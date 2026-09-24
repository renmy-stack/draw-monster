// node tune.js [試す数] — つまみ K を ランダムに試して、腕の長さ・体の大きさ・足の長さで 勝率がかたよらない組を探す
'use strict';
const RB = require('./sim.js');
function ln(x0, y0, x1, y1, n) { const a = []; for (let i = 0; i <= n; i++) a.push([Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n)]); return a; }
function box(w, h) { return [[-w / 2, -60 - h], [w / 2, -60 - h], [w / 2, -60], [-w / 2, -60]].map(p => p.map(Math.round)); }
const mk = (w, h, arm, leg) => RB.design(RB.cleanStroke(box(w, h), RB.INK.body), RB.cleanStroke(ln(0, 0, arm, 0, Math.max(2, Math.round(arm / 10))), RB.INK.arm), RB.cleanStroke(ln(0, 0, 0, leg, 6), RB.INK.leg));
const pool = [];
for (const [w, h] of [[30, 30], [60, 70], [100, 100]]) for (const arm of [35, 70, 110]) for (const leg of [45, 80]) pool.push(mk(w, h, arm, leg));
const probes = {
  arm: [30, 60, 90, 120, 150].map(a => mk(60, 70, a, 60)),
  body: [[20, 20], [35, 40], [60, 70], [90, 90], [120, 110]].map(([w, h]) => mk(w, h, 60, 60)),
  tinyLong: [mk(20, 20, 150, 60), mk(20, 20, 100, 60)],
};
function rate(d) { let w = 0, t = 0; for (const p of pool) for (const [A, B, me] of [[d, p, 'A'], [p, d, 'B']]) { const S = RB.fight(A, B); if (S.winner === me) w++; t++; } return w / t; }
function evalK() {
  const r = {}; for (const k of Object.keys(probes)) r[k] = probes[k].map(rate);
  const spread = a => Math.max(...a) - Math.min(...a);
  const score = spread(r.arm) + spread(r.body) + Math.max(0, Math.max(...r.tinyLong) - 0.6) * 2;
  return { r, score };
}
const base = Object.assign({}, RB.K);
let seed = 3; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = a => a[Math.floor(rnd() * a.length)];
const N = +(process.argv[2] || 30), res = [];
const GRID = process.argv[3] ? JSON.parse(process.argv[3]) : null;
for (let i = 0; i < N; i++) {
  const k = i === 0 ? {} : Object.fromEntries(Object.entries(GRID || { perLen: [1 / 200, 1 / 140, 1 / 100, 1 / 70], reactArm: [0.2, 0.5, 0.8], kb: [6, 10, 16], kbMass: [0, 0.7, 1.2], hpP: [0.5, 0.8] }).map(([n, v]) => [n, pick(v)]));
  Object.assign(RB.K, base, k);
  const e = evalK(); res.push({ k, e });
  process.stdout.write('.');
}
res.sort((a, b) => a.e.score - b.e.score);
console.log();
const f = a => a.map(x => Math.round(x * 100)).join('/');
for (const x of res.slice(0, 6)) console.log(JSON.stringify(x.k), ' score', x.e.score.toFixed(2), ' 腕', f(x.e.r.arm), ' 体', f(x.e.r.body), ' ちび長腕', f(x.e.r.tinyLong));
const b0 = res.find(x => !Object.keys(x.k).length); console.log('いまの値', ' score', b0.e.score.toFixed(2), ' 腕', f(b0.e.r.arm), ' 体', f(b0.e.r.body), ' ちび長腕', f(b0.e.r.tinyLong));
