// Разбор контуров SVG: где построение кривое и насколько. Используют tools/check.mjs и tools/site.mjs.
//
// Что меряется (в единицах сетки файла):
//   круги      — замкнутый контур, который ложится на окружность: сколько узлов и где они (канон —
//                4 узла на экстремумах), длина рычагов против идеальной 4/3·tg(θ/4)·r, касательность
//                рычагов, отклонение от окружности;
//   дуги       — участки контура по окружности (скругления углов, торцы линий): то же;
//   прямые     — прямая, записанная кривой; прогиб «почти прямой»; наклон «почти вертикали/горизонтали/
//                диагонали»; одна прямая из нескольких кусков;
//   узлы       — надлом (касательные в узле расходятся на 0.5–12°), экстремум внутри сегмента,
//                микросегменты;
//   симметрия  — зеркальная (лучшая ось и её сдвиг от центра кадра) и поворотная.
const DEG = 180 / Math.PI;
const KAPPA = (4 / 3) * (Math.SQRT2 - 1); // 0.5522847…

// ---------- векторы ----------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const crs = (a, b) => a[0] * b[1] - a[1] * b[0];
const len = (a) => Math.hypot(a[0], a[1]);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const angOf = (v) => Math.atan2(v[1], v[0]);
const angBetween = (a, b) => Math.abs(Math.atan2(crs(a, b), dot(a, b))); // 0..π
const r4 = (x) => Math.round(x * 1e4) / 1e4;

// ---------- аффинные преобразования ----------
const I = [1, 0, 0, 1, 0, 0];
const mmul = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
const ap = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
function parseTransform(s) {
  let m = I;
  if (!s) return m;
  for (const t of s.matchAll(/(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g)) {
    const a = t[2].split(/[\s,]+/).filter(Boolean).map(Number);
    let n = I;
    if (t[1] === 'matrix') n = a;
    else if (t[1] === 'translate') n = [1, 0, 0, 1, a[0], a[1] ?? 0];
    else if (t[1] === 'scale') n = [a[0], 0, 0, a[1] ?? a[0], 0, 0];
    else if (t[1] === 'rotate') {
      const r = (a[0] * Math.PI) / 180, c = Math.cos(r), s2 = Math.sin(r);
      n = [c, s2, -s2, c, 0, 0];
      if (a.length === 3) n = mmul(mmul([1, 0, 0, 1, a[1], a[2]], n), [1, 0, 0, 1, -a[1], -a[2]]);
    } else if (t[1] === 'skewX') n = [1, 0, Math.tan((a[0] * Math.PI) / 180), 1, 0, 0];
    else n = [1, Math.tan((a[0] * Math.PI) / 180), 0, 1, 0, 0];
    m = mmul(m, n);
  }
  return m;
}

// ---------- кривые ----------
function bez(s, t) {
  const [p0, p1, p2, p3] = s.p, u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}
function bezD(s, t) {
  const [p0, p1, p2, p3] = s.p, u = 1 - t;
  return [
    3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]),
    3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]),
  ];
}
const lineSeg = (a, b, src) => ({ kind: 'L', src, p: [a, add(a, mul(sub(b, a), 1 / 3)), add(a, mul(sub(b, a), 2 / 3)), b] });
function segLen(s) {
  if (s.kind === 'L') return dist(s.p[0], s.p[3]);
  let l = 0, prev = s.p[0];
  for (let i = 1; i <= 32; i++) { const q = bez(s, i / 32); l += dist(prev, q); prev = q; }
  return l;
}
// касательная в начале/конце (вырожденные рычаги пропускаются)
function tanStart(s) {
  for (const q of [s.p[1], s.p[2], s.p[3]]) { const v = sub(q, s.p[0]); if (len(v) > 1e-9) return v; }
  return [0, 0];
}
function tanEnd(s) {
  for (const q of [s.p[2], s.p[1], s.p[0]]) { const v = sub(s.p[3], q); if (len(v) > 1e-9) return v; }
  return [0, 0];
}

// SVG-дуга → центр и куски кубик ≤ 90°
function arcToCubics(p1, rx, ry, phiDeg, fA, fS, p2) {
  if (dist(p1, p2) < 1e-12) return { pieces: [] };
  if (!rx || !ry) return { pieces: [lineSeg(p1, p2, 'A')] };
  rx = Math.abs(rx); ry = Math.abs(ry);
  const phi = (phiDeg * Math.PI) / 180, c = Math.cos(phi), s = Math.sin(phi);
  const dx = (p1[0] - p2[0]) / 2, dy = (p1[1] - p2[1]) / 2;
  const x1 = c * dx + s * dy, y1 = -s * dx + c * dy;
  const lam = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const k = (fA !== fS ? 1 : -1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (k * rx * y1) / ry, cyp = (-k * ry * x1) / rx;
  const cx = c * cxp - s * cyp + (p1[0] + p2[0]) / 2, cy = s * cxp + c * cyp + (p1[1] + p2[1]) / 2;
  const th = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const t1 = th(1, 0, (x1 - cxp) / rx, (y1 - cyp) / ry);
  let dt = th((x1 - cxp) / rx, (y1 - cyp) / ry, (-x1 - cxp) / rx, (-y1 - cyp) / ry);
  if (!fS && dt > 0) dt -= 2 * Math.PI; else if (fS && dt < 0) dt += 2 * Math.PI;
  const n = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9));
  const d = dt / n, h = (4 / 3) * Math.tan(d / 4);
  const map = ([x, y]) => [cx + c * rx * x - s * ry * y, cy + s * rx * x + c * ry * y];
  const pieces = [];
  for (let i = 0; i < n; i++) {
    const a1 = t1 + i * d, a2 = a1 + d;
    const q0 = [Math.cos(a1), Math.sin(a1)], q3 = [Math.cos(a2), Math.sin(a2)];
    const q1 = add(q0, mul([-Math.sin(a1), Math.cos(a1)], h)), q2 = sub(q3, mul([-Math.sin(a2), Math.cos(a2)], h));
    pieces.push({ kind: 'A', src: 'A', p: [q0, q1, q2, q3].map(map), arc: { cx, cy, rx, ry, phi: phiDeg } });
  }
  pieces[0].p[0] = p1; pieces[n - 1].p[3] = p2;
  return { pieces };
}

