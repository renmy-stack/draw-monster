// node _mix.js — 今の裏 5 体 ＋ 攻略形 A〜F（11 体）から 5 体を選ぶ並びごとに、いろいろな挑戦者のうち 何体が 5 人抜きできるか
'use strict';
const RB = require('./sim.js'), fs = require('fs');
const { randomRobot } = require('./clear_rate.js');
const D = x => RB.design(x.body, x.arm, x.leg);
const NEWS = require('./_uc_all.json').map(x => D(x.d));
const DEF = RB.URA.slice().concat(NEWS), NAMES = RB.URA.map(d => d.name).concat(['A', 'B', 'C', 'D', 'E', 'F']);
const known = [], tag = [];
const add = (d, t) => { if (d && RB.validDesign(d)) { known.push(d); tag.push(t); } };
NEWS.forEach((d, i) => add(d, 'AF'));
for (const f of fs.readdirSync('.')) {
  if (!/^_(ch_all|owner\d?|coevo_round\d_clear|challenger_\d+|elite\w*|pool|co_\w+|explore_all)\.json$/.test(f)) continue;
  let j = require('./' + f); if (!Array.isArray(j)) j = [j];
  for (const x of j) { const y = x.d || x; if (y.body) add(D(y), 'known'); }
}
let s = 777; const save = Math.random; Math.random = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
const rnd = []; while (rnd.length < 1500) { const d = randomRobot(); if (d) rnd.push(d); }
Math.random = save;
const ATT = known.concat(rnd), T = tag.concat(rnd.map(() => 'rand'));
console.log('挑戦者: 既知 ' + known.length + '（うち A〜F 6）＋ ランダム ' + rnd.length);
// 勝ち表: ATT × DEF（ビット）
const win = ATT.map(a => DEF.map(d => RB.fight(a, d).winner === 'A'));
const combos = []; const idx = [...Array(11).keys()];
(function rec(st, cur) { if (cur.length === 5) { combos.push(cur.slice()); return; } for (let i = st; i < 11; i++) { cur.push(i); rec(i + 1, cur); cur.pop(); } })(0, []);
const res = [];
for (const c of combos) {
  const nNew = c.filter(i => i >= 5).length; if (nNew > 2) continue;
  let cAF = 0, cKnown = 0, cRand = 0;
  ATT.forEach((a, k) => { if (c.every(i => win[k][i])) { if (T[k] === 'AF') cAF++; else if (T[k] === 'known') cKnown++; else cRand++; } });
  res.push({ c, names: c.map(i => NAMES[i]).join('・'), nNew, cAF, cKnown, cRand, tot: cAF + cKnown + cRand });
}
res.sort((a, b) => a.tot - b.tot || a.cAF - b.cAF);
const show = r => console.log(r.names.padEnd(24) + ' 新' + r.nNew + '  A〜F ' + r.cAF + '/6  既知 ' + r.cKnown + '  ランダム ' + r.cRand);
console.log('--- いま ---'); show(res.find(r => r.nNew === 0));
for (const n of [1, 2]) { console.log('--- ' + n + ' 体 入れかえ（上位）---'); res.filter(r => r.nNew === n).slice(0, 8).forEach(show); }
// 個別の勝率（1 体ずつ、挑戦者全体に対して）
console.log('--- 1 体ずつの 挑戦者勝率 ---');
DEF.forEach((d, i) => { const w = win.filter(r => r[i]).length; console.log(NAMES[i] + ' ' + (w / ATT.length * 100).toFixed(1) + '%'); });
fs.writeFileSync('_mix_res.json', JSON.stringify(res));
