// node test_sim.js — CPU ロボの総当たり（勝ち数・決着の秒・ダウン）、決定的か、URL の往復
'use strict';
const RB = require('./sim.js');
const C = RB.CPU, w = C.map(() => 0);
let secs = 0, downs = 0, n = 0, ko = 0;
for (let i = 0; i < C.length; i++) for (let j = 0; j < C.length; j++) {
  if (i === j) continue;
  const S = RB.create(C[i], C[j]);
  while (!S.over) { RB.step(S); for (const e of S.fx) if (e.t === 'down') downs++; S.fx.length = 0; }
  if (S.winner === 'A') w[i]++; else if (S.winner === 'B') w[j]++;
  secs += S.t; n++; if (S.reason === 'ko') ko++;
}
console.log('勝ち数: ' + C.map((c, i) => c.name + ' ' + w[i]).join(' / '));
console.log('平均 ' + (secs / n).toFixed(1) + ' 秒・ダウン ' + (downs / n).toFixed(1) + ' 回・KO ' + ko + '/' + n);
const a = RB.fight(C[0], C[4]), b = RB.fight(C[0], C[4]);
console.log('同じ結果になるか:', a.A.hp === b.A.hp && a.B.hp === b.B.hp && a.t === b.t ? 'OK' : 'NG');
const enc = RB.encodeDesign(C[4]), dec = RB.decodeDesign(enc);
console.log('URL の往復:', dec && JSON.stringify([dec.body, dec.arm, dec.leg]) === JSON.stringify([C[4].body, C[4].arm, C[4].leg]) ? 'OK' : 'NG', enc.length + '文字');
