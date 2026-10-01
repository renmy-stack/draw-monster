// node k_evo.js 種 — かみ の 候補（右がわ）を 進化で 育てる。形は こちらで 作る（evolve.js の 遺伝子）。
// 相手（左）: みんなを クリアした 実際の 形から 60（種ごとに ちがう 60）。いちばん たくさん 止める 形が 強い
const fs = require('fs'), { run } = require('../_terrain/tp_par.js'), { G, plain } = require('../_terrain/tp_gen.js');
const sd = +process.argv[2] || 1, P = 40, GEN = 30, NC = 60;
let seed = 1000 + sd * 7919; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const S = require('./real_strong.json').strong, mc = S.filter(o => o.t.includes('minnaclear') || o.rm >= 5).map(o => o.c);
const ch = []; const used = new Set(); while (ch.length < NC) { const i = Math.floor(rnd() * mc.length); if (!used.has(i)) { used.add(i); ch.push(mc[i]); } }
(async () => {
  G.setSeed(31337 + sd * 101);
  let pop = []; while (pop.length < P) { const p = G.randP(), d = G.build(p); if (d) pop.push({ p, c: plain(d) }); }
  const all = new Map(), t0 = Date.now();
  for (let g = 0; g < GEN; g++) {
    const pairs = []; for (const x of pop) for (const a of ch) pairs.push([a, x.c, 'flat']);
    const r = await run(pairs);
    pop.forEach((x, i) => { let w = 0; for (let k = 0; k < NC; k++) if (r[i * NC + k] !== 'A') w++; x.fit = w / NC; });
    for (const x of pop) if (!all.has(x.c)) all.set(x.c, { c: x.c, p: x.p, fit: x.fit, g, sd });
    pop.sort((a, b) => b.fit - a.fit);
    console.log('種', sd, '世代', g, 'いちばん', (pop[0].fit * 100).toFixed(0) + '%', '上位5', (pop.slice(0, 5).reduce((s, x) => s + x.fit, 0) / 5 * 100).toFixed(0) + '%', ((Date.now() - t0) / 1000).toFixed(0) + '秒');
    const keep = pop.slice(0, 12), next = keep.slice(), step = 0.18 * (1 - g / GEN) + 0.04;
    while (next.length < P - 4) { const par = keep[Math.floor(rnd() * keep.length)], q = G.mutate(par.p, step), d = G.build(q); if (d) next.push({ p: q, c: plain(d) }); }
    while (next.length < P) { const q = G.randP(), d = G.build(q); if (d) next.push({ p: q, c: plain(d) }); }
    pop = next;
  }
  fs.writeFileSync('evo_' + sd + '.json', JSON.stringify([...all.values()].sort((a, b) => b.fit - a.fit)));
  console.log('種', sd, 'おわり', all.size, '体');
})();
