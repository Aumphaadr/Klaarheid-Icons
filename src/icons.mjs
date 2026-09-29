// Klaarheid Icons — единственный источник иконок: осевые линии на сетке 24×24. Толщина линии w задаётся при сборке (по умолчанию 2),
// всё остальное — здесь. Горизонтали и вертикали — на целых координатах (края ложатся на пиксели
// в 24 px), круг — r 10 вокруг (12, 12), квадрат — 16–18, поле — 1.
// Части: { stroke: путь } — линия; { solid: путь } — заливка с той же линией по краю;
// { disk: [центр, r] } — залитый круг; { dot: центр } — точка диаметром w;
// { capsule: [a, b, r] } — толстая линия постоянной ширины 2r (как диск, от толщины сборки не зависит);
// { fill: путь } — чистая заливка по замкнутому пути, без линии по краю (как диск).
import { line, circle, polyline, rect, path, arc, chainPath, L, cutPath, cutPathStrip, cutPathRegion, capsuleRegion, edgeLen, subEdge } from './geom.mjs';

const R3 = Math.sqrt(3), S2 = Math.SQRT2;
const rot90 = (p) => [24 - p[1], p[0]]; // поворот на 90° по часовой вокруг (12, 12)
const rotN = (p, n) => { let q = p; for (let i = 0; i < n; i++) q = rot90(q); return q; };
const mirrorX = (p) => [24 - p[0], p[1]];
const TRI_R = 1.5; // скругление углов треугольников (осевая)

// треугольники-стрелки медиа
const playTri = [[6, 3], [6 + 9 * R3, 12], [6, 21]]; // равносторонний, сторона 18
const ffA = [[4, 4], [13, 12], [4, 20]], ffB = [[13, 4], [22, 12], [13, 20]];
const skipTri = [[5, 4], [17, 12], [5, 20]];
const tri = (pts) => polyline(pts, { closed: true, r: TRI_R });

// стрелка и шеврон вправо; остальные — поворотом
const arrowParts = (n) => [
  { stroke: line(rotN([4, 12], n), rotN([19, 12], n)) }, // древко кончается за 1 до острия: торец целиком под головкой
  { stroke: polyline([[13, 5], [20, 12], [13, 19]].map((p) => rotN(p, n))) },
];
const chevronParts = (n) => [{ stroke: polyline([[9, 6], [15, 12], [9, 18]].map((p) => rotN(p, n))) }];

// лупа: кольцо r 8 вокруг (11, 11), ручка под 45° от осевой кольца до (21, 21)
const lens = [{ stroke: circle([11, 11], 8) }, { stroke: line([11 + 8 / S2, 11 + 8 / S2], [21, 21]) }];

// кольцо r 10 для круглых
const ring = { stroke: circle([12, 12], 10) };

// глаз: веки — дуги r 34/3 через уголки (2; 12), (22; 12) и (12; 6) / (12; 18) — хорда 20, стрелка 6; зрачок — диск r 3
const eyeR = 34 / 3, eyeCt = [12, 6 + eyeR], eyeCb = [12, 18 - eyeR];
const eyeAL = Math.atan2(12 - eyeCt[1], 2 - eyeCt[0]) * 180 / Math.PI + 360, eyeAR = Math.atan2(12 - eyeCb[1], 22 - eyeCb[0]) * 180 / Math.PI;
const eyePath = path([arc(eyeCt, eyeR, eyeAL, 2 * (270 - eyeAL)), arc(eyeCb, eyeR, eyeAR, 2 * (90 - eyeAR))], true);

// вопросительный знак: крюк r 2.5 и обратный изгиб r 1.25, касательный к вертикали x = 12
const qR1 = 2.5, qR2 = 1.25, qC = [12, 9.5];
const qPhi = Math.acos(qR2 / (qR1 + qR2)) * 180 / Math.PI; // 70.53°
const qCb = [qC[0] + (qR1 + qR2) * Math.cos(qPhi * Math.PI / 180), qC[1] + (qR1 + qR2) * Math.sin(qPhi * Math.PI / 180)];
const question = path([arc(qC, qR1, 180, 180 + qPhi), arc(qCb, qR2, 180 + qPhi, -qPhi)]);

const D2R = Math.PI / 180;
const pt = (c, r, deg) => [c[0] + r * Math.cos(deg * D2R), c[1] + r * Math.sin(deg * D2R)];
const vsub = (a, b) => [a[0] - b[0], a[1] - b[1]], vadd = (a, b) => [a[0] + b[0], a[1] + b[1]], vmul = (a, k) => [a[0] * k, a[1] * k];
const vnorm = (a) => { const l = Math.hypot(a[0], a[1]); return [a[0] / l, a[1] / l]; };
const rotV = (v, deg) => { const a = deg * D2R, c = Math.cos(a), s = Math.sin(a); return [c * v[0] - s * v[1], s * v[0] + c * v[1]]; };

// стрелка по дуге: дуга от угла a0 в сторону dir (+1 — по часовой), острие — на самой дуге.
// Ось головки задаётся углом (кратным 15°), острие ставится туда, где ось — хорда дуги под головкой:
// θ = ось − dir·90° + dir·δ/2, δ — угол дуги под плечами. При оси 45° плечи строго горизонтальны и
// вертикальны, торцы плеч режутся ровно по четвертям. Древко кончается на 1 раньше острия (по дуге).
function arcArrow(c, r, a0, dir, axisDeg, head = 5) {
  const delta = ((head * Math.SQRT1_2) / r) / D2R;
  const tipDeg = axisDeg - dir * 90 + (dir * delta) / 2;
  let sweep = tipDeg - a0;
  if (dir > 0) sweep = ((sweep % 360) + 360) % 360; else sweep = -((((-sweep) % 360) + 360) % 360);
  const T = pt(c, r, a0 + sweep);
  const axis = [Math.cos(axisDeg * D2R), Math.sin(axisDeg * D2R)];
  const arm = (deg) => vadd(T, vmul(rotV(vmul(axis, -1), deg), head));
  return [{ stroke: path([arc(c, r, a0, sweep - dir * (1 / r) / D2R)]) }, { stroke: polyline([arm(45), T, arm(-45)]) }];
}
// карандаш от кончика tip к торцу end: корпус полушириной s, заточка длиной tipLen, углы торца
// скруглены r, поясок ластика — в band от торца
function pencil(tip, end, { s = 2.5, tipLen = 5, r = 1.5, band = 3.5 } = {}) {
  const U = vnorm(vsub(tip, end)), V = [-U[1], U[0]];
  const E1 = vsub(end, vmul(V, s)), E2 = vadd(end, vmul(V, s));
  const base = vsub(tip, vmul(U, tipLen));
  const body = polyline([E1, vsub(base, vmul(V, s)), tip, vadd(base, vmul(V, s)), E2], { closed: true, r: [r, 0, 0, 0, r] });
  const b = vadd(end, vmul(U, band));
  return [
    { stroke: body },
    { stroke: line(vsub(b, vmul(V, s)), vadd(b, vmul(V, s))) }, // поясок ластика
    { stroke: line(vsub(base, vmul(V, s)), vadd(base, vmul(V, s))) }, // перекладина у заточки: концы — в углах корпуса
  ];
}
// лоток: 4..20 × 14..20, r 2
const tray = { stroke: polyline([[4, 14], [4, 20], [20, 20], [20, 14]], { r: 2 }) };
const bubble = polyline([[3, 4], [21, 4], [21, 17], [7, 17], [3, 21]], { closed: true, r: [2, 2, 2, 0, 0] });
// четырёхконечная звезда: четыре четверти окружностей r 10 с центрами в углах квадрата 2…22
const sparklePath = chainPath([arc([22, 2], 10, 180, -90), arc([22, 22], 10, 270, -90), arc([2, 22], 10, 0, -90), arc([2, 2], 10, 90, -90)], true);
// дуга радиуса R от a до b, выгнутая вверх (центр — под хордой)
function arcUp(a, b, R) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], c = Math.hypot(dx, dy) / 2;
  const h = Math.sqrt(R * R - c * c), n = [-dy / (2 * c), dx / (2 * c)];
  const C = n[1] > 0 ? [mx + n[0] * h, my + n[1] * h] : [mx - n[0] * h, my - n[1] * h];
  const a0 = Math.atan2(a[1] - C[1], a[0] - C[0]) / D2R;
  let sw = Math.atan2(b[1] - C[1], b[0] - C[0]) / D2R - a0;
  while (sw > 180) sw -= 360;
  while (sw < -180) sw += 360;
  return arc(C, R, a0, sw);
}
// раскрытая книга по рисунку SignoreBot: две страницы-листа, края вертикальны, верх и низ — горбы
// одного радиуса 8; сверху горбы сходятся к корешку углом на уровне углов листа, снизу корешок
// на 1,5 ниже наружных углов — нижний угол глубже. Корешок — от угла до угла.
const bookOpen = chainPath([
  L([2, 19], [2, 5.5]), arcUp([2, 5.5], [12, 5.5], 8), arcUp([12, 5.5], [22, 5.5], 8), L([22, 5.5], [22, 19]),
  arcUp([22, 19], [12, 20.5], 8), arcUp([12, 20.5], [2, 19], 8),
], true);
// подкова магнита: ноги шириной 5 — 3..8 и 16..21, дуги r 9 и r 4 вокруг (12; 12); полюса 3..7 сплошные
const magnetBody = chainPath([
  polyline([[3, 12], [3, 3], [8, 3], [8, 12]], { r: [0, 1.5, 1.5, 0] }), arc([12, 12], 4, 180, -180),
  polyline([[16, 12], [16, 3], [21, 3], [21, 12]], { r: [0, 1.5, 1.5, 0] }), arc([12, 12], 9, 0, 180),
], true);
const magnetPole = (x) => ({ solid: polyline([[x, 3], [x + 5, 3], [x + 5, 7], [x, 7]], { closed: true, r: [1.5, 1.5, 0, 0] }) });
const lockBody = rect(4, 11, 16, 10, 2);
const shackle = (sweep) => chainPath(sweep === 180 ? [L([8, 11], [8, 7]), arc([12, 7], 4, 180, 180), L([16, 7], [16, 11])] : [L([8, 11], [8, 7]), arc([12, 7], 4, 180, sweep)]);

// ===== третья партия: помощники =====
const S = (p) => ({ stroke: p });
const rot180 = (p) => [24 - p[0], 24 - p[1]];
const rotPath180 = (pp) => chainPath(pp.edges.map((e) => (e.t === 'L' ? L(rot180(e.a), rot180(e.b)) : { ...e, c: rot180(e.c), a0: e.a0 + Math.PI })));
// отрезок a→b с разрывом там, где его пересекает прямая (c, d): концы — на расстоянии gap от неё
// (gap 4 = полтолщины + просвет 2 + полтолщины)
function cutAround(a, b, c, d, gap) {
  const n = [-(d[1] - c[1]), d[0] - c[0]], ln = Math.hypot(n[0], n[1]);
  const sd = (p) => ((p[0] - c[0]) * n[0] + (p[1] - c[1]) * n[1]) / ln;
  const da = sd(a), db = sd(b), at = (t) => vadd(a, vmul(vsub(b, a), t));
  return [line(a, at((da - Math.sign(da) * gap) / (da - db))), line(at((da + Math.sign(da) * gap) / (da - db)), b)];
}
// отрезок между окружностями по осевым: от окружности (a, ra) до окружности (b, rb)
const between = (a, ra, b, rb) => { const u = vnorm(vsub(b, a)); return line(vadd(a, vmul(u, ra)), vsub(b, vmul(u, rb))); };
// четырёхконечная звезда с центром c и полуразмахом s (как sparklePath, но любого размера)
const sparkleAt = (c, s) => chainPath([
  arc([c[0] + s, c[1] - s], s, 180, -90), arc([c[0] + s, c[1] + s], s, 270, -90),
  arc([c[0] - s, c[1] + s], s, 0, -90), arc([c[0] - s, c[1] - s], s, 90, -90),
], true);
// фигурная скобка «{»: концы (xe, y0) и (xe, y1), вертикали на x = xe − r, нос-касп на x = xe − 2r;
// «}» — её зеркало относительно x = 12
function braceLeft(xe, y0, y1, r = 2) {
  const xv = xe - r, xn = xe - 2 * r, ym = (y0 + y1) / 2;
  return chainPath([
    arc([xe, y0 + r], r, 270, -90), L([xv, y0 + r], [xv, ym - r]), arc([xn, ym - r], r, 0, 90),
    arc([xn, ym + r], r, 270, 90), L([xv, ym + r], [xv, y1 - r]), arc([xe, y1 - r], r, 180, -90),
  ]);
}
function braceRight(xe, y0, y1, r = 2) {
  const xm = 24 - xe, xv = xm + r, xn = xm + 2 * r, ym = (y0 + y1) / 2;
  return chainPath([
    arc([xm, y0 + r], r, 270, 90), L([xv, y0 + r], [xv, ym - r]), arc([xn, ym - r], r, 180, -90),
    arc([xn, ym + r], r, 270, -90), L([xv, ym + r], [xv, y1 - r]), arc([xm, y1 - r], r, 0, 90),
  ]);
}
// луна: серп рогами вправо — наружная дуга r 10 вокруг (14,5; 12) от 60° до 300° через лево, внутренняя — через рога
// вокруг (18,5; 12), r √76 (толщина серпа посередине 5,3)
const moonR = Math.sqrt(76), moonA = Math.atan2(-10 * Math.sin(Math.PI / 3), 1) / D2R + 360;
const moonPath = chainPath([arc([14.5, 12], 10, 60, 240), arc([18.5, 12], moonR, moonA, 360 - 2 * moonA)], true);
// звено цепи: капсула r 4 вдоль диагонали x + y = 24; ближний торец проходит через центр ближнего
// торца другого звена (p = 4 / 2√2) — путь начинается там же, в середине чужой петли. Разрыв там, где
// сверху идёт другое звено: конец заглушки — на расстоянии 4 от его осевой (просвет 2)
function chainLink(a = 4, q = 6) {
  const p = a / (2 * S2), n = [Math.SQRT1_2, Math.SQRT1_2];
  const E1 = [12 + p, 12 - p], E2 = [12 + q, 12 - q], EB = [12 - p, 12 + p];
  const Pof = (t) => vsub([12 + t, 12 - t], vmul(n, a));
  let lo = p, hi = q;
  for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (Math.hypot(...vsub(Pof(m), EB)) < a + 4) lo = m; else hi = m; }
  return chainPath([arc(E1, a, 135, -90), L(vadd(E1, vmul(n, a)), vadd(E2, vmul(n, a))), arc(E2, a, 45, -180), L(vsub(E2, vmul(n, a)), Pof(lo))]);
}
// пузырь-круг с хвостом: круг (c, r), острие T; стороны хвоста — под ±half° к прямой от острия к центру
function bubbleCircle(c, r, T, half = 30) {
  const dir0 = Math.atan2(c[1] - T[1], c[0] - T[0]) / D2R;
  const hit = (deg) => {
    const d = [Math.cos(deg * D2R), Math.sin(deg * D2R)], f = vsub(T, c);
    const b = f[0] * d[0] + f[1] * d[1], cc = f[0] * f[0] + f[1] * f[1] - r * r;
    return vadd(T, vmul(d, -b - Math.sqrt(b * b - cc)));
  };
  const P1 = hit(dir0 - half), P2 = hit(dir0 + half);
  const a1 = Math.atan2(P1[1] - c[1], P1[0] - c[0]) / D2R, a2 = Math.atan2(P2[1] - c[1], P2[0] - c[0]) / D2R;
  let sw = a2 - a1;
  while (sw <= 0) sw += 360;
  return chainPath([arc(c, r, a1, sw), L(P2, T), L(T, P1)], true);
}
// правильная пятиконечная звезда: описанный круг R вокруг c, внутренний радиус R·0.381966
const starPts = (R, c) => Array.from({ length: 10 }, (_, k) => pt(c, k % 2 ? R * 0.381966 : R, -90 + 36 * k));
const starPath = polyline(starPts(10.5, [12, 13]), { closed: true });
// поля-виджеты: поле 20×12 (кнопка, ввод, список) и счётчик 20×14 — как у оригинала, он выше
const field = rect(2, 6, 20, 12, 2);
const spinField = rect(2, 5, 20, 14, 2);
const spinChevrons = [S(polyline([[15.5, 10], [17, 8.5], [18.5, 10]])), S(polyline([[15.5, 14], [17, 15.5], [18.5, 14]]))];
// окно: рамка и три точки заголовка (просвет 2 до рамки и до содержимого)
const windowParts = [S(rect(2, 3, 20, 18, 2)), ...[6, 10, 14].map((x) => ({ dot: [x, 7] }))];
const qrModule = (x, y) => ({ solid: rect(x, y, 1, 1) }); // осевой квадрат 1×1 → видимый 3×3

