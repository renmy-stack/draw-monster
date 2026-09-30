// プレイヤー（左）の 最強形は 地形ごとに ちがうか: 各地形で 育てた 上位 5 を 6 地形で 実際の 形 60（育てるのに 使って いない）と 戦わせる
// node tp_cross_atk.js [地形の キー...]（育てた 形が ある ぶん）
const { run } = require('./tp_par.js'), RF = require('./real_ref.json'), fs = require('fs');
const T = process.argv.length > 2 ? process.argv.slice(2) : ['flat', 'yama', 'heya', 'dokutsu', 'gake', 'dansa'];
const opp = RF.om.slice(0, 30).concat(RF.ur.slice(0, 30));
(async () => {
  const ch = {}; for (const e of T) ch[e] = require('./atk_' + e + '.json').slice(0, 5).map(x => x.c);
  const tab = {};
  for (const e of T) { tab[e] = {}; for (const t of T) { const ps = []; for (const c of ch[e]) for (const o of opp) ps.push([c, o, t]); const r = await run(ps); tab[e][t] = r.filter(v => v === 'A').length / r.length; } }
  console.log('育てた ↓ / 戦う →  ' + T.map(t => t.padStart(8)).join(''));
  for (const e of T) console.log(e.padEnd(12), T.map(t => (((tab[e][t] * 100).toFixed(0) + '%') + (t === e ? '*' : ' ')).padStart(8)).join(''));
  for (const t of T) { const s = T.slice().sort((a, b) => tab[b][t] - tab[a][t]); console.log(t.padEnd(12), 'いちばん', s[0], (tab[s[0]][t] * 100).toFixed(0) + '%', ' 2 番', s[1], (tab[s[1]][t] * 100).toFixed(0) + '%', ' その地形 育ち', (tab[t][t] * 100).toFixed(0) + '%'); }
  fs.writeFileSync('cross_atk_' + T.join('_') + '.json', JSON.stringify(tab));
})();
