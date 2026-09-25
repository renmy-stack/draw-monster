// node ura_rate.js [体数] — うら 5 人抜きを どれだけ クリアできるか（ランダムなモンスター と、おもてを クリアできた つよい モンスター）
'use strict';
const RB = require('./sim.js');
const { randomRobot } = require('./clear_rate.js');
const N = +(process.argv[2] || 1500);
function ladder(d, list) { let k = 0; for (; k < list.length; k++) if (RB.fight(d, list[k]).winner !== 'A') break; return k; }
const all = [], omoteClear = [];
while (all.length < N) { const d = randomRobot(); if (!d) continue; all.push(d); if (ladder(d, RB.CPU) === RB.CPU.length) omoteClear.push(d); }
function report(label, list) {
  const reach = new Array(RB.URA.length + 1).fill(0);
  for (const d of list) reach[ladder(d, RB.URA)]++;
  console.log(label + '（' + list.length + ' 体）: ' + reach.map((c, k) => k + '人 ' + (c / list.length * 100).toFixed(1) + '%').join(' / '));
}
report('ランダムなモンスター', all.slice(0, 600));
report('おもてを クリアできた モンスター', omoteClear);