// ===== четвёртая партия: помощники =====
const ALIGN = [[6, 16], [10, 11], [14, 14], [18, 8]]; // строки выравнивания: y и длина (как у align-left)
// многоугольник, обрезанный полуплоскостью x ≤ xMax. «Половинка» — заливка до x = 11: с контуром
// заливки (+1) она доходит ровно до оси x = 12
function clipX(pts, xMax) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], ia = a[0] <= xMax + 1e-12, ib = b[0] <= xMax + 1e-12;
    if (ia) out.push(a);
    if (ia !== ib) { const t = (xMax - a[0]) / (b[0] - a[0]); out.push([xMax, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
const angOf = (c, p) => Math.atan2(p[1] - c[1], p[0] - c[0]) / D2R;
// сердце: лепестки r 5 вокруг (8; 8) и (16; 8) пересекаются в выемке (12; 5), бока — касательные к лепесткам из острия
// (12; 22), остриё скруглено r 1,5
const hSweep = (a, b) => ((b - a) % 360 + 360) % 360; // угол по возрастанию от a до b (sweepTo объявлен ниже)
const hC1 = [8, 8], hC2 = [16, 8], hR = 5, hTip = [12, 22], hDip = [12, 8 - Math.sqrt(hR * hR - 16)];
function heartTangent(C, pick) {
  const d = Math.hypot(hTip[0] - C[0], hTip[1] - C[1]), a0 = Math.atan2(C[1] - hTip[1], C[0] - hTip[0]), l = Math.sqrt(d * d - hR * hR);
  return [1, -1].map((sg) => { const a = a0 + sg * Math.asin(hR / d); return [hTip[0] + l * Math.cos(a), hTip[1] + l * Math.sin(a)]; }).sort((p, q) => pick * (p[0] - q[0]))[0];
}
const hP1 = heartTangent(hC1, 1), hP2 = heartTangent(hC2, -1);
const heartPath = chainPath([arc(hC2, hR, angOf(hC2, hDip), hSweep(angOf(hC2, hDip), angOf(hC2, hP2))), ...polyline([hP2, hTip, hP1], { r: [0, 1.5, 0] }).edges,
  arc(hC1, hR, angOf(hC1, hP1), hSweep(angOf(hC1, hP1), angOf(hC1, hDip)))], true);
// левая половина сердца до x = 11: от левого лепестка через верх до касания, вниз по боку до x = 11 и вверх по x = 11
const hQ = [11, hP1[1] + (11 - hP1[0]) * (hTip[1] - hP1[1]) / (hTip[0] - hP1[0])], hTop11 = [11, 8 - Math.sqrt(hR * hR - 9)], hA0 = angOf(hC1, hTop11);
const heartHalf = chainPath([arc(hC1, hR, hA0, -hSweep(angOf(hC1, hP1), hA0)), L(hP1, hQ), L(hQ, hTop11)], true);
// шестерёнка: верх зуба — хорда на расстоянии At от центра (видимый край ровно At + 1), полуширина hwT;
// впадина — вершины на окружности Rr с полушириной hwR; скругления: верх rT, впадина rR
function gearPath(N, At, Rr, hwT, hwR, rT, rR) {
  const pts = [], rs = [];
  for (let k = 0; k < N; k++) {
    const a = -90 + (360 / N) * k, u = [Math.cos(a * D2R), Math.sin(a * D2R)], v = [-u[1], u[0]], dR = Math.asin(hwR / Rr) / D2R;
    pts.push(pt([12, 12], Rr, a - dR), vadd([12, 12], vadd(vmul(u, At), vmul(v, -hwT))), vadd([12, 12], vadd(vmul(u, At), vmul(v, hwT))), pt([12, 12], Rr, a + dR));
    rs.push(rR, rT, rT, rR);
  }
  return polyline(pts, { closed: true, r: rs });
}
// глобус: меридиан — линза из двух дуг r 34/3 через полюса (полуширина 6), параллели на ±4; концы параллелей — на
// осевой круга
const globeW = 6, globeR = (globeW * globeW + 100) / (2 * globeW), globeCr = [12 + globeW - globeR, 12], globeCl = [12 - globeW + globeR, 12];
const globeLens = chainPath([
  arc(globeCr, globeR, angOf(globeCr, [12, 2]), 2 * angOf(globeCr, [12, 22])),
  arc(globeCl, globeR, angOf(globeCl, [12, 22]), 360 - 2 * angOf(globeCl, [12, 22])),
], true);
const parallel = (y) => { const dx = Math.sqrt(100 - (y - 12) ** 2); return line([12 - dx, y], [12 + dx, y]); };
// заслонённое: окружность (c, r) без части, что ближе Rc + 4 к центру C (полтолщины + просвет 2 + полтолщины)
function visibleArc(c, r, C, Rc) {
  const d = Math.hypot(c[0] - C[0], c[1] - C[1]), Rh = Rc + 4;
  const k = (Rh * Rh - d * d - r * r) / (2 * r * d);
  const phi = angOf(C, c), half = Math.acos(Math.max(-1, Math.min(1, k))) / D2R;
  return arc(c, r, phi - half, 2 * half);
}
// угол на окружности (c, r), где до центра C ровно Rh: между aKeep (дальше) и aHide (ближе)
function cutAngle(c, r, C, Rh, aKeep, aHide) {
  const f = (a) => Math.hypot(...vsub(pt(c, r, a), C)) - Rh;
  let lo = aKeep, hi = aHide;
  for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (f(m) >= 0) lo = m; else hi = m; }
  return lo;
}
// кубик: правильный шестиугольник, вертикальные рёбра на x = 4 и 20 (R·cos 30° = 8)
const diceR = 8 / (R3 / 2), dV = [0, 1, 2, 3, 4, 5].map((k) => pt([12, 12], diceR, -90 + 60 * k));
const onFace = (A, B, D, u, v) => vadd(A, vadd(vmul(vsub(B, A), u), vmul(vsub(D, A), v)));

// ===== пятая партия: файлы и папки =====
// тонкая линия (¾ основной, 1,5 при толщине 2) — для мелких знаков в тесном поле: содержимое листов, папок
// и планшетов; просвет вокруг таких знаков — тоже 1,5. Корпуса предметов остаются основной линией.
const T = (p) => ({ stroke: p, thin: true });
// лист: 5..19 × 2..22 — пропорция A4 (1 : √2), срезанный угол 5 и загнутый уголок сплошным треугольником; знак
// на листе — тонкой линией, до стенок и до уголка просвет не меньше 1,5
const filePage = polyline([[5, 2], [14, 2], [19, 7], [19, 22], [5, 22]], { closed: true, r: [2, 0, 0, 2, 2] });
const fileFold = polyline([[14, 2], [14, 7], [19, 7]], { closed: true });
const fileParts = [S(filePage), { solid: fileFold }];
// зеркало пути относительно x = 12
const mirrorPathX = (pp) => chainPath(pp.edges.map((e) => (e.t === 'L' ? L([24 - e.a[0], e.a[1]], [24 - e.b[0], e.b[1]]) : { ...e, c: [24 - e.c[0], e.c[1]], a0: Math.PI - e.a0, da: -e.da })));
// папка: язычок 2..9 на y 4 со ступенькой до y 7 (углы ступеньки r 1,25), тело до y 20
const folderPath = polyline([[2, 20], [2, 4], [9, 4], [9, 7], [22, 7], [22, 20]], { closed: true, r: [2, 2, 1.25, 1.25, 2, 2] });
// открытая папка: силуэт (задник с язычком, стенка на x = 18, клапан выступает вправо до 22) и отдельный
// путь — верх клапана с левым скатом; скаты параллельны (3 : 10), левый кончается на осевой дна
const folderOpenBack = polyline([[2, 20], [2, 4], [9, 4], [9, 7], [18, 7], [18, 10], [22, 10], [19, 20]], { closed: true, r: [2, 2, 1.25, 1.25, 2, 0, 1.5, 2] });
const folderOpenFlap = polyline([[18, 10], [8, 10], [5, 20]], { r: [0, 2, 0] });
// планшет: доска 5..19 × 5..22 с разрывом под зажим, зажим — сплошной 9..15 × 2..5, концы доски уходят в него
const clipBoard = [S(polyline([[8, 5], [5, 5], [5, 22], [19, 22], [19, 5], [16, 5]], { r: 2 })), { solid: rect(9, 2, 6, 3) }];

// ===== модификации: основа + знак =====
// Три приёма. (1) Внутри — у контейнеров (лист, папка, планшет): знак в свободном поле, как file-plus.
// (2) Бейдж в углу — у фигур во весь кадр (звезда, воронка): знак в круге видимого радиуса 4 с центром
// (18,5; 18,5), основа уменьшена и вырезана по радиусу 7 (просвет 2 + полтолщины) — концы обрезков
// круглые, как у всех вырезов. (3) Сбоку — у человека: фигура сдвинута влево, знак у головы, без выреза.
const BADGE_C = [18.5, 18.5], BADGE_CUT = 7;
const badgeGlyph = {
  x: (c, a = 2.5) => [S(line([c[0] - a, c[1] - a], [c[0] + a, c[1] + a])), S(line([c[0] + a, c[1] - a], [c[0] - a, c[1] + a]))],
  plus: (c, a = 3) => [S(line([c[0], c[1] - a], [c[0], c[1] + a])), S(line([c[0] - a, c[1]], [c[0] + a, c[1]]))],
  // круговая стрелка: дуга r 3 на 270°, головка с осью 45° (плечи по осям), как у rotate
  repeat: (c) => {
    const r = 3, head = 2.5, axisDeg = 45, delta = ((head * Math.SQRT1_2) / r) / D2R, tip = axisDeg - 90 + delta / 2;
    const T = pt(c, r, tip), ax = [Math.cos(axisDeg * D2R), Math.sin(axisDeg * D2R)], arm = (d) => vadd(T, vmul(rotV(vmul(ax, -1), d), head));
    return [S(path([arc(c, r, tip - 270, 270 - (1 / r) / D2R)])), S(polyline([arm(45), T, arm(-45)]))];
  },
};
// обрезок, у которого за последним углом остался хвост короче 2, режется по самой вершине: иначе торец
// налезает на стык угла (просвет до знака от этого только растёт)
const trimTails = (pp, min = 2) => {
  const e = pp.edges.slice();
  while (e.length > 1 && edgeLen(e[e.length - 1]) < min) e.pop();
  while (e.length > 1 && edgeLen(e[0]) < min) e.shift();
  return path(e, false);
};
const withBadge = (baseParts, glyph, c = BADGE_C) => [...baseParts.flatMap((p) => (p.stroke ? cutPath(p.stroke, c, BADGE_CUT).map((q) => S(trimTails(q))) : [p])), ...badgeGlyph[glyph](c)];
// человек для знака сбоку: голова r 3,5 и плечи r 7, сдвинут влево (ось x = 9)
const personLeft = [S(circle([9, 7], 3.5)), S(path([arc([9, 21.5], 7, 180, 180)]))];

// ===== шестая партия: состояния и управление =====
// колокольчик: купол — полуокружность r 6 вокруг (12, 11), бока до 15, юбка под 45° до обода на 18;
// ушко — отрезок до осевой купола, язычок — залитая полуокружность r 2 под ободом (рисунок 2..22, по центру)
const bellBody = chainPath([arc([12, 11], 6, 180, 180), polyline([[18, 11], [18, 15], [21, 18], [3, 18], [6, 15], [6, 11]], { r: [0, 2, 1.25, 1.25, 2, 0] })], true);
// лампочка: колба r 6,5 вокруг (12, 9); от точек под 45° — касательные к цоколю шириной 5 (стыки гладкие),
// дно цоколя — полуокружность r 2,5, поясок — отрезок между стенками
function bulbPath() {
  const c = [12, 9], R = 6.5, P = pt(c, R, 45), t = (P[0] - 14.5) / Math.SQRT1_2, N = [14.5, P[1] + t * Math.SQRT1_2];
  return chainPath([arc(c, R, 135, 270), polyline([P, N, [14.5, 18.5]], { r: [0, 2, 0] }), arc([12, 18.5], 2.5, 0, 180), polyline([[9.5, 18.5], [24 - N[0], N[1]], [24 - P[0], P[1]]], { r: [0, 2, 0] })], true);
}
// цифры нумерованного списка (тонкая линия, высота 6, симметрично относительно y = 12):
// «1» — стойка x = 6 от 4 до 10 с флажком под 45° до (4; 6) (зазор до стойки 0,5);
// «2» — чаша r = 6 / (2 + √2) от 180° через верх до 45°, оттуда касательная ровно под 45° в угол (x0; yb) и основание.
// При такой высоте касательная выходит из целой точки: для угла (3; 20) это (6; 17)
const digitOne = polyline([[4, 6], [6, 4], [6, 10]]);
function digitTwo(x0, yt, yb) {
  const r = (yb - yt) / (2 + Math.SQRT2), c = [x0 + r, yt + r], P = pt(c, r, 45);
  return chainPath([arc(c, r, 180, 225), L(P, [x0, yb]), L([x0, yb], [x0 + 2 * r, yb])]);
}
const bellParts = [S(bellBody), S(line([12, 3], [12, 5])), { solid: chainPath([arc([12, 19], 2, 0, 180), L([10, 19], [14, 19])], true) }];
const textSearchLens = [S(circle([15.5, 14.5], 4)), S(line(pt([15.5, 14.5], 4, 45), [21, 20]))];
const listLines = [6, 12, 18].map((y) => S(line([10, y], [21, y])));

// ===== восьмая партия: остаток Idyllium =====
// овал из четырёх дуг (чертёжный): концы r1, верх и низ r2 = ((a − r1)² + b² − r1²) / 2(b − r1); стыки касательные,
// точки касания лежат на линиях центров. Эллипсов в ядре нет — так овал остаётся из дуг окружностей
function ovalGeo(cx, cy, a, b, r1) {
  const r2 = ((a - r1) ** 2 + b * b - r1 * r1) / (2 * (b - r1)), p = Math.atan2(r2 - b, a - r1) / D2R;
  return { r2, p, Lc: [cx - (a - r1), cy], Rc: [cx + (a - r1), cy], Tc: [cx, cy + (r2 - b)], Bc: [cx, cy - (r2 - b)] };
}
const oval = (cx, cy, a, b, r1) => { const g = ovalGeo(cx, cy, a, b, r1), p = g.p;
  return chainPath([arc(g.Lc, r1, 180, p), arc(g.Tc, g.r2, 180 + p, 180 - 2 * p), arc(g.Rc, r1, 360 - p, 2 * p), arc(g.Bc, g.r2, p, 180 - 2 * p), arc(g.Lc, r1, 180 - p, p)], true); };
// нижняя половина овала — слева направо через низ
const ovalLow = (cx, cy, a, b, r1) => { const g = ovalGeo(cx, cy, a, b, r1), p = g.p;
  return [arc(g.Lc, r1, 180, -p), arc(g.Bc, g.r2, 180 - p, -(180 - 2 * p)), arc(g.Rc, r1, p, -p)]; };
// цилиндр базы: верхний овал, бока до нижней половины овала (концы боков — на осевой верхнего), полосы — нижние половины
const database = (cx, yTop, yBot, a, b, r1, bands = [], W = S) => [
  W(oval(cx, yTop, a, b, r1)), W(chainPath([L([cx - a, yTop], [cx - a, yBot]), ...ovalLow(cx, yBot, a, b, r1), L([cx + a, yBot], [cx + a, yTop])])),
  ...bands.map((y) => W(chainPath(ovalLow(cx, y, a, b, r1)))),
];
// курсор: остриё T, рёбра под ±22,5° к диагонали длиной len, выемка на диагонали в 0,72 длины от острия; остриё и выемка
// острые, крылья скруглены r 1,5, как углы треугольников набора (скруглённая выемка у малого курсора съедала ребро целиком)
const cursor = (T0, len) => polyline([T0, pt(T0, len, 22.5), pt(T0, len * 0.72, 45), pt(T0, len, 67.5)], { closed: true, r: [0, 1.5, 0, 1.5] });
// предметы по диагонали (пипетка, кисть): ось из O вправо вверх, s — вдоль оси, t — поперёк (вправо вниз);
// полукруглые концы капсул режутся как торцы — посередине, на два равных куска
const capArc = (c, r, a0, sweep) => ({ ...arc(c, r, a0, sweep), kind: 'cap' });
const DW = [Math.SQRT1_2, -Math.SQRT1_2], DN = [Math.SQRT1_2, Math.SQRT1_2];
const onAxis = (O, s, t = 0) => vadd(vadd(O, vmul(DW, s)), vmul(DN, t));
function circTop(c1, r1, c2, r2) { // верхняя точка пересечения двух окружностей
  const dx = c2[0] - c1[0], dy = c2[1] - c1[1], d = Math.hypot(dx, dy), a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(r1 * r1 - a * a);
  const m = [c1[0] + (a * dx) / d, c1[1] + (a * dy) / d], p1 = [m[0] + (h * dy) / d, m[1] - (h * dx) / d], p2 = [m[0] - (h * dy) / d, m[1] + (h * dx) / d];
  return p1[1] < p2[1] ? p1 : p2;
}
// поварской колпак: шапки — круги r 4 (7,5; 10,5), r 5 (12; 7) и зеркальный; околыш 6..18 до низа 21 (углы r 2), черта на 18
function chefHat() {
  const c1 = [7.5, 10.5], c2 = [12, 7], c3 = [16.5, 10.5], y1 = c1[1] + Math.sqrt(16 - 2.25), I12 = circTop(c1, 4, c2, 5), I23 = [24 - I12[0], I12[1]];
  const a1 = angOf(c1, [6, y1]), a1e = angOf(c1, I12) + 360, a2s = angOf(c2, I12) + 360, a2e = angOf(c2, I23) + 360, a3s = angOf(c3, I23) + 360;
  return [S(chainPath([arc(c1, 4, a1, a1e - a1), arc(c2, 5, a2s, a2e - a2s), arc(c3, 4, a3s, 540 - a1 - a3s), polyline([[18, y1], [18, 21], [6, 21], [6, y1]], { r: [0, 2, 2, 0] })], true)), S(line([6, 18], [18, 18]))];
}
// пазл: средняя деталь — тело 5..19 × 5,5..18,5 (углы r 1,5), выступы сверху и снизу, впадины слева и справа — круги
// r 2,25 с центром в 0,75 от края (шейка 4,24)
function puzzle() {
  const K = 2.25, ko = 0.75, nk = Math.sqrt(K * K - ko * ko), sw = 360 - 2 * Math.acos(ko / K) / D2R;
  const t = [12, 5.5 - ko], b = [12, 18.5 + ko], l = [5 + ko, 12], r = [19 - ko, 12];
  return [S(chainPath([
    L([6.5, 5.5], [12 - nk, 5.5]), arc(t, K, angOf(t, [12 - nk, 5.5]), sw), L([12 + nk, 5.5], [17.5, 5.5]), arc([17.5, 7], 1.5, 270, 90),
    L([19, 7], [19, 12 - nk]), arc(r, K, angOf(r, [19, 12 - nk]), -sw), L([19, 12 + nk], [19, 17]), arc([17.5, 17], 1.5, 0, 90),
    L([17.5, 18.5], [12 + nk, 18.5]), arc(b, K, angOf(b, [12 + nk, 18.5]), sw), L([12 - nk, 18.5], [6.5, 18.5]), arc([6.5, 17], 1.5, 90, 90),
    L([5, 17], [5, 12 + nk]), arc(l, K, angOf(l, [5, 12 + nk]), -sw), L([5, 12 - nk], [5, 7]), arc([6.5, 7], 1.5, 180, 90),
  ], true))];
}
// кисть: ручка-капсула шириной 4 вдоль диагонали, обойма поперёк, щетина — капля: круг r 3,5 и кончик в 5,5 от центра
function brush() {
  const Cb = [7, 17], rb = 3.5, s0 = Math.sqrt(rb * rb - 4), E = onAxis(Cb, 15.5), Q = onAxis(Cb, -5.5), off = Math.acos(rb / 5.5) / D2R;
  const P1 = onAxis(Cb, s0, -2), P2 = onAxis(Cb, s0, 2), aP2 = angOf(Cb, P2), aP1 = angOf(Cb, P1) + 360, t1 = 135 - off, t2 = 135 + off;
  return [S(chainPath([L(P1, onAxis(Cb, 15.5, -2)), capArc(E, 2, 225, 180), L(onAxis(Cb, 15.5, 2), P2), arc(Cb, rb, aP2, t1 - aP2), L(pt(Cb, rb, t1), Q), L(Q, pt(Cb, rb, t2)), arc(Cb, rb, t2, aP1 - t2)], true)),
    S(line(onAxis(Cb, 5.5, -3.5), onAxis(Cb, 5.5, 3.5)))];
}
// пипетка по оси из (3,5; 20,5): кончик — круг r 1,25 у самого начала оси, трубка до s 12, муфта 12..15,5, колба до s 19,5 + r 3
function pipette() {
  const O = [3.5, 20.5], T0 = onAxis(O, 1.25), Cm = onAxis(O, 12, -2.25), Cp = onAxis(O, 12, 2.25);
  const touch = (Pq, side) => { // точка касания из Pq к кругу кончика, со стороны side (+1 — по DN)
    const dx = Pq[0] - T0[0], dy = Pq[1] - T0[1], d = Math.hypot(dx, dy), phi = Math.atan2(dy, dx), b = Math.acos(1.25 / d);
    const c = [phi + b, phi - b].map((a) => [T0[0] + 1.25 * Math.cos(a), T0[1] + 1.25 * Math.sin(a)]), sd = (q) => (q[0] - T0[0]) * DN[0] + (q[1] - T0[1]) * DN[1];
    return side > 0 ? (sd(c[0]) > sd(c[1]) ? c[0] : c[1]) : (sd(c[0]) < sd(c[1]) ? c[0] : c[1]);
  };
  const tm = touch(Cm, -1), tp = touch(Cp, 1), a1 = angOf(T0, tm), a2 = angOf(T0, tp);
  const tube = chainPath([L(Cm, tm), arc(T0, 1.25, a1, a2 - a1 > 0 ? a2 - a1 - 360 : a2 - a1), L(tp, Cp)]);
  const collar = polyline([onAxis(O, 12, -4.25), onAxis(O, 15.5, -4.25), onAxis(O, 15.5, 4.25), onAxis(O, 12, 4.25)], { closed: true, r: 1.25 });
  const bulb = chainPath([L(onAxis(O, 15.5, -3), onAxis(O, 19.5, -3)), capArc(onAxis(O, 19.5), 3, 225, 180), L(onAxis(O, 19.5, 3), onAxis(O, 15.5, 3))]);
  return [S(tube), S(collar), S(bulb)];
}
// черепаха: панцирь — полукруг r 7,5 вокруг (10,5; 14) с плоским низом, щиток — дуга r 3,5 и два шва под 45° (панцирь
// на три пластины); голова — сплошной круг r 2, заходит на край панциря; лапы — капсулы r 1,5
function turtle() {
  const C = [10.5, 14], R = 7.5, r2 = 3.5;
  return [S(chainPath([arc(C, R, 180, 180), L([C[0] + R, C[1]], [C[0] - R, C[1]])], true)), S(path([arc(C, r2, 180, 180)])),
    ...[225, 315].map((a) => S(line(pt(C, r2, a), pt(C, R, a)))), { disk: [pt(C, R + 2.25, -15), 2] },
    { capsule: [[6, 14.5], [6, 17], 1.5] }, { capsule: [[15, 14.5], [15, 17], 1.5] }];
}

// ===== девятая партия: остаток SignoreBot — по композиции оригиналов бота =====
const sweepTo = (a, b) => ((b - a) % 360 + 360) % 360; // угол по возрастанию от a до b
// «выключено» с просветом 2 по обе стороны косой (как eye-off): вырезана полоса |s| < 4
const cutBothSides = (parts, P0) => parts.flatMap((p) => (p.stroke ? cutPathStrip(p.stroke, P0, SLASH_N, -4, 4).filter((q) => pathLen(q) >= 2).map((q) => S(snapToAxes(trimTails(q)))) : []));
// овал с вертикальной большой осью (раструб рупора): тот же чертёжный овал, повёрнутый на 90°
function ovalVert(cx, cy, av, bh, r1) {
  const r2 = ((av - r1) ** 2 + bh * bh - r1 * r1) / (2 * (bh - r1)), p = Math.atan2(r2 - bh, av - r1) / D2R;
  const Tc = [cx, cy - (av - r1)], Bc = [cx, cy + (av - r1)], Rs = [cx - (r2 - bh), cy], Ls = [cx + (r2 - bh), cy];
  return { r2, Ls, path: chainPath([arc(Tc, r1, 270, p), arc(Rs, r2, 270 + p, 180 - 2 * p), arc(Bc, r1, 90 - p, 2 * p), arc(Ls, r2, 90 + p, 180 - 2 * p), arc(Tc, r1, 270 - p, p)], true) };
}
// рупор по рисунку бота: раструб — вертикальный овал a 9 × 2 (концы r 1,25) в (19; 11,5); задняя коробка 3..9 × 8..15 с большими
// скруглениями спины (r 2,5) и перегородкой; края конуса — вогнутые дуги, касательные к горизонтали у коробки, концы — на осевой
// раструба; ручка висит под коробкой, её концы — на осевой низа коробки
function megaphone() {
  const rim = ovalVert(19, 11.5, 9, 2, 1.25), xAt = (y) => rim.Ls[0] - Math.sqrt(rim.r2 ** 2 - (y - 11.5) ** 2);
  const E = [xAt(3.5), 3.5], Eb = [E[0], 23 - E[1]], R = ((E[0] - 9) ** 2 + (E[1] - 8) ** 2) / (2 * (8 - E[1])), cT = [9, 8 - R], cB = [9, 15 + R];
  return [S(rim.path), S(chainPath([arc(cT, R, angOf(cT, E), 90 - angOf(cT, E)), polyline([[9, 8], [3, 8], [3, 15], [9, 15]], { r: [0, 2.5, 2.5, 0] }), arc(cB, R, 270, sweepTo(270, angOf(cB, Eb)))])),
    S(line([9, 8], [9, 15])), S(polyline([[5.5, 15], [6.5, 21.5], [9.5, 21.5], [8.5, 15]], { r: [0, 1.25, 1.25, 0] }))];
}
// щит: верх — два отрезка под 15° к пику, бока 5 и 19 до y 11, низ — дуги r 149/14, касательные к бокам, сходятся в (12; 21)
function shieldPath() {
  const R = 149 / 14, cL = [5 + R, 11], cR = [19 - R, 11], peak = [12, 5 - 7 * Math.tan(15 * D2R)], aR = angOf(cR, [12, 21]), aL = angOf(cL, [12, 21]);
  return chainPath([arc(cR, R, aR, -aR), polyline([[19, 11], [19, 5], peak, [5, 5], [5, 11]], { r: [0, 2, 1.5, 2, 0] }), arc(cL, R, 180, aL - 180)], true);
}
// подарок: крышка 3..21 × 7..11, короб 5..19 до 21, лента по оси; бант одним путём — петля по кругу r 2,5 от низа (на крышке)
// через верх до касательной, прямая в узел (12; 7), зеркально
function gift() {
  const C = [8, 4.5], r = 2.5, K = [12, 7], d = Math.hypot(K[0] - C[0], K[1] - C[1]), aQ = angOf(C, K) - Math.acos(r / d) / D2R + 360;
  const Q = pt(C, r, aQ), Qm = [24 - Q[0], Q[1]];
  return [S(rect(3, 7, 18, 4, 1.5)), S(polyline([[5, 11], [5, 21], [19, 21], [19, 11]], { r: [0, 2, 2, 0] })), S(line([12, 7], [12, 21])),
    S(chainPath([arc(C, r, 90, aQ - 90), L(Q, K), L(K, Qm), arc([16, 4.5], r, 540 - aQ, aQ - 90)]))];
}
// ракета по рисунку бота — облегчённой линией 1,75 (w 0,875): при 2 плавники и иллюминатор слипаются. Корпус — «линза» длиной 18
// и полушириной 4,25, хвост срезан; иллюминатор-кольцо r 2; плавники крупные и полые; пламя-капля за хвостом
function rocket() {
  const w = 0.875, M = [14, 10], half = 9, hw0 = 4.25, R = (half * half + hw0 * hw0) / (2 * hw0), k = R - hw0, hw = (u) => Math.sqrt(R * R - u * u) - k, uT = -6.5;
  const at = (u, t = 0) => onAxis(M, u, t), P = at(half), cA = at(0, k), cB = at(0, -k), A = at(uT, -hw(uT)), B = at(uT, hw(uT)), Sw = (pp) => ({ stroke: pp, w });
  const body = chainPath([arc(cA, R, angOf(cA, A), sweepTo(angOf(cA, A), angOf(cA, P))), arc(cB, R, angOf(cB, P), sweepTo(angOf(cB, P), angOf(cB, B))), L(B, A)], true);
  const fins = [-1, 1].map((sg) => Sw(polyline([at(-1, sg * hw(-1)), at(-4.5, sg * 8.5), at(-9, sg * 7), at(uT, sg * hw(uT))], { r: [0, 1.5, 1.5, 0] })));
  const Fc = at(uT - 4.8), off = Math.acos(1.75 / 4) / D2R, tip = at(uT - 8.8);
  return [Sw(body), Sw(circle(at(2.5), 2)), ...fins, Sw(chainPath([capArc(Fc, 1.75, 135 + off, 360 - 2 * off), L(pt(Fc, 1.75, 135 - off), tip), L(tip, pt(Fc, 1.75, 135 + off))], true))];
}
// меч по рисунку бота — единый силуэт: широкий клинок (полуширина 3,5) вдоль диагонали x + y = 24, на конце — прямой угол
// с кромками по осям (остриё в (21,5; 2,5)); гарда лепестками ±6,5 вокруг (8; 16); рукоять полушириной 2 (ўже — просвет внутри
// вырождается) и навершие-ромб ±3,5
function sword() {
  const G = [8, 16], sT = 13.5 * S2, sC = sT - 3.5, P = (sv, t) => onAxis(G, sv, t);
  const pts = [P(sT, 0), P(sC, 3.5), P(1.5, 3.5), P(1.5, 6.5), P(-1.5, 6.5), P(-1.5, 2), P(-4.5, 2), P(-6.5, 3.5), P(-8.5, 0), P(-6.5, -3.5), P(-4.5, -2), P(-1.5, -2), P(-1.5, -6.5), P(1.5, -6.5), P(1.5, -3.5), P(sC, -3.5)];
  return [S(polyline(pts, { closed: true, r: [1.5, 1.25, 0, 1.25, 1.25, 0, 0, 1.25, 0, 1.25, 0, 0, 1.25, 1.25, 0, 1.25] }))];
}
// замок с ключом: замок слева (тело 2..12 × 11..21, дужка r 3 вокруг (7; 8)); ключ справа — кольцо r 2,75 в (19; 13), стержень к (12,5; 19,5),
// две бородки; тело замка вырезано капсулами вокруг ключа (просвет 2)
function lockKey() {
  const K = [19, 13], rk = 2.75, s0 = pt(K, rk, 135), E = [12.5, 19.5], u = [-Math.SQRT1_2, Math.SQRT1_2], v = [Math.SQRT1_2, Math.SQRT1_2];
  const teeth = [0, 2.5].map((kk) => { const a = vadd(E, vmul(u, -kk)); return line(a, vadd(a, vmul(v, 2))); });
  const region = (q) => Math.min(capsuleRegion(s0, E, 4)(q), ...teeth.map((t) => capsuleRegion(t.edges[0].a, t.edges[0].b, 4)(q)), Math.hypot(q[0] - K[0], q[1] - K[1]) - (rk + 4));
  return [...cutPathRegion(rect(2, 11, 10, 10, 2), region).filter((q) => pathLen(q) >= 2).map((q) => S(trimTails(q))),
    S(chainPath([L([4, 11], [4, 8]), arc([7, 8], 3, 180, 180), L([10, 8], [10, 11])])), S(line([7, 15], [7, 17])), S(circle(K, rk)), S(line(s0, E)), ...teeth.map(S)];
}
// хлопушка-конфетти по рисунку бота: конус от острия (3; 21) к (7; 9) и (15; 17), полоса поперёк; конфетти как у бота —
// серпантин-«S» и дужка за линией устья (x − y ≥ 4: просвет 2), «запятая» выше (дуга r 2 делится как торец: её внутреннее
// смещение — радиус торца), шесть точек r 1 в свободных местах
function partyPopper() {
  return [S(polyline([[3, 21], [7, 9], [15, 17]], { closed: true, r: 1.5 })), S(line([5.6, 13.2], [10.8, 18.4])),
    S(chainPath([arc([15, 8.5], 3, 185, 85), L([15, 5.5], [17, 5.5]), arc([17, 2.5], 3, 90, -90)])), S(path([arc([19, 13], 2, 180, 180)])), S(path([capArc([10.5, 3.5], 2, 200, -50)])),
    ...[[3.5, 6], [4.5, 2], [12.5, 2], [22, 7.5], [19, 17], [22, 20]].map((c) => ({ disk: [c, 1] }))];
}
// паровоз носом вправо: ходовая доска — отдельная линия 2..22 на 15 (стенки сверху и колёса снизу кончаются на ней); будка —
// крыша со свесом назад 2,5..9 на 4, стенки 3,5 и 9; котёл от будки до носа, нос скруглён; труба-воронка выше будки;
// колёса — дуги r 2,5 с центрами на 17, между колёсами просвет 2
function locomotive() {
  const wheel = (x) => { const a = Math.asin(-0.8) / D2R; return S(path([arc([x, 17], 2.5, a, 180 - 2 * a)])); };
  return [S(line([2, 15], [22, 15])), S(polyline([[2.5, 4], [9, 4], [9, 15]])), S(line([3.5, 4], [3.5, 15])), S(polyline([[9, 8], [18, 8], [21, 11], [21, 15]], { r: [0, 2, 1.5, 0] })),
    S(polyline([[14.5, 8], [13.5, 3], [17.5, 3], [16.5, 8]], { r: [0, 1.25, 1.25, 0] })), wheel(7), wheel(16)];
}
// волшебная палочка: капсула полушириной 1,5 по диагонали с пояском, искра — сплошная (четыре четверти r 4), плюс и точка
function wandSparkles() {
  const O = [3.5, 20.5], at = (s, t = 0) => onAxis(O, s, t), c = [17.5, 6.5], R = 4;
  const wand = chainPath([L(at(0, -1.5), at(13, -1.5)), capArc(at(13), 1.5, 225, 180), L(at(13, 1.5), at(0, 1.5)), capArc(at(0), 1.5, 45, 180)], true);
  const spark = chainPath([arc([c[0] - R, c[1] - R], R, 90, -90), arc([c[0] + R, c[1] - R], R, 180, -90), arc([c[0] + R, c[1] + R], R, 270, -90), arc([c[0] - R, c[1] + R], R, 0, -90)], true);
  return [S(wand), S(line(at(10.5, -1.5), at(10.5, 1.5))), { solid: spark }, T(line([5, 6], [9, 6])), T(line([7, 4], [7, 8])), { disk: [[20, 15.5], 1.25] }];
}
// булавка по рисунку бота: головка — один замкнутый контур: шляпка 7..17 на 2, «ушки» под 45° к стойкам 9 и 15; от стоек на 11
// раструб — дуги r 3 до линии основания на 14 (6..18). Игла — заливка шириной 2 от осевой основания, конец «пулей»: две дуги
// r 3,625, касательные к бокам на 20,5 и сходящиеся в (12; 23)
function pushpin() {
  const og = 3.625, a = Math.atan2(2.5, og - 1) / D2R;
  const head = chainPath([arc([9, 14], 3, 180, 90), polyline([[9, 11], [9, 4], [7, 2], [17, 2], [15, 4], [15, 11]], { r: [0, 1.25, 0, 0, 1.25, 0] }), arc([15, 14], 3, 270, 90), L([18, 14], [6, 14])], true);
  const needle = path([L([11, 14], [13, 14]), L([13, 14], [13, 20.5]), arc([13 - og, 20.5], og, 0, a), arc([11 + og, 20.5], og, 180 - a, a), L([11, 20.5], [11, 14])], true);
  return [S(head), { fill: needle }];
}
// перемешать по рисунку бота: S-кривые — ввод 2..5, дуга r 5, диагональ «3-4-5» (от (9; 8) до (15; 16)), дуга r 5, вывод до 21
// под остриё в 22. Сплошная идёт сверху слева вниз направо, вторая разрезана под ней с просветом 1,5 (перекрёсток «под»; так
// ближе к рисунку бота, а на 16 px разрыв ещё в целый пиксель)
function shuffle() {
  const th = Math.atan2(4, 3) / D2R;
  const over = chainPath([L([2, 6], [5, 6]), arc([5, 11], 5, 270, th), L([9, 8], [15, 16]), arc([19, 13], 5, 90 + th, -th), L([19, 18], [21, 18])]);
  const under = chainPath([L([2, 18], [5, 18]), arc([5, 13], 5, 90, -th), L([9, 16], [15, 8]), arc([19, 11], 5, 270 - th, th), L([19, 6], [21, 6])]);
  return [S(over), ...cutPathStrip(under, [12, 12], [0.8, -0.6], -3.5, 3.5).map(S), S(polyline([[19, 3], [22, 6], [19, 9]])), S(polyline([[19, 15], [22, 18], [19, 21]]))];
}
// точки пересечения окружностей (c1, r1) и (c2, r2), верхняя — первой
function circlesMeet(c1, r1, c2, r2) {
  const dx = c2[0] - c1[0], dy = c2[1] - c1[1], d = Math.hypot(dx, dy), a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(r1 * r1 - a * a);
  const bx = c1[0] + (a * dx) / d, by = c1[1] + (a * dy) / d;
  return [[bx - (h * dy) / d, by + (h * dx) / d], [bx + (h * dy) / d, by - (h * dx) / d]].sort((p, q) => p[1] - q[1]);
}
// сон по рисунку бота: луна во всё поле — внешняя дуга r 10 вокруг (12; 12), выкус r 9 вокруг (18; 7,5) (центры в 7,5 —
// треугольник 3-4-5); рожки на пересечении окружностей, (10,8; 2,1) и (21,2; 15,9). «Zz» тонкой линией в раскрыве, между ними 1,7
function sleep() {
  const C = [12, 12], B = [18, 7.5], [top, right] = circlesMeet(C, 10, B, 9), Z = (x, y, a) => T(polyline([[x, y], [x + a, y], [x, y + a], [x + a, y + a]]));
  const aT = angOf(C, top) + 360, aR = angOf(C, right), bR = angOf(B, right), bT = angOf(B, top) + 360;
  return [S(chainPath([arc(C, 10, aT, aR - aT), arc(B, 9, bR, bT - bR)], true)), Z(19, 3, 3), Z(14.5, 8.5, 2.5)];
}
// хлопушка кино: доска 3..21 × 10..21 (шарнирный угол острый), рычаг 18 × 3,5 на шарнире (3; 10) под 15°, три полосы
function clapperboard() {
  const d = [Math.cos(-15 * D2R), Math.sin(-15 * D2R)], up = [d[1], -d[0]], B0 = [3, 10], B1 = vadd(B0, vmul(d, 18)), T0 = vadd(B0, vmul(up, 3.5)), T1 = vadd(B1, vmul(up, 3.5));
  return [S(polyline([[3, 10], [21, 10], [21, 21], [3, 21]], { closed: true, r: [0, 2, 2, 2] })), S(polyline([B0, B1, T1, T0], { closed: true, r: [0, 1.25, 1.25, 1.25] })),
    ...[4, 8.5, 13].map((sv) => S(line(vadd(B0, vmul(d, sv)), vadd(vadd(B0, vmul(d, sv + 2.5)), vmul(up, 3.5)))))]; // верхний торец последней — до скругления угла
}

// ===== седьмая партия: модификации значков шестой =====
// Ещё два приёма к трём из пятой партии. (4) В строю — у списков: знак встаёт на место детали списка, список
// остаётся целым (бейдж в углу стёр бы строку). (5) Выключено — косая из левого верхнего угла в правый нижний:
// справа сверху основа отступает от неё на 2 (вырезана полоса 0 < s < 4 от осевой косой), слева снизу детали
// кончаются на её осевой. Обрезок короче 2 выбрасывается, хвост короче 2 за углом — срезается.
const pathLen = (pp) => pp.edges.reduce((a, e) => a + edgeLen(e), 0);
// конец дуги фигуры, упавший ближе 5° к оси, срезается до оси (просвет от этого только растёт): дуги режутся
// по осям, и у оси остался бы кусок меньше 5°
const snapToAxes = (pp, min = 5 * D2R) => {
  const e = pp.edges.slice(), q = Math.PI / 2;
  const f = e[0];
  if (f.t === 'A' && f.kind === 'main') {
    const dir = Math.sign(f.da), axis = dir > 0 ? Math.ceil(f.a0 / q - 1e-9) * q : Math.floor(f.a0 / q + 1e-9) * q, d = Math.abs(axis - f.a0);
    if (d > 1e-9 && d < min && d < Math.abs(f.da)) e[0] = subEdge(f, d / Math.abs(f.da), 1);
  }
  const l = e[e.length - 1];
  if (l.t === 'A' && l.kind === 'main') {
    const end = l.a0 + l.da, dir = Math.sign(l.da), axis = dir > 0 ? Math.floor(end / q + 1e-9) * q : Math.ceil(end / q - 1e-9) * q, d = Math.abs(end - axis);
    if (d > 1e-9 && d < min && d < Math.abs(l.da)) e[e.length - 1] = subEdge(l, 0, 1 - d / Math.abs(l.da));
  }
  return path(e, false);
};
const SLASH_N = [Math.SQRT1_2, -Math.SQRT1_2]; // нормаль к косой — вправо вверх
const withSlash = (baseParts, a, b) => [
  ...baseParts.flatMap((p) => (p.stroke ? cutPathStrip(p.stroke, a, SLASH_N, 0, 4).filter((q) => pathLen(q) >= 2).map((q) => S(snapToAxes(trimTails(q)))) : [p])),
  S(line(a, b)),
];
// стрелка вдоль строки: древко от a, острие в b (древко кончается за 1 до него), плечи головки — h по каждой оси
const rowArrow = (a, b, h) => { const d = Math.sign(b[0] - a[0]); return [S(line(a, [b[0] - d, b[1]])), S(polyline([[b[0] - d * h, b[1] - h], b, [b[0] - d * h, b[1] + h]]))]; };
// маленькая молния на месте цифры: молния набора ×¼ (узлы на сетке ¼), рамка 3,5..6,5 × 4,5..9,5 — центр (5; 7), как у «1»
const listBolt = polyline([[15, 2], [6, 13], [11, 13], [9, 22], [18, 11], [13, 11]].map(([x, y]) => [3.5 + (x - 6) / 4, 4.5 + (y - 2) / 4]), { closed: true });

// ===== десятая партия: математика ООМ =====
// куб — кубик набора без точек (шестиугольник dV и «игрек» из центра); объёмы — сетка 2 × 2 × 2 тонкой линией через
// середины рёбер граней; чёрный ящик — три сплошные грани, внутренние рёбра сдвинуты внутрь (между гранями просвет 1,5)
const lerp = (a, b, t) => vadd(a, vmul(vsub(b, a), t));
const cubeParts = [S(polyline(dV, { closed: true })), S(line([12, 12], dV[5])), S(line([12, 12], dV[1])), S(line([12, 12], dV[3]))];
const cubeFaces = [[dV[5], dV[0], dV[1], [12, 12]], [dV[5], [12, 12], dV[3], dV[4]], [[12, 12], dV[1], dV[2], dV[3]]];
const faceGrid = ([A, B, C, Dd]) => [T(line(lerp(A, B, 0.5), lerp(Dd, C, 0.5))), T(line(lerp(A, Dd, 0.5), lerp(B, C, 0.5)))];
// грань, у которой рёбра с номерами inner (ребро i — от вершины i к i + 1) сдвинуты внутрь на d
function insetFace(P, inner, d) {
  const n = P.length, sgn = Math.sign(P.reduce((s, p, i) => s + p[0] * P[(i + 1) % n][1] - P[(i + 1) % n][0] * p[1], 0));
  const edges = P.map((p, i) => {
    const q = P[(i + 1) % n], u = vmul(vsub(q, p), 1 / Math.hypot(...vsub(q, p))), nIn = [-u[1] * sgn, u[0] * sgn];
    return inner.includes(i) ? [vadd(p, vmul(nIn, d)), vadd(q, vmul(nIn, d))] : [p, q];
  });
  const meet = ([p, p2], [q, q2]) => { const r = vsub(p2, p), s = vsub(q2, q), t = ((q[0] - p[0]) * s[1] - (q[1] - p[1]) * s[0]) / (r[0] * s[1] - r[1] * s[0]); return vadd(p, vmul(r, t)); };
  return edges.map((e, i) => meet(edges[(i - 1 + n) % n], e));
}
const cubeFill = (g = 1.5) => [[2, 3], [0, 1], [0, 3]].map((inner, k) => ({ solid: polyline(insetFace(cubeFaces[k], inner, 1 + g / 2), { closed: true }) }));
// молоток по рисунку ООМ — гвоздодёр. Оси: s — вдоль головы к когтю (DW), t — вдоль рукояти (DN), O — их пересечение;
// угол экрана = угол в рамке − 45°. Голова — чистая заливка: боёк высотой 3,5 с торцом, скруглённым по углам r 1, снизу
// полукруглая выемка r 1,5; верх — дуга r 12 от бойка к когтю, снизу у когтя вогнутое «горло» r 6, кончик скруглён r 1,
// как стык линии на остром углу: обе дуги касаются его окружности (острым в наборе остаётся только игла булавки).
// Кончик и радиусы подобраны так, что концы дуг не ближе 5° к осям (дуги режутся по осям), а кромки сходятся (стык < 180°). Рукоять — капсула шириной 3.
// O подобран так, что габарит стоит по центру поля
function hammer() {
  const O = [8.75, 8], P = (s, t) => onAxis(O, s, t), A = (c, r, a0, sw, kind) => ({ ...arc(P(...c), r, a0 - 45, sw), ...(kind ? { kind } : {}) });
  const f = 1.75, Qtop = [-6, -f], Qth = [2, f], Tc = [8, 2], Rtop = 12, Rth = 6;
  const toward = (C, R, Q) => vadd(C, vmul(vsub(Q, C), R / Math.hypot(...vsub(Q, C))));
  const Ct = circlesMeet(Qtop, Rtop, Tc, Rtop - 1)[1], Kt = toward(Ct, Rtop, Tc); // верх касается кончика изнутри
  const Ch = circlesMeet(Qth, Rth, Tc, Rth + 1)[1], Kh = toward(Ch, Rth, Tc); // горло — снаружи
  const down = (a, b) => -sweepTo(b, a); // размах по убыванию угла
  const E = [...polyline([Qtop, [-8.5, -f], [-8.5, f], [-6, f]].map((q) => P(...q)), { r: [0, 1, 1, 0] }).edges,
    A([-4.5, f], 1.5, 180, 180), L(P(-3, f), P(...Qth)),
    A(Ch, Rth, angOf(Ch, Qth), sweepTo(angOf(Ch, Qth), angOf(Ch, Kh))),
    A(Tc, 1, angOf(Tc, Kh), down(angOf(Tc, Kh), angOf(Tc, Kt)), 'join'),
    A(Ct, Rtop, angOf(Ct, Kt), down(angOf(Ct, Kt), angOf(Ct, Qtop)))];
  return [{ fill: path(E, true) }, { capsule: [P(0, f), P(0, 17), 1.5] }];
}
// весы по рисунку ООМ: коромысло 5..19 на 7, шишка — диск r 2 на стойке, стойка до основания 7..17 на 20; чаши сплошные —
// треугольник от конца коромысла к ободу на 13 и полукруг r 3
const scalePan = (x) => chainPath([L([x, 7], [x + 3, 13]), arc([x, 13], 3, 0, 180), L([x - 3, 13], [x, 7])], true);
// пятиугольник: верх на 3, низ на 21
const pentR = 18 / (1 + Math.cos(36 * D2R)), pentagonPts = [0, 1, 2, 3, 4].map((k) => pt([12, 3 + pentR], pentR, -90 + 72 * k));
// зеркало: пунктир оси (штрих 2, просвет 2 между торцами), треугольники остриём к оси; исходный — сплошной
const flipParts = (q) => [...[2, 8, 14, 20].map((y) => S(line(q([12, y]), q([12, y + 2])))),
  { solid: polyline([[2.5, 5.5], [8.5, 12], [2.5, 18.5]].map(q), { closed: true, r: TRI_R }) }, S(polyline([[21.5, 5.5], [15.5, 12], [21.5, 18.5]].map(q), { closed: true, r: TRI_R }))];
// ƒ: наклонная стойка (14; 8,5)–(10; 15,5), крюки r 2,5 на 75° по касательной к ней, перекладина 8,5..15,5 на 12
const fA = [14, 8.5], fB = [10, 15.5], fN = vnorm([7, 4]), fC1 = vadd(fA, vmul(fN, 2.5)), fC2 = vsub(fB, vmul(fN, 2.5));
const fGlyph = [S(chainPath([arc(fC2, 2.5, angOf(fC2, fB) + 75, -75), L(fB, fA), arc(fC1, 2.5, angOf(fC1, fA), 75)])), S(line([8.5, 12], [15.5, 12]))];

// ===== одиннадцатая партия: связь (общее назначение, analysis/GENERAL.md) =====
// трубка: спинка — дуга r 17 вокруг (19; 5), кромка — дуга r 13, площадки 6 × 6 со скруглениями r 3; симметрична
// относительно диагонали x + y = 24
function phoneParts() {
  const C = [19, 5], th = 112, P1 = pt(C, 13, th), P2 = pt(C, 13, 270 - th);
  const e1 = polyline([[19, 22], [22, 22], [22, 16], [16, 16], P1], { r: [0, 3, 3, 1.25, 0] }).edges;
  const e2 = polyline([P2, [8, 8], [8, 2], [2, 2], [2, 5]], { r: [0, 1.25, 3, 3, 0] }).edges;
  return [S(chainPath([arc(C, 17, 180, -90), ...e1, arc(C, 13, th, 270 - 2 * th), ...e2], true))];
}
// скрепка: стоит вертикально — прогоны x = 6, 10, 14, 18 (просвет 2), петли r 6 и r 2 внизу вокруг
// (12; 15,5), r 4 вверху вокруг (14; 6,5); внутренний прогон кончается в центре верхней петли (до неё просвет ровно 2)
function paperclip() {
  return [S(chainPath([L([6, 8], [6, 15.5]), arc([12, 15.5], 6, 180, -180), L([18, 15.5], [18, 6.5]), arc([14, 6.5], 4, 0, -180), L([10, 6.5], [10, 15.5]),
    { ...arc([12, 15.5], 2, 180, -180), kind: 'cap' }, L([14, 15.5], [14, 6.5])]))]; // петля r 2 режется как торец
}
// флажок: древко x = 4, полотнище 4..20 × 4..14; верх и низ — одна и та же волна из двух дуг с перегибом посередине
// (провис 1,5 на хорде 8), правый край прямой, полотнище кончается на осевой древка
function flagParts() {
  const R = (16 + 2.25) / 3, a = Math.asin(4 / R) / D2R;
  const wave = (y) => [arc([8, y + R - 1.5], R, -90 - a, 2 * a), arc([16, y - R + 1.5], R, 90 + a, -2 * a)];
  const back = (e) => ({ ...e, a0: e.a0 + e.da, da: -e.da });
  return [S(line([4, 22], [4, 3])), S(chainPath([...wave(4), L([20, 4], [20, 14]), ...wave(14).reverse().map(back)]))];
}
// большой палец: кулак 9..21 × 10..21, палец — капсула шириной 4 от левого края кулака вверх до 3, складки пальцев —
// две тонкие черты от правого края; манжета — сплошная полоса 3..5 отдельно, в 2 от кулака. Палец вниз — отражение
// относительно y = 12
function thumbParts(down = false) {
  const f = down ? (p) => [p[0], 24 - p[1]] : (p) => p;
  // кончик r 2 режется как торец
  const hand = chainPath([...polyline([[13, 5], [13, 10], [21, 10], [21, 21], [9, 21], [9, 5]].map(f), { r: [0, 1.25, 2, 2, 2, 0] }).edges,
    { ...arc(f([11, 5]), 2, 180, down ? -180 : 180), kind: 'cap' }], true);
  return [S(hand), { solid: polyline([[3, 11], [5, 11], [5, 21], [3, 21]].map(f), { closed: true }) }, ...[13.75, 17.25].map((y) => T(line(f([16.5, y]), f([21, y]))))];
}
// лица: кольцо, глаза — кольца r 1,5 в (8,5; 9,5) и (15,5; 9,5) (между ними и до обода просвет 2); улыбка — дуга r 5,5
// вокруг центра лица на 110°, грусть — дуга r 4 вокруг (12; 19,5) на 90°
const faceEyes = [S(circle([8.5, 9.5], 1.5)), S(circle([15.5, 9.5], 1.5))];
const faceParts = (sad) => [ring, ...faceEyes, S(path([sad ? arc([12, 19.5], 4, 225, 90) : arc([12, 12], 5.5, 145, -110)]))];
// микрофон: узкая капсула 10..14 × 2..14 (r 2), держатель — «U» r 6 вокруг (12; 12) с просветом 2,
// стойка до 22
const micParts = [S(rect(10, 2, 4, 12, 2)), S(chainPath([L([6, 9], [6, 12]), arc([12, 12], 6, 180, -180), L([18, 12], [18, 9])])), S(line([12, 18], [12, 22]))];
// наушники: оголовье — полукруг r 8 вокруг (12; 11), амбушюры — отдельные капсулы 4 × 10 (r 2),
// оголовье кончается на их осевой; гарнитура — те же, с укороченными амбушюрами и штангой микрофона
const headphonesParts = [S(path([arc([12, 11], 8, 180, 180)])), S(rect(2, 11, 4, 10, 2)), S(rect(18, 11, 4, 10, 2))];
// фотоаппарат: корпус 2..22 × 7..21 с выступом 9..15 на 4, объектив r 3 (до верха и низа корпуса просвет 2)
const cameraParts = [S(polyline([[2, 7], [7, 7], [9, 4], [15, 4], [17, 7], [22, 7], [22, 21], [2, 21]], { closed: true, r: [2, 0, 1.25, 1.25, 0, 2, 2, 2] })), S(circle([12, 14], 3))];
// принтер: корпус 2..22 × 9..18, бумага сверху — «П» 7..17 от 3 до осевой корпуса, снизу — лист 7..17 × 14..22, низ
// корпуса кончается на его боках
const printerParts = [S(polyline([[7, 18], [2, 18], [2, 9], [22, 9], [22, 18], [17, 18]], { r: [0, 2, 2, 2, 2, 0] })), S(polyline([[7, 9], [7, 3], [17, 3], [17, 9]], { r: [0, 1.25, 1.25, 0] })), S(rect(7, 14, 10, 8, 1.25))];

// ===== двенадцатая партия: покупки и деньги =====
// тележка: ручка, скошенный перед корзины, дно, скошенный зад; верх корзины кончается на переднем скосе; колёса — диски r 2
const cartFrontX = (y) => 4.5 + ((7 - 4.5) * (y - 2)) / (16 - 2);
const cartParts = [S(polyline([[2, 2], [4.5, 2], [7, 16], [19, 16], [21.5, 7], [cartFrontX(7), 7]], { r: [0, 1.25, 1.25, 1.25, 1.25, 0] })), { disk: [[8.5, 21], 2] }, { disk: [[17.5, 21], 2] }];
// фургон: кузов 2..14 × 3..18, кабина до 7 с коротким скосом 3 × 4, колёса — кольца r 2; низ кузова кончается
// на колёсах
const truckParts = [S(polyline([[5, 18], [2, 18], [2, 3], [14, 3], [14, 18]], { r: [0, 1.25, 2, 2, 0] })), S(line([9, 18], [15, 18])),
  S(polyline([[14, 7], [19, 7], [22, 11], [22, 18], [19, 18]], { r: [0, 1.25, 1.25, 1.25, 0] })), S(circle([7, 18], 2)), S(circle([17, 18], 2))];
// доллар: «S» из двух окружностей r 4 вокруг (12; 8) и (12; 16), касающихся в центре; хвосты — до 25° от горизонтали
// (до черты просвет 2); черта — только над и под буквой, 2..4 и 20..22
const dollarParts = [S(chainPath([arc([12, 8], 4, 335, -245), arc([12, 16], 4, 270, 245)])), S(line([12, 2], [12, 4])), S(line([12, 20], [12, 22]))];
// кошелёк: корпус 2..20 × 6..20, язычок 14..22 × 9..17 с застёжкой-точкой (кругом просвет 2); правый бок корпуса кончается на язычке
const walletParts = [S(polyline([[20, 9], [20, 6], [2, 6], [2, 20], [20, 20], [20, 17]], { r: [0, 2, 2, 2, 2, 0] })), S(rect(14, 9, 8, 8, 2)), { dot: [18, 13] }];
// чек: лист 4..20, низ — зубцы 4 × 2 под 45°, три строки
const receiptParts = [S(polyline([[4, 3], [20, 3], [20, 21], [18, 19], [16, 21], [14, 19], [12, 21], [10, 19], [8, 21], [6, 19], [4, 21]], { closed: true, r: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0] })),
  S(line([8, 7], [16, 7])), S(line([8, 11], [16, 11])), S(line([8, 15], [12, 15]))];
// магазин: навес одним контуром — скаты крыши и четыре фестона r 2,5; стены кончаются на крайних фестонах, дверь — на полу
const awningPath = chainPath([...polyline([[2, 8], [5, 3], [19, 3], [22, 8]], { r: [0, 1.25, 1.25, 0] }).edges, ...[19.5, 14.5, 9.5, 4.5].map((x) => arc([x, 8], 2.5, 0, 180))], true);
const storeWallY = 8 + Math.sqrt(2.5 * 2.5 - 0.5 * 0.5);
const storeParts = [S(awningPath), S(polyline([[4, storeWallY], [4, 21], [20, 21], [20, storeWallY]], { r: [0, 2, 2, 0] })), S(polyline([[9, 21], [9, 15], [15, 15], [15, 21]], { r: [0, 1.25, 1.25, 0] }))];
// банк: фронтон шириной с основание (3..21), нижние углы острые — скругление r 1,5 при угле 29° съедало по 6 клеток и крыша
// выходила уже колоннады; четыре колонны через 4, основание
const landmarkParts = [S(polyline([[3, 8], [12, 3], [21, 8]], { closed: true, r: [0, 1.5, 0] })), ...[6, 10, 14, 18].map((x) => S(line([x, 12], [x, 17]))), S(line([3, 21], [21, 21]))];
// калькулятор: корпус 4..20 × 2..22, табло — сплошная полоса, клавиши — точки 3 × 2 с равными полями
const calculatorParts = [S(rect(4, 2, 16, 20, 2)), { capsule: [[8.5, 6.5], [15.5, 6.5], 1.5] }, ...[12, 17].flatMap((y) => [8, 12, 16].map((x) => ({ dot: [x, y] })))];
// билет: углы вырезаны вогнутыми четвертями r 2,5, перфорация x = 15 — штрихи 2 через 4, крайние начинаются на кромках
const ticketParts = [S(chainPath([L([4.5, 5], [19.5, 5]), arc([22, 5], 2.5, 180, -90), L([22, 7.5], [22, 16.5]), arc([22, 19], 2.5, 270, -90),
  L([19.5, 19], [4.5, 19]), arc([2, 19], 2.5, 0, -90), L([2, 16.5], [2, 7.5]), arc([2, 5], 2.5, 90, -90)], true)), ...[5, 11, 17].map((y) => S(line([15, y], [15, y + 2])))];
// копилка: одним контуром — круглое тело r 7 вокруг (10; 11), лапы шириной 4 на 4..8 и 12..16 до 20,5, пятачок до 21
// на высоте 9..13, ушко — треугольник от 290° и 330° тела до (16,5; 2,5) со скруглённым кончиком; глаз — точка (12,5; 9,5)
function piggyParts() {
  const O = [10, 11], R = 7, onC = (x) => [x, O[1] + Math.sqrt(R * R - (x - O[0]) ** 2)], ang = (P) => angOf(O, P), legY = 20.5;
  const sh = Math.sqrt(R * R - 4), Pst = [O[0] + sh, O[1] - 2], Psb = [O[0] + sh, O[1] + 2], F1 = onC(16), F2 = onC(12), B1 = onC(8), B2 = onC(4);
  return [S(chainPath([arc(O, R, ang(Psb), sweepTo(ang(Psb), ang(F1))), ...polyline([F1, [16, legY], [12, legY], F2], { r: [0, 1.25, 1.25, 0] }).edges,
    arc(O, R, ang(F2), sweepTo(ang(F2), ang(B1))), ...polyline([B1, [8, legY], [4, legY], B2], { r: [0, 1.25, 1.25, 0] }).edges,
    arc(O, R, ang(B2), sweepTo(ang(B2), 290)), ...polyline([pt(O, R, 290), [16.5, 2.5], pt(O, R, 330)], { r: [0, 1.25, 0] }).edges, arc(O, R, 330, sweepTo(330, ang(Pst))),
    ...polyline([Pst, [21, O[1] - 2], [21, O[1] + 2], Psb], { r: [0, 1.25, 1.25, 0] }).edges], true)), { disk: [[12.5, 9.5], 1] }];
}

// ===== тринадцатая партия: стрелки и фигуры =====
const mirrorY = (p) => [p[0], 24 - p[1]];
// каретка — сплошной треугольник 10 × 5 с боками под 45° (стрелка выпадающего списка)
const caretParts = (up) => [{ solid: polyline(up ? [[7, 14], [17, 14], [12, 9]] : [[7, 10], [17, 10], [12, 15]], { closed: true }) }];
// двойные шевроны: вправо — два шеврона 5 × 10 через 7 (между плечами просвет 2,9), остальные — поворотом
const chevronsParts = (n) => [6, 13].map((x) => S(polyline([[x, 7], [x + 5, 12], [x, 17]].map((p) => rotN(p, n)))));
// диагональная стрелка вверх-вправо: уголок-головка с вершиной (18; 6) и плечами 10, древко от (6; 18) кончается за 1 до вершины
const diagArrowParts = (n) => [S(polyline([[8, 6], [18, 6], [18, 16]].map((p) => rotN(p, n)))), S(line(rotN([6, 18], n), rotN([17, 7], n)))];
// стрелка в круге: кольцо, древко 7..16, головка с плечами 4 и острием в 17 (до кольца просвет 3)
const circleArrowParts = (n) => [ring, S(line(rotN([7, 12], n), rotN([16, 12], n))), S(polyline([[13, 8], [17, 12], [13, 16]].map((p) => rotN(p, n))))];
// тренд: ломаная под 45° (2,5; 17,5) — (7,5; 12,5) — (11,5; 16,5) — (20,5; 7,5) и уголок-головка с вершиной (21,5; 6,5)
// и плечами 5, ломаная кончается за 1 до вершины; вниз — отражение
const trendParts = (f) => [S(polyline([[2.5, 17.5], [7.5, 12.5], [11.5, 16.5], [20.5, 7.5]].map(f))), S(polyline([[16.5, 6.5], [21.5, 6.5], [21.5, 11.5]].map(f)))];
// «ввод» и «ответить»: древко с поворотом дугой r 5, головка с плечами 4 на 16 (8), острие в 4 от края; вправо —
// отражения
const cornerParts = {
  'corner-down-left': [S(chainPath([L([20, 4], [20, 11]), arc([15, 11], 5, 0, 90), L([15, 16], [5, 16])])), S(polyline([[8, 12], [4, 16], [8, 20]]))],
  'corner-down-right': [S(chainPath([L([4, 4], [4, 11]), arc([9, 11], 5, 180, -90), L([9, 16], [19, 16])])), S(polyline([[16, 12], [20, 16], [16, 20]]))],
  reply: [S(chainPath([L([20, 20], [20, 13]), arc([15, 13], 5, 0, -90), L([15, 8], [5, 8])])), S(polyline([[8, 12], [4, 8], [8, 4]]))],
  forward: [S(chainPath([L([4, 20], [4, 13]), arc([9, 13], 5, 180, 90), L([9, 8], [19, 8])])), S(polyline([[16, 12], [20, 8], [16, 4]]))],
};
// восьмиугольник: правильный, прямые стороны на 3 и 21
const octCut = (18 - 18 / (1 + Math.SQRT2)) / 2;
const octagonPts = [[3 + octCut, 3], [21 - octCut, 3], [21, 3 + octCut], [21, 21 - octCut], [21 - octCut, 21], [3 + octCut, 21], [3, 21 - octCut], [3, 3 + octCut]];
// play в круге: равносторонний треугольник со стороной 9, центр тяжести в (12; 12)
const play9 = (9 * R3) / 2, circlePlayTri = [[12 - play9 / 3, 7.5], [12 + (2 * play9) / 3, 12], [12 - play9 / 3, 16.5]];
// двойная галочка: вторая сдвинута на 8,5; её короткое плечо — до просвета 2 от длинного плеча первой
const checkStub = (8.5 - 4 * S2) / 2;
// розетка «проверено»: 8 выпуклых лепестков r 4 между впадинами на r 8,5 (углы 22,5° + 45°·k)
function rosettePath(rho = 8.5, rl = 4) {
  const cusps = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => pt([12, 12], rho, 22.5 + 45 * k));
  return chainPath(cusps.map((P, k) => {
    const Q = cusps[(k + 1) % 8], mid = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], half = Math.hypot(Q[0] - P[0], Q[1] - P[1]) / 2;
    const off = Math.sqrt(rl * rl - half * half), m = Math.hypot(mid[0] - 12, mid[1] - 12), C = [mid[0] - ((mid[0] - 12) / m) * off, mid[1] - ((mid[1] - 12) / m) * off];
    return arc(C, rl, angOf(C, P), sweepTo(angOf(C, P), angOf(C, Q)));
  }), true);
}
const squareBox = S(rect(3, 3, 18, 18, 2));

