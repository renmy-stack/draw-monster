// 水平の うらの 基準（生成した 形 1 体ごと）: 全部 と「水平の おもてを クリアした 形」だけ
const RB = require('../sim.js'), { run } = require('./tp_par.js'), P = require('./tp_pool.json');
const plain = d => RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg });
async function ladder(pool, cpus) { let alive = pool.slice(); const rates = []; for (const c of cpus) { const r = await run(alive.map(a => [a, c, 'flat'])); const nx = alive.filter((_, i) => r[i] === 'A'); rates.push(+(nx.length / Math.max(1, alive.length)).toFixed(3)); alive = nx; } return { rates, clear: alive }; }
(async () => {
  const om = await ladder(P.R, RB.CPU.map(plain));
  const all = await ladder(P.R, RB.URA.map(plain)), oc = await ladder(om.clear, RB.URA.map(plain));
  const f = x => (x * 100).toFixed(1) + '%';
  console.log('全部（' + P.R.length + ' 体）: 各段', all.rates.map(f).join(' '), '全部ぬけ', f(all.clear.length / P.R.length));
  console.log('おもてクリア（' + om.clear.length + ' 体）: 各段', oc.rates.map(f).join(' '), '全部ぬけ', f(oc.clear.length / om.clear.length));
  require('fs').writeFileSync('ref_ura.json', JSON.stringify({ all: all.rates, oc: oc.rates, allClear: all.clear.length / P.R.length, ocClear: oc.clear.length / om.clear.length, omoteClear: om.clear }));
})();
