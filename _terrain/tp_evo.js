// node tp_evo.js 地形 — その 地形で 相手（右がわ）として 強い 形を 進化で 育てる。うまれた 形は ぜんぶ おぼえる（うらの 候補）
const fs = require('fs');
const RB = require('../sim.js'), { run, TER } = require('./tp_par.js'), { G, plain } = require('./tp_gen.js');
const tk = process.argv[2], P = 36, GEN = 14;
let seed = 99; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pool = require('./tp_pool.json'), rank = require('./gd_in.json').ranked.map(m => m.code);
// 挑戦者（左）: ランクせんの 形 30（挑戦者 として だけ 使う）＋ 人が 描きそうな 形 10
const ch = rank.filter((_, i) => i % 25 === 3).slice(0, 30).concat(pool.R.slice(1400, 1410));
(async () => {
  G.setSeed(1234 + tk.length * 77);
  let pop = []; while (pop.length < P) { const p = G.randP(), d = G.build(p); if (d) pop.push({ p, c: plain(d) }); }
  const all = new Map(), t0 = Date.now();
  for (let g = 0; g < GEN; g++) {
    const pairs = []; for (const x of pop) for (const a of ch) pairs.push([a, x.c, tk]);
    const r = await run(pairs);
    pop.forEach((x, i) => { let w = 0, n = 0; for (let k = 0; k < ch.length; k++) { const v = r[i * ch.length + k]; if (v === 'T') continue; n++; if (v === 'B') w++; } x.fit = n ? w / n : 0; x.tall = r.slice(i * ch.length, (i + 1) * ch.length).every(v => v === 'T'); });
    for (const x of pop) if (!all.has(x.c)) all.set(x.c, { c: x.c, fit: x.fit, g });
    pop.sort((a, b) => b.fit - a.fit);
    console.log(tk, '世代', g, 'いちばん', (pop[0].fit * 100).toFixed(0) + '%', '上位4', (pop.slice(0, 4).reduce((s, x) => s + x.fit, 0) / 4 * 100).toFixed(0) + '%', ((Date.now() - t0) / 1000).toFixed(0) + '秒');
    const keep = pop.slice(0, 12), next = keep.slice(), step = 0.18 * (1 - g / GEN) + 0.04;
    while (next.length < P - 3) { const par = keep[Math.floor(rnd() * keep.length)], q = G.mutate(par.p, step), d = G.build(q); if (d) next.push({ p: q, c: plain(d) }); }
    while (next.length < P) { const q = G.randP(), d = G.build(q); if (d) next.push({ p: q, c: plain(d) }); }
    pop = next;
  }
  fs.writeFileSync('evo_' + tk + '.json', JSON.stringify([...all.values()].sort((a, b) => b.fit - a.fit)));
  console.log(tk, 'おわり', all.size, '体');
})();