// ===== четырнадцатая партия: инструменты и люди =====
// пользователь в кольце: голова — сплошной диск r 3 в (12; 9,5), плечи — дуга r 6 вокруг (12; 22,5), концы — на осевой
// кольца
function circleUserParts() {
  const C = [12, 22.5], [a, b] = circlesMeet([12, 12], 10, C, 6).sort((p, q) => p[0] - q[0]);
  return [ring, { disk: [[12, 9.5], 3] }, S(path([arc(C, 6, angOf(C, a), angOf(C, b) - angOf(C, a))]))];
}
// гаечный ключ в осях «вдоль — поперёк»: головка r 5,5 с зевом шириной 4 вглубь до s = 1, рукоять шириной 4 до s = −14
// с круглым концом (торец r 2); ключ стоит по центру поля
function wrenchParts() {
  const O = onAxis([12, 12], 5.25), P = (s, t) => onAxis(O, s, t), A = (c, r, a0, sw) => arc(P(...c), r, a0 - 45, sw);
  const jx = Math.sqrt(5.5 * 5.5 - 4), ja = Math.asin(2 / 5.5) / D2R;
  return [S(chainPath([L(P(1, -2), P(1, 2)), L(P(1, 2), P(jx, 2)), A([0, 0], 5.5, ja, 180 - 2 * ja), L(P(-jx, 2), P(-14, 2)), { ...A([-14, 0], 2, 90, 180), kind: 'cap' },
    L(P(-14, -2), P(-jx, -2)), A([0, 0], 5.5, 180 + ja, 180 - 2 * ja), L(P(jx, -2), P(1, -2))], true))];
}
// жук: тело 6..18 × 7..15 (скругления r 3, прямой верх 9..15) с полукруглым низом r 6, средняя линия, головка r 2,5 на прямой
// верха, усики от 240° и 300° (между усиком и телом — карман у основания, как у стыков стрелок), по три ножки
function bugParts() {
  const body = chainPath([...polyline([[6, 15], [6, 7], [18, 7], [18, 15]], { r: [0, 3, 3, 0] }).edges, arc([12, 15], 6, 0, 180)], true);
  const low = pt([12, 15], 6, 135), a1 = pt([12, 7], 2.5, 240), a2 = pt([12, 7], 4.5, 240);
  const legs = [[[6, 11], [2, 9]], [[6, 15], [2, 15]], [low, [4.5, 22]]];
  return [S(body), S(line([12, 11], [12, 21])), S(path([arc([12, 7], 2.5, 180, 180)])), S(line(a1, a2)), S(line(mirrorX(a1), mirrorX(a2))),
    ...legs.map(([a, b]) => S(line(a, b))), ...legs.map(([a, b]) => S(line(mirrorX(a), mirrorX(b))))];
}
// награда: кольцо r 6 вокруг (12; 8,5), лента от кольца (125° и 55°) к хвостам (7; 21) и (17; 21) с вырезом до 19
const awardParts = [S(circle([12, 8.5], 6)), S(polyline([pt([12, 8.5], 6, 125), [7, 21], [12, 19], [17, 21], pt([12, 8.5], 6, 55)], { r: [0, 1.25, 0, 1.25, 0] }))];
// отпечаток пальца: гребни r 2, 6 и 10 вокруг (12; 12) — арки со спусками вниз от горизонтали через центр (между гребнями 4),
// внешний разорван справа
const fingerprintParts = [S(chainPath([L([2, 16], [2, 12]), arc([12, 12], 10, 180, 140)])), S(path([arc([12, 12], 10, 345, 30)])),
  S(chainPath([L([6, 16], [6, 12]), arc([12, 12], 6, 180, 180)])), S(chainPath([L([10, 18], [10, 12]), arc([12, 12], 2, 180, 180), L([14, 12], [14, 21])]))];
