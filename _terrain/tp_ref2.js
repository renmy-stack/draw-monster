// 水平の 基準（ランダムの 形 2000 体 ぜんぶ ちがう 形 で はかりなおし）
const RB = require('../sim.js'), { run } = require('./tp_par.js'), P = require('./tp_pool.json');
const plain = d => RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg });
(async () => { let alive = P.R.slice(); const rates = [];
  for (const c of RB.CPU.map(plain)) { const r = await run(alive.map(a => [a, c, 'flat'])); const nx = alive.filter((_, i) => r[i] === 'A'); rates.push(+(nx.length / alive.length).toFixed(3)); alive = nx; }
  console.log('水平 おもて', P.R.length, '体: 各段', rates.map(x => (x * 100).toFixed(1) + '%').join(' '), '全部ぬけ', (alive.length / P.R.length * 100).toFixed(1) + '%'); })();
