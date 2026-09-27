// Сборка сайта: node tools/site.mjs → docs/ (GitHub Pages) и картинки README в assets/.
// Вход: svg/fill и svg/stroke (tools/build.mjs), каталог src/meta.mjs, страница site/ (index.html, app.css, app.js, fonts/).
// Числа иконок (узлы, окружности, зеркало) считает tools/stats.mjs; их кеш по содержимому файла — .cache/stats.json
// (в git не идёт; его пишут и check.mjs, и эта сборка; без него сборка просто дольше).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICONS } from '../src/icons.mjs';
import { CATEGORIES } from '../src/meta.mjs';
import { LUCIDE, TABLER } from '../src/third-party.mjs';
import { iconStats, svgHash, statsRow, readCache, writeCache } from './stats.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs'), SITE = path.join(ROOT, 'site'), ASSETS = path.join(ROOT, 'assets');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

// каталог ↔ исходник: каждая иконка ровно в одной категории
const listed = CATEGORIES.flatMap((c) => Object.keys(c.icons));
const names = new Set(ICONS.map((i) => i.name));
const problems = [
  ...listed.filter((n, k) => listed.indexOf(n) !== k).map((n) => `${n}: дважды в каталоге`),
  ...listed.filter((n) => !names.has(n)).map((n) => `${n}: есть в каталоге, нет в src/icons.mjs`),
  ...[...names].filter((n) => !listed.includes(n)).map((n) => `${n}: нет в каталоге src/meta.mjs`),
  ...[...Object.keys(LUCIDE), ...Object.keys(TABLER)].filter((n) => !names.has(n)).map((n) => `${n}: есть в src/third-party.mjs, нет в src/icons.mjs`),
];
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }

// числа иконок — с кешем по содержимому svg/fill
const cache = readCache(), fresh = {};
let computed = 0;

const pathD = (svg) => /<path fill="currentColor" d="([^"]+)"\/>/.exec(svg)[1];
const strokeInner = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>\s*/, '').replace(/\s*<\/svg>\s*$/, '').replace(/\n\s*/g, '');

const cats = [];
const icons = [];
for (const c of CATEGORIES) {
  cats.push({ id: c.id, ru: c.ru, en: c.en });
  for (const [name, [ru, tags]] of Object.entries(c.icons)) {
    const fill = read('svg', 'fill', `${name}.svg`), stroke = read('svg', 'stroke', `${name}.svg`);
    const hash = svgHash(fill);
    let st = cache[name]?.hash === hash ? cache[name].st : null;
    if (!st) { st = statsRow(iconStats(fill, name)); computed++; }
    fresh[name] = { hash, st };
    icons.push({ n: name, c: c.id, ru, t: tags, d: pathD(fill), s: strokeInner(stroke), st, ...(LUCIDE[name] ? { l: LUCIDE[name] } : {}), ...(TABLER[name] ? { tb: TABLER[name] } : {}) });
  }
}
writeCache(fresh);

// docs/: страница как есть, данные — одним скриптом (страница открывается и с диска, без сервера).
// Папка собирается заново целиком; CNAME (свой домен GitHub Pages), если появится, переживает пересборку.
const cname = fs.existsSync(path.join(DOCS, 'CNAME')) ? fs.readFileSync(path.join(DOCS, 'CNAME')) : null;
fs.rmSync(DOCS, { recursive: true, force: true });
fs.mkdirSync(DOCS, { recursive: true });
if (cname) fs.writeFileSync(path.join(DOCS, 'CNAME'), cname);
for (const f of ['index.html', 'app.css', 'app.js']) fs.copyFileSync(path.join(SITE, f), path.join(DOCS, f));
// шрифты сайта (Onest, Source Code Pro) — вместе с их лицензиями OFL
fs.cpSync(path.join(SITE, 'fonts'), path.join(DOCS, 'fonts'), { recursive: true });
// сторонние лицензии: списки иконок, совпавших с Lucide и Tabler, — между метками <!--lucide-list-->…<!--/lucide-list-->
// и <!--tabler-list-->…<!--/tabler-list-->, их числа — между <!--lucide-count-->… и <!--tabler-count-->… (здесь и в README)
const listOf = (map, label) => Object.keys(map).sort().map((n) => (map[n] === n ? `\`${n}\`` : `\`${n}\` (${label}: \`${map[n]}\`)`)).join(', ').concat('.')
  .replace(/(.{1,112})(, |$)/g, (m, a, b) => `${a}${b.trim() ? ',' : ''}\n`).trimEnd();