// перо (векторный инструмент): наконечник остриём в (2,5; 2,5), симметричен по диагонали; прорезь до отверстия r 2 в (11; 11);
// держатель — брусок 2,5 × 8 поперёк диагонали за спинкой наконечника (просвет 2)
const penGrip = (d, v) => onAxis([0, 0], v, d), penD = 31.5 / S2 + 4;
const penToolParts = [S(polyline([[2.5, 2.5], [16, 6], [18.5, 13], [13, 18.5], [6, 16]], { closed: true, r: [0, 1.25, 1.25, 1.25, 1.25] })), S(line([2.5, 2.5], [11 - S2, 11 - S2])), S(circle([11, 11], 2)),
  S(polyline([penGrip(penD, -4), penGrip(penD + 2.5, -4), penGrip(penD + 2.5, 4), penGrip(penD, 4)], { closed: true, r: 1.25 }))];
// кофе: чашка 5..17 — край на 3,5, стенки до 10,5, дно — полуокружность r 6; ручка — полуокружность r 2,5 с концами
// на стенке; блюдце — черта 3,5..20,5 на 20,5 (до дна просвет 2)
const coffeeParts = [S(chainPath([L([5, 3.5], [17, 3.5]), L([17, 3.5], [17, 10.5]), arc([11, 10.5], 6, 0, 180), L([5, 10.5], [5, 3.5])], true)),
  S(path([arc([17, 7.5], 2.5, 270, 180)])), S(line([3.5, 20.5], [20.5, 20.5]))];
// диафрагма: пять лепестков — стороны пятиугольника (описанный r 5) продолжены до кольца
function apertureParts() {
  const hv = [0, 1, 2, 3, 4].map((k) => pt([12, 12], 5, -90 + 72 * k));
  return [ring, ...hv.map((v, k) => {
    const w = hv[(k + 1) % 5], u = vmul(vsub(w, v), 1 / Math.hypot(...vsub(w, v))), b = (v[0] - 12) * u[0] + (v[1] - 12) * u[1], c = (v[0] - 12) ** 2 + (v[1] - 12) ** 2 - 100;
    return S(line(v, vadd(v, vmul(u, -b + Math.sqrt(b * b - c)))));
  })];
}
// ⌘: четыре прямые и четыре петли r 3 на 270° отдельными деталями (одним путём он пересекает сам себя); середина —
// квадрат 8..16, петли снаружи, как у знака клавиши Mac
const commandParts = [S(line([8, 5], [8, 19])), S(line([16, 5], [16, 19])), S(line([5, 8], [19, 8])), S(line([5, 16], [19, 16])),
  S(path([arc([5, 5], 3, 0, -270)])), S(path([arc([19, 5], 3, 90, -270)])), S(path([arc([19, 19], 3, 180, -270)])), S(path([arc([5, 19], 3, 270, -270)]))];

// ===== пятнадцатая партия: места и транспорт =====
// метка: голова r 7,5 вокруг (12; 9,5), касательные к острию (12; 22) со скруглением r 1,5, внутри — сплошной диск r 2,5
function mapPinParts() {
  const C = [12, 9.5], a = Math.acos(7.5 / 12.5) / D2R, P1 = pt(C, 7.5, 90 - a), P2 = pt(C, 7.5, 90 + a);
  return [S(chainPath([arc(C, 7.5, 90 + a, 360 - 2 * a), ...polyline([P1, [12, 22], P2], { r: [0, 1.5, 0] }).edges], true)), { disk: [C, 2.5] }];
}
// шапочка: доска-ромб 2..22 × 5..15, боковые углы острые — с правого свисает кисть до 16; околыш — от нижних кромок доски
// на x = 6 и 18 вниз до 16, низ — коробовая кривая по эллипсу 6 × 3: малые дуги r 1,5 у боков, большая r 9 вокруг (12; 10), дно на 19
function gradCapParts() {
  const Cb = [12, 10], Cl = [7.5, 16], Cr = [16.5, 16], al = angOf(Cb, Cl), ar = angOf(Cb, Cr);
  return [S(polyline([[2, 10], [12, 5], [22, 10], [12, 15]], { closed: true, r: [0, 1.25, 0, 1.25] })), S(line([22, 10], [22, 16])),
    S(chainPath([L([6, 12], [6, 16]), arc(Cl, 1.5, 180, al - 180), arc(Cb, 9, al, ar - al), arc(Cr, 1.5, ar, -ar), L([18, 16], [18, 12])]))];
}
// карта: четыре панели шириной 4 зигзагом 4..20 (размах 2), наружные углы r 1,25, изломы r 1,5; сгибы x = 8, 12, 16 —
// от края до края
const mapParts = [S(polyline([[4, 5], [8, 3], [12, 5], [16, 3], [20, 5], [20, 19], [16, 21], [12, 19], [8, 21], [4, 19]], { closed: true, r: [1.25, 1.5, 1.5, 1.5, 1.25, 1.25, 1.5, 1.5, 1.5, 1.25] })),
  ...[8, 12, 16].map((x) => S(line([x, x === 12 ? 5 : 3], [x, x === 12 ? 19 : 21])))];
// портфель: корпус 2..22 × 7..21, ручка 8..16 до 3, пояс на 13
const briefcaseParts = [S(rect(2, 7, 20, 14, 2)), S(polyline([[8, 7], [8, 3], [16, 3], [16, 7]], { r: [0, 2, 2, 0] })), S(line([2, 13], [22, 13]))];
// здание: башня 5..19 × 2..22 (r 2,5), окна — два столбца точек на 9 и 15, дверь 10..14 до 18 — на полу
const buildingParts = [S(rect(5, 2, 14, 20, 2.5)), S(polyline([[10, 22], [10, 18], [14, 18], [14, 22]], { r: [0, 1.25, 1.25, 0] })),
  ...[6, 10, 14].flatMap((y) => [9, 15].map((x) => ({ dot: [x, y] })))];
// машина — в системе фургона: колёса-кольца r 2 на 17 (x = 7 и 17), низ кузова кончается на колёсах; багажник и капот —
// по 3 клетки на 11 со скруглением r 2, кабина — трапеция до 5
const carParts = [S(polyline([[5, 17], [2, 17], [2, 11], [5, 11], [7.5, 5], [15.5, 5], [19, 11], [22, 11], [22, 17], [19, 17]], { r: [0, 1.25, 2, 0, 1.25, 1.25, 0, 2, 1.25, 0] })),
  S(line([9, 17], [15, 17])), S(circle([7, 17], 2)), S(circle([17, 17], 2))];
// компас: стрелка вдоль меридиана — северная половина сплошная, южная контуром; засечки востока и запада от обода
// внутрь до 7,5
const compassParts = [ring, S(line([19.5, 12], [22, 12])), S(line([2, 12], [4.5, 12])), { solid: polyline([[12, 6], [14.5, 12], [9.5, 12]], { closed: true }) }, S(polyline([[9.5, 12], [14.5, 12], [12, 18]], { closed: true }))];
// самолёт носом вверх, симметричен: фюзеляж 10..14 с носом r 2, стреловидные крылья до 3 и 21, хвост с вырезом до 20
function planeParts() {
  const right = [[14, 8], [21, 12], [21, 15], [14, 13], [14, 17], [16, 19], [16, 22], [12, 20]], left = right.slice(0, -1).reverse().map(mirrorX);
  return [S(chainPath([L([10, 8], [10, 4]), capArc([12, 4], 2, 180, 180), L([14, 4], [14, 8]), ...polyline([...right, ...left]).edges], true))];
}
// автобус — в системе фургона: кузов 2..22 × 4..18 со скошенным передом, окна — полоса до 11 со стойками 8 и 15, колёса на 18
const busParts = [S(polyline([[5, 18], [2, 18], [2, 4], [18, 4], [22, 10], [22, 18], [19, 18]], { r: [0, 1.25, 2, 1.25, 1.25, 1.25, 0] })), S(line([9, 18], [15, 18])),
  S(line([2, 11], [22, 11])), S(line([8, 4], [8, 11])), S(line([15, 4], [15, 11])), S(circle([7, 18], 2)), S(circle([17, 18], 2))];

// ===== шестнадцатая партия: по заявкам владельца =====
// мышь: корпус-стадион 5..19 × 2..22 (r 7); колесо — паз от верха: ножки x = 10 и 14 от осевой корпуса вниз до 6, низ —
// полукруг r 2 (торец); от колеса стойка к перегородке кнопок на 12 — до плеч колеса просвет 2, сверху паз слит с корпусом,
// щелей нет. Нажатая кнопка — заливка её области (у левой и правой — с вырезом под колесо), нажатое колесо — заливка паза
function mouseParts(state) {
  const C = [12, 9], R = 7, yj = C[1] - Math.sqrt(R * R - 4), aL = angOf(C, [10, yj]) + 360, aR = angOf(C, [14, yj]) + 360;
  const body = chainPath([arc(C, R, 180, 180), L([19, 9], [19, 15]), arc([12, 15], R, 0, 180), L([5, 15], [5, 9])], true);
  const parts = [S(body), S(chainPath([L([10, yj], [10, 6]), capArc([12, 6], 2, 180, -180), L([14, 6], [14, yj])])), S(line([12, 8], [12, 12])), S(line([5, 12], [19, 12]))];
  if (state === 'left') parts.push({ fill: chainPath([L([12, 12], [5, 12]), L([5, 12], [5, 9]), arc(C, R, 180, aL - 180), L([10, yj], [10, 6]), capArc([12, 6], 2, 180, -90), L([12, 8], [12, 12])], true) });
  if (state === 'right') parts.push({ fill: chainPath([L([12, 12], [19, 12]), L([19, 12], [19, 9]), arc(C, R, 360, aR - 360), L([14, yj], [14, 6]), capArc([12, 6], 2, 0, 90), L([12, 8], [12, 12])], true) });
  if (state === 'middle') parts.push({ fill: chainPath([arc(C, R, aL, aR - aL), L([14, yj], [14, 6]), capArc([12, 6], 2, 0, 180), L([10, 6], [10, yj])], true) });
  return parts;
}
// парусник: парус-треугольник 4..20 × 2..13, мачта делит его пополам и доходит до палубы (просвет от паруса до палубы 2);
// корпус — трапеция 2..22 × 17..21; симметричен
const sailboatParts = [S(polyline([[2, 17], [22, 17], [19, 21], [5, 21]], { closed: true, r: [0, 0, 1.25, 1.25] })),
  S(polyline([[12, 2], [20, 13], [4, 13]], { closed: true, r: [0, 1.5, 1.5] })), S(line([12, 2], [12, 17]))];
// теплоход: корпус-трапеция 2..22 × 14..19, надстройка 6..16 до 10, труба 9..12 до 5
const shipParts = [S(polyline([[2, 14], [22, 14], [19, 19], [5, 19]], { closed: true, r: [0, 0, 1.25, 1.25] })),
  S(polyline([[6, 14], [6, 10], [16, 10], [16, 14]], { r: [0, 1.25, 1.25, 0] })), S(polyline([[9, 10], [9, 5], [12, 5], [12, 10]], { r: [0, 1.25, 1.25, 0] }))];
// подлодка: корпус-стадион 2..18 × 11..19 (r 4), рубка 8..13 до 7, перископ с загибом до 3, иллюминаторы-точки через 4
// (до корпуса просвет 2), винт — стойка до x = 22 и лопасть 12..18 (до корпуса просвет 2)
const submarineParts = [S(chainPath([arc([6, 15], 4, 90, 180), L([6, 11], [14, 11]), arc([14, 15], 4, 270, 180), L([14, 19], [6, 19])], true)),
  S(polyline([[8, 11], [8, 7], [13, 7], [13, 11]], { r: [0, 1.25, 1.25, 0] })), S(polyline([[11, 7], [11, 3], [14, 3]], { r: [0, 1.25, 0] })),
  ...[6, 10, 14].map((x) => ({ dot: [x, 15] })), S(line([18, 15], [22, 15])), S(line([22, 12], [22, 18]))];
// валюты — в мерах dollar-sign: буква 5..19, полукруги r 3,5–4, черты — горизонтали на целых, между чертами просвет 2
// евро: «C» r 7 вокруг (13; 12) с концами под ±45°, две черты 4..12 на 10 и 14
const euroParts = [S(path([arc([13, 12], 7, -45, -270)])), S(line([4, 10], [12, 10])), S(line([4, 14], [12, 14]))];
// фунт: крюк — полукруг r 4 вокруг (14; 9), стойка x = 10 до основания 6..18 на 19, поперечина 6..15 на 13
const poundParts = [S(chainPath([arc([14, 9], 4, 0, -180), L([10, 9], [10, 19])])), S(line([6, 19], [18, 19])), S(line([6, 13], [15, 13]))];
// иена (и юань): «V» из (6; 5) и (18; 5) в (12; 9), стойка до 19, черты 7..17 на 13 и 17; симметрична
const yenParts = [S(polyline([[6, 5], [12, 9], [18, 5]])), S(line([12, 9], [12, 19])), S(line([7, 13], [17, 13])), S(line([7, 17], [17, 17]))];
// рубль: «Р» — стойка x = 9 от 19 до 5, чаша r 3,5 до 12 кончается на стойке; черта 6..14 на 16
const rubleParts = [S(chainPath([L([9, 19], [9, 5]), L([9, 5], [13.5, 5]), arc([13.5, 8.5], 3.5, 270, 180), L([13.5, 12], [9, 12])])), S(line([6, 16], [14, 16]))];
// рупия: черты 6..18 на 3 и 8; чаша — полукруг r 4,5 вокруг (10,5; 7,5) от верхней черты до 12, влево до 6 и нога
// под 45° до (15; 21)
const rupeeParts = [S(line([6, 3], [18, 3])), S(line([6, 8], [18, 8])), S(chainPath([arc([10.5, 7.5], 4.5, 270, 180), L([10.5, 12], [6, 12]), L([6, 12], [15, 21])]))];

// ===== семнадцатая партия: текст и раскладка =====
// ползунки: дорожки 3..21 на 6, 12 и 18, бегунок — планка поперёк высотой 4; левый кусок дорожки
// кончается в 2 от планки, правый выходит из неё. Бегунки на x = 15, 9 и 13: обрезки не короче 2, планки соседних
// дорожек не сходятся. Кольца-бегунки не встали: с просветом 2 от дорожек оставались огрызки
const slidersParts = [[6, 15], [12, 9], [18, 13]].flatMap(([y, x]) => [S(line([3, y], [x - 4, y])), S(line([x, y - 2], [x, y + 2])), S(line([x, y], [21, y]))]);
// галочка чек-листа — тонкой линией в колонке знаков 2,25..6,75 (до строки просвет 1,5), плечи под 45°, по центру строки
const listTick = (y) => T(polyline([[2.25, y], [3.75, y + 1.5], [6.75, y - 1.5]]));
// кавычки «99»: диск r 3 и хвост — дуга r 6 на 70° вокруг O = C − (4; 0): наружная кромка хвоста (r 7) касается диска
// в его правой точке и продолжает его окружность без плеча; вторая кавычка — через 9, пара отцентрована по обеим осям
const quoteMark = (cx, cy) => [{ disk: [[cx, cy], 3] }, S(path([arc([cx - 4, cy], 6, 0, 70)]))];
const quoteY = 12 - (6 * Math.sin(70 * D2R) - 2) / 2; // середина между верхом диска и низом торца хвоста — на 12
// буквы — высотой 4..20, как A у font-size. B: стойка x = 6, верхняя чаша r 4 до 17, нижняя r 4 до 18 (шире верхней);
// нижняя чаша кончается на осевых верхней
const boldParts = [S(chainPath([L([6, 12], [6, 4]), L([6, 4], [13, 4]), arc([13, 8], 4, 270, 180), L([13, 12], [6, 12])], true)),
  S(chainPath([L([13, 12], [14, 12]), arc([14, 16], 4, 270, 180), L([14, 20], [6, 20]), L([6, 20], [6, 12])]))];
// S — как у dollar-sign, в высоте 4..20 (чаши r 4, хвосты загнуты на 60°), но без середины: верх кончается на левом краю
// верхней чаши (5,5; 8), низ начинается на правом краю нижней (18,5; 16) — до черты зачёркивания с обеих сторон просвет 2.
// Прежде черта шла по средней перекладине S и сливалась с ней — зачёркивания не было видно
const sTop = chainPath([arc([14.5, 8], 4, -30, -60), L([14.5, 4], [9.5, 4]), arc([9.5, 8], 4, 270, -90)]);
const sBottom = chainPath([arc([14.5, 16], 4, 0, 90), L([14.5, 20], [9.5, 20]), arc([9.5, 16], 4, 90, 60)]);

