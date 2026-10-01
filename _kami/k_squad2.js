// node k_squad2.js — かみの 5 たいを 1 たいずつ 進化で 作る（作り方 2）。
// 相手は「前の 体で 止まらなかった 形」だけ（軽い）: ランキング 上位 30（ぜったい）＋ みんなクリアから 60（ためし）
// 最後に みんなクリア 全部で たしかめる（負けた ところで 打ち切り）
const fs = require('fs'), { run } = require('../_terrain/tp_par.js'), G2 = require('./k_gen2.js');
const R = require('./rank_top.json'), S0 = require('./real_strong.json').strong;
const rank = R.top.map(t => t.c), rankSet = new Set(rank);
const clear = [...new Set(S0.filter(o => o.t.includes('minnaclear') || o.rm >= 5).map(o => o.c))].filter(c => !rankSet.has(c));
let seed = 97; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const smp = []; { const u = new Set(); while (smp.length < 60) { const i = Math.floor(rnd() * clear.length); if (!u.has(i)) { u.add(i); smp.push(clear[i]); } } }
const P = 24, GEN = 20, stops = v => v !== 'A';
let fights = 0; const go = ps => { fights += ps.length; return run(ps); };
async function slot(Sr, Sc, k) {
  G2.setSeed(5000 + k * 131);
  let pop = []; while (pop.length < P) { const p = G2.randP(), d = G2.build(p); if (d) pop.push({ p, c: G2.plain(d) }); }
  let top = null; const S = Sr.concat(Sc);
  for (let g = 0; g < GEN; g++) {
    const r = await go(pop.flatMap(x => S.map(a => [a, x.c, 'flat'])));
    pop.forEach((x, i) => { const v = r.slice(i * S.length, (i + 1) * S.length); x.lr = Sr.filter((a, j) => !stops(v[j])); x.lc = Sc.filter((a, j) => !stops(v[Sr.length + j])); x.fit = (Sr.length - x.lr.length) * 3 + (Sc.length - x.lc.length); });
    pop.sort((a, b) => b.fit - a.fit);
    if (!top || pop[0].fit > top.fit) top = pop[0];
    if (g % 5 === 4 || g === GEN - 1) console.log('  ', k + 1, 'たいめ 世代', g, 'ランキング のこり', top.lr.length, '/', Sr.length, 'ためし のこり', top.lc.length, '/', Sc.length);
    if (!top.lr.length && !top.lc.length) break;
    const keep = pop.slice(0, 8), next = keep.slice(), step = 0.2 * (1 - g / GEN) + 0.04;
    while (next.length < P - 3) { const par = keep[Math.floor(rnd() * keep.length)], q = G2.mutate(par.p, step), d = G2.build(q); if (d) next.push({ p: q, c: G2.plain(d) }); }
    while (next.length < P) { const q = G2.randP(), d = G2.build(q); if (d) next.push({ p: q, c: G2.plain(d) }); }
    pop = next;
  }
  return top;
}
(async () => {
  const t0 = Date.now(), squad = [];
  let Sr = rank, Sc = smp;
  for (let k = 0; k < 5; k++) {
    if (!Sr.length && !Sc.length) { Sc = smp; }   // ぜんぶ 止まったら、のこりの 枠は ためし 全体に 強い 体
    const t = await slot(Sr, Sc, k);
    squad.push({ c: t.c, p: t.p });
    Sr = t.lr; Sc = t.lc;
    console.log(k + 1, 'たいめ きまり: ランキング のこり', Sr.length, 'ためし のこり', Sc.length, '戦い', fights, ((Date.now() - t0) / 1000).toFixed(0) + '秒');
  }
  // たしかめ: みんなクリア 全部を 1 たいめから（負けたら 打ち切り）
  let S = clear;
  for (let k = 0; k < 5; k++) { const r = await go(S.map(a => [a, squad[k].c, 'flat'])); S = S.filter((a, i) => !stops(r[i])); }
  console.log('たしかめ: みんなクリア', clear.length, 'のうち かみを ぬけた', S.length, '／ 戦い ぜんぶで', fights, ((Date.now() - t0) / 1000).toFixed(0) + '秒');
  fs.writeFileSync('squad2.json', JSON.stringify({ squad, leftClear: S, fights }));
})();
