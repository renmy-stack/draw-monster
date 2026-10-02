// node k_refine.js [入力] [出力] — かみの 5 たいを 1 たいずつ 作りなおす（ぬける 数が ふえない やり方）
// k たいめの 相手は「ほかの 4 たいを ぜんぶ ぬける 形」だけ（ランキング 上位は 重さ 100 で ぜったい 止める）
const fs = require('fs'), { run } = require('../_terrain/dist_par.js'), G2 = require('./k_gen2.js');
const IN = process.argv[2] || 'squad2.json', OUT = process.argv[3] || 'squad3.json';
const R = require('./rank_top.json'), S0 = require('./real_strong.json').strong;
const rank = R.top.map(t => t.c), rankSet = new Set(rank);
const C = [...new Set(rank.concat(S0.filter(o => o.t.includes('minnaclear') || o.rm >= 5).map(o => o.c)))];
const squad = JSON.parse(fs.readFileSync(IN, 'utf8')).squad;
let seed = 31; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const P = 20, GEN = 12, stops = v => v !== 'A';
let fights = 0; const go = ps => { fights += ps.length; return run(ps); };
const pass = M => C.filter((c, i) => M[i].every(v => !v));   // 5 たい ぜんぶ ぬけた
(async () => {
  const t0 = Date.now();
  // M[i][k] = C[i] を k たいめが 止める か
  const r0 = await go(C.flatMap(c => squad.map(s => [c, s.c, 'flat'])));
  const M = C.map((c, i) => squad.map((s, k) => stops(r0[i * 5 + k])));
  console.log('はじめ: ぬける', pass(M).length, '/', C.length, '（ランキング', pass(M).filter(c => rankSet.has(c)).length, '）');
  G2.setSeed(777);
  for (let k = 0; k < 5; k++) {
    const idx = C.map((c, i) => i).filter(i => M[i].every((v, j) => j === k || !v));   // ほかの 4 たいを ぬける 形
    const S = idx.map(i => C[i]), w = S.map(c => rankSet.has(c) ? 100 : 1);
    const score = v => v.reduce((s, x, j) => s + (stops(x) ? w[j] : 0), 0);
    let pop = [{ p: squad[k].p, c: squad[k].c }];
    while (pop.length < P) { const q = G2.mutate(squad[k].p, 0.1 + 0.1 * rnd()), d = G2.build(q); if (d) pop.push({ p: q, c: G2.plain(d) }); }
    let top = null;
    for (let g = 0; g < GEN; g++) {
      const r = await go(pop.flatMap(x => S.map(a => [a, x.c, 'flat'])));
      pop.forEach((x, i) => { x.v = r.slice(i * S.length, (i + 1) * S.length); x.fit = score(x.v); });
      pop.sort((a, b) => b.fit - a.fit);
      if (!top || pop[0].fit > top.fit) top = pop[0];
      const keep = pop.slice(0, 6), next = keep.slice(), step = 0.14 * (1 - g / GEN) + 0.03;
      while (next.length < P) { const par = keep[Math.floor(rnd() * keep.length)], q = G2.mutate(par.p, step), d = G2.build(q); if (d) next.push({ p: q, c: G2.plain(d) }); }
      pop = next;
    }
    const before = S.filter((c, j) => M[idx[j]][k]).length;
    squad[k] = { c: top.c, p: top.p };
    // 新しい k たいめの 列を 全部に ついて 計算しなおす（S の 中は もう わかって いる）
    const others = C.map((c, i) => i).filter(i => !idx.includes(i));
    const r2 = await go(others.map(i => [C[i], top.c, 'flat']));
    others.forEach((i, j) => M[i][k] = stops(r2[j])); idx.forEach((i, j) => M[i][k] = stops(top.v[j]));
    console.log(k + 1, 'たいめ: あいて', S.length, '止めた', before, '→', S.filter((c, j) => stops(top.v[j])).length, '／ ぬける', pass(M).length, '（ランキング', pass(M).filter(c => rankSet.has(c)).length, '）戦い', fights, ((Date.now() - t0) / 1000).toFixed(0) + '秒');
  }
  fs.writeFileSync(OUT, JSON.stringify({ squad, left: pass(M), fights }));
})();