// ---------- разбор d ----------
function parseD(d, M) {
  const subpaths = [];
  let i = 0, cmd = null, cur = [0, 0], start = [0, 0], lastC = null, lastQ = null, sp = null;
  const NUM = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y;
  const skip = () => { while (i < d.length && /[\s,]/.test(d[i])) i++; };
  const num = () => { skip(); NUM.lastIndex = i; const m = NUM.exec(d); if (!m) throw new Error(`путь: число ожидалось в ${i}`); i = NUM.lastIndex; return parseFloat(m[0]); };
  const flag = () => { skip(); const ch = d[i++]; if (ch !== '0' && ch !== '1') throw new Error('путь: флаг дуги'); return ch === '1'; };
  const more = () => { skip(); return i < d.length && /[+\-.\d]/.test(d[i]); };
  const T = (p) => ap(M, p);
  const push = (seg) => { if (!sp) { sp = { segs: [], closed: false }; subpaths.push(sp); } sp.segs.push(seg); };
  while (true) {
    skip();
    if (i >= d.length) break;
    if (/[A-Za-z]/.test(d[i])) cmd = d[i++];
    else if (!cmd) throw new Error('путь: нет команды');
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    const P = (x, y) => (rel ? [cur[0] + x, cur[1] + y] : [x, y]);
    if (C === 'Z') {
      if (sp) {
        if (dist(cur, start) > 1e-9) sp.segs.push({ ...lineSeg(T(cur), T(start), 'Z') });
        sp.closed = true;
      }
      cur = start; sp = null; lastC = lastQ = null;
      if (more()) cmd = rel ? 'l' : 'L'; // после z координаты недопустимы, но не падаем
      continue;
    }
    do {
      if (C === 'M') {
        const p = P(num(), num());
        cur = start = p; sp = { segs: [], closed: false, startRaw: p }; subpaths.push(sp);
        cmd = rel ? 'l' : 'L'; lastC = lastQ = null;
        break;
      } else if (C === 'L' || C === 'H' || C === 'V') {
        let p;
        if (C === 'L') p = P(num(), num());
        else if (C === 'H') { const x = num(); p = [rel ? cur[0] + x : x, cur[1]]; }
        else { const y = num(); p = [cur[0], rel ? cur[1] + y : y]; }
        if (dist(cur, p) > 1e-9) push(lineSeg(T(cur), T(p), C));
        cur = p; lastC = lastQ = null;
      } else if (C === 'C' || C === 'S') {
        let c1;
        if (C === 'C') c1 = P(num(), num());
        else c1 = lastC ? [2 * cur[0] - lastC[0], 2 * cur[1] - lastC[1]] : cur;
        const c2 = P(num(), num()), p = P(num(), num());
        push({ kind: 'C', src: C, p: [T(cur), T(c1), T(c2), T(p)] });
        lastC = c2; lastQ = null; cur = p;
      } else if (C === 'Q' || C === 'T') {
        let q;
        if (C === 'Q') q = P(num(), num());
        else q = lastQ ? [2 * cur[0] - lastQ[0], 2 * cur[1] - lastQ[1]] : cur;
        const p = P(num(), num());
        const c1 = add(cur, mul(sub(q, cur), 2 / 3)), c2 = add(p, mul(sub(q, p), 2 / 3));
        push({ kind: 'C', src: C, p: [T(cur), T(c1), T(c2), T(p)] });
        lastQ = q; lastC = null; cur = p;
      } else if (C === 'A') {
        const rx = num(), ry = num(), rot = num(), fA = flag(), fS = flag(), p = P(num(), num());
        // дугу строим в своих координатах, потом переносим куски
        const { pieces } = arcToCubics(cur, rx, ry, rot, fA, fS, p);
        for (const pc of pieces) push({ ...pc, p: pc.p.map(T), arcSrc: { rx, ry, rot } });
        cur = p; lastC = lastQ = null;
      } else throw new Error(`путь: команда ${cmd}`);
    } while (more());
  }
  return subpaths.filter((s) => s.segs.length);
}

