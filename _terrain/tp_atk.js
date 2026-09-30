// node tp_atk.js 地形 — プレイヤー（左がわ）として その 地形で 強い 形を 育てる。相手は 実際の 形 40（右）
const fs = require('fs'), RB = require('../sim.js'), { run } = require('./tp_par.js'), { G, plain } = require('./tp_gen.js'), RF = require('./real_ref.json');
const tk = process.argv[2], P = 36, GEN = 14;
let seed = 4242; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const opp = RF.om.slice(200, 220).concat(RF.ur.slice(200, 220));
(async () => {
  G.setSeed(777 + tk.length * 55 + tk.charCodeAt(0));
  let pop = []; while (pop.length < P) { const p = G.randP(), d = G.build(p); if (d) pop.push({ p, c: plain(d) }); }
  const all = new Map(), t0 = Date.now();
  for (let g = 0; g < GEN; g++) {
    const ps = []; for (const x of pop) for (const o of opp) ps.push([x.c, o, tk]);
    const r = await run(ps);
    pop.forEach((x, i) => { let w = 0; for (let k = 0; k < opp.length; k++) if (r[i * opp.length + k] === 'A') w++; x.fit = w / opp.length; });   // 天井に つかえる（T）は 0
    for (const x of pop) if (!all.has(x.c)) all.set(x.c, { c: x.c, fit: x.fit, g });
    pop.sort((a, b) => b.fit - a.fit);
    if (g === GEN - 1 || g % 4 === 0) console.log('攻め', tk, '世代', g, 'いちばん', (pop[0].fit * 100).toFixed(0) + '%', ((Date.now() - t0) / 1000).toFixed(0) + '秒');
    const keep = pop.slice(0, 12), next = keep.slice(), step = 0.18 * (1 - g / GEN) + 0.04;
    while (next.length < P - 3) { const par = keep[Math.floor(rnd() * keep.length)], q = G.mutate(par.p, step), d = G.build(q); if (d) next.push({ p: q, c: plain(d) }); }
    while (next.length < P) { const q = G.randP(), d = G.build(q); if (d) next.push({ p: q, c: plain(d) }); }
    pop = next;
  }
  fs.writeFileSync('atk_' + tk + '.json', JSON.stringify([...all.values()].sort((a, b) => b.fit - a.fit).slice(0, 30)));
  console.log('攻め', tk, 'おわり');
})();
