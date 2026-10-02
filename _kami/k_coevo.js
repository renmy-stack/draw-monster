// node k_coevo.js [回数] — いたちごっこ: 攻め（A3、ぬける 形を さがす）→ 守り（A1、1 たいを 作りなおす）を くりかえす
// 守りの 強さ = その 体が 止める（ぬけて いる 形）− 止めなく なる（その 体だけが 止めて いた 形）。ランキング 上位は 重さ 100
const fs = require('fs'), { execFileSync } = require('child_process'), { run } = require('../_terrain/dist_par.js'), G2 = require('./k_gen2.js');
const N = +process.argv[2] || 6, P = 16, GEN = 10, CAP = 40;
let seed = 515; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const stop = v => v !== 'A', W = u => u.rank ? 100 : 1;
let fights = 0; const go = ps => { fights += ps.length; return ps.length ? run(ps) : []; };
(async () => {
  G2.setSeed(8080); const t0 = Date.now();
  for (let it = 0; it < N; it++) {
    // 攻め: 新しい 種で ぬける 形を さがす（found.json に 足される）
    fs.writeFileSync('found.json', '[]');
    const out = execFileSync('node', ['k_atk.js', String(100 + it), '20']).toString().trim().split('\n').pop();
    const st = JSON.parse(fs.readFileSync('base.json', 'utf8')), U = st.U, squad = st.squad;
    const known = new Set(U.map(u => u.c));
    let nf = JSON.parse(fs.readFileSync('found.json', 'utf8')).filter(c => !known.has(c));
    const nfAll = nf.length; nf = nf.sort(() => rnd() - 0.5).slice(0, CAP);
    if (nf.length) { const r = await go(nf.flatMap(c => squad.map(s => [c, s.c, 'flat']))); nf.forEach((c, i) => U.push({ c, rank: false, test: false, atk: true, m: squad.map((s, k) => stop(r[i * 5 + k]) ? 1 : 0) })); }
    // 守り: いちばん「その 体だけ」が 少ない 体（入れかえやすい）から 順に 1 たい
    const T = U.filter(u => !u.test && !u.m.some(Boolean));
    const uniq = k => U.filter(u => !u.test && u.m[k] && u.m.reduce((s, v) => s + v, 0) === 1);
    const k = it % 5, B = uniq(k), S = T.concat(B);
    const score = v => S.reduce((s, u, j) => s + (j < T.length ? (stop(v[j]) ? W(u) : 0) : (stop(v[j]) ? 0 : -W(u))), 0);
    let pop = [{ p: squad[k].p, c: squad[k].c }];
    while (pop.length < P) { const q = rnd() < 0.7 ? G2.mutate(squad[k].p, 0.08 + 0.12 * rnd()) : G2.mutate(squad[Math.floor(rnd() * 5)].p, 0.2), d = G2.build(q); if (d) pop.push({ p: q, c: G2.plain(d) }); }
    let top = null;
    for (let g = 0; g < GEN; g++) {
      const r = await go(pop.flatMap(x => S.map(u => [u.c, x.c, 'flat'])));
      pop.forEach((x, i) => { x.fit = score(r.slice(i * S.length, (i + 1) * S.length)); });
      pop.sort((a, b) => b.fit - a.fit); if (!top || pop[0].fit > top.fit) top = pop[0];
      const keep = pop.slice(0, 6), next = keep.slice(), step = 0.12 * (1 - g / GEN) + 0.03;
      while (next.length < P) { const par = keep[Math.floor(rnd() * keep.length)], q = G2.mutate(par.p, step), d = G2.build(q); if (d) next.push({ p: q, c: G2.plain(d) }); }
      pop = next;
    }
    const base = score(S.map((u, j) => j < T.length ? 'A' : 'B'));   // いまの 体の 点（T は 止めて いない・B は 止めて いる）
    if (top.c !== squad[k].c && top.fit > base) {
      squad[k] = { c: top.c, p: top.p };
      const r = await go(U.map(u => [u.c, top.c, 'flat'])); U.forEach((u, i) => u.m[k] = stop(r[i]) ? 1 : 0);
    }
    const p = U.filter(u => !u.m.some(Boolean));
    console.log('回', it + 1, '| 攻め:', out.replace(/^種 \d+ おわり: /, ''), '（新しい', nfAll, '→ 足した', nf.length, '）| 守り:', k + 1, 'たいめ', top.fit > base ? '入れかえ ' + base + '→' + top.fit : 'そのまま',
      '| ぬける: 実際の 形', p.filter(u => !u.atk).length, '（たしかめ用', p.filter(u => u.test).length, '・ランキング', p.filter(u => u.rank).length, '）・攻めで 見つけた 形', p.filter(u => u.atk).length, '/', U.filter(u => u.atk).length, '| 戦い', fights, ((Date.now() - t0) / 1000).toFixed(0) + '秒');
    fs.writeFileSync('base.json', JSON.stringify({ U, squad }));
  }
})();