// ---------- SVG → контуры ----------
function parseStyle(attrs) {
  const st = {};
  for (const part of (attrs.style ?? '').split(';')) {
    const [k, v] = part.split(':').map((x) => x && x.trim());
    if (k && v) st[k] = v;
  }
  const get = (k) => attrs[k] ?? st[k];
  return { fill: get('fill'), stroke: get('stroke'), strokeWidth: get('stroke-width') };
}
function attrsOf(tag) {
  const a = {};
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) a[m[1]] = m[2];
  return a;
}
function shapeToD(name, a) {
  const f = (k) => parseFloat(a[k] ?? '0');
  if (name === 'path') return a.d ?? '';
  if (name === 'circle' || name === 'ellipse') {
    const cx = f('cx'), cy = f('cy'), rx = name === 'circle' ? f('r') : f('rx'), ry = name === 'circle' ? f('r') : f('ry');
    return `M${cx + rx} ${cy}A${rx} ${ry} 0 0 1 ${cx} ${cy + ry}A${rx} ${ry} 0 0 1 ${cx - rx} ${cy}A${rx} ${ry} 0 0 1 ${cx} ${cy - ry}A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}Z`;
  }
  if (name === 'rect') {
    const x = f('x'), y = f('y'), w = f('width'), h = f('height');
    let rx = a.rx !== undefined ? f('rx') : a.ry !== undefined ? f('ry') : 0;
    let ry = a.ry !== undefined ? f('ry') : rx;
    rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
    if (!rx || !ry) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
    return `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`;
  }
  if (name === 'line') return `M${f('x1')} ${f('y1')}L${f('x2')} ${f('y2')}`;
  if (name === 'polyline' || name === 'polygon') return `M${(a.points ?? '').trim()}${name === 'polygon' ? 'Z' : ''}`;
  return '';
}
export function readSvg(text) {
  const vbm = /viewBox="([^"]+)"/.exec(text);
  const vb = vbm ? vbm[1].trim().split(/[\s,]+/).map(Number) : [0, 0, 24, 24];
  const shapes = [];
  const stack = [{ m: I, fill: undefined, stroke: undefined, sw: undefined }];
  for (const t of text.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)) {
    const [, close, name, rest, self] = t;
    if (name === 'g' || name === 'svg') {
      if (close) { if (name === 'g') stack.pop(); continue; }
      if (name === 'svg') continue;
      const a = attrsOf(rest), st = parseStyle(a), top = stack[stack.length - 1];
      const g = { m: mmul(top.m, parseTransform(a.transform)), fill: st.fill ?? top.fill, stroke: st.stroke ?? top.stroke, sw: st.strokeWidth ?? top.sw };
      if (!self) stack.push(g);
      continue;
    }
    if (close || !['path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon'].includes(name)) continue;
    const a = attrsOf(rest), st = parseStyle(a), top = stack[stack.length - 1];
    const m = mmul(top.m, parseTransform(a.transform));
    const fill = st.fill ?? top.fill ?? 'black', stroke = st.stroke ?? top.stroke ?? 'none';
    const paint = fill === 'none' && stroke !== 'none' ? 'stroke' : 'fill';
    const sw = parseFloat(st.strokeWidth ?? top.sw ?? '1');
    shapes.push({ element: name, paint, strokeWidth: paint === 'stroke' ? sw * Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) : null, subpaths: parseD(shapeToD(name, a), m), attrs: a });
  }
  return { vb, shapes };
}