// ===== восемнадцатая партия: погода и природа =====
// окружность, касательная в точке P (n — единичная нормаль в сторону центра) и проходящая через Q: [центр, радиус]
const tangentCircle = (P, n, Q) => { const d = vsub(Q, P), t = (d[0] ** 2 + d[1] ** 2) / (2 * (d[0] * n[0] + d[1] * n[1])); return [vadd(P, vmul(n, t)), Math.abs(t)]; };
// облако — три круга: левый r 4 (6; 15), большой r 5,5 (11; 10,5), правый r 5 (17; 14); низ y = 19 касается левого
// и правого. Круги сходятся уголками (как шапки chef-hat); поле 2..22 × 5..19. Облако с осадками — выше на 3 и без низа:
// левый круг от 135°, правый до 45°
function cloudPath(dy = 0, open = false) {
  const Lc = [6, 15 + dy], Bc = [11, 10.5 + dy], Rc = [17, 14 + dy], J1 = circlesMeet(Lc, 4, Bc, 5.5)[0], J2 = circlesMeet(Bc, 5.5, Rc, 5)[0];
  const a0 = open ? 135 : 90, a1 = open ? 45 : 90, b1 = angOf(Bc, J1), c2 = angOf(Rc, J2);
  const edges = [arc(Lc, 4, a0, sweepTo(a0, angOf(Lc, J1))), arc(Bc, 5.5, b1, sweepTo(b1, angOf(Bc, J2))), arc(Rc, 5, c2, sweepTo(c2, a1))];
  return open ? chainPath(edges) : chainPath([...edges, L([17, 19 + dy], [6, 19 + dy])], true);
}
// капля: круг r 6,5 вокруг (12; 14,5) и касательные к острию (12; 1,5) — до центра 13 = 2r, бока ровно под 60°;
// на острие скругление r 1,5 (его верх — на 3, поле 2..22)
function dropletPath() {
  const C = [12, 14.5], Q1 = pt(C, 6.5, 330), Q2 = pt(C, 6.5, 210);
  return chainPath([arc(C, 6.5, 330, 240), ...polyline([Q2, [12, 1.5], Q1], { r: [0, 1.5, 0] }).edges], true);
}
// пламя: тело — круг r 6 вокруг (12; 15,5); внешние бока — дуги, касательные к телу в крайних точках, до острия языка
// (12; 2,5) и второго язычка (16,5; 8); между ними выемка: внутренний край языка — дуга, уходящая от острия на 10° левее
// вертикали и касающаяся изнутри дна (круг r 2 вокруг (14; 11,5)); от дна к язычку — прямая, касательная к нему.
// Язык загибается к выемке, как у живого огня; остриё языка — 40°, язычка — 30°
function flamePath() {
  const Cb = [12, 15.5], T = [12, 2.5], K = [16.5, 8], Nn = [14, 11.5], rn = 2;
  const [Ql, rl] = tangentCircle([6, 15.5], [1, 0], T), [Qr, rr] = tangentCircle([18, 15.5], [-1, 0], K);
  const n1 = [Math.cos(10 * D2R), Math.sin(10 * D2R)], v = vsub(Nn, T); // нормаль к ходу от острия вниз — на восток
  const R1 = (v[0] ** 2 + v[1] ** 2 - rn * rn) / (2 * (v[0] * n1[0] + v[1] * n1[1] - rn)), Q1 = vadd(T, vmul(n1, R1)), J1 = vadd(Q1, vmul(vnorm(vsub(Nn, Q1)), R1));
  const w = vsub(Nn, K), dd = Math.hypot(w[0], w[1]), al = Math.asin(rn / dd) / D2R;
  const J3 = [1, -1].map((sg) => pt(K, Math.sqrt(dd * dd - rn * rn), angOf(K, Nn) + sg * al)).sort((p, q) => q[0] - p[0])[0]; // восточная касательная
  const t1 = angOf(Q1, T), b1 = angOf(Nn, J1), sweepN = -sweepTo(angOf(Nn, J3), b1);
  return chainPath([arc(Q1, R1, t1, -sweepTo(angOf(Q1, J1), t1)), { ...arc(Nn, rn, b1, sweepN), kind: 'join' }, L(J3, K),
    arc(Qr, rr, angOf(Qr, K), sweepTo(angOf(Qr, K), 0)), arc(Cb, 6, 0, 180), arc(Ql, rl, 180, sweepTo(180, angOf(Ql, T)))], true);
}
// снежинка: шесть лучей r 7 из центра, на конце каждого — развилка из двух веток по 3,2 под ±30°
const snowflakeParts = [...[90, 30, 150].map((a) => S(line(pt([12, 12], 7, a), pt([12, 12], 7, a + 180)))),
  ...[30, 90, 150, 210, 270, 330].map((a) => { const V = pt([12, 12], 7, a); return S(polyline([pt(V, 3.2, a - 30), V, pt(V, 3.2, a + 30)])); })];
// термометр: трубка x 7..11 с торцом r 2 наверху, колба r 4,5 вокруг (9; 17,5) — низ на 22; шкала — риски 15,5..19,5
// на 3, 7, 11 (до трубки просвет 2,5, до колбы — больше 2); вместе поле 3,5..20,5 — по центру
const thermoY = 17.5 - Math.sqrt(4.5 ** 2 - 4), thermoA = angOf([9, 17.5], [11, thermoY]);
const thermometerParts = [S(chainPath([L([7, thermoY], [7, 4]), capArc([9, 4], 2, 180, 180), L([11, 4], [11, thermoY]), arc([9, 17.5], 4.5, thermoA, 360 - 2 * (thermoA + 90))], true)),
  ...[3, 7, 11].map((y) => S(line([15.5, y], [19.5, y])))];
// ветер: струи на 8, 12, 16 от x = 2, завитки r 3 на 240° (конец завитка до своей струи — 4,5); верхний завиток левее
// среднего на 10 — между ними просвет больше 2
const windParts = [S(chainPath([L([2, 8], [9, 8]), arc([9, 5], 3, 90, -240)])), S(chainPath([L([2, 12], [19, 12]), arc([19, 9], 3, 90, -240)])),
  S(chainPath([L([2, 16], [14, 16]), arc([14, 19], 3, 270, 240)]))];
// дерево: крона — круги r 4,5 (12; 6,5) и r 4 (7,5; 12), (16,5; 12), низ y = 16; ствол 16..22. Крона 3,5..20,5 — как у ели
function treeParts() {
  const T0 = [12, 6.5], Lc = [7.5, 12], Rc = [16.5, 12], pL = circlesMeet(Lc, 4, T0, 4.5)[0], pR = circlesMeet(T0, 4.5, Rc, 4)[0];
  const aL = angOf(Lc, pL), bL = angOf(T0, pL), aR = angOf(Rc, pR);
  return [S(chainPath([arc(Lc, 4, 90, sweepTo(90, aL)), arc(T0, 4.5, bL, sweepTo(bL, angOf(T0, pR))), arc(Rc, 4, aR, sweepTo(aR, 90)), L([16.5, 16], [7.5, 16])], true)),
    S(line([12, 16], [12, 22]))];
}
// ель: два яруса с параллельными скатами 7 : 6 (вершина 12; 2, ярусы по 9 и 16), нижние углы r 1,25; ствол 16..22
const treePineParts = [S(polyline([[12, 2], [18, 9], [14.5, 9], [20.5, 16], [3.5, 16], [9.5, 9], [6, 9]], { closed: true, r: [0, 0, 0, 1.25, 1.25, 0, 0] })),
  S(line([12, 16], [12, 22]))];
// лист: линза между (7,5; 16,5) и (20,5; 3,5) из двух дуг по 110° (концы — в 10° за осями: при 100° внутренний уголок
// острия ложился в 0,09 от узла на оси); черенок с жилкой — прямая (3,5; 20,5)–(14,5; 9,5)
function leafParts() {
  const A = [7.5, 16.5], B = [20.5, 3.5], M = lerp(A, B, 0.5), R = Math.hypot(13, 13) / 2 / Math.sin(55 * D2R), h = R * Math.cos(55 * D2R);
  const C1 = vadd(M, vmul(DN, h)), C2 = vsub(M, vmul(DN, h));
  return [S(chainPath([arc(C1, R, 170, 110), arc(C2, R, -10, 110)], true)), S(line([3.5, 20.5], [14.5, 9.5]))];
}
// зонт: купол — полукруг r 10 вокруг (12; 12,5), край — четыре фестона шириной 5 и высотой 1,5 (дуги r 17/6); ручка — от
// среднего уголка края вниз до 19,5 и крюк r 2
function umbrellaParts() {
  const y = 12.5, r = (2.5 ** 2 + 1.5 ** 2) / 3, a = Math.asin(2.5 / r) / D2R;
  return [S(chainPath([arc([12, y], 10, 180, 180), ...[19.5, 14.5, 9.5, 4.5].map((x) => arc([x, y + r - 1.5], r, -90 + a, -2 * a))], true)),
    S(chainPath([L([12, y], [12, 19.5]), capArc([14, 19.5], 2, 180, -180)]))];
}
// восход и закат: горизонт 2..22 на 20, солнце — полукруг r 4 на горизонте, лучи r 8..10 под 45° (как у sun); стрелка
// шириной 8, древко кончается за 1 до острия, до солнца просвет 2
const sunHorizon = [S(line([2, 20], [22, 20])), S(path([arc([12, 20], 4, 180, 180)])), ...[225, 315].map((d) => S(line(pt([12, 20], 8, d), pt([12, 20], 10, d))))];
// след лапы: пальцы — сплошные капсулы, наклонённые наружу: внутренние r 2,1 на (9,3; 6) и (14,7; 6) под 15°, внешние
// r 1,9 на (4,6; 11) и (19,4; 11) под 45°; подушка — сплошной скруглённый треугольник 5..19 × 11..20 (скругления 4 и 2,5)
const pawToe = (c, tilt, h, r, side) => { const v = [side * Math.sin(tilt * D2R) * h, -Math.cos(tilt * D2R) * h]; return { capsule: [vadd(c, v), vsub(c, v), r] }; };
const pawParts = [pawToe([9.3, 6], 15, 0.9, 2.1, -1), pawToe([14.7, 6], 15, 0.9, 2.1, 1), pawToe([4.6, 11], 45, 0.7, 1.9, -1), pawToe([19.4, 11], 45, 0.7, 1.9, 1),
  { solid: polyline([[12, 11], [19, 20], [5, 20]], { closed: true, r: [4, 2.5, 2.5] }) }];

// ===== девятнадцатая партия: устройства =====
// wi-fi: концентрические дуги r 6, 10, 14 вокруг (12; 18,75) на ±45° (шаг 4, просвет 2) и точка r 1,5 — поле 3,75..20,25;
// выключенный — как mic-off: косая (4; 4)–(20; 20), просвет 2 по обе стороны, до точки 2,3
const wifiC = [12, 18.75], wifiArcs = [6, 10, 14].map((r) => S(path([arc(wifiC, r, 225, 90)])));
// ноутбук: экран 4..20 × 3..15 (r 2), дека — сплошная трапеция 5..19 сверху, 3..21 снизу, 19..21
const laptopParts = [S(rect(4, 3, 16, 12, 2)), { solid: polyline([[5, 19], [19, 19], [21, 21], [3, 21]], { closed: true }) }];
// процессор: корпус 5..19 (r 2), кристалл — сплошной квадрат 10..14 (r 1), по три ножки на сторону — на 8, 12, 16, от края поля
// до осевой корпуса
const cpuParts = [S(rect(5, 5, 14, 14, 2)), { solid: rect(10, 10, 4, 4, 1) },
  ...[8, 12, 16].flatMap((v) => [S(line([v, 2], [v, 5])), S(line([v, 19], [v, 22])), S(line([2, v], [5, v])), S(line([19, v], [22, v]))])];
// клавиатура: рамка 2..22 × 5..19; ряд клавиш-точек на 10 и ряд на 14 — точки по краям, пробел посередине; ряды отстоят
// от рамки поровну
const keyboardParts = [S(rect(2, 5, 20, 14, 2)), ...[6, 10, 14, 18].map((x) => ({ dot: [x, 10] })), { dot: [6, 14] }, S(line([10, 14], [14, 14])), { dot: [18, 14] }];
// жёсткий диск: плоский корпус 2..22 × 7..17, щель 6..12 и огонёк на одной высоте
const hardDriveParts = [S(rect(2, 7, 20, 10, 2)), S(line([6, 12], [12, 12])), { dot: [17, 12] }];
// часы: циферблат r 7, ремешки — полосы шириной 7 до 2 и 22 (верхние углы r 1,5), стрелки на 12 и на 4 часа
function watchParts() {
  const yJ = 12 - Math.sqrt(49 - 3.5 * 3.5);
  const strap = (s) => S(polyline([[8.5, 12 + s * (12 - yJ)], [8.5, 12 + s * 10], [15.5, 12 + s * 10], [15.5, 12 + s * (12 - yJ)]], { r: [0, 1.5, 1.5, 0] }));
  return [S(circle([12, 12], 7)), strap(-1), strap(1), S(polyline([[12, 9], [12, 12], pt([12, 12], 2.5, 30)]))];
}
// батарея: корпус 3..19 × 7..17 (r 2), клемма — сплошная 19..21 × 10..14; уровни — капсулы 2 × 4 на x = 7, 11, 15
// (до корпуса и между собой просвет 2); зарядка — молния, центрально-симметричная вокруг (11; 12), корпус вырезан вокруг
// неё с просветом 2
const batteryBody = [S(rect(3, 7, 16, 10, 2)), { solid: rect(19, 10, 2, 4) }];
const batteryParts = (n) => [...batteryBody, ...[7, 11, 15].slice(0, n).map((x) => ({ capsule: [[x, 11], [x, 13], 1] }))];
function batteryChargingParts() {
  const bolt = [[13, 4], [9, 12], [13, 12], [9, 20]];
  const region = (q) => Math.min(...[0, 1, 2].map((i) => capsuleRegion(bolt[i], bolt[i + 1], 4)(q)));
  return [...cutPathRegion(rect(3, 7, 16, 10, 2), region).filter((q) => pathLen(q) >= 2).map(S), { solid: rect(19, 10, 2, 4) }, S(polyline(bolt))];
}
// bluetooth: руна высотой 4..20 — стойка x = 12, острия на x = 16, хвосты на x = 8, скаты под 45°; из трёх деталей без
// самопересечений (стойка с остриями и две диагонали)
const bluetoothParts = [S(polyline([[16, 16], [12, 20], [12, 4], [16, 8]])), S(line([8, 8], [16, 16])), S(line([16, 8], [8, 16]))];
// трансляция: экран 3..21 × 4..20 без левого нижнего угла, волны — дуги r 5 и 9 вокруг (3; 20) и точка r 1,5 (как у rss)
const castParts = [S(polyline([[3, 7], [3, 4], [21, 4], [21, 20], [16, 20]], { r: [0, 2, 2, 2, 0] })), S(path([arc([3, 20], 5, 270, 90)])), S(path([arc([3, 20], 9, 270, 90)])), { disk: [[3, 20], 1.5] }];
// планшет 3..21 и смартфон 7..17 во весь рост (r 2,5); внизу — полоска «домой» (до краёв просвет 2); смартфон узкий,
// как нынешние телефоны (1 : 2)
const tabletParts = [S(rect(3, 2, 18, 20, 2.5)), S(line([10, 18], [14, 18]))];
const smartphoneParts = [S(rect(7, 2, 10, 20, 2.5)), S(line([11, 18], [13, 18]))];
// колонка: корпус 5..19 × 2..22 (r 2,5), НЧ-динамик — кольцо r 3 вокруг (12; 15), ВЧ — диск r 1,5 в (12; 6,5)
const speakerParts = [S(rect(5, 2, 14, 20, 2.5)), S(circle([12, 15], 3)), { disk: [[12, 6.5], 1.5] }];

// ===== двадцатая партия: люди и общение (второй заход, analysis/GENERAL2.md) =====
const P20 = {};
// пользователь с шестерёнкой: человек как у user-plus, чуть выше (голова r 3,5 в (9; 6,5), плечи r 7), шестерёнка —
// кольцо r 2 и шесть зубцов до r 4 вокруг (18; 17); человек вырезан вокруг неё с просветом 2
{
  const G = [18, 17], teeth = [0, 60, 120, 180, 240, 300].map((a) => S(line(pt(G, 2, a), pt(G, 4, a))));
  const person = [S(circle([9, 6.5], 3.5)), S(path([arc([9, 21], 7, 180, 180)]))];
  P20.userCog = [...person.flatMap((p) => cutPath(p.stroke, G, 8).map((q) => S(trimTails(q)))), S(circle(G, 2)), ...teeth];
}
// колокольчик со звоном: bell и волны — дуги r 9,5 вокруг (12; 9) на 30° по бокам купола
P20.bellRing = [...bellParts, S(path([arc([12, 9], 9.5, 195, 30)])), S(path([arc([12, 9], 9.5, 315, 30)]))];
// звонок: трубка как phone, волны — дуги r 4 и 8 вокруг (13; 11) от верха до права (как у rss)
P20.phoneCall = [...phoneParts(), S(path([arc([13, 11], 4, 270, 90)])), S(path([arc([13, 11], 8, 270, 90)]))];
// ладонь: крайние пальцы — стороны «U» (дно — полукруг r 6 вокруг (14; 14,5)), средние — прямые x = 12 и 16 разной
// длины, большой палец — от края ладони под 45°
P20.hand = [S(chainPath([L([8, 5.5], [8, 14.5]), arc([14, 14.5], 6, 180, -180), L([20, 14.5], [20, 7.5])])), S(line([12, 3.5], [12, 12.5])), S(line([16, 4], [16, 12.5])),
  S(line([8, 14.5], [4, 10.5]))];
// доступность: человек с раскинутыми руками — голова r 2 в (12; 4), руки 4..20 на 9, тело до 15, ноги до (8; 21) и (16; 21)
P20.accessibility = [{ disk: [[12, 4], 2] }, S(line([4, 9], [20, 9])), S(polyline([[8, 21], [12, 15], [16, 21]])), S(line([12, 9], [12, 15]))];
// газета: лист 2..22, «шапка» — сплошная полоса, снимок — сплошной квадрат, строки тонкой линией (просвет 1,5)
P20.newspaper = [S(rect(2, 2, 20, 20, 2)), { capsule: [[6.5, 6.5], [17.5, 6.5], 1.5] }, { solid: rect(6, 11, 3, 3, 0.75) },
  T(line([12.75, 11], [17.25, 11])), T(line([12.75, 14], [17.25, 14])), T(line([5.75, 17.5], [17.25, 17.5]))];
// раскрытый конверт: корпус 2..22 × 10..21 с клапаном вверх до (12; 3), внутри — «V» к (12; 16)
P20.mailOpen = [S(polyline([[2, 10], [12, 3], [22, 10], [22, 21], [2, 21]], { closed: true, r: [2, 1.5, 2, 2, 2] })), S(polyline([[2, 10], [12, 16], [22, 10]], { r: [0, 2, 0] }))];
// языки: «文» — черта 2..12 на 5, отметка сверху и косой крест под ней; «A» 12..22 высотой 10..22 с перекладиной на 18
P20.languages = [S(line([2, 5], [12, 5])), S(line([7, 2], [7, 5])), S(line([3, 9], [9, 15])), S(line([9, 9], [3, 15])),
  S(polyline([[12, 22], [17, 10], [22, 22]])), S(line([12 + 5 * 4 / 12, 18], [22 - 5 * 4 / 12, 18]))];
// контакты: записная книжка 3..18 × 2..22 с закладками на 7, 12, 17, на обложке человек (голова r 2, плечи r 3,5)
P20.contact = [S(rect(3, 2, 15, 20, 2)), ...[7, 12, 17].map((y) => S(line([18, y], [21, y]))), S(circle([10.5, 8.5], 2)), S(path([arc([10.5, 18], 3.5, 180, 180)]))];
// гарнитура: оголовье r 8 вокруг (12; 11) и амбушюры 4 × 7 (r 2), как у headphones; штанга микрофона — дуга r 3 от правой
// амбушюры ко рту
P20.headset = [S(path([arc([12, 11], 8, 180, 180)])), S(rect(2, 11, 4, 7, 2)), S(rect(18, 11, 4, 7, 2)), S(chainPath([arc([17, 18], 3, 0, 90), L([17, 21], [14, 21])]))];

