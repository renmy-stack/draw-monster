// 実際の 形で 水平の おもて・うらを 最後まで 戦わせる（記録の 突破率と くらべる）
const RB = require('../sim.js'), { run } = require('./tp_par.js'), P = require('./real_pool.json');
const plain = d => RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg });
let seed = 3; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const pick = (a, n) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
async function ladder(pool, cpus, t) { let alive = pool.slice(); const rates = []; for (const c of cpus) { const r = await run(alive.map(a => [a, c, t])); const nx = alive.filter((_, i) => r[i] === 'A'); rates.push(nx.length / Math.max(1, alive.length)); alive = nx; } return { rates, clear: alive.length / pool.length }; }
(async () => {
  const om = pick(P.omote, 1500), ur = pick(P.ura, 1500);
  const f = x => (x * 100).toFixed(1) + '%';
  const a = await ladder(om, RB.CPU.map(plain), 'flat'); console.log('おもて（1500 形）: 各段', a.rates.map(f).join(' '), '全部ぬけ', f(a.clear), '｜ 記録', f(om.filter(c => P.reach.omote[c] >= 5).length / om.length));
  const b = await ladder(ur, RB.URA.map(plain), 'flat'); console.log('うら（1500 形）: 各段', b.rates.map(f).join(' '), '全部ぬけ', f(b.clear), '｜ 記録', f(ur.filter(c => P.reach.ura[c] >= 5).length / ur.length));
  require('fs').writeFileSync('real_ref.json', JSON.stringify({ om, ur, omote: a, ura: b }));
})();