// ---------- окружность по точкам ----------
function fitCircle(pts) {
  // Коса (алгебраически), затем уточнение Шпета: центр ← среднее + r·среднее((c − p)/|c − p|)
  let sx = 0, sy = 0;
  for (const p of pts) { sx += p[0]; sy += p[1]; }
  const mx = sx / pts.length, my = sy / pts.length;
  let Suu = 0, Svv = 0, Suv = 0, Suuu = 0, Svvv = 0, Suvv = 0, Svuu = 0;
  for (const p of pts) {
    const u = p[0] - mx, v = p[1] - my;
    Suu += u * u; Svv += v * v; Suv += u * v; Suuu += u * u * u; Svvv += v * v * v; Suvv += u * v * v; Svuu += v * u * u;
  }
  const det = Suu * Svv - Suv * Suv;
  let c = [mx, my];
  if (Math.abs(det) > 1e-12) {
    const bu = 0.5 * (Suuu + Suvv), bv = 0.5 * (Svvv + Svuu);
    c = [mx + (bu * Svv - bv * Suv) / det, my + (Suu * bv - Suv * bu) / det];
  }
  for (let it = 0; it < 60; it++) {
    let r = 0, gx = 0, gy = 0;
    const ds = pts.map((p) => Math.max(1e-12, dist(p, c)));
    for (const d of ds) r += d;
    r /= pts.length;
    for (let k = 0; k < pts.length; k++) { gx += (c[0] - pts[k][0]) / ds[k]; gy += (c[1] - pts[k][1]) / ds[k]; }
    const nc = [mx + (r * gx) / pts.length, my + (r * gy) / pts.length];
    const moved = dist(nc, c);
    c = nc;
    if (moved < 1e-10) break;
  }
  let r = 0;
  for (const p of pts) r += dist(p, c);
  r /= pts.length;
  let maxDev = 0, sq = 0;
  for (const p of pts) { const e = dist(p, c) - r; sq += e * e; if (Math.abs(e) > Math.abs(maxDev)) maxDev = e; }
  return { c, r, max: Math.abs(maxDev), rms: Math.sqrt(sq / pts.length) };
}
function sampleSegs(segs, per = 24) {
  const pts = [];
  segs.forEach((s, k) => { for (let i = k === 0 ? 0 : 1; i <= per; i++) pts.push(bez(s, i / per)); });
  return pts;
}
// направление обхода по окружности → угол дуги сегмента (со знаком обхода)
function sweep(c, a, b, dir) {
  let d = angOf(sub(b, c)) - angOf(sub(a, c));
  while (d <= -Math.PI) d += 2 * Math.PI;
  while (d > Math.PI) d -= 2 * Math.PI;
  if (dir > 0 && d < -1e-9) d += 2 * Math.PI;
  if (dir < 0 && d > 1e-9) d -= 2 * Math.PI;
  return d;
}
// дуга по касательным: касательные в концах кубики пересекаются в X; у дуги окружности плечи |P0X| и |P3X|
// равны, а оба рычага равны 4/3·tg(θ/4)·r, где θ — поворот касательной, r = плечо / tg(θ/2)
function tangentArc(s) {
  if (s.kind === 'L') return null;
  const t0 = tanStart(s), t1 = tanEnd(s);
  const th = angBetween(t0, t1);
  if (th < 0.5 / DEG || th > 175 / DEG) return null;
  const den = crs(t0, t1);
  if (Math.abs(den) < 1e-12) return null;
  const u = crs(sub(s.p[3], s.p[0]), t1) / den;
  const X = add(s.p[0], mul(t0, u));
  const a = dist(s.p[0], X), b = dist(s.p[3], X);
  if (!(a > 1e-9 && b > 1e-9)) return null;
  const r = ((a + b) / 2) / Math.tan(th / 2);
  const ideal = (4 / 3) * Math.tan(th / 4) * r;
  return { deg: th * DEG, legs: a / b, r, k1: dist(s.p[1], s.p[0]) / ideal, k2: dist(s.p[3], s.p[2]) / ideal };
}
// разбор участка по окружности: узлы, рычаги, касательность
function arcConstruction(segs, fit) {
  const { c, r } = fit;
  const mid = bez(segs[0], 0.5);
  const dir = Math.sign(crs(sub(segs[0].p[0], c), sub(mid, c))) || 1;
  const per = segs.map((s) => {
    const tt = tangentArc(s);
    const th = Math.abs(sweep(c, s.p[0], s.p[3], dir));
    const ideal = (4 / 3) * Math.tan(th / 4) * r;
    const h1 = dist(s.p[1], s.p[0]), h2 = dist(s.p[3], s.p[2]);
    const t0 = [-(s.p[0][1] - c[1]), s.p[0][0] - c[0]], t3 = [-(s.p[3][1] - c[1]), s.p[3][0] - c[0]];
    const a1 = h1 > 1e-9 ? Math.min(angBetween(sub(s.p[1], s.p[0]), t0), angBetween(sub(s.p[1], s.p[0]), mul(t0, -1))) * DEG : null;
    const a2 = h2 > 1e-9 ? Math.min(angBetween(sub(s.p[3], s.p[2]), t3), angBetween(sub(s.p[3], s.p[2]), mul(t3, -1))) * DEG : null;
    return { deg: th * DEG, k1: s.kind === 'L' ? null : h1 / ideal, k2: s.kind === 'L' ? null : h2 / ideal, tan1: a1, tan2: a2, kind: s.kind, tt };
  });
  // углы узлов от оси: 0° — справа, 90° — снизу (ось y SVG вниз)
  const nodes = segs.map((s) => { const a = angOf(sub(s.p[0], c)) * DEG; return (a + 360) % 360; });
  return { per, nodes, dir };
}
const offAxis = (a, step = 90) => { const m = ((a % step) + step) % step; return Math.min(m, step - m); };

