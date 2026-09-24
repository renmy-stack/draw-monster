// node trace.js [A番号] [B番号] — CPU ロボどうしの 1 戦を 1 秒ごとに
'use strict';
const RB = require('./sim.js');
const a = +(process.argv[2] || 0), b = +(process.argv[3] || 4);
const S = RB.create(RB.CPU[a], RB.CPU[b]); let hits = 0, downs = 0;
while (!S.over) {
  RB.step(S);
  for (const e of S.fx) { if (e.t === 'hit') hits++; if (e.t === 'down') downs++; }
  S.fx.length = 0;
  if (Math.round(S.t * 240) % 240 === 0) console.log('t' + S.t.toFixed(0), 'A x' + S.A.x.toFixed(0), 'th' + S.A.th.toFixed(2), 'hp' + S.A.hp, '| B x' + S.B.x.toFixed(0), 'th' + S.B.th.toFixed(2), 'hp' + S.B.hp);
}
console.log(RB.CPU[a].name, 'vs', RB.CPU[b].name, S.reason, S.winner, S.t.toFixed(1) + '秒', 'hits', hits, 'downs', downs);
