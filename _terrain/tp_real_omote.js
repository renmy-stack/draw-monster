// 実際の 形 1500 で 5 地形の おもてを 測る（水平は 28.1%）
const RB = require('../sim.js'), { run, TER } = require('./tp_par.js'), A = require('../arena.js'), ref = require('./real_ref.json');
const plain = d => RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg });
(async () => {
  for (const t of A.TERRAINS.slice(1)) {
    let alive = ref.om, n0 = alive.length;
    if (t.arena.ceil) { const r = await run(alive.map(a => [a, plain(t.cpu.omote[0]), t.key])); alive = alive.filter((_, i) => r[i] !== 'T'); }
    const n1 = alive.length, rates = [];
    for (const c of t.cpu.omote.map(plain)) { const r = await run(alive.map(a => [a, c, t.key])); const nx = alive.filter((_, i) => r[i] === 'A'); rates.push((nx.length / Math.max(1, alive.length) * 100).toFixed(0) + '%'); alive = nx; }
    console.log(t.name, (n1 < n0 ? '（天井に つかえる ' + (n0 - n1) + ' 形を のぞく）' : ''), '各段', rates.join(' '), '全部ぬけ', (alive.length / n1 * 100).toFixed(1) + '%');
  }
})();