export const ICONS = [
  // --- медиа ---
  { name: 'play', parts: [{ stroke: tri(playTri) }] },
  { name: 'play-fill', parts: [{ solid: tri(playTri) }] },
  { name: 'pause', parts: [{ stroke: rect(5, 4, 4, 16, 2) }, { stroke: rect(15, 4, 4, 16, 2) }] },
  { name: 'pause-fill', parts: [{ solid: rect(5, 4, 4, 16, 2) }, { solid: rect(15, 4, 4, 16, 2) }] },
  { name: 'stop', parts: [{ stroke: rect(4, 4, 16, 16, 2) }] },
  { name: 'stop-fill', parts: [{ solid: rect(4, 4, 16, 16, 2) }] },
  { name: 'record', parts: [{ stroke: circle([12, 12], 8) }] },
  { name: 'record-fill', parts: [{ solid: circle([12, 12], 8) }] },
  { name: 'fast-forward', parts: [{ stroke: tri(ffA) }, { stroke: tri(ffB) }] },
  { name: 'fast-forward-fill', parts: [{ solid: tri(ffA) }, { solid: tri(ffB) }] },
  { name: 'rewind', parts: [{ stroke: tri(ffA.map(mirrorX)) }, { stroke: tri(ffB.map(mirrorX)) }] },
  { name: 'rewind-fill', parts: [{ solid: tri(ffA.map(mirrorX)) }, { solid: tri(ffB.map(mirrorX)) }] },
  { name: 'skip-forward', parts: [{ stroke: tri(skipTri) }, { stroke: line([20, 4], [20, 20]) }] },
  { name: 'skip-forward-fill', parts: [{ solid: tri(skipTri) }, { stroke: line([20, 4], [20, 20]) }] },
  { name: 'skip-back', parts: [{ stroke: tri(skipTri.map(mirrorX)) }, { stroke: line([4, 4], [4, 20]) }] },
  { name: 'skip-back-fill', parts: [{ solid: tri(skipTri.map(mirrorX)) }, { stroke: line([4, 4], [4, 20]) }] },
  // --- интерфейс ---
  { name: 'plus', parts: [{ stroke: line([12, 5], [12, 19]) }, { stroke: line([5, 12], [19, 12]) }] },
  { name: 'minus', parts: [{ stroke: line([5, 12], [19, 12]) }] },
  { name: 'x', parts: [{ stroke: line([6, 6], [18, 18]) }, { stroke: line([18, 6], [6, 18]) }] },
  { name: 'check', parts: [{ stroke: polyline([[4, 12.5], [9, 17.5], [20, 6.5]]) }] },
  { name: 'arrow-right', parts: arrowParts(0) },
  { name: 'arrow-down', parts: arrowParts(1) },
  { name: 'arrow-left', parts: arrowParts(2) },
  { name: 'arrow-up', parts: arrowParts(3) },
  { name: 'chevron-right', parts: chevronParts(0) },
  { name: 'chevron-down', parts: chevronParts(1) },
  { name: 'chevron-left', parts: chevronParts(2) },
  { name: 'chevron-up', parts: chevronParts(3) },
  { name: 'search', parts: [...lens] },
  { name: 'zoom-in', parts: [...lens, { stroke: line([8, 11], [14, 11]) }, { stroke: line([11, 8], [11, 14]) }] },
  { name: 'zoom-out', parts: [...lens, { stroke: line([8, 11], [14, 11]) }] },
  // переключатель: тонкая дорожка-капсула 3..21 × 8,5..15,5 и крупная сплошная ручка r 5 поверх неё
  { name: 'toggle-on', parts: [{ stroke: rect(3, 8.5, 18, 7, 3.5) }, { disk: [[16, 12], 5] }] },
  { name: 'toggle-off', parts: [{ stroke: rect(3, 8.5, 18, 7, 3.5) }, { disk: [[8, 12], 5] }] },
  // --- предметы ---
  // монитор: экран 2..22 × 3..16, подставка — сплошная трапеция от экрана до 20
  { name: 'monitor', parts: [S(rect(2, 3, 20, 13, 2)), { solid: polyline([[10, 16], [14, 16], [15.5, 20], [8.5, 20]], { closed: true }) }] },
  { name: 'sticky-note', parts: [
    { stroke: polyline([[3, 3], [21, 3], [21, 15], [15, 21], [3, 21]], { closed: true, r: [2, 2, 0, 0, 2] }) },
    { stroke: polyline([[15, 20], [15, 15], [20, 15]], { r: 2 }) }, // концы загиба — за 1 до углов листа
  ] },
  // зрачок сплошной r 4, как у Idyllium: так он совпадает с eye-off, где кольцо косая стёрла бы целиком (до контура глаза 2)
  { name: 'eye', parts: [{ stroke: eyePath }, { disk: [[12, 12], 3] }] },
  { name: 'ban', parts: [ring, { stroke: line([12 - 10 / S2, 12 - 10 / S2], [12 + 10 / S2, 12 + 10 / S2]) }] },
  // ноты: сплошные головки r 3, штили x = 9 и 19, толстое ребро-параллелограмм
  { name: 'music', parts: [{ disk: [[7, 19], 3] }, { disk: [[17, 17], 3] }, S(line([9, 19], [9, 6])), S(line([19, 17], [19, 4])),
    { solid: polyline([[9, 5], [19, 3], [19, 4.5], [9, 6.5]], { closed: true }) }] },
  // --- круглые ---
  { name: 'circle-question', parts: [ring, { stroke: question }, { dot: [12, 17] }] },
  { name: 'circle-info', parts: [ring, { dot: [12, 8] }, { stroke: line([12, 12], [12, 16]) }] },
  { name: 'circle-alert', parts: [ring, { stroke: line([12, 8], [12, 12]) }, { dot: [12, 16] }] },
  { name: 'circle-x', parts: [ring, { stroke: line([9, 9], [15, 15]) }, { stroke: line([15, 9], [9, 15]) }] },
  { name: 'circle-check', parts: [ring, { stroke: polyline([[8, 11.5], [11, 14.5], [16, 9.5]]) }] },
  { name: 'circle-plus', parts: [ring, { stroke: line([8, 12], [16, 12]) }, { stroke: line([12, 8], [12, 16]) }] },
  { name: 'circle-minus', parts: [ring, { stroke: line([8, 12], [16, 12]) }] },

  // ===== вторая партия =====
  // --- карандаши ---
  { name: 'pencil', batch: 2, parts: pencil([3.5, 20.5], [19.5, 4.5]) },
  { name: 'pencil-line', batch: 2, parts: [...pencil([3.5, 20.5], [17, 7]), { stroke: line([13, 21], [21, 21]) }] },
  { name: 'square-pen', batch: 2, parts: [{ stroke: polyline([[12, 3], [3, 3], [3, 21], [21, 21], [21, 12]], { r: 2 }) }, ...pencil([9.5, 14.5], [19.5, 4.5], { s: 2, tipLen: 4, band: 3 })] },
  // --- прямоугольники с вырезами и наростами ---
  { name: 'external-link', batch: 2, parts: [
    { stroke: polyline([[10, 4], [4, 4], [4, 20], [20, 20], [20, 14]], { r: 2 }) },
    { stroke: polyline([[14, 4], [20, 4], [20, 10]]) }, { stroke: line([11, 13], [19, 5]) }] },
  // дверь — прямоугольник 10×18 с проёмом в стене; стрелка выходит изнутри (log-out) или входит внутрь (log-in)
  // проём рамки 6..18, головка с плечами 3 — до рамки и до краёв проёма просвет 2
  { name: 'log-out', batch: 2, parts: [
    { stroke: polyline([[14, 6], [14, 3], [4, 3], [4, 21], [14, 21], [14, 18]], { r: 2 }) }, { stroke: line([9, 12], [20, 12]) }, { stroke: polyline([[18, 9], [21, 12], [18, 15]]) }] },
  { name: 'log-in', batch: 2, parts: [
    { stroke: polyline([[11, 6], [11, 3], [21, 3], [21, 21], [11, 21], [11, 18]], { r: 2 }) }, { stroke: line([4, 12], [16, 12]) }, { stroke: polyline([[14, 9], [17, 12], [14, 15]]) }] },
  { name: 'upload', batch: 2, parts: [tray, { stroke: line([12, 16], [12, 5]) }, { stroke: polyline([[7.5, 8.5], [12, 4], [16.5, 8.5]]) }] },
  { name: 'download', batch: 2, parts: [tray, { stroke: line([12, 4], [12, 15]) }, { stroke: polyline([[7.5, 11.5], [12, 16], [16.5, 11.5]]) }] },
  { name: 'space', batch: 2, parts: [{ stroke: polyline([[4, 9], [4, 15], [20, 15], [20, 9]], { r: 2 }) }] },
  { name: 'message', batch: 2, parts: [{ stroke: bubble }] },
  { name: 'message-dots', batch: 2, parts: [{ stroke: bubble }, { dot: [8, 10.5] }, { dot: [12, 10.5] }, { dot: [16, 10.5] }] },
  { name: 'copy', batch: 2, parts: [{ stroke: rect(9, 9, 12, 12, 2) }, { stroke: polyline([[5, 15], [3, 15], [3, 3], [15, 3], [15, 5]], { r: 2 }) }] },
  // --- круги с вырезами и наростами ---
  { name: 'power', batch: 2, parts: [{ stroke: path([arc([12, 13], 8, -45, 270)]) }, { stroke: line([12, 3], [12, 12]) }] },
  // отменить и вернуть: головка с плечами 4, путь — по 8, разворот дугой r 6 вокруг (13,5; 14) и назад по 20
  { name: 'undo', batch: 2, parts: [
    { stroke: polyline([[8.5, 4], [4.5, 8], [8.5, 12]]) }, { stroke: chainPath([L([5.5, 8], [13.5, 8]), arc([13.5, 14], 6, 270, 180), L([13.5, 20], [9, 20])]) }] },
  { name: 'redo', batch: 2, parts: [
    { stroke: polyline([[15.5, 4], [19.5, 8], [15.5, 12]]) }, { stroke: chainPath([L([18.5, 8], [10.5, 8]), arc([10.5, 14], 6, 270, -180), L([10.5, 20], [15, 20])]) }] },
  // повороты: стрелка по дуге r 9, головка 5,5
  { name: 'rotate-cw', batch: 2, parts: arcArrow([12, 12], 9, 0, 1, 45, 5.5) },
  { name: 'rotate-ccw', batch: 2, parts: arcArrow([12, 12], 9, 180, -1, 135, 5.5) },
  { name: 'refresh', batch: 2, parts: [...arcArrow([12, 12], 9, 190, 1, 45, 4), ...arcArrow([12, 12], 9, 10, 1, 225, 4)] },
  // --- четырёхконечная звезда ---
  { name: 'sparkle', batch: 2, parts: [{ stroke: sparklePath }] },
  { name: 'sparkle-fill', batch: 2, parts: [{ solid: sparklePath }] },
  // --- книги ---
  // раскрытая книга: строки — по три тонкие черты 5,25..8,75 и 15,25..18,75 на 8,5, 11,5 и 14,5
  { name: 'book-open', batch: 2, parts: [{ stroke: bookOpen }, { stroke: line([12, 5.5], [12, 20.5]) }, ...[8.5, 11.5, 14.5].flatMap((y) => [T(line([5.25, y], [8.75, y])), T(line([15.25, y], [18.75, y]))])] },
  // книга: обложка 4..20 × 2..22, корешок x = 8, обрез снизу на 17 и лента-закладка — сплошная полоска 12..15,5
  // с вырезом до 7,5
  { name: 'book', batch: 2, parts: [{ stroke: rect(4, 2, 16, 20, 2) }, { stroke: line([4, 17], [20, 17]) }, { stroke: line([8, 2], [8, 17]) },
    { solid: polyline([[12, 2], [15.5, 2], [15.5, 9], [13.75, 7.5], [12, 9]], { closed: true }) }] },
  // --- прямоугольник и полуокружность с продолженными прямыми ---
  { name: 'lock', batch: 2, parts: [{ stroke: lockBody }, { stroke: shackle(180) }, { stroke: line([12, 15], [12, 17]) }] },
  { name: 'lock-open', batch: 2, parts: [{ stroke: lockBody }, { stroke: shackle(150) }, { stroke: line([12, 15], [12, 17]) }] },
  { name: 'shopping-bag', batch: 2, parts: [{ stroke: rect(4, 8, 16, 13, 2) }, { stroke: chainPath([L([9, 11], [9, 6]), arc([12, 6], 3, 180, 180), L([15, 6], [15, 11])]) }] },
  { name: 'magnet', batch: 2, parts: [{ stroke: magnetBody }, magnetPole(3), magnetPole(16)] },

  // ===== третья партия: простые иконки Idyllium =====
  // --- линии и стрелки ---
  { name: 'menu', batch: 3, parts: [6, 12, 18].map((y) => S(line([4, y], [20, y]))) },
  { name: 'align-left', batch: 3, parts: [[6, 20], [10, 15], [14, 18], [18, 12]].map(([y, x]) => S(line([4, y], [x, y]))) },
  { name: 'text', batch: 3, parts: [[7, 20], [12, 16], [17, 12]].map(([y, x]) => S(line([4, y], [x, y]))) },
  // косые черты — наклон 3 : 8; в slashes-off поперечная черта перпендикулярна им и проходит через центр
  { name: 'slashes', batch: 3, parts: [S(line([5, 20], [11, 4])), S(line([13, 20], [19, 4]))] },
  { name: 'slashes-off', batch: 3, parts: [
    ...cutAround([5, 20], [11, 4], [4, 9], [20, 15], 4).map(S), ...cutAround([13, 20], [19, 4], [4, 9], [20, 15], 4).map(S), S(line([4, 9], [20, 15]))] },
  // обмен: стрелки на 8 и 16 во всю ширину 3..21, головки с плечами 4
  { name: 'arrow-left-right', batch: 3, parts: [
    S(polyline([[7, 4], [3, 8], [7, 12]])), S(line([4, 8], [21, 8])), S(polyline([[17, 12], [21, 16], [17, 20]])), S(line([3, 16], [20, 16]))] },
  // буква A — ноги наклоном 5 : 16, перекладина кончается на их осевых; стрелка ↕ — через просвет 2
  { name: 'font-size', batch: 3, parts: [
    S(polyline([[2, 20], [7, 4], [12, 20]])), S(line([2 + 5 * 6 / 16, 14], [12 - 5 * 6 / 16, 14])),
    S(line([19, 5], [19, 19])), S(polyline([[16, 7], [19, 4], [22, 7]])), S(polyline([[16, 17], [19, 20], [22, 17]]))] },
  // развернуть: четыре стрелки в углы со сплошными головками — прямоугольные треугольники (3; 3), (9; 3), (3; 9),
  // древки от (10; 10) до середины гипотенузы
  { name: 'expand', batch: 3, parts: [0, 1, 2, 3].flatMap((k) => [{ solid: polyline([[3, 3], [9, 3], [3, 9]].map((p) => rotN(p, k)), { closed: true }) }, S(line(rotN([10, 10], k), rotN([6, 6], k)))]) },
  // переместить: четыре отдельные стрелки от 3,5 до 10 от центра со сплошными головками (высота 3,5, основание 6)
  { name: 'move', batch: 3, parts: [0, 1, 2, 3].flatMap((k) => [S(line(rotN([12, 8.5], k), rotN([12, 5.5], k))), { solid: polyline([[12, 2], [15, 5.5], [9, 5.5]].map((p) => rotN(p, k)), { closed: true }) }]) },
  { name: 'text-cursor-sparkle', batch: 3, parts: [
    S(line([5, 5], [5, 21])), S(line([3, 5], [7, 5])), S(line([3, 21], [7, 21])), { solid: sparkleAt([16.5, 7.5], 4.5) }] },
  { name: 'braces', batch: 3, parts: [S(braceLeft(8, 4, 20)), S(braceRight(8, 4, 20)), { disk: [[12, 12], 2] }] },
  { name: 'slider', batch: 3, parts: [S(line([3, 12], [21, 12])), { disk: [[12, 12], 3] }] },
  { name: 'chart-line', batch: 3, parts: [
    S(polyline([[3, 17], [9, 10], [15, 14], [21, 7]])), ...[[3, 17], [9, 10], [15, 14], [21, 7]].map((c) => ({ disk: [c, 2] }))] },
  // столбики — заливка по осевой ширины 2 (видимая 4), низ уходит в основание
  { name: 'chart-bar', batch: 3, parts: [
    { solid: rect(4, 10, 2, 9) }, { solid: rect(11, 5, 2, 14) }, { solid: rect(18, 13, 2, 6) }, S(line([2, 20], [22, 20]))] },
  // --- круги ---
  { name: 'circle-dot', batch: 3, parts: [ring, { disk: [[12, 12], 4] }] },
  // поделиться: узлы — кольца r 2,5 в (17,5; 5), (6,5; 12), (17,5; 19), связи от осевой до осевой
  { name: 'share', batch: 3, parts: [
    S(circle([17.5, 5], 2.5)), S(circle([6.5, 12], 2.5)), S(circle([17.5, 19], 2.5)), S(between([6.5, 12], 2.5, [17.5, 5], 2.5)), S(between([6.5, 12], 2.5, [17.5, 19], 2.5))] },
  // часы: 10:10 — часовая 4 на −150°, минутная 6 на −30°, ось — диск r 1,75
  { name: 'clock', batch: 3, parts: [ring, S(polyline([pt([12, 12], 4, -150), [12, 12], pt([12, 12], 6, -30)])), { disk: [[12, 12], 1.75] }] },
  { name: 'grip-vertical', batch: 3, parts: [9, 15].flatMap((x) => [6, 12, 18].map((y) => ({ disk: [[x, y], 2] }))) },
  { name: 'dots-vertical', batch: 3, parts: [6, 12, 18].map((y) => ({ disk: [[12, y], 2] })) },
  { name: 'dots', batch: 3, parts: [6, 12, 18].map((x) => ({ disk: [[x, 12], 2] })) },
  // солнце: диск r 4 и двенадцать лучей r 8..10 через 30°
  { name: 'sun', batch: 3, parts: [S(circle([12, 12], 4)), ...[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((d) => S(line(pt([12, 12], 8, d), pt([12, 12], 10, d))))] },
  { name: 'moon', batch: 3, parts: [S(moonPath)] },
  // круговая диаграмма: три четверти r 8 и выдвинутая залитая четверть; просвет между ними 2
  { name: 'chart-pie', batch: 3, parts: [
    S(chainPath([L([10, 6], [10, 14]), L([10, 14], [18, 14]), arc([10, 14], 8, 0, 270)], true)),
    { solid: chainPath([L([14, 10], [14, 2]), arc([14, 10], 8, 270, 90), L([22, 10], [14, 10])], true) }] },
  // ножницы: кольца r 3, лезвия под 45° начинаются на осевых колец и пересекаются на x = 12
  { name: 'scissors', batch: 3, parts: [
    S(circle([6, 16.5], 3)), S(circle([18, 16.5], 3)),
    S(line(vadd([6, 16.5], vmul([Math.SQRT1_2, -Math.SQRT1_2], 3)), vadd([6, 16.5], vmul([Math.SQRT1_2, -Math.SQRT1_2], 17)))),
    S(line(vadd([18, 16.5], vmul([-Math.SQRT1_2, -Math.SQRT1_2], 3)), vadd([18, 16.5], vmul([-Math.SQRT1_2, -Math.SQRT1_2], 17))))] },
  { name: 'link', batch: 3, parts: [S(chainLink()), S(rotPath180(chainLink()))] },
  // якорь: кольцо r 3, шток до низа дуги, перекладина через просвет 2 от кольца; лапы — стрелки на дуге r 9
  // с осями 240° и 300° (кратны 15°), как у rotate
  { name: 'anchor', batch: 3, parts: [
    S(circle([12, 5], 3)), S(line([12, 8], [12, 21])), S(line([8, 12], [16, 12])),
    ...arcArrow([12, 12], 9, 90, 1, 240, 4), ...arcArrow([12, 12], 9, 90, -1, 300, 4)] },
  { name: 'message-circle', batch: 3, parts: [S(bubbleCircle([12, 12], 9, [2, 22]))] },
  { name: 'message-circle-question', batch: 3, parts: [S(bubbleCircle([12, 12], 9, [2, 22])), S(question), { dot: [12, 17] }] },
  // --- прочие фигуры ---
  // треугольник — равносторонний, сторона 22, скругление 1,5; основание на y = 21. Верх «!» — на 10:
  // так до сторон ровно просвет 2
  { name: 'triangle-alert', batch: 3, parts: [S(tri([[12, 21 - 11 * R3], [23, 21], [1, 21]])), S(line([12, 10], [12, 13])), { dot: [12, 17] }] },
  { name: 'square-check', batch: 3, parts: [S(rect(3, 3, 18, 18, 2)), S(polyline([[7, 12.5], [10, 15.5], [17, 8.5]]))] },
  { name: 'button', batch: 3, parts: [S(field), S(line([8, 12], [16, 12]))] },
  { name: 'input', batch: 3, parts: [S(field), S(line([6, 10], [6, 14]))] },
  { name: 'select', batch: 3, parts: [S(field), S(polyline([[14, 11], [16, 13], [18, 11]]))] },
  { name: 'input-number', batch: 3, parts: [S(spinField), S(line([6, 12], [10, 12])), ...spinChevrons] },
  { name: 'input-decimal', batch: 3, parts: [S(spinField), S(line([6, 12], [7.5, 12])), { dot: [11.5, 12] }, ...spinChevrons] },
  // полоса: капсула r 5, заполнение — капсула r 2 с тем же центром левого торца (просвет 2 по всему торцу)
  { name: 'progress', batch: 3, parts: [S(rect(2, 7, 20, 10, 5)), { capsule: [[7, 12], [14, 12], 2] }] },
  // многострочное поле: рамка 2..22 × 4..20, две строки и уголок-ручка — две тонкие косые в правом нижнем углу
  { name: 'textarea', batch: 3, parts: [S(rect(2, 4, 20, 16, 2)), S(line([6, 8], [18, 8])), S(line([6, 12], [11, 12])), T(line([18.75, 14.25], [16.25, 16.75])), T(line([17.5, 11.25], [12, 16.75]))] },
  { name: 'table', batch: 3, parts: [S(rect(3, 5, 18, 14, 2)), S(line([3, 10], [21, 10])), S(line([9, 5], [9, 19])), S(line([15, 5], [15, 19]))] },
  // картинка: солнце — диск r 2, горы — ломаная под 45°, концы — на осевой рамки (правый — в середине угла)
  { name: 'image', batch: 3, parts: [
    S(rect(2, 3, 20, 18, 2)), { disk: [[7, 8], 2] }, S(polyline([[2, 19], [7, 14], [10, 17], [14, 13], [20 + S2, 19 + S2]]))] },
  // групповая рамка: разрыв в верхней стороне, в нём — подпись
  { name: 'fieldset', batch: 3, parts: [S(polyline([[7, 5], [3, 5], [3, 20], [21, 20], [21, 5], [17, 5]], { r: 2 })), S(line([10, 5], [14, 5]))] },
  { name: 'tabs', batch: 3, parts: [
    S(rect(2, 9, 20, 12, 2)), S(polyline([[4, 9], [4, 5], [10, 5], [10, 9]], { r: [0, 1.5, 1.5, 0] })), S(polyline([[14, 9], [14, 5], [20, 5], [20, 9]], { r: [0, 1.5, 1.5, 0] }))] },
  { name: 'widgets', batch: 3, parts: [S(rect(5, 4, 14, 6, 3)), S(line([3, 18], [21, 18])), { disk: [[12, 18], 3] }] },
  { name: 'canvas', batch: 3, parts: [S(rect(3, 3, 18, 18, 2)), S(circle([9.5, 9.5], 2.5)), S(line([11.5, 17], [17, 11.5]))] },
  // окно: под точками — тонкая черта заголовка во всю ширину
  { name: 'window', batch: 3, parts: [...windowParts, T(line([2, 10.5], [22, 10.5]))] },
  { name: 'window-terminal', batch: 3, parts: [...windowParts, S(polyline([[6, 11], [9, 14], [6, 17]])), S(line([12, 17], [17, 17]))] },
  { name: 'window-play', batch: 3, parts: [...windowParts, { solid: polyline([[10, 11], [10 + 3 * R3, 14], [10, 17]], { closed: true }) }] },
  { name: 'qr-code', batch: 3, parts: [
    S(rect(3, 3, 7, 7, 1.5)), S(rect(14, 3, 7, 7, 1.5)), S(rect(3, 14, 7, 7, 1.5)), qrModule(6, 6), qrModule(17, 6), qrModule(6, 17),
    qrModule(14, 14), qrModule(20, 14), qrModule(14, 20), qrModule(20, 20)] },
  { name: 'sitemap', batch: 3, parts: [
    S(rect(9, 3, 6, 5, 1.5)), S(rect(2, 16, 6, 5, 1.5)), S(rect(16, 16, 6, 5, 1.5)), S(line([12, 8], [12, 12])), S(polyline([[5, 16], [5, 12], [19, 12], [19, 16]], { r: 2 }))] },
  // архив: крышка 2..22 × 3..9, короб 5..19 до 21, ручка 10..14 на 13
  { name: 'archive', batch: 3, parts: [S(rect(2, 3, 20, 6, 2)), S(polyline([[5, 9], [5, 21], [19, 21], [19, 9]], { r: [0, 2, 2, 0] })), S(line([10, 13], [14, 13]))] },
  // звезда: описанный круг R 10,5 вокруг (12, 13) — так видимая рамка встаёт по центру; углы — круглые стыки
  { name: 'star', batch: 3, parts: [S(starPath)] },
  { name: 'star-fill', batch: 3, parts: [{ solid: starPath }] },

  // ===== четвёртая партия =====
  // --- выравнивание: те же строки, что у align-left ---
  { name: 'align-center', batch: 4, parts: ALIGN.map(([y, l]) => S(line([12 - l / 2, y], [12 + l / 2, y]))) },
  { name: 'align-right', batch: 4, parts: ALIGN.map(([y, l]) => S(line([20 - l, y], [20, y]))) },
  { name: 'align-justify', batch: 4, parts: [...[6, 10, 14].map((y) => S(line([4, y], [20, y]))), S(line([4, 18], [12, 18]))] },
  // --- звезда и сердца ---
  { name: 'star-half', batch: 4, parts: [S(starPath), { solid: polyline(clipX(starPts(10.5, [12, 13]), 11), { closed: true }) }] },
  { name: 'heart', batch: 4, parts: [S(heartPath)] },
  { name: 'heart-fill', batch: 4, parts: [{ solid: heartPath }] },
  { name: 'heart-half', batch: 4, parts: [S(heartPath), { solid: heartHalf }] },
  // --- шестерёнки: верх зубьев на 10 от центра, дырка r 3 ---
  { name: 'gear-6', batch: 4, parts: [S(gearPath(6, 10, 8, 2.2, 3.2, 1.5, 1.5)), S(circle([12, 12], 3))] },
  { name: 'gear-8', batch: 4, parts: [S(gearPath(8, 10, 8, 1.6, 2.4, 1.5, 1.2)), S(circle([12, 12], 3))] },
  // --- названные значки SignoreBot ---
  { name: 'calendar', batch: 4, parts: [
    S(rect(3, 4, 18, 18, 2)), S(line([3, 9], [21, 9])), S(line([8, 2], [8, 5])), S(line([16, 2], [16, 5])),
    ...[8, 12, 16].flatMap((x) => [13.5, 17.5].map((y) => ({ dot: [x, y] })))] },
  // дом: скаты под 45°, дверь — вырез в основании
  { name: 'house', batch: 4, parts: [S(polyline([[4, 21], [4, 11], [12, 3], [20, 11], [20, 21], [15, 21], [15, 14], [9, 14], [9, 21]], { closed: true, r: 2 }))] },
  { name: 'globe', batch: 4, parts: [ring, S(globeLens), S(parallel(8)), S(parallel(16))] },
  // книги: корешки вплотную (общие стенки), разной высоты, с поясками
  { name: 'books', batch: 4, parts: [[3, 5], [9, 3], [15, 7]].flatMap(([x, y]) => [
    S(rect(x, y, 6, 21 - y, 1.5)), S(line([x, y + 4], [x + 6, y + 4])), S(line([x, 17], [x + 6, 17]))]) },
  { name: 'user', batch: 4, parts: [S(circle([12, 6], 3.5)), S(path([arc([12, 21.5], 8, 180, 180)]))] },
  // двое: передний целиком, задний — то, что не заслонено (просвет 2 до головы и плеч переднего)
  { name: 'users', batch: 4, parts: [
    S(circle([9, 7], 3.5)), S(path([arc([9, 22], 7, 180, 180)])), S(path([visibleArc([15.5, 6], 3.5, [9, 7], 3.5)])),
    S(path([(() => { const a = cutAngle([16, 22], 6, [9, 22], 11, 360, 270); return arc([16, 22], 6, a, 360 - a); })()]))] },
  // --- простые значки SignoreBot сверх названных ---
  // прицел: кольцо r 6, риски от края до 4,5 от центра — поперёк кольца, в центре диск r 1,5
  { name: 'crosshair', batch: 4, parts: [S(circle([12, 12], 6)), ...[0, 1, 2, 3].map((k) => S(line(rotN([12, 2], k), rotN([12, 7.5], k)))), { disk: [[12, 12], 1.5] }] },
  // ключ: стержень по диагонали x + y = 24 от осевой кольца; зубцы перпендикулярны ему, шаг 3√2
  { name: 'key', batch: 4, parts: [
    S(circle([16, 8], 5)), { disk: [[16, 8], 1.5] }, S(line(pt([16, 8], 5, 135), [5, 19])), S(line([5, 19], [7.5, 21.5])), S(line([8, 16], [10.5, 18.5]))] },
  { name: 'funnel', batch: 4, parts: [S(polyline([[3, 4], [21, 4], [14, 12], [14, 20], [10, 20], [10, 12]], { closed: true, r: [1.5, 1.5, 2, 2, 2, 2] }))] },
  { name: 'gem', batch: 4, parts: [
    S(polyline([[7, 4], [17, 4], [22, 10], [12, 21], [2, 10]], { closed: true })), S(line([2, 10], [22, 10])), S(polyline([[10, 4], [8, 10], [12, 21], [16, 10], [14, 4]]))] },
  // молния: центрально-симметрична относительно (12, 12)
  { name: 'lightning', batch: 4, parts: [S(polyline([[15, 2], [6, 13], [11, 13], [9, 22], [18, 11], [13, 11]], { closed: true }))] },
  // слои: верхний лист — сплошной ромб 2..22 × 3..12, под ним два уголка через 4,5 (просвет 2,1)
  { name: 'layers', batch: 4, parts: [
    { solid: polyline([[12, 3], [22, 7.5], [12, 12], [2, 7.5]], { closed: true }) }, S(polyline([[2, 12], [12, 16.5], [22, 12]])), S(polyline([[2, 16.5], [12, 21], [22, 16.5]]))] },
  // отправить: бумажный самолётик-дротик носом вправо — остриё (21; 12), крылья (3; 5) и (3; 19), выемка (8; 12)
  // и сгиб от неё до 13
  { name: 'send', batch: 4, parts: [S(polyline([[3, 5], [21, 12], [3, 19], [8, 12]], { closed: true })), S(line([8, 12], [13, 12]))] },
  { name: 'inbox', batch: 4, parts: [
    S(polyline([[7, 4], [17, 4], [21, 11], [21, 20], [3, 20], [3, 11]], { closed: true, r: 2 })),
    S(polyline([[3, 13], [8, 13], [10, 16], [14, 16], [16, 13], [21, 13]], { r: [0, 1.5, 1.5, 1.5, 1.5, 0] }))] },
  { name: 'crown', batch: 4, parts: [
    S(polyline([[5, 17], [3, 8], [8, 12], [12, 5], [16, 12], [21, 8], [19, 17]], { closed: true, r: [2, 0, 0, 0, 0, 0, 2] })),
    { disk: [[3, 8], 2] }, { disk: [[12, 5], 2] }, { disk: [[21, 8], 2] }, S(line([5, 21], [19, 21]))] },
  { name: 'stopwatch', batch: 4, parts: [
    S(circle([12, 13.5], 7.5)), S(line([10, 2], [14, 2])), S(line([12, 2], [12, 6])), S(line(pt([12, 13.5], 7.5, -45), pt([12, 13.5], 9.5, -45))),
    S(line([12, 13.5], pt([12, 13.5], 4, -45))), { disk: [[12, 13.5], 2] }] },
  { name: 'video-camera', batch: 4, parts: [
    S(rect(2, 10, 14, 11, 2)), S(polyline([[16, 13], [22, 10], [22, 21], [16, 18]])), S(circle([4.5, 6.5], 2.5)), S(circle([13.5, 6.5], 2.5))] },
  { name: 'film', batch: 4, parts: [
    S(rect(3, 2, 18, 20, 2)), S(line([7, 2], [7, 22])), S(line([17, 2], [17, 22])), S(line([3, 12], [21, 12])),
    S(line([3, 7], [7, 7])), S(line([3, 17], [7, 17])), S(line([17, 7], [21, 7])), S(line([17, 17], [21, 17]))] },
  // робот: уши — стойки вплотную к стенкам головы
  { name: 'robot', batch: 4, parts: [
    S(rect(4, 8, 16, 13, 2)), S(line([12, 8], [12, 5])), { disk: [[12, 3], 2] }, { dot: [9, 13] }, { dot: [15, 13] }, S(line([10, 17], [14, 17])),
    S(line([2, 12], [2, 16])), S(line([22, 12], [22, 16]))] },
  // динамик и волны: дуги r 5,5 и 9,5 вокруг (12, 12) по ±45°
  { name: 'volume', batch: 4, parts: [
    S(polyline([[2, 9], [6, 9], [11, 4], [11, 20], [6, 15], [2, 15]], { closed: true, r: [1.5, 0, 0, 0, 0, 1.5] })),
    S(path([arc([12, 12], 5.5, -45, 90)])), S(path([arc([12, 12], 9.5, -45, 90)]))] },
  { name: 'volume-x', batch: 4, parts: [
    S(polyline([[2, 9], [6, 9], [11, 4], [11, 20], [6, 15], [2, 15]], { closed: true, r: [1.5, 0, 0, 0, 0, 1.5] })), S(line([15, 9], [21, 15])), S(line([21, 9], [15, 15]))] },
  // «Aa»: A — ноги наклоном 4,5 : 16, строчная a — круг r 3,5 и стойка по его правому краю
  { name: 'letter-case', batch: 4, parts: [
    S(polyline([[2, 20], [6.5, 4], [11, 20]])), S(line([2 + 4.5 * 6 / 16, 14], [11 - 4.5 * 6 / 16, 14])), S(circle([17.5, 16.5], 3.5)), S(line([21, 13], [21, 20]))] },
  // телевизор: антенна сходится на осевой верхней стенки, человек стоит на нижней
  { name: 'tv', batch: 4, parts: [
    S(rect(2, 6, 20, 16, 2)), S(polyline([[7, 2], [12, 6], [17, 2]])), S(circle([12, 12.5], 2.5)), S(path([arc([12, 22], 3, 180, 180)]))] },
  // кубик: грани 1, 2 и 3 точки по диагоналям граней
  { name: 'dice', batch: 4, parts: [
    S(polyline(dV, { closed: true })), S(line([12, 12], dV[5])), S(line([12, 12], dV[1])), S(line([12, 12], dV[3])),
    { dot: onFace(dV[0], dV[1], dV[5], 0.5, 0.5) }, { dot: onFace(dV[5], [12, 12], dV[4], 0.3, 0.3) }, { dot: onFace(dV[5], [12, 12], dV[4], 0.7, 0.7) },
    ...[0.25, 0.5, 0.75].map((t) => ({ dot: onFace([12, 12], dV[1], dV[3], t, t) }))] },
  { name: 'package', batch: 4, parts: [
    S(polyline([[6, 3], [18, 3], [21, 9], [21, 21], [3, 21], [3, 9]], { closed: true, r: [1.5, 1.5, 0, 2, 2, 0] })), S(line([3, 9], [21, 9])),
    S(polyline([[10, 3], [10, 12], [12, 10.5], [14, 12], [14, 3]]))] },
  { name: 'hourglass', batch: 4, parts: [
    S(line([5, 3], [19, 3])), S(line([5, 21], [19, 21])),
    S(polyline([[7, 3], [7, 7], [12, 12], [7, 17], [7, 21]], { r: [0, 2, 0, 2, 0] })), S(polyline([[17, 3], [17, 7], [12, 12], [17, 17], [17, 21]], { r: [0, 2, 0, 2, 0] }))] },
  // вещание: диск r 1,5 и волны — дуги r 4,5 и r 8,5 по 90° с обеих сторон
  { name: 'radio', batch: 4, parts: [
    { disk: [[12, 12], 1.5] }, ...[0, 180].flatMap((a) => [S(path([arc([12, 12], 4.5, a - 45, 90)])), S(path([arc([12, 12], 8.5, a - 45, 90)]))])] },

  // ===== пятая партия: файлы и папки =====
  // --- листы ---
  { name: 'file', batch: 5, parts: fileParts },
  { name: 'file-plus', batch: 5, parts: [...fileParts, T(line([12, 12], [12, 18])), T(line([9, 15], [15, 15]))] },
  { name: 'file-x', batch: 5, parts: [...fileParts, T(line([9.5, 12.5], [14.5, 17.5])), T(line([14.5, 12.5], [9.5, 17.5]))] },
  // строки: короткая — слева от загиба, под ним две полные и одна покороче, шаг 3; поле листа 7,5..16,5 (просвет 1,5)
  { name: 'file-text', batch: 5, parts: [...fileParts, T(line([8.5, 9.5], [10.5, 9.5])), T(line([8.5, 12.5], [15.5, 12.5])), T(line([8.5, 15.5], [15.5, 15.5])), T(line([8.5, 18.5], [13, 18.5]))] },
  { name: 'file-code', batch: 5, parts: [...fileParts, T(polyline([[10.25, 12.5], [8.25, 15], [10.25, 17.5]])), T(polyline([[13.75, 12.5], [15.75, 15], [13.75, 17.5]]))] },
  { name: 'file-json', batch: 5, parts: [...fileParts, T(braceLeft(10.5, 11.5, 18.5, 1.125)), T(mirrorPathX(braceLeft(10.5, 11.5, 18.5, 1.125)))] },
  // картинка: солнце — диск r 1,25, горы под 45° от осевой левой стенки до начала скругления справа
  { name: 'file-image', batch: 5, parts: [...fileParts, { disk: [[9, 11.5], 1.25] }, T(polyline([[5, 18], [8, 15], [10.5, 17.5], [14, 14], [19, 19]]))] },
  // нота: головка — диск r 1,75, стебель вровень с её правым краем, флажок — четверть окружности r 3
  { name: 'file-music', batch: 5, parts: [...fileParts, { disk: [[10.5, 17], 1.75] }, T(chainPath([L([11.5, 17], [11.5, 11.5]), arc([11.5, 14.5], 3, 270, 90)]))] },
  // буква A наклоном 1 : 2, перекладина кончается на осевых ног
  { name: 'file-font', batch: 5, parts: [...fileParts, T(polyline([[8.5, 18], [12, 11], [15.5, 18]])), T(line([9.5, 16], [14.5, 16]))] },
  // молния: зубцы через один влево и вправо от оси x = 9,25, шаг 1,25 (соседние сливаются в цепочку),
  // верхний заходит в стенку листа; бегунок — капсула 3×5, её верх заходит в последний зубец
  { name: 'file-archive', batch: 5, parts: [...fileParts,
    ...[0, 1, 2, 3, 4, 5].map((k) => T(k % 2 ? line([9.5, 3.5 + 1.25 * k], [10.75, 3.5 + 1.25 * k]) : line([8.25, 3.5 + 1.25 * k], [9.5, 3.5 + 1.25 * k]))),
    T(rect(8.25, 11, 2.5, 5, 1.25))] },
  { name: 'file-spreadsheet', batch: 5, parts: [...fileParts, T(rect(8.5, 11.5, 7, 7)), T(line([12, 11.5], [12, 18.5])), T(line([8.5, 15], [15.5, 15]))] },
  // --- папки ---
  { name: 'folder', batch: 5, parts: [S(folderPath)] },
  { name: 'folder-plus', batch: 5, parts: [S(folderPath), T(line([12, 10.5], [12, 16.5])), T(line([9, 13.5], [15, 13.5]))] },
  { name: 'folder-down', batch: 5, parts: [S(folderPath), T(line([12, 10.25], [12, 15.75])), T(polyline([[9, 13.75], [12, 16.75], [15, 13.75]]))] },
  { name: 'folder-open', batch: 5, parts: [S(folderOpenBack), S(folderOpenFlap)] },
  // --- дискета, корзина, два листа, планшеты ---
  // дискета: шторка — сплошная 7..14 × 3..8, наклейка 7..17 от 12 с тонкой строкой 10,25..13,75 на 16,5
  { name: 'save', batch: 5, parts: [
    S(polyline([[3, 3], [17, 3], [21, 7], [21, 21], [3, 21]], { closed: true, r: [2, 0, 0, 2, 2] })),
    { solid: polyline([[7, 3], [14, 3], [14, 8], [7, 8]], { closed: true, r: [0, 0, 1.25, 1.25] }) },
    S(polyline([[7, 21], [7, 12], [17, 12], [17, 21]], { r: [0, 1.5, 1.5, 0] })), T(line([10.25, 16.5], [13.75, 16.5]))] },
  { name: 'trash', batch: 5, parts: [
    S(line([3, 6], [21, 6])), S(polyline([[5, 6], [5, 21], [19, 21], [19, 6]], { r: [0, 2, 2, 0] })), S(polyline([[9, 6], [9, 3], [15, 3], [15, 6]], { r: [0, 1.5, 1.5, 0] })),
    S(line([10, 10], [10, 17])), S(line([14, 10], [14, 17]))] },
  // два листа: задний — Г с огрызками за 2 до переднего, как у copy
  { name: 'files', batch: 5, parts: [
    S(polyline([[9, 8], [17, 8], [21, 12], [21, 22], [9, 22]], { closed: true, r: [2, 0, 0, 2, 2] })), { solid: polyline([[17, 8], [17, 12], [21, 12]], { closed: true }) },
    S(polyline([[5, 16], [3, 16], [3, 2], [15, 2], [15, 4]], { r: 2 }))] },
  { name: 'clipboard', batch: 5, parts: clipBoard },
  { name: 'clipboard-list', batch: 5, parts: [...clipBoard, ...[10.5, 14, 17.5].flatMap((y) => [{ dot: [8.5, y], thin: true }, T(line([11.5, y], [15.5, y]))])] },
  { name: 'clipboard-paste', batch: 5, parts: [...clipBoard, T(polyline([[8.5, 10], [12.5, 10], [15.5, 13], [15.5, 18], [8.5, 18]], { closed: true, r: [1.5, 0, 0, 1.5, 1.5] })), { solid: polyline([[12.5, 10], [12.5, 13], [15.5, 13]], { closed: true }), thin: true }] },
  // --- модификации (пробные) ---
  // переподписка: звезда меньше (R 9 вокруг (11; 11,5)) и круговая стрелка в углу
  { name: 'star-repeat', batch: 5, parts: withBadge([S(polyline(starPts(9, [11, 11.5]), { closed: true }))], 'repeat') },
  // сброс фильтров: знак справа сверху — у воронки там широкий край, а ножку резать нельзя
  { name: 'funnel-x', batch: 5, parts: withBadge([S(polyline([[3, 4], [21, 4], [14, 12], [14, 20], [10, 20], [10, 12]], { closed: true, r: [1.5, 1.5, 2, 2, 2, 2] }))], 'x', [18.5, 5.5]) },
  // ответ: пузырь message и стрелка ответа внутри (головка под 45°, древко с четвертью окружности r 2)
  { name: 'message-reply', batch: 5, parts: [S(bubble), S(polyline([[10, 8], [8, 10], [10, 12]])), S(chainPath([L([9, 10], [14, 10]), arc([14, 12], 2, 270, 90), L([16, 12], [16, 13])]))] },
  { name: 'user-x', batch: 5, parts: [...personLeft, ...badgeGlyph.x([19, 10])] },
  { name: 'user-plus', batch: 5, parts: [...personLeft, ...badgeGlyph.plus([19, 10])] },

  // ===== шестая партия: состояния и управление =====
  // --- состояния ---
  { name: 'loader', batch: 6, parts: [S(path([arc([12, 12], 10, -90, 270)]))] },
  { name: 'bell', batch: 6, parts: bellParts },
  { name: 'bulb', batch: 6, parts: [S(bulbPath()), S(line([9.5, 17], [14.5, 17]))] },
  // история: стрелка против часовой от низа, остриё слева внизу; стрелки часов 10:10 — часовая 3, минутная 4,5, ось —
  // диск r 1,5
  { name: 'history', batch: 6, parts: [...arcArrow([12, 12], 9, 90, -1, 45), S(polyline([pt([12, 12], 3, -150), [12, 12], pt([12, 12], 4.5, -30)])), { disk: [[12, 12], 1.5] }] },
  // пульс: кардиограмма — зубец Q до 14, пик R до 3,5, провал S до 20,5 и волна T — полуокружность r 2,5 в конце
  { name: 'activity', batch: 6, parts: [S(chainPath([...polyline([[2, 12], [5, 12], [7, 14], [10, 3.5], [13, 20.5], [15, 12], [17, 12]]).edges, arc([19.5, 12], 2.5, 180, 180)]))] },
  { name: 'server', batch: 6, parts: [S(rect(2, 3, 20, 7, 2)), S(rect(2, 14, 20, 7, 2)), { dot: [6, 6.5] }, { dot: [6, 17.5] }] },
  // спасательный круг: кольца r 10 и r 5, четыре сплошные полосы по 30° между ними на диагоналях
  { name: 'life-buoy', batch: 6, parts: [ring, S(circle([12, 12], 5)), ...[45, 135, 225, 315].map((a) => ({ fill: chainPath([arc([12, 12], 9, a - 15, 30), L(pt([12, 12], 9, a + 15), pt([12, 12], 6, a + 15)), arc([12, 12], 6, a + 15, -30), L(pt([12, 12], 6, a - 15), pt([12, 12], 9, a - 15))], true) }))] },
  // мишень: кольца r 10 и r 5,5, яблочко — диск r 1,5
  { name: 'target', batch: 6, parts: [ring, S(circle([12, 12], 5.5)), { disk: [[12, 12], 1.5] }] },
  // колба: горлышко 10..14, стенки наклоном 1 : 2 до дна на 21, жидкость — отрезок между стенками на 16
  { name: 'flask-conical', batch: 6, parts: [S(polyline([[10, 3], [10, 9], [4, 21], [20, 21], [14, 9], [14, 3]], { r: [0, 2, 2, 2, 2, 0] })), S(line([8, 3], [16, 3])), S(line([6.5, 16], [17.5, 16]))] },
  // --- управление ---
  { name: 'text-search', batch: 6, parts: [S(line([3, 5], [21, 5])), S(line([3, 11], [8, 11])), S(line([3, 17], [8, 17])), ...textSearchLens] },
  // две цифры, а не три: три при шаге 6 сливаются в столбик уже на 20 px
  { name: 'list-ordered', batch: 6, parts: [...listLines, T(digitOne), T(digitTwo(3, 14, 20))] },
  // повтор: две стрелки со скруглением r 4 на 7 и 17 от 4 и 20, головки с плечами 3; вторая — поворот первой на 180°
  { name: 'repeat', batch: 6, parts: [S(polyline([[4, 12], [4, 7], [19, 7]], { r: [0, 4, 0] })), S(polyline([[16, 4], [19, 7], [16, 10]])),
    S(polyline([[20, 12], [20, 17], [5, 17]], { r: [0, 4, 0] })), S(polyline([[8, 14], [5, 17], [8, 20]]))] },
  // ластик: прямоугольник под 45°, поясок — параллельно короткой стороне; земля начинается в нижнем углу
  { name: 'eraser', batch: 6, parts: [S(polyline([[14, 3], [21, 10], [11, 20], [4, 13]], { closed: true, r: [2, 2, 0, 2] })), S(line([8, 9], [15, 16])), S(line([11, 20], [21, 20]))] },
  // вверх-вниз: arrow-left-right, повёрнутая на 90°, — стрелки на 8 и 16 во всю высоту 3..21
  { name: 'arrow-up-down', batch: 6, parts: [S(polyline([[4, 7], [8, 3], [12, 7]])), S(line([8, 4], [8, 21])), S(polyline([[12, 17], [16, 21], [20, 17]])), S(line([16, 3], [16, 20]))] },
  // вниз к черте: головка с плечами 4, острие на 16, черта 5..19 на 21
  { name: 'arrow-down-to-line', batch: 6, parts: [S(line([12, 3], [12, 15])), S(polyline([[8, 12], [12, 16], [16, 12]])), S(line([5, 21], [19, 21]))] },
  // боковые панели: панель сплошная, 3..8 или 16..21
  { name: 'panel-left', batch: 6, parts: [S(rect(3, 3, 18, 18, 2)), { solid: polyline([[3, 3], [8, 3], [8, 21], [3, 21]], { closed: true, r: [2, 0, 0, 2] }) }] },
  { name: 'panel-right', batch: 6, parts: [S(rect(3, 3, 18, 18, 2)), { solid: polyline([[16, 3], [21, 3], [21, 21], [16, 21]], { closed: true, r: [0, 2, 2, 0] }) }] },
  // вписать: четыре уголка со скруглением r 2, углы в 2 от края, плечи 5
  { name: 'scan', batch: 6, parts: [[[2, 7], [2, 2], [7, 2]], [[17, 2], [22, 2], [22, 7]], [[22, 17], [22, 22], [17, 22]], [[7, 22], [2, 22], [2, 17]]].map((q) => S(polyline(q, { r: 2 }))) },

  // ===== седьмая партия: модификации =====
  // «Найти и заменить»: строки text-search сами становятся ⇆ — верхняя с острием вправо, нижняя короткая — влево.
  // Головки с плечами 2 по осям: крупнее верхняя подошла бы к лупе ближе 2
  { name: 'text-search-replace', batch: 7, parts: [...rowArrow([3, 5], [21, 5], 2), S(line([3, 11], [8, 11])), ...rowArrow([8, 17], [3, 17], 2), ...textSearchLens] },
  // «Вне очереди»: молния встаёт на место «1» — пункт идёт первым; тонкая заливка, как цифры
  { name: 'list-ordered-lightning', batch: 7, parts: [...listLines, { solid: listBolt, thin: true }, T(digitTwo(3, 14, 20))] },
  // «Очистить очереди»: крест 4×4 в конце средней строки; строка укорочена до просвета 2
  { name: 'list-ordered-x', batch: 7, parts: [S(line([10, 6], [21, 6])), S(line([10, 12], [13.5, 12])), S(line([10, 18], [21, 18])), ...badgeGlyph.x([19, 12], 2), T(digitOne), T(digitTwo(3, 14, 20))] },
  // уведомления выключены: косая идёт через центр купола (12; 11) — колокол стоит там же, где у bell,
  // а язычок отходит от косой на 2,24; правая часть купола начинается ровно под ушком (срез до оси 270°)
  { name: 'bell-off', batch: 7, parts: withSlash(bellParts, [3, 2], [22, 21]) },

  // ===== восьмая партия: остаток Idyllium =====
  // --- интерфейс ---
  { name: 'pointer', batch: 8, parts: [S(cursor([5, 5], 16))] },
  // «Конструктор GUI»: окно (как window) открыто в правом нижнем углу, курсор входит в него остриём; концы рамки — в 2 от курсора
  { name: 'window-pointer', batch: 8, parts: [S(polyline([[22, 11], [22, 3], [2, 3], [2, 21], [11, 21]], { r: [0, 2, 2, 2, 0] })), ...[6, 10, 14].map((x) => ({ dot: [x, 7] })), S(cursor([11, 11], 12))] },
  // глаз выключен — по рисунку Idyllium: косая (4; 4)–(20; 20) короче кадра, контур глаза отступает от неё на 2 с обеих сторон;
  // зрачок — сплошной круг r 4 (до контура глаза 2), разрезанный косой на два сегмента с просветом 1: при 2 от него остаются нити
  { name: 'eye-off', batch: 8, parts: [
    ...cutPathStrip(eyePath, [12, 12], SLASH_N, -4, 4).filter((q) => pathLen(q) >= 2).map((q) => S(snapToAxes(trimTails(q)))),
    ...[-45, 135].map((m) => { const a = Math.acos(2 / 3) / D2R; return { fill: chainPath([arc([12, 12], 3, m - a, 2 * a), L(pt([12, 12], 3, m + a), pt([12, 12], 3, m - a))], true) }; }),
    S(line([4, 4], [20, 20]))] },
  { name: 'file-info', batch: 8, parts: [...fileParts, { dot: [12, 11.5], thin: true }, T(line([12, 14.5], [12, 18.5]))] },
  { name: 'clipboard-image', batch: 8, parts: [...clipBoard, { disk: [[9, 11.5], 1.25] }, T(polyline([[5, 18], [8, 15], [10.5, 17.5], [14, 14], [19, 19]]))] },
  // --- данные ---
  // база: овалы a 8, b 3, концы r 1,75 — тогда верх и низ ровно r 18 (при концах r 2 точка стыка дуг в смещении
  // ложилась в 0,03 от внутренней кромки стенки — лишние узлы); верхний овал на 5,5 сплошной, низ на 18,5, полоса на 12
  { name: 'database', batch: 8, parts: [{ solid: oval(12, 5.5, 8, 3, 1.75) }, ...database(12, 5.5, 18.5, 8, 3, 1.75, [12]).slice(1)] },
  // цилиндр на листе — те же пропорции вдвое меньше, тонкой линией; полосе места нет (просвет вышел бы 0,75)
  { name: 'file-database', batch: 8, parts: [...fileParts, ...database(12, 12.75, 17.25, 3.5, 1.5, 0.875, [], T)] },
  // --- рисование ---
  // палитра: круг r 10, справа снизу — выпуклая четверть r 5 вокруг (17; 12) и выемка r 5 вокруг (17; 22), касательные друг к другу;
  // краски — диски r 1,5 на окружности r 5,5
  { name: 'palette', batch: 8, parts: [S(chainPath([arc([12, 12], 10, 90, 270), arc([17, 12], 5, 0, 90), arc([17, 22], 5, 270, -90)], true)), ...[135, 195, 255, 315].map((a) => ({ disk: [pt([12, 12], 5.5, a), 1.5] }))] },
  // пипетка — по рисунку Idyllium: трубка контуром сужается от полуширины 2,25 у муфты к кончику r 1,25 (стороны касаются
  // кончика); муфта — прямоугольник 3,5 × 8,5 поперёк оси; колба — капсула полушириной 3, её бока кончаются на осевой муфты
  { name: 'pipette', batch: 8, parts: pipette() },
  { name: 'brush', batch: 8, parts: brush() },
  // --- разделы ---
  { name: 'chef-hat', batch: 8, parts: chefHat() },
  { name: 'puzzle', batch: 8, parts: puzzle() },
  { name: 'turtle', batch: 8, parts: turtle() },

  // ===== девятая партия: остаток SignoreBot =====
  // --- предметы ---
  { name: 'pin', batch: 9, parts: pushpin() },
  // вилка: штыри 9 и 15 до планки на 6, планка 4..20, корпус «U» с дном r 6, провод
  { name: 'plug', batch: 9, parts: [S(line([9, 2], [9, 6])), S(line([15, 2], [15, 6])), S(line([4, 6], [20, 6])), S(chainPath([L([6, 6], [6, 10]), arc([12, 10], 6, 180, -180), L([18, 10], [18, 6])])), S(line([12, 16], [12, 22]))] },
  { name: 'gift', batch: 9, parts: gift() },
  { name: 'lock-key', batch: 9, parts: lockKey() },
  { name: 'sword', batch: 9, parts: sword() },
  { name: 'shield-star', batch: 9, parts: [S(shieldPath()), { solid: polyline(starPts(3.6, [12, 11.5]), { closed: true }) }] },
  { name: 'rocket', batch: 9, parts: rocket() },
  // хайповоз (Hype Train) — паровоз, а не ракета: ракета остаётся «при старте»
  { name: 'locomotive', batch: 9, parts: locomotive() },
  // --- стрим и медиа ---
  { name: 'megaphone', batch: 9, parts: megaphone() },
  // вышка: излучатель r 2 в (12; 9), ноги из его нижней точки к (7; 21) и (17; 21), перекладина 9..15 на 17, волны r 6 и 10 по ±30°
  { name: 'radio-tower', batch: 9, parts: [S(circle([12, 9], 2)), S(polyline([[7, 21], [12, 11], [17, 21]])), S(line([9, 17], [15, 17])), ...[0, 180].flatMap((a) => [S(path([arc([12, 9], 6, a - 30, 60)])), S(path([arc([12, 9], 10, a - 30, 60)]))])] },
  // отключено: radio с косой (4; 4)–(20; 20), волны отступают от неё на 2 с обеих сторон, точка уходит
  { name: 'radio-off', batch: 9, parts: [...cutBothSides([0, 180].flatMap((a) => [S(path([arc([12, 12], 6, a - 45, 90)])), S(path([arc([12, 12], 10, a - 45, 90)]))]), [12, 12]), S(line([4, 4], [20, 20]))] },
  { name: 'clapperboard', batch: 9, parts: clapperboard() },
  // медиа: задняя карточка-картинка (Г, концы в 2 от передней), передняя — видео с треугольником
  { name: 'media', batch: 9, parts: [S(polyline([[15, 6], [15, 3], [2, 3], [2, 14], [7, 14]], { r: [0, 2, 2, 2, 0] })), S(rect(10, 10, 12, 11, 2)), { solid: polyline([[15, 13], [15 + 2.5 * R3, 15.5], [15, 18]], { closed: true }) }, { disk: [[6, 7], 1.25] }, T(polyline([[2, 12], [5, 9], [7.5, 11.5]]))] },
  // наложение (хромакей, mix-blend-mode): два пересекающихся круга r 6,5
  { name: 'blend', batch: 9, parts: [S(circle([9, 9], 6.5)), S(circle([15, 15], 6.5))] },
  { name: 'wand-sparkles', batch: 9, parts: wandSparkles() },
  { name: 'party-popper', batch: 9, parts: partyPopper() },
  // --- действия ---
  { name: 'shuffle', batch: 9, parts: shuffle() },
  { name: 'sleep', batch: 9, parts: sleep() },

  // ===== десятая партия: математика ООМ =====
  // --- вкладки сцен ---
  // коробка с числом: квадрат набора и «7» — число по умолчанию в панели объектов ООМ; семёрка —
  // с перекладиной 10,5..15,5 на 12, как пишут от руки
  { name: 'square-number', batch: 10, parts: [S(rect(3, 3, 18, 18, 2)), S(polyline([[8.5, 7], [15.5, 7], [10.5, 17]])), S(line([10.5, 12], [15.5, 12]))] },
  // числовая прямая: ось со стрелкой, засечки через 4, указатель — сплошной треугольник над засечкой
  { name: 'number-line', batch: 10, parts: [S(line([3, 16], [21, 16])), S(polyline([[19, 13], [22, 16], [19, 19]])), ...[3, 7, 11, 15].map((x) => S(line([x, 14], [x, 18]))),
    { solid: polyline([[8.5, 6], [13.5, 6], [11, 10]], { closed: true }) }] },
  // плоскость: оси со стрелками из начала (8; 16), точка в первой четверти
  { name: 'axes', batch: 10, parts: [S(line([2, 16], [21, 16])), S(polyline([[19, 13], [22, 16], [19, 19]])), S(line([8, 22], [8, 3])), S(polyline([[5, 5], [8, 2], [11, 5]])), { disk: [[15, 9], 2] }] },
  // конвейер: лента-капсула (торцы r 2 режутся как торцы линии), коробка стоит на ней, стрелка движения; с роликами
  // внутри ленты и с колёсами-шкивами он читался танком и грузовиком
  { name: 'conveyor', batch: 10, parts: [S(chainPath([L([4, 15], [20, 15]), capArc([20, 17], 2, 270, 180), L([20, 19], [4, 19]), capArc([4, 17], 2, 90, 180)], true)),
    S(polyline([[4, 15], [4, 7], [12, 7], [12, 15]], { r: [0, 1.5, 1.5, 0] })), S(line([16, 8], [20, 8])), S(polyline([[18, 5], [21, 8], [18, 11]]))] },
  // ленты: целая полоса и полоса на четверти, одна доля закрашена (одна полоса с долями читалась батарейкой)
  { name: 'fraction-bar', batch: 10, parts: [S(rect(2, 4, 20, 6, 1.5)), S(rect(2, 14, 20, 6, 1.5)), ...[7, 12, 17].map((x) => S(line([x, 14], [x, 20]))),
    { fill: polyline([[7, 14], [7, 20], [2, 20], [2, 14]], { closed: true, r: [0, 0, 1.5, 1.5] }) }] },
  // площади: прямоугольник 4 × 3 единичных квадрата со стороной 5, сетка тонкой линией, углы острые — это фигура, а не рамка
  { name: 'area-grid', batch: 10, parts: [S(rect(2, 5, 20, 15)), ...[7, 12, 17].map((x) => T(line([x, 5], [x, 20]))), ...[10, 15].map((y) => T(line([2, y], [22, y])))] },
  // объёмы: куб 2 × 2 × 2
  { name: 'cube-grid', batch: 10, parts: [...cubeParts, ...cubeFaces.flatMap(faceGrid)] },
  // окружность: кольцо набора, диаметр по оси и радиус под 45° — угол от оси (круг с крестом осей читался прицелом,
  // точка на ободе и «синус» только утяжеляли рисунок)
  { name: 'unit-circle', batch: 10, parts: [ring, S(line([2, 12], [22, 12])), S(line([12, 12], pt([12, 12], 10, -45)))] },
  { name: 'scale', batch: 10, parts: [S(line([5, 7], [19, 7])), S(line([12, 7], [12, 20])), S(line([7, 20], [17, 20])), { disk: [[12, 5], 2] }, { solid: scalePan(5) }, { solid: scalePan(19) }] },
  // --- инструменты и действия ---
  { name: 'hammer', batch: 10, parts: hammer() },
  // линейка: засечки от верхней кромки, короткие и длинные через одну
  { name: 'ruler', batch: 10, parts: [S(rect(2, 8, 20, 8, 1.5)), ...[6, 14].map((x) => S(line([x, 8], [x, 11]))), ...[10, 18].map((x) => S(line([x, 8], [x, 12.5])))] },
  // куб: шестиугольник кубика, левая грань сплошная, ребро из центра вправо вверх
  { name: 'cube', batch: 10, parts: [S(polyline(dV, { closed: true })), S(line([12, 12], dV[1])), { solid: polyline([dV[5], [12, 12], dV[3], dV[4]], { closed: true }) }] },
  // чёрный ящик: куб из трёх сплошных граней — на месте «?», который читался помощью
  { name: 'cube-fill', batch: 10, parts: cubeFill() },
  { name: 'flip-horizontal', batch: 10, parts: flipParts((p) => p) },
  { name: 'flip-vertical', batch: 10, parts: flipParts(rot90) },
  { name: 'pentagon', batch: 10, parts: [S(polyline(pentagonPts, { closed: true, r: 1.5 }))] },
  // склейка — обратное ножницам: две стрелки к шву, остриё в 2 от осевой шва
  { name: 'merge', batch: 10, parts: [S(line([12, 4], [12, 20])), S(line([2, 12], [7, 12])), S(polyline([[5, 9], [8, 12], [5, 15]])), S(line([22, 12], [17, 12])), S(polyline([[19, 9], [16, 12], [19, 15]]))] },
  { name: 'square-function', batch: 10, parts: [S(rect(3, 3, 18, 18, 2)), ...fGlyph] },

  // ===== одиннадцатая партия: связь =====
  // конверт: в пропорции C6 (20 × 14), клапан — «V» от 7,5 до (12; 14) со скруглением r 2,5
  { name: 'mail', batch: 11, parts: [S(rect(2, 5, 20, 14, 2)), S(polyline([[2, 7.5], [12, 14], [22, 7.5]], { r: [0, 2.5, 0] }))] },
  { name: 'phone', batch: 11, parts: phoneParts() },
  // @: кольцо r 3,5, стойка x = 15,5, крюк r 3, внешняя дуга r 9,5 на 292°
  { name: 'at-sign', batch: 11, parts: [S(circle([12, 12], 3.5)), S(chainPath([L([15.5, 8.5], [15.5, 13.5]), arc([18.5, 13.5], 3, 180, -180), L([21.5, 13.5], [21.5, 12]), arc([12, 12], 9.5, 0, -292)]))] },
  { name: 'paperclip', batch: 11, parts: paperclip() },
  // закладка: лента 6..18 во всю высоту, вырез «V» до 17
  { name: 'bookmark', batch: 11, parts: [S(polyline([[6, 2], [18, 2], [18, 22], [12, 17], [6, 22]], { closed: true, r: [2, 2, 0, 1.25, 0] }))] },
  // ярлык: висит остриём вверх — пятиугольник 5..19 × 1,5..22 со скосами под 45°, дырочка — диск r 2 в (12; 9),
  // до скосов просвет больше 2
  { name: 'tag', batch: 11, parts: [S(polyline([[12, 1.5], [19, 8.5], [19, 22], [5, 22], [5, 8.5]], { closed: true, r: [1.5, 1.5, 2, 2, 1.5] })), { disk: [[12, 9], 2] }] },
  { name: 'flag', batch: 11, parts: flagParts() },
  { name: 'thumbs-up', batch: 11, parts: thumbParts() },
  { name: 'thumbs-down', batch: 11, parts: thumbParts(true) },
  { name: 'smile', batch: 11, parts: faceParts(false) },
  { name: 'frown', batch: 11, parts: faceParts(true) },
  { name: 'mic', batch: 11, parts: micParts },
  // выключено: косая с просветом 2 с обеих сторон, как у eye-off и radio-off
  { name: 'mic-off', batch: 11, parts: [...cutBothSides(micParts, [12, 12]), S(line([4, 4], [20, 20]))] },
  { name: 'headphones', batch: 11, parts: headphonesParts },
  // два пузыря: передний 2..14 × 3..12 с хвостом влево вниз, задний — зеркальный, виден справа и снизу, концы в 2 от переднего
  { name: 'messages', batch: 11, parts: [S(polyline([[2, 3], [14, 3], [14, 12], [6, 12], [2, 16]], { closed: true, r: [2, 2, 2, 0, 0] })),
    S(polyline([[18, 8], [22, 8], [22, 21], [18, 17], [12, 17]], { r: [0, 2, 0, 0, 0] }))] },
  { name: 'hash', batch: 11, parts: [S(line([4, 9], [20, 9])), S(line([4, 15], [20, 15])), S(line([10, 3], [8, 21])), S(line([16, 3], [14, 21]))] },
  // rss: узел — диск r 2,5, волны — четверти r 9 и r 15,5 вокруг него
  { name: 'rss', batch: 11, parts: [{ disk: [[5, 19], 2.5] }, S(path([arc([5, 19], 9, 270, 90)])), S(path([arc([5, 19], 15.5, 270, 90)]))] },
  { name: 'camera', batch: 11, parts: cameraParts },
  { name: 'printer', batch: 11, parts: printerParts },

  // ===== двенадцатая партия: покупки и деньги =====
  { name: 'shopping-cart', batch: 12, parts: cartParts },
  // банкноты: стопка из двух — передняя 2..18 × 8..20 с кольцом r 2 в середине, от задней видны верх и правый край
  // (6..22 × 4..16), они кончаются на осевой передней
  { name: 'banknote', batch: 12, parts: [S(rect(2, 8, 16, 12, 2)), S(circle([10, 14], 2)), S(polyline([[6, 8], [6, 4], [22, 4], [22, 16], [18, 16]], { r: [0, 2, 2, 2, 0] }))] },
  { name: 'truck', batch: 12, parts: truckParts },
  // банковская карта: 3..21 × 6..18, r 3 (пропорция 3 : 2), чип — сплошной прямоугольник слева, номер — черта
  // справа внизу
  { name: 'credit-card', batch: 12, parts: [S(rect(3, 6, 18, 12, 3)), { solid: rect(7, 10, 3, 2) }, S(line([14, 14], [17, 14]))] },
  { name: 'dollar-sign', batch: 12, parts: dollarParts },
  { name: 'wallet', batch: 12, parts: walletParts },
  { name: 'receipt', batch: 12, parts: receiptParts },
  { name: 'store', batch: 12, parts: storeParts },
  { name: 'landmark', batch: 12, parts: landmarkParts },
  { name: 'piggy-bank', batch: 12, parts: piggyParts() },
  { name: 'calculator', batch: 12, parts: calculatorParts },
  { name: 'ticket', batch: 12, parts: ticketParts },
  // процент: косая через центр, кольца r 2,5 в углах
  { name: 'percent', batch: 12, parts: [S(line([19, 5], [5, 19])), S(circle([6.5, 6.5], 2.5)), S(circle([17.5, 17.5], 2.5))] },

  // ===== тринадцатая партия: стрелки и фигуры =====
  { name: 'caret-down', batch: 13, parts: caretParts(false) },
  { name: 'caret-up', batch: 13, parts: caretParts(true) },
  { name: 'chevrons-right', batch: 13, parts: chevronsParts(0) },
  { name: 'chevrons-down', batch: 13, parts: chevronsParts(1) },
  { name: 'chevrons-left', batch: 13, parts: chevronsParts(2) },
  { name: 'chevrons-up', batch: 13, parts: chevronsParts(3) },
  { name: 'arrow-up-right', batch: 13, parts: diagArrowParts(0) },
  { name: 'arrow-down-right', batch: 13, parts: diagArrowParts(1) },
  { name: 'arrow-down-left', batch: 13, parts: diagArrowParts(2) },
  { name: 'arrow-up-left', batch: 13, parts: diagArrowParts(3) },
  { name: 'circle-arrow-right', batch: 13, parts: circleArrowParts(0) },
  { name: 'circle-arrow-down', batch: 13, parts: circleArrowParts(1) },
  { name: 'circle-arrow-left', batch: 13, parts: circleArrowParts(2) },
  { name: 'circle-arrow-up', batch: 13, parts: circleArrowParts(3) },
  { name: 'trending-up', batch: 13, parts: trendParts((p) => p) },
  { name: 'trending-down', batch: 13, parts: trendParts(mirrorY) },
  { name: 'corner-down-left', batch: 13, parts: cornerParts['corner-down-left'] },
  { name: 'corner-down-right', batch: 13, parts: cornerParts['corner-down-right'] },
  { name: 'reply', batch: 13, parts: cornerParts.reply },
  { name: 'forward', batch: 13, parts: cornerParts.forward },
  { name: 'square', batch: 13, parts: [squareBox] },
  // треугольник — тот же, что у triangle-alert
  { name: 'triangle', batch: 13, parts: [S(tri([[12, 21 - 11 * R3], [23, 21], [1, 21]]))] },
  // шестиугольник — шестиугольник кубика набора, углы r 1,5
  { name: 'hexagon', batch: 13, parts: [S(polyline(dV, { closed: true, r: 1.5 }))] },
  { name: 'octagon-alert', batch: 13, parts: [S(polyline(octagonPts, { closed: true, r: 1.5 })), S(line([12, 8], [12, 12])), { dot: [12, 16] }] },
  { name: 'circle-play', batch: 13, parts: [ring, S(polyline(circlePlayTri, { closed: true, r: 1.25 }))] },
  { name: 'circle-pause', batch: 13, parts: [ring, S(line([10, 8.5], [10, 15.5])), S(line([14, 8.5], [14, 15.5]))] },
  { name: 'circle-stop', batch: 13, parts: [ring, S(rect(9, 9, 6, 6, 1.25))] },
  { name: 'square-plus', batch: 13, parts: [squareBox, S(line([8, 12], [16, 12])), S(line([12, 8], [12, 16]))] },
  { name: 'square-minus', batch: 13, parts: [squareBox, S(line([8, 12], [16, 12]))] },
  { name: 'square-x', batch: 13, parts: [squareBox, S(line([9, 9], [15, 15])), S(line([15, 9], [9, 15]))] },
  { name: 'check-check', batch: 13, parts: [S(polyline([[2, 12], [7, 17], [17, 7]])), S(polyline([[15.5 - checkStub, 17 - checkStub], [15.5, 17], [22, 10.5]]))] },
  { name: 'badge-check', batch: 13, parts: [S(rosettePath()), S(polyline([[8, 12], [11, 15], [16, 10]]))] },
  // щит — тот же, что у shield-star; галочка — с просветом 2 до боков (у левого конца бок уже сходится к острию)
  { name: 'shield', batch: 13, parts: [S(shieldPath())] },
  { name: 'shield-check', batch: 13, parts: [S(shieldPath()), S(polyline([[9.5, 12], [11.5, 14], [15, 10.5]]))] },

  // ===== четырнадцатая партия: инструменты и люди =====
  { name: 'circle-user', batch: 14, parts: circleUserParts() },
  // знак сбоку — в том же месте, что у user-plus и user-x
  { name: 'user-check', batch: 14, parts: [...personLeft, S(polyline([[16, 10], [18, 12], [22, 8]]))] },
  { name: 'user-minus', batch: 14, parts: [...personLeft, S(line([16, 10], [22, 10]))] },
  { name: 'wrench', batch: 14, parts: wrenchParts() },
  { name: 'bug', batch: 14, parts: bugParts() },
  { name: 'award', batch: 14, parts: awardParts },
  { name: 'fingerprint', batch: 14, parts: fingerprintParts },
  { name: 'pen-tool', batch: 14, parts: penToolParts },
  { name: 'coffee', batch: 14, parts: coffeeParts },
  { name: 'aperture', batch: 14, parts: apertureParts() },
  // кадрирование: два уголка на 7 и 17 — рамка 10 × 10, выносы по 5, углы r 2
  { name: 'crop', batch: 14, parts: [S(polyline([[7, 2], [7, 17], [22, 17]], { r: [0, 2, 0] })), S(polyline([[2, 7], [17, 7], [17, 22]], { r: [0, 2, 0] }))] },
  { name: 'command', batch: 14, parts: commandParts },
  // git: узлы — кольца r 2,5, линии кончаются на их осевых; ответвление отходит от ствола вбок на 12 и поворачивает
  // к узлу дугой r 3,5
  { name: 'git-branch', batch: 14, parts: [S(circle([6, 19], 2.5)), S(line([6, 16.5], [6, 2.5])), S(circle([18, 6], 2.5)), S(chainPath([arc([14.5, 8.5], 3.5, 0, 90), L([14.5, 12], [6, 12])]))] },
  { name: 'git-merge', batch: 14, parts: [S(circle([6, 5], 2.5)), S(line([6, 7.5], [6, 21.5])), S(circle([18, 18], 2.5)), S(chainPath([L([6, 12], [14.5, 12]), arc([14.5, 15.5], 3.5, 270, 90)]))] },

  // ===== пятнадцатая партия: места и транспорт =====
  { name: 'map-pin', batch: 15, parts: mapPinParts() },
  { name: 'graduation-cap', batch: 15, parts: gradCapParts() },
  { name: 'map', batch: 15, parts: mapParts },
  { name: 'briefcase', batch: 15, parts: briefcaseParts },
  { name: 'building', batch: 15, parts: buildingParts },
  { name: 'car', batch: 15, parts: carParts },
  { name: 'compass', batch: 15, parts: compassParts },
  { name: 'plane', batch: 15, parts: planeParts() },
  // навигация: наконечник к (21; 3), симметричный относительно диагонали x + y = 24, выемка — в (12,5; 11,5)
  { name: 'navigation', batch: 15, parts: [S(polyline([[3, 10], [21, 3], [14, 21], [12.5, 11.5]], { closed: true }))] },
  { name: 'bus', batch: 15, parts: busParts },

  // ===== шестнадцатая партия: по заявкам владельца =====
  // захват поперёк — grip-vertical, повёрнутый на 90°
  { name: 'grip-horizontal', batch: 16, parts: [6, 12, 18].flatMap((x) => [9, 15].map((y) => ({ disk: [[x, y], 2] }))) },
  { name: 'mouse', batch: 16, parts: mouseParts() },
  { name: 'mouse-left', batch: 16, parts: mouseParts('left') },
  { name: 'mouse-right', batch: 16, parts: mouseParts('right') },
  { name: 'mouse-middle', batch: 16, parts: mouseParts('middle') },
  { name: 'sailboat', batch: 16, parts: sailboatParts },
  { name: 'ship', batch: 16, parts: shipParts },
  { name: 'submarine', batch: 16, parts: submarineParts },
  { name: 'euro-sign', batch: 16, parts: euroParts },
  { name: 'pound-sign', batch: 16, parts: poundParts },
  { name: 'yen-sign', batch: 16, parts: yenParts },
  { name: 'ruble-sign', batch: 16, parts: rubleParts },
  { name: 'rupee-sign', batch: 16, parts: rupeeParts },
  // пользователь выключен — фигура user, просвет 2 по обе стороны косой, как у mic-off. Косая ниже центра: (2; 7)–(16; 21)
  // проходит под головой (до головы ровно просвет 2), режет плечи. Через центр она шла бы почти по касательной к правому
  // плечу и съедала бы его вместе с половиной головы — фигура рассыпалась
  { name: 'user-off', batch: 16, parts: [...cutBothSides([S(circle([12, 6], 3.5)), S(path([arc([12, 21.5], 8, 180, 180)]))], [2, 7]), S(line([2, 7], [16, 21]))] },
  // видеофайл: сплошной треугольник «пуск» со стороной 6,5 тонкой линией — центр тяжести в (12; 15), в центре поля листа
  { name: 'file-video', batch: 16, parts: [...fileParts, { solid: polyline([[12 - 6.5 / (2 * R3), 11.75], [12 + 6.5 / R3, 15], [12 - 6.5 / (2 * R3), 18.25]], { closed: true }), thin: true }] },
  // деление: черта как у minus, точки — диски r 2, как у dots
  { name: 'divide', batch: 16, parts: [S(line([5, 12], [19, 12])), { disk: [[12, 6], 2] }, { disk: [[12, 18], 2] }] },

  // ===== семнадцатая партия: текст и раскладка =====
  // сетка плиток: четыре квадрата 8 × 8 со скруглением r 2 во всё поле 2..22, между ними просвет 2
  { name: 'grid', batch: 17, parts: [[2, 2], [14, 2], [2, 14], [14, 14]].map(([x, y]) => S(rect(x, y, 8, 8, 2))) },
  // раскладка: две колонки плиток шириной 8 и высотой 10 и 6 — наискосок, во всё поле 2..22
  { name: 'layout', batch: 17, parts: [S(rect(2, 2, 8, 10, 2)), S(rect(14, 2, 8, 6, 2)), S(rect(14, 12, 8, 10, 2)), S(rect(2, 16, 8, 6, 2))] },
  // колонки и строки: квадрат как у panel-left, средняя колонка или строка 9..15 — сплошная
  { name: 'columns', batch: 17, parts: [S(rect(3, 3, 18, 18, 2)), { solid: polyline([[9, 3], [15, 3], [15, 21], [9, 21]], { closed: true }) }] },
  { name: 'rows', batch: 17, parts: [S(rect(3, 3, 18, 18, 2)), { solid: polyline([[3, 9], [21, 9], [21, 15], [3, 15]], { closed: true }) }] },
  { name: 'sliders', batch: 17, parts: slidersParts },
  // код: шевроны 6 × 12 под 45° во всю ширину
  { name: 'code', batch: 17, parts: [S(polyline([[8, 6], [2, 12], [8, 18]])), S(polyline([[16, 6], [22, 12], [16, 18]]))] },
  // списки — строки как у list-ordered; маркеры — диски r 1,5 на x = 5, галочки — тонкой линией
  { name: 'list', batch: 17, parts: [...listLines, ...[6, 12, 18].map((y) => ({ disk: [[5, y], 1.5] }))] },
  { name: 'list-checks', batch: 17, parts: [...listLines, ...[6, 12, 18].map(listTick)] },
  { name: 'quote', batch: 17, parts: [...quoteMark(7.5, quoteY), ...quoteMark(16.5, quoteY)] },
  { name: 'bold', batch: 17, parts: boldParts },
  // курсив: засечки 10..18 на 4 и 6..14 на 20, стойка наклоном 4 : 16 — центрально-симметричен
  { name: 'italic', batch: 17, parts: [S(line([10, 4], [18, 4])), S(line([6, 20], [14, 20])), S(line([14, 4], [10, 20]))] },
  // подчёркнутый: U — стойки x = 7 и 17 до 11, низ — полукруг r 5 до 16; черта 4..20 на 20 (просвет 2)
  { name: 'underline', batch: 17, parts: [S(chainPath([L([7, 4], [7, 11]), arc([12, 11], 5, 180, -180), L([17, 11], [17, 4])])), S(line([4, 20], [20, 20]))] },
  // зачёркнутый: черта 3..21 — длиннее буквы, как дорожка slider
  { name: 'strikethrough', batch: 17, parts: [S(sTop), S(sBottom), S(line([3, 12], [21, 12]))] },

  // ===== восемнадцатая партия: погода и природа =====
  { name: 'cloud', batch: 18, parts: [S(cloudPath())] },
  // осадки под облаком без низа: дождь — черты длиной 4 вразбежку, снег — точки на их концах, гроза — зигзаг,
  // центрально-симметричный вокруг (12; 17)
  { name: 'cloud-rain', batch: 18, parts: [S(cloudPath(-3, true)), ...[[8, 16], [12, 18], [16, 16]].map(([x, y]) => S(line([x, y], [x, y + 4])))] },
  { name: 'cloud-snow', batch: 18, parts: [S(cloudPath(-3, true)), ...[[8, 16], [8, 20], [12, 18], [12, 22], [16, 16], [16, 20]].map((c) => ({ dot: c }))] },
  { name: 'cloud-lightning', batch: 18, parts: [S(cloudPath(-3, true)), S(polyline([[14, 12], [10, 17], [14, 17], [10, 22]]))] },
  { name: 'wind', batch: 18, parts: windParts },
  { name: 'snowflake', batch: 18, parts: snowflakeParts },
  { name: 'droplet', batch: 18, parts: [S(dropletPath())] },
  { name: 'umbrella', batch: 18, parts: umbrellaParts() },
  { name: 'thermometer', batch: 18, parts: thermometerParts },
  { name: 'sunrise', batch: 18, parts: [...sunHorizon, S(line([12, 12], [12, 5])), S(polyline([[8, 8], [12, 4], [16, 8]]))] },
  { name: 'sunset', batch: 18, parts: [...sunHorizon, S(line([12, 4], [12, 11])), S(polyline([[8, 8], [12, 12], [16, 8]]))] },
  { name: 'flame', batch: 18, parts: [S(flamePath())] },
  { name: 'leaf', batch: 18, parts: leafParts() },
  { name: 'tree', batch: 18, parts: treeParts() },
  { name: 'tree-pine', batch: 18, parts: treePineParts },
  { name: 'paw-print', batch: 18, parts: pawParts },

  // ===== девятнадцатая партия: устройства =====
  { name: 'wifi', batch: 19, parts: [...wifiArcs, { disk: [wifiC, 1.5] }] },
  { name: 'wifi-off', batch: 19, parts: [...cutBothSides(wifiArcs, [12, 12]), { disk: [wifiC, 1.5] }, S(line([4, 4], [20, 20]))] },
  { name: 'bluetooth', batch: 19, parts: bluetoothParts },
  { name: 'cast', batch: 19, parts: castParts },
  { name: 'laptop', batch: 19, parts: laptopParts },
  { name: 'tablet', batch: 19, parts: tabletParts },
  { name: 'smartphone', batch: 19, parts: smartphoneParts },
  { name: 'watch', batch: 19, parts: watchParts() },
  { name: 'keyboard', batch: 19, parts: keyboardParts },
  { name: 'speaker', batch: 19, parts: speakerParts },
  { name: 'cpu', batch: 19, parts: cpuParts },
  { name: 'hard-drive', batch: 19, parts: hardDriveParts },
  { name: 'battery', batch: 19, parts: batteryParts(0) },
  { name: 'battery-low', batch: 19, parts: batteryParts(1) },
  { name: 'battery-medium', batch: 19, parts: batteryParts(2) },
  { name: 'battery-full', batch: 19, parts: batteryParts(3) },
  { name: 'battery-charging', batch: 19, parts: batteryChargingParts() },

  // ===== двадцатая партия: люди и общение =====
  { name: 'user-cog', batch: 20, parts: P20.userCog },
  { name: 'bell-ring', batch: 20, parts: P20.bellRing },
  { name: 'phone-call', batch: 20, parts: P20.phoneCall },
  { name: 'hand', batch: 20, parts: P20.hand },
  { name: 'accessibility', batch: 20, parts: P20.accessibility },
  { name: 'newspaper', batch: 20, parts: P20.newspaper },
  { name: 'mail-open', batch: 20, parts: P20.mailOpen },
  { name: 'languages', batch: 20, parts: P20.languages },
  { name: 'contact', batch: 20, parts: P20.contact },
  { name: 'headset', batch: 20, parts: P20.headset },
];
