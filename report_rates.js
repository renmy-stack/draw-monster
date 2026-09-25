// node report_rates.js — おもて・うら それぞれ、キャラ 1 体ずつの勝率（単独）と、勝ち抜きの何人抜き・5 人抜きの確率
'use strict';
const RB = require('./sim.js');
const { randomRobot } = require('./clear_rate.js');
const src = require('fs').readFileSync('./challenge.js', 'utf8');
const m = {}; new Function('RB', 'process', 'm', src.slice(src.indexOf('let seed'), src.indexOf('function score')).replace('let seed = +(process.argv[4] || 4242);', 'let seed = 555;') + '; m.randP = randP; m.build = build;')(RB, { argv: [] }, m);
function ladder(d, L) { let k = 0; for (; k < L.length; k++) if (RB.fight(d, L[k]).winner !== 'A') break; return k; }
const human = []; while (human.length < +(process.argv[2] || 1500)) { const d = randomRobot(); if (d) human.push(d); }
const wide = []; while (wide.length < +(process.argv[3] || 600)) { const d = m.build(m.randP()); if (d) wide.push(d); }
const omoteClear = human.filter(d => ladder(d, RB.CPU) === 5);
const pct = x => (x * 100).toFixed(1) + '%';
for (const [label, L] of [['おもて', RB.CPU], ['うら', RB.URA]]) {
  console.log('\n■ ' + label);
  for (const [pname, P] of [['人が描きそう', human], ['おもてクリア組', omoteClear], ['広い範囲', wide]]) {
    if (label === 'おもて' && pname === 'おもてクリア組') continue;
    const single = L.map(c => P.filter(d => RB.fight(d, c).winner === 'A').length / P.length);
    const reach = new Array(L.length + 1).fill(0); for (const d of P) reach[ladder(d, L)]++;
    console.log(pname + '（' + P.length + ' 体）');
    console.log('  1 体ずつの勝率: ' + L.map((c, i) => c.name + ' ' + pct(single[i])).join(' / '));
    console.log('  何人抜き: ' + reach.map((c, k) => k + '人 ' + pct(c / P.length)).join(' / ') + '  → 5 人抜き ' + pct(reach[L.length] / P.length));
  }
}
