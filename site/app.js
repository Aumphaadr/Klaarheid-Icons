// Klaarheid Icons — сайт набора: просмотр с цветом и размером, узлы и рычаги контура,
// выгрузка SVG и PNG по одной и всего набора архивом (ZIP собирается в браузере).
(() => {
  'use strict';
  const DATA = window.KLAARHEID;
  const ICONS = DATA.icons, CATS = DATA.categories;
  ICONS.forEach((ic, i) => { ic.i = i; });
  const byName = new Map(ICONS.map((ic) => [ic.n, ic]));
  const catById = new Map(CATS.map((c) => [c.id, c]));
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const store = {
    get(k, d) { try { const v = localStorage.getItem(`klaarheid.${k}`); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(`klaarheid.${k}`, v); } catch (e) { /* без хранилища — просто не запомним */ } },
  };
  const REPO = 'https://github.com/Aumphaadr/Klaarheid-Icons', NOTICES = `${REPO}/blob/main/THIRD-PARTY-NOTICES.md`;

  // ---------- тексты ----------
  const T = {
    ru: {
      lede: 'Точные иконки: каждая построена из отрезков и дуг окружностей на сетке 24, а не обведена с рисунка. Окружности канонические, концы линий — ровные полукруги, симметричные иконки совпадают со своим зеркалом.',
      pIcons: ['иконка', 'иконки', 'иконок'], pCats: ['категория', 'категории', 'категорий'],
      pNodes: ['узел', 'узла', 'узлов'], pLoops: ['контур', 'контура', 'контуров'],
      factGrid: 'сетка 24 · линия 2', factFormats: 'SVG · PNG',
      licTitle: 'Лицензия MIT-0: бесплатно, без спроса и без условий*',
      licItems: [
        'Бесплатно — в личных и коммерческих проектах, открытых и закрытых.',
        'Без разрешений и без упоминания автора — ни в интерфейсе, ни на сайте, ни в титрах.',
        'Без условий: даже текст лицензии прикладывать к файлам не нужно.',
        'Можно менять: перекрашивать, перерисовывать, включать в свои наборы и шрифты.',
        'Права: каждая иконка построена в коде из отрезков и дуг, автор передаёт вам свои права по MIT-0.',
      ],
      licNote: 'MIT-0 (MIT No Attribution) — та же лицензия MIT, только без её единственного условия: сохранять уведомление об авторстве в копиях.',
      licFoot: '* Сноска: есть иконки, чей рисунок совпадает с иконками Lucide ({n}) или Tabler ({m}). В основном это простые знаки — плюс, шевроны, стрелки, лупа, — но есть и рисунки вроде наушников и калькулятора. На них действует и лицензия того набора (Lucide — ISC, Tabler — MIT): берёте такие иконки — сохраните её текст. Они помечены в карточке; списки и тексты лицензий — в <a href="{url}" target="_blank" rel="noopener">THIRD-PARTY-NOTICES.md</a>.',
      cardL: 'иконкой Lucide «{l}»', cardT: 'иконкой Tabler «{tb}»', cardLT: 'иконками Lucide «{l}» и Tabler «{tb}»',
      licL: 'действует и лицензия ISC Lucide', licT: 'действует и лицензия MIT Tabler', licLT: 'действуют и лицензии ISC Lucide и MIT Tabler',
      thirdCard: 'Сноска: рисунок совпадает с {what} — на него {lic}. Тексты лицензий — в <a href="{url}" target="_blank" rel="noopener">THIRD-PARTY-NOTICES.md</a>.',
      getAll: 'Скачать всё (SVG)', packMore: 'Другие варианты',
      heroCaption: '— узлы и рычаги контура; пунктир — осевая линия исходника',
      search: 'Поиск: имя или слово', size: 'Размер', color: 'Цвет', colorAuto: 'как текст', all: 'Все',
      category: 'Категория', categories: 'Категории',
      countAll: '{n} {icons}', countFound: 'найдено {n} из {total}',
      empty: 'Ничего не нашлось. Попробуйте другое слово или <a href="{url}" target="_blank" rel="noopener">попросите иконку</a>.',
      aboutTitle: 'Как построены иконки', useTitle: 'Как подключить',
      useText: 'Берите файлы из архива или прямо из репозитория. Контур (svg/fill) — одна заливка; линия (svg/stroke) — осевые со stroke-width 2, как у Lucide и Feather. Обе красятся через currentColor.',
      rules: [
        '<b>Сетка 24 × 24, линия 2</b>, концы и стыки круглые. Тонкая линия 1,5 — только для мелких знаков в тесном поле.',
        '<b>Построены, а не нарисованы.</b> Исходник — осевые линии из отрезков и дуг окружностей; контур заливкой вычислен из них смещением на ±1 и объединением деталей.',
        '<b>Окружности канонические</b>: 4 узла на осях, рычаги 0,5523·r. Дуги режутся на осях, торец линии — полукруг из трёх узлов.',
        '<b>Горизонтали и вертикали — на целых координатах</b>: в 24 px их края ложатся на пиксели.',
        '<b>Просвет 2</b> между отдельными деталями (у тонких знаков 1,5); детали, которые сходятся, кончаются на осевой соседки.',
        '<b>Каждая сборка проверяется</b>: прямые без прогиба, узлы без надломов, окружности канонические, контур совпадает с линией, которую рисует браузер.',
      ],
      useHtml: '<!-- в строке: цвет берётся у текста -->\n<svg width="24" height="24" viewBox="0 0 24 24">\n  <path fill="currentColor" d="…"/>\n</svg>\n\n<!-- картинкой -->\n<img src="house.svg" width="24" height="24" alt="">',
      useCss: '/* маской CSS: цвет — background-color */\n.icon {\n  width: 24px;\n  height: 24px;\n  background: currentColor;\n  mask: url(house.svg) center / contain no-repeat;\n}',
      license: 'Лицензия MIT-0', request: 'Попросить иконку', colorPick: 'Выбрать цвет',
      themeToDark: 'Тёмная тема', themeToLight: 'Светлая тема', langSwitch: 'Switch to English',
      prev: 'Предыдущая', next: 'Следующая', close: 'Закрыть',
      tabIcon: 'Иконка', tabNodes: 'Узлы и рычаги', zoom: 'Масштаб',
      lgCorner: 'угловой узел', lgSmooth: 'гладкий узел', lgHandle: 'рычаг', lgAxis: 'осевая линия', lgSafe: 'поле 1',
      stNodes: 'на контуре', stCircles: 'окружности — канонические', stMirror: 'отход от своего зеркала',
      download: 'Скачать', exportSize: 'Размер, px', svgOutline: 'SVG · контур', svgStroke: 'SVG · линия',
      copySvg: 'Копировать SVG', copyName: 'Копировать имя', copied: 'Скопировано', copyFail: 'Не вышло скопировать',
      exportNote: 'Контур — точная заливка одним path. Линия — осевые со stroke-width 2. Без выбранного цвета SVG берёт цвет текста (currentColor), а PNG будет чёрным.',
      colorNow: 'currentColor · PNG чёрным', of: 'из',
      packTitle: 'Весь набор', packLede: '{n} {icons} одним архивом, вместе с лицензиями.',
      format: 'Формат', fmtSvg: 'SVG — контур и линия', fmtPng: 'PNG',
      colCurrent: 'currentColor — цвет текста (PNG — чёрным)', colChosen: 'выбранный цвет',
      packGo: 'Собрать и скачать', packBusy: 'Собираю: {i} из {n}', packDone: 'Готово: {file}', packFail: 'Не получилось: {err}',
      dlStarted: 'Скачивание началось: {file}',
    },
    en: {
      lede: 'Precise icons: each one is constructed from line segments and circular arcs on a 24 grid, not traced from a drawing. Circles are canonical, line ends are true semicircles, and symmetric icons match their mirror exactly.',
      pIcons: ['icon', 'icons'], pCats: ['category', 'categories'], pNodes: ['node', 'nodes'], pLoops: ['contour', 'contours'],
      factGrid: '24 grid · 2 px line', factFormats: 'SVG · PNG',
      licTitle: 'MIT-0 License: free, no permission, no conditions*',
      licItems: [
        'Free — in personal and commercial, open and closed projects.',
        'No permission and no credit needed — not in your interface, on your site or in the credits.',
        'No conditions: you do not even have to ship the license text with the files.',
        'Change them as you like: recolor, redraw, put them into your own sets and fonts.',
        'Rights: every icon is constructed in code from line segments and arcs, and the author’s rights are granted to you under MIT-0.',
      ],
      licNote: 'MIT-0 (MIT No Attribution) is the MIT License without its only condition — keeping the copyright notice in copies.',
      licFoot: '* Footnote: some icons coincide with Lucide icons ({n}) or Tabler icons ({m}). Most of them are elementary signs — a plus, chevrons, arrows, a magnifier — but some are pictograms, like headphones or a calculator. These are also covered by the license of that set (Lucide — ISC, Tabler — MIT): if you use them, keep its text. They are marked on their cards; the lists and the license texts are in <a href="{url}" target="_blank" rel="noopener">THIRD-PARTY-NOTICES.md</a>.',
      cardL: 'the Lucide icon “{l}”', cardT: 'the Tabler icon “{tb}”', cardLT: 'the Lucide icon “{l}” and the Tabler icon “{tb}”',
      licL: 'the Lucide ISC license', licT: 'the Tabler MIT license', licLT: 'the Lucide ISC and the Tabler MIT licenses',
      thirdCard: 'Footnote: this drawing coincides with {what} and is also covered by {lic}. The license texts are in <a href="{url}" target="_blank" rel="noopener">THIRD-PARTY-NOTICES.md</a>.',
      getAll: 'Download all (SVG)', packMore: 'More options',
      heroCaption: '— nodes and handles of the outline; dashed — the source centerline',
      search: 'Search by name or keyword', size: 'Size', color: 'Color', colorAuto: 'text color', all: 'All',
      category: 'Category', categories: 'Categories',
      countAll: '{n} {icons}', countFound: '{n} of {total}',
      empty: 'Nothing found. Try another word or <a href="{url}" target="_blank" rel="noopener">request an icon</a>.',
      aboutTitle: 'How the icons are built', useTitle: 'How to use',
      useText: 'Take the files from the archive or straight from the repository. The outline flavour (svg/fill) is one filled path; the stroke flavour (svg/stroke) is centerlines with stroke-width 2, like Lucide and Feather. Both are colored with currentColor.',
      rules: [
        '<b>24 × 24 grid, 2 px line</b>, round caps and joins. A thinner 1.5 line only for small marks in tight spaces.',
        '<b>Constructed, not drawn.</b> The source is centerlines made of line segments and circular arcs; the filled outline is computed from them by offsetting ±1 and merging the parts.',
        '<b>Canonical circles</b>: 4 nodes on the axes, handles 0.5523·r. Arcs are split at the axes; a line end is a semicircle of three nodes.',
        '<b>Horizontals and verticals sit on whole coordinates</b>, so at 24 px their edges land on pixels.',
        '<b>A clearance of 2</b> between separate parts (1.5 for thin marks); parts that meet end on the neighbour’s centerline.',
        '<b>Every build is checked</b>: straight lines are straight, nodes have no kinks, circles are canonical, and the outline matches the line the browser draws.',
      ],
      useHtml: '<!-- inline: takes the color of the text -->\n<svg width="24" height="24" viewBox="0 0 24 24">\n  <path fill="currentColor" d="…"/>\n</svg>\n\n<!-- as an image -->\n<img src="house.svg" width="24" height="24" alt="">',
      useCss: '/* as a CSS mask, colored by background-color */\n.icon {\n  width: 24px;\n  height: 24px;\n  background: currentColor;\n  mask: url(house.svg) center / contain no-repeat;\n}',
      license: 'MIT-0 License', request: 'Request an icon', colorPick: 'Choose a color',
      themeToDark: 'Dark theme', themeToLight: 'Light theme', langSwitch: 'Переключить на русский',
      prev: 'Previous', next: 'Next', close: 'Close',
      tabIcon: 'Icon', tabNodes: 'Nodes & handles', zoom: 'Zoom',
      lgCorner: 'corner node', lgSmooth: 'smooth node', lgHandle: 'handle', lgAxis: 'centerline', lgSafe: '1-unit margin',
      stNodes: 'on the outline', stCircles: 'circles are canonical', stMirror: 'deviation from its own mirror',
      download: 'Download', exportSize: 'Size, px', svgOutline: 'SVG · outline', svgStroke: 'SVG · stroke',
      copySvg: 'Copy SVG', copyName: 'Copy name', copied: 'Copied', copyFail: 'Could not copy',
      exportNote: 'Outline is the precise filled shape, one path. Stroke is the centerline with stroke-width 2. Without a chosen color SVG uses the text color (currentColor) and PNG is black.',
      colorNow: 'currentColor · PNG in black', of: 'of',
      packTitle: 'The whole pack', packLede: '{n} {icons} in one archive, licenses included.',
      format: 'Format', fmtSvg: 'SVG — outline and stroke', fmtPng: 'PNG',
      colCurrent: 'currentColor — the text color (PNG in black)', colChosen: 'chosen color',
      packGo: 'Build and download', packBusy: 'Building: {i} of {n}', packDone: 'Done: {file}', packFail: 'Failed: {err}',
      dlStarted: 'Download started: {file}',
    },
  };
  let lang = store.get('lang', 'ru');
  if (!T[lang]) lang = 'ru';
  const t = (k, vars) => {
    let s = T[lang][k] ?? T.en[k] ?? k;
    if (vars && typeof s === 'string') for (const [a, b] of Object.entries(vars)) s = s.split(`{${a}}`).join(b);
    return s;
  };
  const plural = (n, key) => {
    const f = T[lang][key];
    if (lang !== 'ru') return n === 1 ? f[0] : f[1];
    const d = n % 10, h = n % 100;
    return d === 1 && h !== 11 ? f[0] : d >= 2 && d <= 4 && (h < 12 || h > 14) ? f[1] : f[2];
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const catName = (id) => catById.get(id)[lang === 'ru' ? 'ru' : 'en'];

  // ---------- рисунки ----------
  const svgInline = (ic, size, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path fill="currentColor" d="${ic.d}"/></svg>`;
  // файлы: как в svg/fill и svg/stroke, с размером и цветом выгрузки
  function fileSvg(ic, kind, size, color) {
    const c = color || 'currentColor';
    if (kind === 'fill') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">\n  <path fill="${c}" d="${ic.d}"/>\n</svg>\n`;
    const inner = (color ? ic.s.split('currentColor').join(color) : ic.s).replace(/></g, '>\n  <');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n  ${inner}\n</svg>\n`;
  }
  function fillUiIcons(root = document) {
    for (const el of root.querySelectorAll('[data-icon]')) {
      const ic = byName.get(el.dataset.icon);
      if (ic && !el.firstElementChild) el.innerHTML = svgInline(ic, 18);
    }
  }

  // узловой вид: контур заливкой, как его покажет редактор; узлы (квадрат — угол, круг — гладкий), рычаги,
  // осевая линия исходника пунктиром
  function parseD(d) {
    const subs = [];
    let sp = null, cur = [0, 0], start = [0, 0];
    for (const m of d.matchAll(/([MHVLCZ])([^MHVLCZ]*)/g)) {
      const c = m[1], a = m[2].trim() ? m[2].trim().split(/[\s,]+/).map(Number) : [];
      if (c === 'M') { cur = start = [a[0], a[1]]; sp = { segs: [] }; subs.push(sp); }
      else if (c === 'H') { const p = [a[0], cur[1]]; sp.segs.push({ k: 'L', p: [cur, p] }); cur = p; }
      else if (c === 'V') { const p = [cur[0], a[0]]; sp.segs.push({ k: 'L', p: [cur, p] }); cur = p; }
      else if (c === 'L') { const p = [a[0], a[1]]; sp.segs.push({ k: 'L', p: [cur, p] }); cur = p; }
      else if (c === 'C') { const p = [a[4], a[5]]; sp.segs.push({ k: 'C', p: [cur, [a[0], a[1]], [a[2], a[3]], p] }); cur = p; }
      else if (c === 'Z') { if (Math.hypot(cur[0] - start[0], cur[1] - start[1]) > 1e-9) sp.segs.push({ k: 'L', p: [cur, start] }); cur = start; }
    }
    return subs;
  }
  const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const tanStart = (s) => { for (const q of s.p.slice(1)) { const v = sub2(q, s.p[0]); if (Math.hypot(v[0], v[1]) > 1e-9) return v; } return [0, 0]; };
  const tanEnd = (s) => { const e = s.p[s.p.length - 1]; for (const q of s.p.slice(0, -1).reverse()) { const v = sub2(e, q); if (Math.hypot(v[0], v[1]) > 1e-9) return v; } return [0, 0]; };
  const angBetween = (a, b) => Math.abs(Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1])) * 180 / Math.PI;
  function nodesSvg(ic, W) {
    const u = 25 / W, P = (p) => `${+p[0].toFixed(4)} ${+p[1].toFixed(4)}`;
    let grid = '';
    for (let i = 0; i <= 24; i++) grid += `M${i} 0V24M0 ${i}H24`;
    let g = `<path d="${grid}" class="nv-grid" vector-effect="non-scaling-stroke"/><rect x="1" y="1" width="22" height="22" class="nv-safe" vector-effect="non-scaling-stroke"/>`;
    g += `<path d="${ic.d}" class="nv-fill"/><path d="${ic.d}" class="nv-line" vector-effect="non-scaling-stroke"/><g class="nv-axis">${ic.s}</g>`;
    let handles = '', nodes = '';
    for (const sp of parseD(ic.d)) {
      const n = sp.segs.length;
      sp.segs.forEach((sg, k) => {
        if (sg.k === 'C') for (const [a, b] of [[sg.p[0], sg.p[1]], [sg.p[3], sg.p[2]]]) {
          if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6) continue;
          handles += `<path d="M${P(a)}L${P(b)}" class="nv-handle" vector-effect="non-scaling-stroke"/><circle cx="${+b[0].toFixed(4)}" cy="${+b[1].toFixed(4)}" r="${(1.8 * u).toFixed(4)}" class="nv-hdot"/>`;
        }
        const prev = sp.segs[(k - 1 + n) % n], p = sg.p[0], h = 3 * u;
        nodes += angBetween(tanEnd(prev), tanStart(sg)) > 0.5
          ? `<rect x="${(p[0] - h).toFixed(4)}" y="${(p[1] - h).toFixed(4)}" width="${(2 * h).toFixed(4)}" height="${(2 * h).toFixed(4)}" class="nv-node"/>`
          : `<circle cx="${+p[0].toFixed(4)}" cy="${+p[1].toFixed(4)}" r="${h.toFixed(4)}" class="nv-node"/>`;
      });
    }
    return `<svg class="nv" viewBox="-0.5 -0.5 25 25" width="${W}" height="${W}" role="img" aria-label="${esc(ic.n)}: ${esc(t('tabNodes'))}">${g}${handles}${nodes}</svg>`;
  }

  // ---------- подсветка примера: HTML и CSS ----------
  const tok = (cls, s) => `<span class="t-${cls}">${esc(s)}</span>`;
  function hlHtml(src) {
    let out = '', i = 0;
    for (const m of src.matchAll(/<!--[\s\S]*?-->|<\/?[\w-]+|[\w:-]+(?==)|=|"[^"]*"|\/?>/g)) {
      const s = m[0];
      out += esc(src.slice(i, m.index));
      if (s.startsWith('<!--')) out += tok('com', s);
      else if (s[0] === '<') { const cut = s[1] === '/' ? 2 : 1; out += tok('punct', s.slice(0, cut)) + tok('tag', s.slice(cut)); }
      else if (s === '=' || s.endsWith('>')) out += tok('punct', s);
      else if (s[0] === '"') out += tok('str', s);
      else out += tok('attr', s);
      i = m.index + s.length;
    }
    return out + esc(src.slice(i));
  }
  function hlCss(src) {
    let out = '', i = 0, depth = 0;
    for (const m of src.matchAll(/\/\*[\s\S]*?\*\/|url\([^)]*\)|[{}]|[;:,\/()]|-?\d*\.?\d+(?:px|%|em|rem|deg|s)?\b|[.#]?[a-zA-Z_-][\w-]*/g)) {
      const s = m[0], rest = src.slice(m.index + s.length);
      out += esc(src.slice(i, m.index));
      if (s.startsWith('/*')) out += tok('com', s);
      else if (s.startsWith('url(')) out += tok('fn', 'url') + tok('punct', '(') + tok('str', s.slice(4, -1)) + tok('punct', ')');
      else if (s === '{' || s === '}') { depth += s === '{' ? 1 : -1; out += tok('punct', s); }
      else if (/^[;:,/()]$/.test(s)) out += tok('punct', s);
      else if (/^-?\.?\d/.test(s)) out += tok('num', s);
      else if (!depth) out += tok('sel', s);
      else if (/^\s*:/.test(rest)) out += tok('prop', s);
      else if (rest.startsWith('(')) out += tok('fn', s);
      else out += tok('kw', s);
      i = m.index + s.length;
    }
    return out + esc(src.slice(i));
  }

  // ---------- состояние ----------
  let size = +store.get('size', 24);
  if (!(size >= 16 && size <= 64)) size = 24;
  let colorMode = store.get('colorMode', 'auto'), colorVal = store.get('color', '#275f9e');
  if (!/^#[0-9a-f]{6}$/i.test(colorVal)) colorVal = '#275f9e';
  let currentCat = 'all', query = ''; // currentCat — раздел под панелью поиска (подсветка в оглавлении)
  let visible = ICONS;
  let cur = null, view = 'icon', zoom = +store.get('zoom', 192), xsize = +store.get('xsize', 24);
  if (!(zoom >= 16 && zoom <= 384)) zoom = 192;
  if (!(xsize >= 8 && xsize <= 2048)) xsize = 24;
  let packSize = 24;
  const SIZES = [16, 20, 24, 32, 48, 64, 128, 256, 512];
  const pickedColor = () => (colorMode === 'pick' ? colorVal : null);

  // ---------- сетка ----------
  const norm = (s) => s.toLowerCase().replace(/ё/g, 'е');
  for (const ic of ICONS) {
    const c = catById.get(ic.c);
    ic.key = norm(`${ic.n} ${ic.n.replace(/-/g, ' ')} ${ic.ru} ${ic.t} ${c.ru} ${c.en}`);
  }
  function renderGrid() {
    $('#grid').innerHTML = CATS.map((c) => `<section class="cat" data-cat="${c.id}"><h2><span class="cat-name"></span><small></small></h2><div class="tiles">${
      ICONS.filter((ic) => ic.c === c.id).map((ic) => `<button class="tile" type="button" data-name="${ic.n}">${svgInline(ic, 24)}<span>${ic.n}</span></button>`).join('')}</div></section>`).join('');
  }
  const tokens = () => norm(query).split(/\s+/).filter(Boolean);
  const matchQ = (ic, toks) => toks.every((tk) => ic.key.includes(tk));
  function applyFilter() {
    const toks = tokens();
    visible = ICONS.filter((ic) => matchQ(ic, toks));
    const set = new Set(visible.map((ic) => ic.n));
    for (const sec of $$('#grid .cat')) {
      let n = 0;
      for (const tile of sec.querySelectorAll('.tile')) { const on = set.has(tile.dataset.name); tile.hidden = !on; if (on) n++; }
      sec.hidden = !n;
      sec.querySelector('small').textContent = n;
    }
    $('#count').textContent = toks.length
      ? t('countFound', { n: visible.length, total: ICONS.length })
      : t('countAll', { n: ICONS.length, icons: plural(ICONS.length, 'pIcons') });
    const empty = $('#empty');
    empty.hidden = visible.length > 0;
    if (!visible.length) empty.innerHTML = t('empty', { url: `${REPO}/issues/new?template=icon-request.md` });
    renderCats(toks);
    spyCats();
  }
  // категории — оглавление: число — сколько в разделе подходит под поиск; пустые гаснут и не нажимаются
  function renderCats(toks) {
    const counts = Object.fromEntries(CATS.map((c) => [c.id, 0]));
    let total = 0;
    for (const ic of ICONS) if (matchQ(ic, toks)) { counts[ic.c]++; total++; }
    const rows = [['all', t('all'), total], ...CATS.map((c) => [c.id, catName(c.id), counts[c.id]])];
    const focused = document.activeElement?.closest?.('#cats [data-cat]')?.dataset.cat;
    $('#cats').innerHTML = rows.map(([id, name, n]) => `<button class="side-item${n ? '' : ' none'}" type="button" data-cat="${id}"${n ? '' : ' disabled'} aria-current="${id === currentCat}"><span>${esc(name)}</span><small>${n}</small></button>`).join('');
    if (focused) $(`#cats [data-cat="${focused}"]`)?.focus();
    $('#cat-select').innerHTML = rows.map(([id, name, n]) => `<option value="${id}"${n ? '' : ' disabled'}${id === currentCat ? ' selected' : ''}>${esc(name)} · ${n}</option>`).join('');
  }
  // клик по категории прокручивает к её разделу (под липкую панель поиска); «Все» — к началу сетки. Фильтрует только поиск
  const toolbarOffset = () => { const tb = $('#toolbar'); return getComputedStyle(tb).position === 'sticky' ? tb.offsetHeight : 0; };
  function scrollToCat(id) {
    const target = id === 'all' ? $('#grid') : $(`#grid .cat[data-cat="${id}"]`);
    if (!target || target.hidden) return;
    // «Все» — ниже линии подсветки (48), чтобы первый раздел ещё не считался текущим
    const gap = id === 'all' ? 60 : 12;
    window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - toolbarOffset() - gap), behavior: 'smooth' });
  }
  // подсветка в оглавлении — последний раздел, чей заголовок поднялся до линии в 48 px под панелью поиска; выше — «Все»
  function spyCats() {
    const edge = toolbarOffset() + 48;
    let cur = 'all';
    for (const sec of $$('#grid .cat')) {
      if (sec.hidden) continue;
      if (sec.getBoundingClientRect().top <= edge) cur = sec.dataset.cat; else break;
    }
    if (cur === currentCat) return;
    currentCat = cur;
    for (const b of $$('#cats [data-cat]')) b.setAttribute('aria-current', String(b.dataset.cat === cur));
    $('#cat-select').value = cur;
  }
  function applyLook(skip) {
    const root = document.documentElement.style;
    root.setProperty('--size', `${size}px`);
    if (colorMode === 'pick') root.setProperty('--icon', colorVal); else root.removeProperty('--icon');
    $('#size').value = size;
    $('#size-out').textContent = size;
    $('#color-auto').setAttribute('aria-pressed', String(colorMode === 'auto'));
    const sw = colorMode === 'pick' ? colorVal : 'transparent';
    for (const el of [$('#x-swatch'), $('#p-swatch')]) el.style.background = sw;
    $('#x-color-text').textContent = colorMode === 'pick' ? colorVal : t('colorNow');
    syncPicker(skip);
  }

  // ---------- цвет: маленькая панель с тремя ползунками RGB ----------
  const hex2 = (n) => n.toString(16).padStart(2, '0');
  const toHex = (rgb) => `#${rgb.map(hex2).join('')}`;
  const fromHex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const inkHex = () => { const v = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim().toLowerCase(); return /^#[0-9a-f]{6}$/.test(v) ? v : '#141820'; };
  const PRESETS = ['#141820', '#275f9e', '#0f7b8a', '#1f8a5b', '#c27c0e', '#c2334d', '#7a4cc2', '#ffffff'];
  const pickerHex = () => (colorMode === 'pick' ? colorVal : inkHex());
  // skip — поле, в котором сейчас печатают: его значение не трогаем
  function syncPicker(skip) {
    const hex = pickerHex(), rgb = fromHex(hex);
    ['r', 'g', 'b'].forEach((ch, k) => {
      const range = $(`#cp-${ch}`), num = $(`#cp-${ch}n`), lo = rgb.slice(), hi = rgb.slice();
      lo[k] = 0; hi[k] = 255;
      if (skip !== range) range.value = rgb[k];
      if (skip !== num) num.value = rgb[k];
      range.style.setProperty('--track', `linear-gradient(90deg, rgb(${lo.join(',')}), rgb(${hi.join(',')}))`);
    });
    const hexIn = $('#cp-hex');
    if (skip !== hexIn) { hexIn.value = hex.toUpperCase(); hexIn.removeAttribute('aria-invalid'); }
    $('#cp-preview').style.background = hex;
    $('#cp-chip').style.background = hex;
    for (const b of $$('#cp-presets button')) b.setAttribute('aria-pressed', String(colorMode === 'pick' && b.dataset.hex === colorVal));
  }
  function setColor(hex, skip) {
    colorVal = hex.toLowerCase();
    colorMode = 'pick';
    store.set('color', colorVal);
    store.set('colorMode', 'pick');
    applyLook(skip);
  }
  const cpPop = $('#cp-pop'), cpOpen = $('#cp-open');
  function placePicker() {
    cpPop.style.left = '0px';
    const r = cpPop.getBoundingClientRect(), vw = document.documentElement.clientWidth;
    let dx = 0;
    if (r.right > vw - 12) dx = vw - 12 - r.right;
    if (r.left + dx < 12) dx = 12 - r.left;
    cpPop.style.left = `${dx}px`;
  }
  function openPicker() { cpPop.hidden = false; cpOpen.setAttribute('aria-expanded', 'true'); syncPicker(); placePicker(); $('#cp-r').focus(); }
  function closePicker(refocus = true) { if (cpPop.hidden) return; cpPop.hidden = true; cpOpen.setAttribute('aria-expanded', 'false'); if (refocus) cpOpen.focus(); }
  cpOpen.onclick = () => (cpPop.hidden ? openPicker() : closePicker());
  document.addEventListener('pointerdown', (e) => { if (!cpPop.hidden && !e.target.closest('#cp')) closePicker(false); });
  cpPop.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); closePicker(); } });
  ['r', 'g', 'b'].forEach((ch, k) => {
    const range = $(`#cp-${ch}`), num = $(`#cp-${ch}n`);
    range.addEventListener('input', () => { const rgb = fromHex(pickerHex()); rgb[k] = +range.value; setColor(toHex(rgb), range); });
    num.addEventListener('input', () => {
      const v = Math.round(+num.value);
      if (num.value === '' || !(v >= 0 && v <= 255)) return;
      const rgb = fromHex(pickerHex()); rgb[k] = v; setColor(toHex(rgb), num);
    });
    num.addEventListener('change', () => syncPicker());
  });
  $('#cp-hex').addEventListener('input', (e) => {
    let v = e.target.value.trim().toLowerCase();
    if (!v.startsWith('#')) v = `#${v}`;
    if (/^#[0-9a-f]{3}$/.test(v)) v = `#${[...v.slice(1)].map((c) => c + c).join('')}`;
    if (/^#[0-9a-f]{6}$/.test(v)) { e.target.removeAttribute('aria-invalid'); setColor(v, e.target); } else e.target.setAttribute('aria-invalid', 'true');
  });
  $('#cp-hex').addEventListener('change', () => syncPicker());
  $('#cp-presets').innerHTML = PRESETS.map((h) => `<button type="button" data-hex="${h}" style="background:${h}" aria-label="${h}" title="${h.toUpperCase()}"></button>`).join('');
  $('#cp-presets').addEventListener('click', (e) => { const b = e.target.closest('[data-hex]'); if (b) setColor(b.dataset.hex); });

  // ---------- тексты на странице ----------
  function applyTexts() {
    document.documentElement.lang = lang;
    for (const el of $$('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    for (const el of $$('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
    for (const el of $$('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
    $('#lang').textContent = lang === 'ru' ? 'EN' : 'RU';
    $('#lang').setAttribute('aria-label', t('langSwitch'));
    $('#facts').innerHTML = [
      `<b>${ICONS.length}</b> ${plural(ICONS.length, 'pIcons')}`, `<b>${CATS.length}</b> ${plural(CATS.length, 'pCats')}`,
      t('factGrid'), t('factFormats'),
    ].map((x) => `<li>${x}</li>`).join('');
    const tick = svgInline(byName.get('check'), 18), note = svgInline(byName.get('circle-info'), 18);
    const nL = ICONS.filter((ic) => ic.l).length, nT = ICONS.filter((ic) => ic.tb).length;
    $('#lic-list').innerHTML = t('licItems').map((x) => `<li>${tick}<span>${esc(x)}</span></li>`).join('') + `<li class="info">${note}<span>${esc(t('licNote'))}</span></li>`
      + `<li class="foot"><span></span><span>${t('licFoot', { n: nL, m: nT, url: NOTICES })}</span></li>`;
    $('#rules').innerHTML = t('rules').map((r) => `<li>${r}</li>`).join('');
    $('#use-code').innerHTML = `${hlHtml(t('useHtml'))}\n\n${hlCss(t('useCss'))}`;
    $('#p-lede').textContent = t('packLede', { n: ICONS.length, icons: plural(ICONS.length, 'pIcons') });
    for (const sec of $$('#grid .cat')) sec.querySelector('.cat-name').textContent = catName(sec.dataset.cat);
    for (const tile of $$('#grid .tile')) {
      const ic = byName.get(tile.dataset.name), label = lang === 'ru' ? `${ic.n} — ${ic.ru}` : ic.n;
      tile.title = label;
      tile.setAttribute('aria-label', label);
    }
    applyFilter();
    applyTheme();
    applyLook();
    if (cur) renderDetail();
  }

  // ---------- тема ----------
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const effTheme = () => document.documentElement.dataset.theme || (mq.matches ? 'dark' : 'light');
  function applyTheme() {
    const dark = effTheme() === 'dark', btn = $('#theme');
    btn.innerHTML = svgInline(byName.get(dark ? 'sun' : 'moon'), 18);
    btn.setAttribute('aria-label', t(dark ? 'themeToLight' : 'themeToDark'));
    btn.title = btn.getAttribute('aria-label');
  }
  mq.addEventListener?.('change', () => { applyTheme(); applyLook(); });

  // ---------- карточка иконки ----------
  const dlg = $('#detail');
  function openDetail(name, tab) {
    const ic = byName.get(name);
    if (!ic) return;
    cur = ic;
    if (tab) view = tab;
    renderDetail();
    if (!dlg.open) dlg.showModal();
    if (location.hash !== `#${name}`) history.replaceState(null, '', `#${name}`);
  }
  function renderStage() {
    const stage = $('#stage');
    if (view === 'nodes') stage.innerHTML = nodesSvg(cur, Math.round(stage.clientWidth || 420));
    else stage.innerHTML = svgInline(cur, zoom, 'big');
    $('#tab-icon').setAttribute('aria-selected', String(view === 'icon'));
    $('#tab-nodes').setAttribute('aria-selected', String(view === 'nodes'));
    $('#zoom-row').hidden = view !== 'icon';
    $('#legend').hidden = view !== 'nodes';
    $('#zoom').value = zoom;
    $('#zoom-out').textContent = `${zoom} px`;
  }
  function renderDetail() {
    const ic = cur;
    $('#d-name').textContent = ic.n;
    $('#d-sub').textContent = lang === 'ru' ? `${ic.ru} · ${catName(ic.c)}` : catName(ic.c);
    renderStage();
    $('#ladder').innerHTML = [16, 20, 24, 32, 48].map((s) => `<figure>${svgInline(ic, s)}<figcaption>${s}</figcaption></figure>`).join('');
    const [nodes, loops, circles, canon, mirror] = ic.st;
    const items = [
      [nodes, `${plural(nodes, 'pNodes')} ${t('stNodes')}`],
      [loops, plural(loops, 'pLoops')],
    ];
    if (circles) items.push([`${canon} ${t('of')} ${circles}`, t('stCircles')]);
    if (mirror !== null && mirror !== undefined) items.push([mirror === 0 ? '0' : `≤ ${mirror}`, t('stMirror')]);
    $('#d-stats').innerHTML = items.map(([b, s]) => `<li><b>${b}</b><span>${esc(s)}</span></li>`).join('');
    const k = ic.l && ic.tb ? 'LT' : ic.l ? 'L' : ic.tb ? 'T' : '';
    $('#d-lucide').hidden = !k;
    $('#d-lucide').innerHTML = k ? t('thirdCard', { what: t(`card${k}`, { l: esc(ic.l ?? ''), tb: esc(ic.tb ?? '') }), lic: t(`lic${k}`), url: NOTICES }) : '';
    renderSizeChips($('#x-sizes'), xsize, (v) => { xsize = v; store.set('xsize', v); renderDetail(); });
    applyLook();
    $('#x-status').textContent = '';
  }
  function renderSizeChips(box, value, onPick) {
    box.innerHTML = SIZES.map((s) => `<button class="chip" type="button" data-s="${s}" aria-pressed="${s === value}">${s}</button>`).join('')
      + `<input type="number" min="8" max="2048" step="1" value="${value}" aria-label="px">`;
    box.onclick = (e) => { const b = e.target.closest('[data-s]'); if (b) onPick(+b.dataset.s); };
    box.querySelector('input').onchange = (e) => { const v = Math.round(+e.target.value); if (v >= 8 && v <= 2048) onPick(v); else e.target.value = value; };
  }
  function step(dir) {
    const list = visible.length ? visible : ICONS;
    let k = list.indexOf(cur);
    k = k < 0 ? 0 : (k + dir + list.length) % list.length;
    openDetail(list[k].n);
  }
  dlg.addEventListener('close', () => { cur = null; if (location.hash) history.replaceState(null, '', location.pathname + location.search); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  $('#d-close').onclick = () => dlg.close();
  $('#d-prev').onclick = () => step(-1);
  $('#d-next').onclick = () => step(1);
  $('#tab-icon').onclick = () => { view = 'icon'; renderStage(); };
  $('#tab-nodes').onclick = () => { view = 'nodes'; renderStage(); };
  $('#zoom').oninput = (e) => { zoom = +e.target.value; store.set('zoom', zoom); renderStage(); };
  dlg.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });

  // ---------- выгрузка ----------
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }
  async function copyText(s) {
    try { await navigator.clipboard.writeText(s); return true; } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = s; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.append(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      ta.remove();
      return ok;
    }
  }
  async function pngOf(ic, px, color) {
    const url = URL.createObjectURL(new Blob([fileSvg(ic, 'fill', px, color || '#000000')], { type: 'image/svg+xml' }));
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const cv = document.createElement('canvas');
      cv.width = cv.height = px;
      cv.getContext('2d').drawImage(img, 0, 0, px, px);
      return await new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('canvas'))), 'image/png'));
    } finally { URL.revokeObjectURL(url); }
  }
  const status = (el, s) => { el.textContent = s; };
  $('#x-svg').onclick = () => { download(new Blob([fileSvg(cur, 'fill', xsize, pickedColor())], { type: 'image/svg+xml' }), `${cur.n}.svg`); status($('#x-status'), t('dlStarted', { file: `${cur.n}.svg` })); };
  $('#x-svg-stroke').onclick = () => { download(new Blob([fileSvg(cur, 'stroke', xsize, pickedColor())], { type: 'image/svg+xml' }), `${cur.n}-stroke.svg`); status($('#x-status'), t('dlStarted', { file: `${cur.n}-stroke.svg` })); };
  $('#x-png').onclick = async () => {
    const file = `${cur.n}-${xsize}.png`;
    try { download(await pngOf(cur, xsize, pickedColor()), file); status($('#x-status'), t('dlStarted', { file })); } catch (e) { status($('#x-status'), t('packFail', { err: e.message })); }
  };
  $('#x-copy').onclick = async () => status($('#x-status'), t((await copyText(fileSvg(cur, 'fill', xsize, pickedColor()))) ? 'copied' : 'copyFail'));
  $('#x-name').onclick = async () => status($('#x-status'), t((await copyText(cur.n)) ? 'copied' : 'copyFail'));

  // ZIP: локальные заголовки, центральный каталог, конец каталога; текст сжимается (deflate-raw), если браузер умеет
  const CRC = (() => { const tb = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; tb[n] = c >>> 0; } return tb; })();
  const crc32 = (u8) => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  async function deflateRaw(u8) {
    if (typeof CompressionStream === 'undefined') return null;
    try { return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()); } catch (e) { return null; }
  }
  async function makeZip(files) {
    const enc = new TextEncoder(), now = new Date();
    const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const parts = [], central = [];
    let offset = 0;
    for (const f of files) {
      const name = enc.encode(f.name), data = f.data, crc = crc32(data);
      let method = 0, body = data;
      if (f.deflate) { const z = await deflateRaw(data); if (z && z.length < data.length) { method = 8; body = z; } }
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, method, true);
      lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true); lh.setUint32(18, body.length, true);
      lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true);
      parts.push(lh, name, body);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, method, true);
      ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true); ch.setUint32(20, body.length, true);
      ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
      central.push(ch, name);
      offset += 30 + name.length + body.length;
    }
    const cdSize = central.reduce((a, p) => a + p.byteLength, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, end], { type: 'application/zip' });
  }
  const README_TXT = (fmt, px, color) => [
    'Klaarheid Icons',
    `${ICONS.length} icons, 24 × 24 grid. ${REPO}`,
    '',
    ...(fmt === 'svg' ? [
      'fill/   — precise outline: one filled path per icon.',
      'stroke/ — centerlines: stroke-width 2, round caps and joins.',
      `Color: ${color || 'currentColor (takes the color of the text)'}. Size attributes: ${px} px.`,
    ] : [`PNG, ${px} × ${px} px, color ${color || '#000000'}, transparent background.`]),
    '',
    'MIT No Attribution (MIT-0): use freely, no conditions, no credit required — see LICENSE.',
    `Footnote: ${ICONS.filter((ic) => ic.l).length} icons coincide with Lucide icons and ${ICONS.filter((ic) => ic.tb).length} with Tabler icons; they are also`,
    'covered by the Lucide license (ISC) or the Tabler license (MIT) — keep the matching text when you use them;',
    'the lists and the texts are in THIRD-PARTY-NOTICES.md.',
    '',
  ].join('\n');
  async function buildPack(fmt, px, color, onStep) {
    const enc = new TextEncoder(), files = [];
    const base = fmt === 'svg' ? 'klaarheid-icons' : `klaarheid-icons-png-${px}`;
    const suffix = color ? `-${color.slice(1)}` : '';
    for (const [i, ic] of ICONS.entries()) {
      if (fmt === 'svg') {
        files.push({ name: `${base}/fill/${ic.n}.svg`, data: enc.encode(fileSvg(ic, 'fill', px, color)), deflate: true });
        files.push({ name: `${base}/stroke/${ic.n}.svg`, data: enc.encode(fileSvg(ic, 'stroke', px, color)), deflate: true });
      } else {
        files.push({ name: `${base}/${ic.n}.png`, data: new Uint8Array(await (await pngOf(ic, px, color)).arrayBuffer()) });
      }
      if (onStep && (i % 15 === 14 || i === ICONS.length - 1)) { onStep(i + 1); await new Promise((r) => setTimeout(r, 0)); }
    }
    files.push({ name: `${base}/LICENSE`, data: enc.encode(DATA.license), deflate: true });
    files.push({ name: `${base}/THIRD-PARTY-NOTICES.md`, data: enc.encode(DATA.notices), deflate: true });
    files.push({ name: `${base}/README.txt`, data: enc.encode(README_TXT(fmt, px, color)), deflate: true });
    return { blob: await makeZip(files), file: `${base}${fmt === 'svg' && px !== 24 ? `-${px}` : ''}${suffix}.zip` };
  }
  $('#get-all').onclick = async (e) => {
    const btn = e.currentTarget, st = $('#get-all-status');
    btn.disabled = true;
    try { const { blob, file } = await buildPack('svg', 24, null); download(blob, file); status(st, t('dlStarted', { file })); }
    catch (err) { status(st, t('packFail', { err: err.message })); }
    finally { btn.disabled = false; }
  };
  const pack = $('#pack');
  function packSizes() { renderSizeChips($('#p-sizes'), packSize, (v) => { packSize = v; packSizes(); }); }
  $('#pack-open').onclick = () => { packSizes(); $('#p-status').textContent = ''; $('#p-progress').hidden = true; pack.showModal(); };
  pack.addEventListener('click', (e) => { if (e.target === pack) pack.close(); });
  $('#p-go').onclick = async (e) => {
    const btn = e.currentTarget, form = $('#pack-form');
    const fmt = form.elements.fmt.value, color = form.elements.col.value === 'pick' ? colorVal : null;
    const bar = $('#p-progress'), st = $('#p-status');
    btn.disabled = true; bar.hidden = false; bar.value = 0;
    try {
      const { blob, file } = await buildPack(fmt, packSize, color, (i) => { bar.value = i / ICONS.length; status(st, t('packBusy', { i, n: ICONS.length })); });
      download(blob, file);
      status(st, t('packDone', { file }));
    } catch (err) { status(st, t('packFail', { err: err.message })); }
    finally { btn.disabled = false; }
  };

  // ---------- первый экран: узлы одной из иконок ----------
  const heroIcon = 'circle-arrow-up';
  function renderHero() {
    const box = $('#hero-nodes');
    box.innerHTML = nodesSvg(byName.get(heroIcon), Math.round(box.clientWidth - 24) || 320);
    $('#hero-name').textContent = heroIcon;
  }
  $('#hero-nodes').onclick = () => openDetail(heroIcon, 'nodes');

  // ---------- события ----------
  $('#grid').addEventListener('click', (e) => { const tile = e.target.closest('.tile'); if (tile) openDetail(tile.dataset.name); });
  $('#cats').addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (b && !b.disabled) scrollToCat(b.dataset.cat); });
  $('#cat-select').addEventListener('change', (e) => scrollToCat(e.target.value));
  let spyQueued = false;
  window.addEventListener('scroll', () => { if (spyQueued) return; spyQueued = true; requestAnimationFrame(() => { spyQueued = false; spyCats(); }); }, { passive: true });
  // высота липкой панели — для липкой колонки категорий
  const setToolbarH = () => document.documentElement.style.setProperty('--toolbar-h', `${$('#toolbar').offsetHeight}px`);
  if (window.ResizeObserver) new ResizeObserver(setToolbarH).observe($('#toolbar')); else setToolbarH();
  $('#q').addEventListener('input', (e) => { query = e.target.value; applyFilter(); });
  $('#size').addEventListener('input', (e) => { size = +e.target.value; store.set('size', size); applyLook(); });
  $('#color-auto').onclick = () => { colorMode = 'auto'; store.set('colorMode', 'auto'); applyLook(); };
  $('#lang').onclick = () => { lang = lang === 'ru' ? 'en' : 'ru'; store.set('lang', lang); applyTexts(); renderHero(); };
  $('#theme').onclick = () => {
    const next = effTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.set('theme', next);
    applyTheme();
    applyLook();
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.target.matches('input, textarea') && !dlg.open && !pack.open) { e.preventDefault(); $('#q').focus(); }
  });
  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { renderHero(); if (cur && view === 'nodes') renderStage(); }, 150); });
  window.addEventListener('hashchange', () => { const n = decodeURIComponent(location.hash.slice(1)); if (byName.has(n)) openDetail(n); });

  // ---------- старт ----------
  renderGrid();
  fillUiIcons();
  applyTexts();
  renderHero();
  const start = decodeURIComponent(location.hash.slice(1));
  if (byName.has(start)) openDetail(start);
})();