// ---------- главный разбор ----------
export function analyzeSvg(text, { name = '' } = {}) {
  const { vb, shapes } = readSvg(text);
  const size = Math.max(vb[2], vb[3]);
  const center = [vb[0] + vb[2] / 2, vb[1] + vb[3] / 2];
  const s = size / 20; // допуски заданы для сетки 20
  const out = { name, vb, size, shapes: [], circles: [], arcs: [], straight: [], tilts: [], runs: [], kinks: [], extrema: [], micro: [], counts: {}, symmetry: {} };
  const counts = { nodes: 0, L: 0, C: 0, A: 0, subpaths: 0 };
  const allSegs = [];
  for (const sh of shapes) {
    out.shapes.push({ element: sh.element, paint: sh.paint, strokeWidth: sh.strokeWidth ? r4(sh.strokeWidth) : null, subpaths: sh.subpaths.length });
    for (const sp of sh.subpaths) {
      counts.subpaths++;
      counts.nodes += sp.segs.length;
      for (const sg of sp.segs) { counts[sg.kind]++; allSegs.push(sg); }
    }
  }
  out.counts = counts;
  const where = (p) => `(${r4(p[0])}, ${r4(p[1])})`;

  for (const sh of shapes) for (const [spi, sp] of sh.subpaths.entries()) {
    let segs = sp.segs;
    if ((sp.closed || dist(segs[0].p[0], segs[segs.length - 1].p[3]) < 1e-6) && segs.length > 1) {
      // начать обход с угла или прямой, чтобы дуга не рвалась на стыке начала и конца
      const m = segs.length;
      let k0 = segs.findIndex((sg, k) => sg.kind === 'L' || angBetween(tanEnd(segs[(k - 1 + m) % m]), tanStart(sg)) * DEG > 12);
      if (k0 > 0) segs = [...segs.slice(k0), ...segs.slice(0, k0)];
    }
    const L = segs.map(segLen);
    // --- целый круг ---
    let isCircle = false;
    if (sp.closed || dist(segs[0].p[0], segs[segs.length - 1].p[3]) < 1e-6) {
      const pts = sampleSegs(segs);
      const fit = fitCircle(pts);
      let swept = 0;
      const mid = bez(segs[0], 0.5), dir0 = Math.sign(crs(sub(segs[0].p[0], fit.c), sub(mid, fit.c))) || 1;
      for (const sg of segs) swept += sweep(fit.c, sg.p[0], sg.p[3], dir0);
      if (fit.r > 0.3 * s && fit.max <= Math.max(0.035 * fit.r, 0.06 * s) && Math.abs(Math.abs(swept) - 2 * Math.PI) < 0.2) {
        isCircle = true;
        const con = arcConstruction(segs, fit);
        const ks = con.per.flatMap((q) => [q.k1, q.k2]).filter((x) => x !== null);
        const tans = con.per.flatMap((q) => [q.tan1, q.tan2]).filter((x) => x !== null);
        out.circles.push({
          element: sh.element, paint: sh.paint, sub: spi, c: [r4(fit.c[0]), r4(fit.c[1])], r: r4(fit.r),
          maxDev: r4(fit.max), rms: r4(fit.rms), nodes: segs.length, kinds: segs.map((q) => q.kind).join(''),
          nodeAngles: con.nodes.map((a) => Math.round(a * 100) / 100),
          nodeOff: r4(Math.max(...con.nodes.map((a) => offAxis(a)))),
          segDeg: con.per.map((q) => Math.round(q.deg * 10) / 10),
          kMin: r4(Math.min(...ks)), kMax: r4(Math.max(...ks)),
          tanMax: r4(Math.max(0, ...tans)),
          centerOff: [r4(fit.c[0] - center[0]), r4(fit.c[1] - center[1])],
          tt: con.per.map((q) => (q.tt ? { deg: Math.round(q.tt.deg * 10) / 10, legs: r4(q.tt.legs), k1: r4(q.tt.k1), k2: r4(q.tt.k2) } : null)),
        });
      }
    }
    if (isCircle) continue;

    // --- дуги (скругления, торцы) ---
    const n = segs.length;
    const used = new Array(n).fill(false);
    for (let i = 0; i < n; i++) {
      if (used[i] || segs[i].kind === 'L') continue;
      let best = null;
      for (let j = i; j < Math.min(n, i + 8); j++) {
        if (segs[j].kind === 'L') break;
        const part = segs.slice(i, j + 1);
        const pts = sampleSegs(part);
        const fit = fitCircle(pts);
        if (!(fit.r > 0.2 * s && fit.r < 12 * s)) break;
        const tol = Math.max(0.03 * fit.r, 0.03 * s);
        if (fit.max > tol) break;
        const mid = bez(part[0], 0.5);
        const dir = Math.sign(crs(sub(part[0].p[0], fit.c), sub(mid, fit.c))) || 1;
        let sw = 0;
        for (const sg of part) sw += sweep(fit.c, sg.p[0], sg.p[3], dir);
        if (Math.abs(sw) > 2 * Math.PI - 0.2) break;
        best = { j, fit, sw: Math.abs(sw) };
      }
      if (best && best.sw * DEG >= 60) {
        const part = segs.slice(i, best.j + 1);
        const con = arcConstruction(part, best.fit);
        const ks = con.per.flatMap((q) => [q.k1, q.k2]).filter((x) => x !== null);
        const tans = con.per.flatMap((q) => [q.tan1, q.tan2]).filter((x) => x !== null);
        for (let k = i; k <= best.j; k++) used[k] = true;
        out.arcs.push({
          sub: spi, from: i, segs: part.length, c: [r4(best.fit.c[0]), r4(best.fit.c[1])], r: r4(best.fit.r), deg: Math.round(best.sw * DEG * 10) / 10,
          maxDev: r4(best.fit.max), kMin: r4(Math.min(...ks)), kMax: r4(Math.max(...ks)), tanMax: r4(Math.max(0, ...tans)),
          nodeAngles: con.nodes.map((a) => Math.round(a * 10) / 10),
          start: [r4(part[0].p[0][0]), r4(part[0].p[0][1])], end: [r4(part[part.length - 1].p[3][0]), r4(part[part.length - 1].p[3][1])],
          tt: con.per.map((q) => (q.tt ? { deg: Math.round(q.tt.deg * 10) / 10, legs: r4(q.tt.legs), k1: r4(q.tt.k1), k2: r4(q.tt.k2) } : null)),
        });
        i = best.j;
      }
    }

    // --- прямые ---
    const straightInfo = segs.map((sg, k) => {
      const a = sg.p[0], b = sg.p[3], ch = sub(b, a), l = len(ch);
      if (l < 1e-9) return null;
      let bow = 0;
      if (sg.kind !== 'L') for (let t = 1; t < 16; t++) { const q = bez(sg, t / 16); bow = Math.max(bow, Math.abs(crs(ch, sub(q, a))) / l); }
      return { k, l, bow, ang: angOf(ch) * DEG, a, b, kind: sg.kind };
    });
    // точная дуга окружности (пусть и очень пологая) — не «кривая прямая»
    const exactArc = (sg) => { const ta = tangentArc(sg); return !!ta && Math.abs(ta.legs - 1) < 1e-3 && Math.abs(ta.k1 - 1) < 1e-3 && Math.abs(ta.k2 - 1) < 1e-3; };
    const isStraight = (q) => q && (q.kind === 'L' || (q.l >= 0.6 * s && q.bow / q.l < 0.02 && !exactArc(segs[q.k])));
    for (const q of straightInfo) {
      if (!q || !isStraight(q) || q.kind === 'L') continue;
      out.straight.push({ sub: sp === undefined ? spi : spi, seg: q.k, from: [r4(q.a[0]), r4(q.a[1])], to: [r4(q.b[0]), r4(q.b[1])], len: r4(q.l), bow: r4(q.bow) });
    }
    // прямые участки: склеить соседние прямые с поворотом < 2.5°
    const runs = [];
    let run = null;
    for (let k = 0; k < n; k++) {
      const q = straightInfo[k];
      if (isStraight(q)) {
        if (run && Math.abs(((q.ang - run.ang + 540) % 360) - 180) < 2.5 && run.last === k - 1) { run.parts.push(q); run.last = k; }
        else { run = { parts: [q], ang: q.ang, last: k }; runs.push(run); }
      } else run = null;
    }
    for (const rn of runs) {
      const a = rn.parts[0].a, b = rn.parts[rn.parts.length - 1].b, ch = sub(b, a), l = len(ch);
      if (l < 1e-9) continue;
      // отход точек участка от хорды
      let dev = 0;
      for (const q of rn.parts) {
        const sg = segs[q.k];
        for (let t = 0; t <= 16; t++) { const pnt = bez(sg, t / 16); dev = Math.max(dev, Math.abs(crs(ch, sub(pnt, a))) / l); }
      }
      const ang = ((angOf(ch) * DEG) + 360) % 180;
      const off45 = offAxis(ang, 45);
      const axis = Math.round(ang / 45) * 45 % 180;
      if (rn.parts.length > 1) out.runs.push({ sub: spi, from: [r4(a[0]), r4(a[1])], to: [r4(b[0]), r4(b[1])], pieces: rn.parts.length, kinds: rn.parts.map((q) => q.kind).join(''), len: r4(l), dev: r4(dev) });
      if (l >= 1.2 * s && off45 > 0.02 && off45 < 1.2) {
        out.tilts.push({ sub: spi, from: [r4(a[0]), r4(a[1])], to: [r4(b[0]), r4(b[1])], len: r4(l), axis, deg: r4(off45), shift: r4(l * Math.sin(off45 / DEG)) });
      }
    }

    // --- узлы ---
    const closed = sp.closed || dist(segs[0].p[0], segs[n - 1].p[3]) < 1e-6;
    for (let k = 0; k < n; k++) {
      if (!closed && k === 0) continue;
      const prev = segs[(k - 1 + n) % n], cur = segs[k];
      const a = angBetween(tanEnd(prev), tanStart(cur)) * DEG;
      if (a >= 0.5 && a <= 12) out.kinks.push({ sub: spi, at: [r4(cur.p[0][0]), r4(cur.p[0][1])], deg: r4(a), between: prev.kind + cur.kind });
    }
    for (let k = 0; k < n; k++) {
      const sg = segs[k];
      if (sg.kind !== 'C' || isStraight(straightInfo[k])) continue;
      // точная дуга окружности (плечи и рычаги как у дуги) — экстремум внутри неё не дефект:
      // правило «узлы на экстремумах» ловит кривые, нарисованные от руки
      const ta = tangentArc(sg);
      if (ta && Math.abs(ta.legs - 1) < 1e-3 && Math.abs(ta.k1 - 1) < 1e-3 && Math.abs(ta.k2 - 1) < 1e-3) continue;
      for (const ax of [0, 1]) {
        // корни производной по оси: квадратное уравнение
        const [p0, p1, p2, p3] = sg.p.map((q) => q[ax]);
        const A = -p0 + 3 * p1 - 3 * p2 + p3, B = 2 * (p0 - 2 * p1 + p2), Cc = p1 - p0;
        const roots = [];
        if (Math.abs(A) < 1e-12) { if (Math.abs(B) > 1e-12) roots.push(-Cc / B); }
        else { const D = B * B - 4 * A * Cc; if (D >= 0) { roots.push((-B + Math.sqrt(D)) / (2 * A), (-B - Math.sqrt(D)) / (2 * A)); } }
        for (const t of roots) {
          if (!(t > 0.03 && t < 0.97)) continue;
          const v = bez(sg, t)[ax];
          const bulge = Math.min(Math.abs(v - p0), Math.abs(v - p3)) * (Math.sign(v - p0) === Math.sign(v - p3) ? 1 : 0);
          if (bulge > 0.02 * s) out.extrema.push({ sub: spi, seg: k, axis: ax ? 'y' : 'x', at: where(bez(sg, t)), bulge: r4(bulge) });
        }
      }
    }
    for (let k = 0; k < n; k++) if (L[k] < 0.08 * s && L[k] > 1e-4) out.micro.push({ sub: spi, seg: k, kind: segs[k].kind, at: where(segs[k].p[0]), len: r4(L[k]) });
  }

  // --- кольца: пары окружностей с общим центром ---
  out.rings = [];
  const cs = [...out.circles].sort((a, b) => b.r - a.r);
  const usedC = new Set();
  for (let a = 0; a < cs.length; a++) for (let b = a + 1; b < cs.length; b++) {
    if (usedC.has(a) || usedC.has(b)) continue;
    const d = dist(cs[a].c, cs[b].c);
    if (d < 0.3 * s && cs[a].r - cs[b].r < 3.5 * s && cs[a].r - cs[b].r > 0.3 * s) {
      usedC.add(a); usedC.add(b);
      out.rings.push({ rOuter: cs[a].r, rInner: cs[b].r, width: r4(cs[a].r - cs[b].r), centerDist: r4(d), c: cs[a].c });
    }
  }

  // --- симметрия ---
  // контур → ломаная с шагом 0.05·s; расстояние меряется до отрезков ломаной, поэтому у точной
  // симметрии отход ≈ 0, а не «полшага выборки»
  const polys = [];
  let cxs = 0, cys = 0, lsum = 0;
  // ось ищется по всей иконке; «задумана ли симметрия» решается по каждой детали (контуру) отдельно:
  // иначе большое кольцо часов «перевешивает» несимметричные стрелки
  const allSubs = shapes.flatMap((sh) => sh.subpaths);
  const subId = new Map(allSubs.map((sp, k) => [sp, k]));
  for (const sp of allSubs) for (const sg of sp.segs) {
    const l = segLen(sg), m = Math.max(1, Math.ceil(l / (0.05 * s)));
    let prev = sg.p[0];
    for (let t = 1; t <= m; t++) {
      const q = bez(sg, t / m), w = dist(prev, q);
      polys.push([prev, q, subId.get(sp)]); cxs += ((prev[0] + q[0]) / 2) * w; cys += ((prev[1] + q[1]) / 2) * w; lsum += w; prev = q;
    }
  }
  if (polys.length && lsum > 0) {
    const cell = 0.25 * s, grid = new Map(), key = (i, j) => i * 100003 + j;
    for (const e of polys) {
      const x0 = Math.floor(Math.min(e[0][0], e[1][0]) / cell), x1 = Math.floor(Math.max(e[0][0], e[1][0]) / cell);
      const y0 = Math.floor(Math.min(e[0][1], e[1][1]) / cell), y1 = Math.floor(Math.max(e[0][1], e[1][1]) / cell);
      for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++) { const k = key(i, j); let b = grid.get(k); if (!b) grid.set(k, (b = [])); b.push(e); }
    }
    const segDist = (q, a, b) => { const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(q, a), ab) / (dot(ab, ab) || 1))); return dist(q, add(a, mul(ab, t))); };
    const CAP = 1.2 * s;
    const nearest = (q) => {
      const gx = Math.floor(q[0] / cell), gy = Math.floor(q[1] / cell), R = Math.ceil(CAP / cell);
      let best = CAP;
      for (let ring = 0; ring <= R; ring++) {
        if ((ring - 1) * cell > best) break;
        for (let dx = -ring; dx <= ring; dx++) for (let dy = -ring; dy <= ring; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const b = grid.get(key(gx + dx, gy + dy));
          if (b) for (const e of b) { const d = segDist(q, e[0], e[1]); if (d < best) best = d; }
        }
      }
      return best;
    };
    const allPts = polys.map((e) => Object.assign([e[0][0], e[0][1]], { sub: e[2] }));
    const pick = (n) => { const st = Math.max(1, Math.floor(allPts.length / n)); return allPts.filter((_, k) => k % st === 0); };
    // по деталям: худший p95 и max среди контуров при данной оси
    const perSub = (f) => {
      const by = new Map();
      for (const p of allPts) { const d = nearest(f(p)); let a = by.get(p.sub); if (!a) by.set(p.sub, (a = [])); a.push(d); }
      let p95 = 0, max = 0;
      for (const a of by.values()) { a.sort((x, y) => x - y); p95 = Math.max(p95, a[Math.floor(a.length * 0.95)]); max = Math.max(max, a[a.length - 1]); }
      return { p95: r4(p95), max: r4(max) };
    };
    const coarse = pick(200), fine = pick(1500);
    const stats = (probe, f) => { const ds = probe.map((p) => nearest(f(p))).sort((a, b) => a - b); return { mean: ds.reduce((a, b) => a + b, 0) / ds.length, p95: ds[Math.floor(ds.length * 0.95)], max: ds[ds.length - 1] }; };
    const worstOf = (f) => { let w = null, wd = -1; for (const p of fine) { const d = nearest(f(p)); if (d > wd) { wd = d; w = p; } } return w ? [r4(w[0]), r4(w[1])] : null; };
    const golden = (f, lo, hi) => { let a = lo, b = hi; const g = (Math.sqrt(5) - 1) / 2; let x1 = b - g * (b - a), x2 = a + g * (b - a), f1 = f(x1), f2 = f(x2); for (let it = 0; it < 24; it++) { if (f1 < f2) { b = x2; x2 = x1; f2 = f1; x1 = b - g * (b - a); f1 = f(x1); } else { a = x1; x1 = x2; f1 = f2; x2 = a + g * (b - a); f2 = f(x2); } } return (a + b) / 2; };
    const centroid = [cxs / lsum, cys / lsum];
    // зеркало относительно прямой с углом th, сдвинутой от центра масс контура на d по нормали
    const mirrorF = (th, d) => { const u = [Math.cos(th), Math.sin(th)], nr = [-u[1], u[0]], c0 = add(centroid, mul(nr, d)); return (p) => { const v = sub(p, c0); return add(c0, sub(mul(u, 2 * dot(v, u)), v)); }; };
    let best = null;
    for (let deg = 0; deg < 180; deg += 3) { const th = deg / DEG, m = stats(coarse, mirrorF(th, 0)).mean; if (!best || m < best.m) best = { th, m }; }
    let th = best.th, d = 0;
    for (let round = 1; round <= 3; round++) {
      d = golden((x) => stats(coarse, mirrorF(th, x)).mean, d - (0.6 * s) / round, d + (0.6 * s) / round);
      th = golden((x) => stats(coarse, mirrorF(x, d)).mean, th - 3 / DEG / round, th + 3 / DEG / round);
    }
    const bs = stats(fine, mirrorF(th, d));
    const ps = perSub(mirrorF(th, d));
    const sym = {
      best: { angle: r4((((th * DEG) % 180) + 180) % 180), mean: r4(bs.mean), p95: r4(bs.p95), max: r4(bs.max), subP95: ps.p95, subMax: ps.max, worstAt: worstOf(mirrorF(th, d)), point: (() => { const nr = [-Math.sin(th), Math.cos(th)]; const c0 = add(centroid, mul(nr, d)); return [r4(c0[0]), r4(c0[1])]; })() },
      centroid: [r4(centroid[0]), r4(centroid[1])],
    };
    sym.intended = ps.p95 <= 0.35 * s; // естественный зазор: у задуманных симметричными ≤ 0.35, дальше начинаются 0.4+
    for (const [k, thx] of [['vertical', Math.PI / 2], ['horizontal', 0]]) {
      const dd = golden((x) => stats(coarse, mirrorF(thx, x)).mean, -0.8 * s, 0.8 * s);
      const st = stats(fine, mirrorF(thx, dd));
      const pos = thx ? centroid[0] - dd : centroid[1] + dd;
      const pk = perSub(mirrorF(thx, dd));
      sym[k] = { axis: r4(pos), axisOff: r4(pos - center[thx ? 0 : 1]), mean: r4(st.mean), p95: r4(st.p95), max: r4(st.max), subP95: pk.p95, subMax: pk.max, worstAt: worstOf(mirrorF(thx, dd)) };
    }
    const rotF = (a) => (p) => { const c = Math.cos(a), si = Math.sin(a), v = sub(p, centroid); return [centroid[0] + c * v[0] - si * v[1], centroid[1] + si * v[0] + c * v[1]]; };
    let bestRot = null;
    // отход при повороте на 360°/n для всех n — чтобы показать и сильно нарушенную симметрию
    sym.rotAll = {};
    for (let k = 3; k <= 12; k++) { const pk = perSub(rotF((2 * Math.PI) / k)); sym.rotAll[k] = { subP95: pk.p95, subMax: pk.max }; }
    for (let k = 3; k <= 12; k++) {
      const sc = stats(coarse, rotF((2 * Math.PI) / k)), half = stats(coarse, rotF(Math.PI / k));
      if (sc.mean < 0.15 * s && half.mean > 3 * sc.mean) {
        const f = stats(fine, rotF((2 * Math.PI) / k)), pk = perSub(rotF((2 * Math.PI) / k));
        if (pk.p95 <= 0.2 * s && (!bestRot || k > bestRot.n)) bestRot = { n: k, mean: r4(f.mean), p95: r4(f.p95), max: r4(f.max), subMax: pk.max, worstAt: worstOf(rotF((2 * Math.PI) / k)) };
      }
    }
    const onlyCircles = out.circles.length === counts.subpaths;
    sym.rotation = onlyCircles ? null : bestRot;
    const xs = allPts.map((p) => p[0]), ys = allPts.map((p) => p[1]);
    sym.bbox = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(r4);
    out.symmetry = sym;
  }
  return out;
}

export { tanStart, tanEnd, angBetween, DEG };
