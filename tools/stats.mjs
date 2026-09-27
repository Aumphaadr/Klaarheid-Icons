// Числа одной иконки по готовому контуру svg/fill: узлы, контуры, окружности (сколько канонических),
// замечания разбора, отход от зеркала и аудит концов. Общие для tools/check.mjs и tools/site.mjs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { analyzeSvg, readSvg } from './lint.mjs';

// кеш строк сайта по содержимому svg/fill: .cache/stats.json (в git не идёт)
const CACHE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.cache', 'stats.json');
export const svgHash = (svg) => crypto.createHash('sha1').update(svg).digest('hex');
export const statsRow = (q) => [q.nodes, q.loops, q.circles, q.canon, q.mirror];
export function readCache() { try { return JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch { return {}; } }
export function writeCache(c) { fs.mkdirSync(path.dirname(CACHE), { recursive: true }); fs.writeFileSync(CACHE, JSON.stringify(c)); }

// полтолщины при сборке по умолчанию: основная линия 2, тонкая 1,5 и облегчённая 1,75 (rocket)
const HS = [1, 0.75, 0.875];
const ld = (tt) => Math.max(0, ...tt.filter(Boolean).map((q) => Math.abs(Math.log(q.legs))));
const kd = (tt) => Math.max(0, ...tt.filter(Boolean).flatMap((q) => [Math.abs(q.k1 - 1), Math.abs(q.k2 - 1)]));

function circle3(a, b, c) {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  if (Math.abs(d) < 1e-12) return null;
  const s = (p) => p[0] * p[0] + p[1] * p[1];
  const x = (s(a) * (b[1] - c[1]) + s(b) * (c[1] - a[1]) + s(c) * (a[1] - b[1])) / d;
  const y = (s(a) * (c[0] - b[0]) + s(b) * (a[0] - c[0]) + s(c) * (b[0] - a[0])) / d;
  return { c: [x, y], r: Math.hypot(a[0] - x, a[1] - y) };
}
const bez = (q, t) => { const u = 1 - t; return [0, 1].map((k) => u * u * u * q[0][k] + 3 * u * u * t * q[1][k] + 3 * u * t * t * q[2][k] + t * t * t * q[3][k]); };

// Концы и стыки — по готовому SVG, без ядра: куски кубик, лежащие на одной окружности, склеиваются
// в дуги. Торец (полукруг радиусом в полтолщины) — ровно две равные четверти, три узла; стык того же
// радиуса — равные куски до 90°; прочие дуги — поровну или разрезами точно по осям; нигде — кусков
// меньше 5° и узлов ближе 0,1 друг к другу.
export function endsAudit(svg) {
  const { shapes } = readSvg(svg);
  const res = { caps: 0, capsBad: [], joins: 0, joinsBad: [], arcs: 0, arcsBad: [], tiny: [], near: [] };
  for (const sh of shapes) for (const sp of sh.subpaths) {
    const segs = sp.segs;
    for (let i = 0; i < segs.length; i++) {
      const a = segs[i].p[0], b = segs[(i + 1) % segs.length].p[0];
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.1) res.near.push(a.map((v) => +v.toFixed(3)));
    }
    const pc = segs.map((sg) => {
      if (sg.kind === 'L') return null;
      const q = sg.p, circ = circle3(q[0], bez(q, 0.5), q[3]);
      if (!circ || circ.r > 1e3) return null;
      // кубика с рычагами 4/3·tg(θ/4)·r отходит от окружности до 0,027 % радиуса — допуск 0,04 %
      for (const t of [0.25, 0.75]) { const m = bez(q, t); if (Math.abs(Math.hypot(m[0] - circ.c[0], m[1] - circ.c[1]) - circ.r) > 4e-4 * circ.r + 1e-6) return null; }
      const v0 = [q[0][0] - circ.c[0], q[0][1] - circ.c[1]], v1 = [q[3][0] - circ.c[0], q[3][1] - circ.c[1]], vm = [bez(q, 0.5)[0] - circ.c[0], bez(q, 0.5)[1] - circ.c[1]];
      const ang = (u, v) => Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1]);
      return { ...circ, start: q[0], sweep: (ang(v0, vm) + ang(vm, v1)) * 180 / Math.PI };
    });
    const sameC = (x, y) => x && y && Math.hypot(x.c[0] - y.c[0], x.c[1] - y.c[1]) < 1e-4 && Math.abs(x.r - y.r) < 1e-4;
    // начать с места, где дуга не продолжается с предыдущего сегмента
    const n = pc.length;
    let s0 = pc.findIndex((q, k) => !sameC(q, pc[(k - 1 + n) % n]));
    if (s0 < 0) s0 = 0; // весь контур — одна окружность
    const groups = [];
    for (let k = 0; k < n; k++) {
      const q = pc[(s0 + k) % n];
      if (!q) continue;
      const g = groups[groups.length - 1];
      if (g && g.last === k - 1 && sameC(g.q, q)) { g.sweeps.push(q.sweep); g.last = k; }
      else groups.push({ q, sweeps: [q.sweep], last: k });
    }
    for (const g of groups) {
      const total = g.sweeps.reduce((x, y) => x + y, 0), abs = g.sweeps.map(Math.abs);
      for (const w of abs) if (w < 5 && abs.length > 1) res.tiny.push({ r: +g.q.r.toFixed(3), w: +w.toFixed(2) });
      const isH = HS.some((h) => Math.abs(g.q.r - h) < 1e-3);
      if (!isH && Math.abs(Math.abs(total) - 360) > 1 && g.sweeps.length > 1) {
        res.arcs++;
        const equal = Math.max(...abs) - Math.min(...abs) < 0.01;
        let a = Math.atan2(g.q.start[1] - g.q.c[1], g.q.start[0] - g.q.c[0]) * 180 / Math.PI;
        const cutsOnAxes = g.sweeps.slice(0, -1).every((w) => { a += w; const m = ((a % 90) + 90) % 90; return Math.min(m, 90 - m) < 0.01; });
        if (!equal && !cutsOnAxes) res.arcsBad.push({ r: +g.q.r.toFixed(3), pieces: abs.map((w) => +w.toFixed(2)) });
      }
      if (isH && Math.abs(Math.abs(total) - 360) > 1) {
        const equal = Math.max(...abs) - Math.min(...abs) < 0.01;
        if (Math.abs(Math.abs(total) - 180) < 0.5) { res.caps++; if (g.sweeps.length !== 2 || !equal) res.capsBad.push({ pieces: abs.map((w) => +w.toFixed(2)) }); }
        else { res.joins++; if (!equal || Math.max(...abs) > 90.01) res.joinsBad.push({ total: +Math.abs(total).toFixed(2), pieces: abs.map((w) => +w.toFixed(2)) }); }
      }
    }
  }
  return res;
}

