// 地形ごとに 最強の 形は ちがうか: 各地形で 育てた 上位 5 体を 6 地形で 同じ 挑戦者（実際の 形 60）と 戦わせる（相手＝右がわ として）
const { run } = require('./tp_par.js'), RF = require('./real_ref.json');
const T = ['flat', 'yama', 'heya', 'dokutsu', 'gake', 'dansa'], E = T.slice(1);
const ch = RF.ur.slice(0, 60);
(async () => {
  const champs = {}; for (const e of E) champs[e] = require('./evo_' + e + '.json').slice(0, 5).map(x => x.c);
  const tab = {};
  for (const e of E) { tab[e] = {}; for (const t of T) { const ps = []; for (const c of champs[e]) for (const a of ch) ps.push([a, c, t]); const r = await run(ps); const n = r.filter(v => v !== 'T').length; tab[e][t] = n ? r.filter(v => v === 'B').length / n : 0; } }
  console.log('育てた 地形 ↓ / 戦う 地形 →   ' + T.join('  '));
  for (const e of E) console.log(e.padEnd(8), T.map(t => ((tab[e][t] * 100).toFixed(0) + '%').padStart(6) + (t === e ? '*' : ' ')).join(''));
  for (const t of E) { const best = E.slice().sort((a, b) => tab[b][t] - tab[a][t])[0]; console.log(t, 'で いちばん 強いのは', best, 'で 育てた 形'); }
})();
