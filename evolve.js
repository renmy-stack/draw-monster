// node evolve.js [世代数] [集団の数] — 強いモンスターを 進化で探す（裏 5 人抜きの CPU 用）
// 形は 画面と同じ作り方（描ける範囲・インクの上限の中、うで・あしは 肩・腰から）なので、人が描ける形だけ
'use strict';
const RB = require('./sim.js');
const { randomRobot } = require('./clear_rate.js');
let seed = 777; const r = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const LIM = { w: [16, 130], h: [16, 150], cy: [-190, -40], round: [0, 1], armLen: [15, 150], armAng: [-1.4, 1.4], armZig: [0, 25], head: [0, 1], legLen: [15, 130], legAng: [-0.8, 0.8], legBend: [-1.2, 1.2] };
function randP() { const p = {}; for (const [k, [a, b]] of Object.entries(LIM)) p[k] = a + (b - a) * r(); return p; }
function mutate(p, s) { const q = Object.assign({}, p); for (const [k, [a, b]] of Object.entries(LIM)) if (r() < 0.5) q[k] = clamp(q[k] + gauss() * (b - a) * s, a, b); return q; }
function build(p) {
  const n = 16, body = [];
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2; let x = Math.cos(t), y = Math.sin(t);
    if (p.round < 0.5) { const m = Math.max(Math.abs(x), Math.abs(y)); x /= m; y /= m; }
    body.push([x * p.w / 2, p.cy + y * p.h / 2]);
  }
  const bodyC = RB.cleanStroke(body, RB.INK.body); if (bodyC.length < 3) return null;
  const j = RB.joints(bodyC);
  const arm = [], na = Math.max(3, Math.round(p.armLen / 10));
  for (let i = 0; i <= na; i++) { const d = p.armLen * i / na, z = p.armZig * (i % 2 ? 1 : -1) * (i > 0 && i < na ? 1 : 0); arm.push([j.shoulder[0] + Math.cos(p.armAng) * d - Math.sin(p.armAng) * z, j.shoulder[1] + Math.sin(p.armAng) * d + Math.cos(p.armAng) * z]); }
  if (p.head >= 0.5) { const e = arm[arm.length - 1], ux = Math.cos(p.armAng), uy = Math.sin(p.armAng); for (const [a, b] of [[0, -14], [14, -14], [14, 14], [0, 14], [0, 0]]) arm.push([e[0] + ux * a - uy * b, e[1] + uy * a + ux * b]); }
  const leg = [[j.hip[0], j.hip[1]]]; let x = j.hip[0], y = j.hip[1], a = Math.PI / 2 + p.legAng; const nl = Math.max(3, Math.round(p.legLen / 10));
  for (let i = 0; i < nl; i++) { a += p.legBend / nl; x += Math.cos(a) * p.legLen / nl; y += Math.sin(a) * p.legLen / nl; leg.push([x, y]); }
  const d = RB.design(bodyC, RB.cleanStroke(arm, RB.INK.arm), RB.cleanStroke(leg, RB.INK.leg));
  return RB.validDesign(d) ? d : null;
}
// 相手: 表の CPU ＋ ランダムなモンスター ＋ いまの強いもの（世代ごとに入れかえ）
const RANDOM = []; while (RANDOM.length < 40) { const d = randomRobot(); if (d) RANDOM.push(d); }
const G = +(process.argv[2] || 12), P = +(process.argv[3] || 24);
let pop = [];
while (pop.length < P) { const p = randP(), d = build(p); if (d) pop.push({ p, d }); }
let hall = [];   // これまでの強者
for (let g = 0; g < G; g++) {
  const opp = RB.CPU.concat(RANDOM.slice(0, 25), hall.slice(0, 8).map(h => h.d), pop.slice(0, 6).map(x => x.d));
  for (const x of pop) {
    let w = 0, t = 0;
    for (const o of opp) { if (o === x.d) continue; for (const [A, B, me] of [[x.d, o, 'A'], [o, x.d, 'B']]) { const S = RB.fight(A, B); if (S.winner === me) w++; t++; } }
    x.fit = w / t;
  }
  pop.sort((a, b) => b.fit - a.fit);
  hall = hall.concat(pop.slice(0, 3).map(x => ({ p: x.p, d: x.d, fit: x.fit, g }))).sort((a, b) => b.fit - a.fit).slice(0, 20);
  console.log('世代 ' + g + '  いちばん ' + Math.round(pop[0].fit * 100) + '%  上位4の平均 ' + Math.round(pop.slice(0, 4).reduce((s, x) => s + x.fit, 0) / 4 * 100) + '%');
  // 次の世代: 上位 1/3 を残し、変化させた子で埋める（新しいランダムも少し）
  const keep = pop.slice(0, Math.ceil(P / 3)), next = keep.slice();
  const step = 0.18 * (1 - g / G) + 0.04;
  while (next.length < P - 2) { const par = keep[Math.floor(r() * keep.length)], q = mutate(par.p, step), d = build(q); if (d) next.push({ p: q, d }); }
  while (next.length < P) { const q = randP(), d = build(q); if (d) next.push({ p: q, d }); }
  pop = next;
}
require('fs').writeFileSync('_elite.json', JSON.stringify(hall.map(h => ({ fit: h.fit, g: h.g, p: h.p, d: { body: h.d.body, arm: h.d.arm, leg: h.d.leg } }))));
console.log('強者 ' + hall.length + ' 体を _elite.json に');
