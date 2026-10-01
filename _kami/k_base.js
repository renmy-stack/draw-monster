// node k_base.js — ものさし 全部（U）と かみ 5 たいの 表を 作る → base.json
// U = ランキング 上位 30 ＋ みんなクリア ＋ ランク登録 ＋ うらクリア。4 分の 1 は たしかめ用（test、作るのには 使わない）
const fs = require('fs'), { run } = require('../_terrain/tp_par.js'), RB = require('../sim.js');
const J = require('./real_strong.json'), R = require('./rank_top.json');
const rank = R.top.map(t => t.c);
const all = [...new Set(rank.concat(
  J.strong.filter(o => o.t.includes('minnaclear') || o.rm >= 5).map(o => o.c),
  J.rank,
  J.strong.filter(o => o.t.includes('uraclear') || o.ru >= 5).map(o => o.c)))];
const h = s => { let x = 7; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0; return x; };
const rankSet = new Set(rank);
const U = all.map(c => ({ c, rank: rankSet.has(c), test: !rankSet.has(c) && h(c) % 4 === 0 }));
const sq = JSON.parse(fs.readFileSync('squad3.json', 'utf8')).squad;
(async () => {
  const t0 = Date.now(), r = await run(U.flatMap(u => sq.map(s => [u.c, s.c, 'flat'])));
  U.forEach((u, i) => u.m = sq.map((s, k) => r[i * 5 + k] !== 'A' ? 1 : 0));
  const pass = U.filter(u => !u.m.some(Boolean));
  console.log('U', U.length, '（作る用', U.filter(u => !u.test).length, '・たしかめ用', U.filter(u => u.test).length, '）ぬける', pass.length, '（作る用', pass.filter(u => !u.test).length, '・たしかめ用', pass.filter(u => u.test).length, '・ランキング', pass.filter(u => u.rank).length, '）', ((Date.now() - t0) / 1000).toFixed(0) + '秒');
  for (let k = 0; k < 5; k++) console.log(k + 1, 'たいめ: 止める', U.filter(u => u.m[k]).length, '・この 体だけが 止める', U.filter(u => u.m[k] && u.m.reduce((a, b) => a + b, 0) === 1).length);
  fs.writeFileSync('base.json', JSON.stringify({ U, squad: sq }));
})();
