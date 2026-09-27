// Проверка набора: node tools/check.mjs [--pixels] [--json файл] [--verbose]
// (1) Геометрия контуров svg/fill (tools/lint.mjs): окружности канонические, прямые — прямые, без надломов,
//     наклонов, лишних кусков и микросегментов; концы и стыки — по правилу (tools/stats.mjs).
// (2) С --pixels — ещё и попиксельно: контур svg/fill против линии svg/stroke, которую рисует браузер
//     (нужен google-chrome). Расходиться должно только сглаживание края.
// Код выхода 1, если нашлось хоть одно замечание.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { iconStats, svgHash, statsRow, writeCache } from './stats.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const FILL = path.join(ROOT, 'svg', 'fill'), STROKE = path.join(ROOT, 'svg', 'stroke');
const names = fs.readdirSync(FILL).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)).sort();

// (1) геометрия; заодно — кеш чисел для tools/site.mjs
const icons = {}, cache = {};
const totals = { icons: names.length, circles: 0, canon: 0, issues: 0, mirror: 0, caps: 0, joins: 0, arcs: 0, endsBad: 0 };
for (const nm of names) {
  const svg = fs.readFileSync(path.join(FILL, `${nm}.svg`), 'utf8'), q = iconStats(svg, nm);
  icons[nm] = q;
  cache[nm] = { hash: svgHash(svg), st: statsRow(q) };
  totals.circles += q.circles; totals.canon += q.canon; totals.issues += q.issues;
  totals.caps += q.ends.caps; totals.joins += q.ends.joins; totals.arcs += q.ends.arcs; totals.endsBad += q.endsBad;
  if (q.mirror !== null) totals.mirror = Math.max(totals.mirror, q.mirror);
}

writeCache(cache);

// (2) пиксели: снимки листов 8 × N по 240 px, контур против линии
const PIXELS_LIMIT = 2; // %: больше — уже не сглаживание края
function readPng(buf) {
  let pos = 8, w = 0, h = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); colorType = data[9]; if (data[8] !== 8) throw new Error('PNG: нужна глубина 8 бит'); }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const bpp = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType], stride = w * bpp, raw = zlib.inflateSync(Buffer.concat(idat)), px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], row = y * (stride + 1) + 1;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0, b = y ? px[(y - 1) * stride + x] : 0, c = x >= bpp && y ? px[(y - 1) * stride + x - bpp] : 0;
      let v = raw[row + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[y * stride + x] = v & 255;
    }
  }
  // яркость как у PIL convert('L')
  const gray = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) gray[i] = bpp < 3 ? px[i * bpp] : Math.floor((px[i * bpp] * 299 + px[i * bpp + 1] * 587 + px[i * bpp + 2] * 114) / 1000);
  return { w, h, gray };
}
if (args.includes('--pixels')) {
  const SIZE = 240, COLS = 8, rows = Math.ceil(names.length / COLS);
  const inner = (f) => fs.readFileSync(f, 'utf8').replace(/^[\s\S]*?(<svg[^>]*>)/, '$1').replace(/width="24" height="24"/, `width="${SIZE}" height="${SIZE}"`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'klaarheid-check-'));
  const shot = {};
  for (const [dir, from] of [['stroke', STROKE], ['fill', FILL]]) {
    const html = `<!doctype html><style>html,body{margin:0;background:#fff;color:#000}div{display:grid;grid-template-columns:repeat(${COLS},${SIZE}px);grid-auto-rows:${SIZE}px;line-height:0}svg{display:block}</style><div>${names.map((nm) => inner(path.join(from, `${nm}.svg`))).join('')}</div>`;
    fs.writeFileSync(path.join(tmp, `${dir}.html`), html);
    shot[dir] = path.join(tmp, `${dir}.png`);
    execFileSync('google-chrome', ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=1', `--screenshot=${shot[dir]}`, `--window-size=${COLS * SIZE},${rows * SIZE}`, `file://${path.join(tmp, `${dir}.html`)}`], { stdio: 'ignore' });
  }
  const a = readPng(fs.readFileSync(shot.stroke)), b = readPng(fs.readFileSync(shot.fill));
  fs.rmSync(tmp, { recursive: true, force: true });
  totals.pixels = 0;
  names.forEach((nm, k) => {
    const r = Math.floor(k / COLS), c = k % COLS;
    let big = 0, ink = 0, max = 0;
    for (let y = r * SIZE; y < (r + 1) * SIZE; y++) for (let x = c * SIZE; x < (c + 1) * SIZE; x++) {
      const i = y * a.w + x, d = Math.abs(a.gray[i] - b.gray[i]);
      if (a.gray[i] < 128) ink++;
      if (d >= 64) big++;
      if (d > max) max = d;
    }
    icons[nm].pixels = +((100 * big) / Math.max(1, ink)).toFixed(2);
    icons[nm].pixelMax = max;
    totals.pixels = Math.max(totals.pixels, icons[nm].pixels);
  });
}

const bad = names.filter((nm) => icons[nm].issues || icons[nm].endsBad || icons[nm].canon < icons[nm].circles || (icons[nm].pixels ?? 0) > PIXELS_LIMIT);
if (args.includes('--verbose')) for (const nm of names) {
  const q = icons[nm];
  console.log(`${nm.padEnd(24)} узлов ${String(q.nodes).padStart(3)}  окружн. ${q.canon}/${q.circles}  замечаний ${q.issues}  зеркало ${q.mirror ?? '—'}${q.pixels !== undefined ? `  пиксели ${q.pixels} % (до ${q.pixelMax}/255)` : ''}`);
}
for (const nm of bad) console.log(`ЗАМЕЧАНИЕ ${nm}: ${JSON.stringify({ issues: icons[nm].issues, canon: `${icons[nm].canon}/${icons[nm].circles}`, ends: icons[nm].endsBad ? icons[nm].ends : 0, pixels: icons[nm].pixels })}`);
console.log(`${totals.icons} иконок: окружностей ${totals.canon}/${totals.circles} канонических, замечаний ${totals.issues}, отход от зеркала ≤ ${totals.mirror}${totals.pixels !== undefined ? `, пикселей расходится ≤ ${totals.pixels} %` : ''}`);
console.log(`концы: торцов ${totals.caps}, стыков ${totals.joins}, прочих разрезанных дуг ${totals.arcs}; не по правилу: ${totals.endsBad}`);
if (args.includes('--json')) fs.writeFileSync(args[args.indexOf('--json') + 1], JSON.stringify({ totals, icons }, null, 1));
if (bad.length) { console.log(`не прошли проверку: ${bad.length}`); process.exit(1); }
