// Сборка набора: node tools/build.mjs [--weight 2]
// Пишет svg/stroke/<имя>.svg (осевые линии, толщина атрибутом) и svg/fill/<имя>.svg (точный контур
// заливкой, один <path>) для каждой иконки из src/icons.mjs. Файлы иконок, которых в исходнике нет, удаляет.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICONS } from '../src/icons.mjs';
import { strokePiece, solidPiece, diskPiece, fillPiece, union, loopsToD, pathToD, fmt, line, pointAt } from '../src/geom.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const wi = args.indexOf('--weight');
const W = wi >= 0 ? parseFloat(args[wi + 1]) : 2;
const H = W / 2;
const THIN = 0.75; // тонкая линия — ¾ основной (1,5 при толщине 2): мелкие знаки в тесном поле
const DP = 6;
const n = (v) => fmt(v, DP);

const weightOf = (pt) => pt.w ?? (pt.thin ? THIN : 1); // множитель толщины детали: основная 1, тонкая ¾, особые — w
function strokeElement(p, solid, k = 1) {
  const f = (solid ? ' fill="currentColor"' : '') + (k !== 1 ? ` stroke-width="${n(W * k)}"` : '');
  if (p.prim?.kind === 'circle') return `<circle cx="${n(p.prim.c[0])}" cy="${n(p.prim.c[1])}" r="${n(p.prim.r)}"${f}/>`;
  if (p.prim?.kind === 'rect' && !Array.isArray(p.prim.r)) {
    const { x, y, w, h, r } = p.prim;
    return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${r ? ` rx="${n(r)}"` : ''}${f}/>`;
  }
  return `<path d="${pathToD(p, DP)}"${f}/>`;
}
// деталь → кусок контура; grow раздувает её (для краёв вырезов в svg/stroke)
function pieceOf(pt, grow = 0) {
  const h = H * weightOf(pt) + grow;
  if (pt.stroke) return strokePiece(pt.stroke, h);
  if (pt.solid) return solidPiece(pt.solid, h);
  if (pt.disk) return diskPiece(pt.disk[0], pt.disk[1] + grow);
  if (pt.fill) { if (grow) throw new Error('вырез чистой заливкой не поддержан'); return fillPiece(pt.fill); }
  if (pt.capsule) return strokePiece(line(pt.capsule[0], pt.capsule[1]), pt.capsule[2] + grow); // толстая линия постоянной толщины 2r
  return diskPiece(pt.dot, h);
}
// заливка с вырезами (holes — детали-знаки): два пути. Первый — осевая контура и точный край вырезов (объединение
// знаков, как в svg/fill) с evenodd, только заливка; второй — та же осевая линией. Вырез обязан отстоять от осевой
// не меньше чем на полтолщины — иначе линия края его закроет
function holedElement(pt) {
  const k = weightOf(pt), inner = fillPiece(pt.solid), loops = union(pt.holes.map((q) => pieceOf(q)));
  for (const e of loops.flat()) for (const t of [0, 0.25, 0.5, 0.75]) if (inner.bd(pointAt(e, t)) > -H * k) throw new Error('вырез заходит на линию края заливки');
  return `<path d="${pathToD(pt.solid, DP)}${loopsToD(loops, DP)}" fill="currentColor" fill-rule="evenodd" stroke="none"/>\n  ${strokeElement(pt.solid, false, k)}`;
}
const svgStroke = (parts) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="${n(W)}" stroke-linecap="round" stroke-linejoin="round">\n${parts.map((pt) => {
  if (pt.stroke) return `  ${strokeElement(pt.stroke, false, weightOf(pt))}`;
  if (pt.solid) return `  ${pt.holes ? holedElement(pt) : strokeElement(pt.solid, true, weightOf(pt))}`;
  if (pt.capsule) return `  <path d="${pathToD(line(pt.capsule[0], pt.capsule[1]), DP)}" stroke-width="${n(2 * pt.capsule[2])}"/>`;
  if (pt.fill) return `  <path d="${pathToD(pt.fill, DP)}" fill="currentColor" stroke="none"/>`;
  const [c, r] = pt.disk ?? [pt.dot, H * weightOf(pt)];
  return `  <circle cx="${n(c[0])}" cy="${n(c[1])}" r="${n(r)}" fill="currentColor" stroke="none"/>`;
}).join('\n')}\n</svg>\n`;
const svgFill = (d) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">\n  <path fill="currentColor" d="${d}"/>\n</svg>\n`;

const names = new Set(ICONS.map((i) => i.name));
if (names.size !== ICONS.length) throw new Error('имена иконок повторяются');
for (const dir of ['fill', 'stroke']) {
  fs.mkdirSync(path.join(ROOT, 'svg', dir), { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, 'svg', dir))) if (f.endsWith('.svg') && !names.has(f.slice(0, -4))) fs.rmSync(path.join(ROOT, 'svg', dir, f));
}

const report = [];
let failed = 0;
for (const icon of ICONS) {
  try {
    // вырезы заливки — отрицательные куски: union вычитает их из остального
    const pieces = icon.parts.flatMap((pt) => [pieceOf(pt), ...(pt.holes ?? []).map((q) => ({ ...pieceOf(q), neg: true }))]);
    const loops = union(pieces);
    const d = loopsToD(loops, DP);
    fs.writeFileSync(path.join(ROOT, 'svg', 'fill', `${icon.name}.svg`), svgFill(d));
    fs.writeFileSync(path.join(ROOT, 'svg', 'stroke', `${icon.name}.svg`), svgStroke(icon.parts));
    if (args.includes('--verbose')) report.push(`${icon.name.padEnd(24)} контуров ${String(loops.length).padStart(2)}  сегментов ${String((d.match(/[LHVC]/g) ?? []).length).padStart(3)}`);
  } catch (e) {
    failed++;
    report.push(`${icon.name.padEnd(24)} ОШИБКА: ${e.message}`);
  }
}
if (report.length) console.log(report.join('\n'));
console.log(`толщина ${W}: ${ICONS.length - failed} из ${ICONS.length} иконок → svg/fill, svg/stroke`);
if (failed) process.exit(1);