const withCounts = (text) => text
  .replace(/<!--lucide-count-->\d+<!--\/lucide-count-->/g, `<!--lucide-count-->${Object.keys(LUCIDE).length}<!--/lucide-count-->`)
  .replace(/<!--tabler-count-->\d+<!--\/tabler-count-->/g, `<!--tabler-count-->${Object.keys(TABLER).length}<!--/tabler-count-->`);
{
  const file = path.join(ROOT, 'THIRD-PARTY-NOTICES.md'), text = fs.readFileSync(file, 'utf8');
  const next = withCounts(text)
    .replace(/<!--lucide-list-->[\s\S]*?<!--\/lucide-list-->/, `<!--lucide-list-->\n${listOf(LUCIDE, 'Lucide')}\n<!--/lucide-list-->`)
    .replace(/<!--tabler-list-->[\s\S]*?<!--\/tabler-list-->/, `<!--tabler-list-->\n${listOf(TABLER, 'Tabler')}\n<!--/tabler-list-->`);
  if (next !== text) fs.writeFileSync(file, next);
}
const data = { categories: cats, icons, license: read('LICENSE'), notices: read('THIRD-PARTY-NOTICES.md') };
fs.writeFileSync(path.join(DOCS, 'icons.js'), `// Klaarheid Icons: данные сайта, собраны tools/site.mjs — не править руками\nwindow.KLAARHEID = ${JSON.stringify(data)};\n`);
fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');

// значок вкладки — диафрагма набора, цвет по теме
const aperture = icons.find((i) => i.n === 'aperture').d;
fs.writeFileSync(path.join(DOCS, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><style>path{fill:#275f9e}@media (prefers-color-scheme:dark){path{fill:#87bfff}}</style><path d="${aperture}"/></svg>\n`);

// README: весь набор сеткой 23 × 15 (по порядку каталога), светлый и тёмный вариант
const COLS = 23, CELL = 40, PAD = 8, rows = Math.ceil(icons.length / COLS);
const W = COLS * CELL + 2 * PAD, H = rows * CELL + 2 * PAD;
const wall = (ink) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" color="${ink}">\n${icons.map((ic, k) => {
  const x = PAD + (k % COLS) * CELL + (CELL - 24) / 2, y = PAD + Math.floor(k / COLS) * CELL + (CELL - 24) / 2;
  return `<g transform="translate(${x} ${y})" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ic.s}</g>`;
}).join('\n')}\n</svg>\n`;
fs.mkdirSync(ASSETS, { recursive: true });
fs.writeFileSync(path.join(ASSETS, 'icons-light.svg'), wall('#141820'));
fs.writeFileSync(path.join(ASSETS, 'icons-dark.svg'), wall('#e7eaef'));

// число иконок в README — между метками <!--count-->…<!--/count-->
for (const f of ['README.md', 'README.ru.md']) {
  const file = path.join(ROOT, f), text = fs.readFileSync(file, 'utf8');
  const next = withCounts(text.replace(/<!--count-->\d+<!--\/count-->/g, `<!--count-->${icons.length}<!--/count-->`));
  if (next !== text) fs.writeFileSync(file, next);
}

const kb = (f) => `${(fs.statSync(f).size / 1024).toFixed(0)} КБ`;
console.log(`сайт: ${icons.length} иконок в ${cats.length} категориях → docs/ (icons.js ${kb(path.join(DOCS, 'icons.js'))}); чисел посчитано заново: ${computed}`);
console.log(`README: assets/icons-light.svg и icons-dark.svg (${kb(path.join(ASSETS, 'icons-light.svg'))})`);
