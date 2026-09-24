// node sweep.js — 腕の長さ・体の大きさを変えたロボが、いろいろな相手にどれだけ勝つか（損得のかたよりを見る）
'use strict';
const RB = require('./sim.js');
function ln(x0, y0, x1, y1, n) { const a = []; for (let i = 0; i <= n; i++) a.push([Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n)]); return a; }
function box(w, h) { return [[-w / 2, -60 - h], [w / 2, -60 - h], [w / 2, -60], [-w / 2, -60]].map(p => p.map(Math.round)); }
const mk = (w, h, arm, leg) => RB.design(RB.cleanStroke(box(w, h), RB.INK.body), RB.cleanStroke(ln(0, 0, arm, 0, Math.max(2, Math.round(arm / 10))), RB.INK.arm), RB.cleanStroke(ln(0, 0, 0, leg, 6), RB.INK.leg));
// 相手: 体 3 種 × 腕 3 種 × 足 2 種
const pool = [];
for (const [w, h] of [[40, 50], [60, 70], [90, 90]]) for (const arm of [40, 70, 100]) for (const leg of [45, 70]) pool.push(mk(w, h, arm, leg));
function rate(d) { let w = 0, t = 0; for (const p of pool) { for (const [A, B, me] of [[d, p, 'A'], [p, d, 'B']]) { const S = RB.fight(A, B); if (S.winner === me) w++; t++; } } return Math.round(w / t * 100); }
const out = [];
out.push('腕の長さ（体 60×70・足 60）: ' + [30, 50, 70, 100, 130, 150].map(a => a + ':' + rate(mk(60, 70, a, 60)) + '%').join('  '));
out.push('体の大きさ（腕 60・足 60）:  ' + [[20, 20], [30, 30], [45, 50], [60, 70], [90, 90], [120, 110]].map(([w, h]) => w + 'x' + h + ':' + rate(mk(w, h, 60, 60)) + '%').join('  '));
out.push('足の長さ（体 60×70・腕 60）: ' + [30, 50, 70, 100, 130].map(l => l + ':' + rate(mk(60, 70, 60, l)) + '%').join('  '));
out.push('ちび体(20x20)の腕:           ' + [40, 70, 100, 150].map(a => a + ':' + rate(mk(20, 20, a, 60)) + '%').join('  '));
console.log(out.join('\n'));
