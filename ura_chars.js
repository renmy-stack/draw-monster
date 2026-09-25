// node ura_chars.js — うら 5 体の キャラごとの勝率（単独）と 何人抜き（人の形・広い範囲・輪の足・平たい）
'use strict';
const RB = require('./sim.js');
const { randomRobot } = require('./clear_rate.js');
const fs = require('fs');
const cm = {}; { const src = fs.readFileSync('./challenge.js', 'utf8'); new Function('RB', 'process', 'cm', src.slice(src.indexOf('let seed'), src.indexOf('function score')).replace('let seed = +(process.argv[4] || 4242);', 'let seed = 2468;') + '; cm.randP = randP; cm.build = build; cm.r = r;')(RB, { argv: [] }, cm); }
const gen = (n, f) => { const a = []; while (a.length < n) { const d = f(); if (d) a.push(d); } return a; };
const pops = [
  ['人が描きそうな形', gen(800, randomRobot)],
  ['広い範囲の形', gen(400, () => cm.build(cm.randP()))],
  ['輪の足の形', gen(300, () => { const p = cm.randP(); p.loop = 1; return cm.build(p); })],
  ['平たい形', gen(300, () => { const p = cm.randP(); p.w = 120 + cm.r() * 80; p.h = 16 + cm.r() * 29; return cm.build(p); })],
];
const L = RB.URA, pct = x => (x * 100).toFixed(1) + '%';
for (const [name, P] of pops) {
  const single = L.map(c => P.filter(d => RB.fight(d, c).winner === 'A').length / P.length);
  const reach = new Array(6).fill(0);
  for (const d of P) { let k = 0; for (; k < 5; k++) if (RB.fight(d, L[k]).winner !== 'A') break; reach[k]++; }
  console.log(name + '（' + P.length + ' 体）| ' + L.map((c, i) => c.name + ' ' + pct(single[i])).join(' / ') + ' | 何人抜き ' + reach.map((c, k) => k + '人 ' + pct(c / P.length)).join(' / '));
}