// Всё об одной иконке: узлы и контуры; окружности и сколько из них канонические (4 узла на осях,
// рычаги 0,5523·r, плечи равны); замечания разбора (надломы, кривые прямые, наклоны, лишние куски,
// экстремумы внутри сегментов, микросегменты, неправильные дуги); отход от зеркала у симметричных
// (null — иконка не симметрична); концы.
export function iconStats(svg, name = '') {
  const x = analyzeSvg(svg, { name });
  const canon = x.circles.filter((c) => c.nodes === 4 && c.nodeOff < 0.01 && ld(c.tt) < 1e-4 && kd(c.tt) < 1e-4).length;
  const arcsOff = x.arcs.filter((a) => ld(a.tt) > 1e-3 || kd(a.tt) > 1e-3).length;
  const issues = x.straight.length + x.tilts.length + x.runs.length + x.kinks.length + x.extrema.length + x.micro.length + arcsOff;
  const mirror = x.symmetry.intended ? x.symmetry.best.subMax : null;
  const ends = endsAudit(svg);
  const endsBad = ends.capsBad.length + ends.joinsBad.length + ends.arcsBad.length + ends.tiny.length + ends.near.length;
  return { nodes: x.counts.nodes, loops: x.counts.subpaths, circles: x.circles.length, canon, issues, mirror, ends, endsBad };
}
