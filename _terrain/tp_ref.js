// 平らの 基準: 各段の 相手に「そこまで 勝ちのこった 挑戦者」が 勝つ 割合
const RB = require('C:/Users/umiya/OneDrive/Desktop/Share/claude/03_game-cc-company/draw-monster/sim.js');
const { run } = require(__dirname + '/tp_par.js'); const P = require(__dirname + '/tp_pool.json');
const plain = d => RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg });
const rank = require(__dirname + '/gd_in.json').ranked.map(m => m.code);
const uraS = P.ura.filter((_, i) => i % 4 === 0);
async function ladder(pool, cpus, t) {
  let alive = pool.slice(); const rates = [];
  for (const c of cpus) { const res = await run(alive.map(a => [a, c, t])); const nx = alive.filter((_, i) => res[i] === 'A'); rates.push(+(nx.length / alive.length).toFixed(3)); alive = nx; if (!alive.length) break; }
  return { n: pool.length, rates, clear: alive.length };
}
(async () => {
  const out = {};
  out.omote = await ladder(P.R, RB.CPU.map(plain), 'flat');
  out.ura = await ladder(rank, RB.URA.map(plain), 'flat');
  out.minna = await ladder(uraS, RB.MINNA.map(plain), 'flat');
  console.log(JSON.stringify(out));
  require('fs').writeFileSync(__dirname + '/tp_ref.json', JSON.stringify(out));
})();
