// node challenge.js [世代] [集団] [種] — うら 5 人抜きを ぜんぶ抜ける形が あるかを 進化で探す（挑戦者）
// 点数 = 何人抜けたか ＋ 負けた戦いで 相手に与えた割合（0〜1）。5 人抜けたら 見つけた形を _challenger.json に
'use strict';
const RB = require('./sim.js');
const LIST = process.argv[5] ? require(process.argv[5]).map(c => RB.design(c.body, c.arm, c.leg)) : RB.URA;
let seed = +(process.argv[4] || 4242); const r = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const LIM = { w: [16, 130], h: [16, 150], cy: [-190, -40], round: [0, 1], armLen: [15, 150], armAng: [-1.4, 1.4], armZig: [0, 25], head: [0, 1], legLen: [15, 130], legAng: [-0.8, 0.8], legBend: [-1.2, 1.2] };
function randP() { const p = {}; for (const [k, [a, b]] of Object.entries(LIM)) p[k] = a + (b - a) * r(); return p; }
function mutate(p, s) { const q = Object.assign({}, p); for (const [k, [a, b]] of Object.entries(LIM)) if (r() < 0.5) q[k] = clamp(q[k] + gauss() * (b - a) * s, a, b); return q; }
function build(p) {
  const n = 16, body = [];
  for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; let x = Math.cos(t), y = Math.sin(t); if (p.round < 0.5) { const m = Math.max(Math.abs(x), Math.abs(y)); x /= m; y /= m; } body.push([x * p.w / 2, p.cy + y * p.h / 2]); }
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
function score(d) {
  let k = 0;
  for (; k < LIST.length; k++) { const S = RB.fight(d, LIST[k]); if (S.winner !== 'A') return k + (1 - S.B.hp / S.B.maxHp) * 0.99; }
  return LIST.length;
}
const G = +(process.argv[2] || 30), P = +(process.argv[3] || 30);
let pop = []; while (pop.length < P) { const p = randP(), d = build(p); if (d) pop.push({ p, d }); }
let found = null, bestEver = 0;
for (let g = 0; g < G && !found; g++) {
  for (const x of pop) { x.s = score(x.d); if (x.s >= LIST.length) { found = x; break; } }
  if (found) break;
  pop.sort((a, b) => b.s - a.s); bestEver = Math.max(bestEver, pop[0].s);
  console.log('世代 ' + g + '  いちばん ' + pop[0].s.toFixed(2) + ' 人ぶん');
  const keep = pop.slice(0, Math.ceil(P / 3)), next = keep.slice(), step = 0.2 * (1 - g / G) + 0.03;
  while (next.length < P - 3) { const par = keep[Math.floor(r() * keep.length)], q = mutate(par.p, step), d = build(q); if (d) next.push({ p: q, d }); }
  while (next.length < P) { const q = randP(), d = build(q); if (d) next.push({ p: q, d }); }
  pop = next;
}
if (found) { console.log('5 人抜き できる形 あり'); require('fs').writeFileSync('_challenger.json', JSON.stringify({ body: found.d.body, arm: found.d.arm, leg: found.d.leg, p: found.p })); }
else console.log('見つからず（さいこう ' + bestEver.toFixed(2) + ' 人ぶん）');
