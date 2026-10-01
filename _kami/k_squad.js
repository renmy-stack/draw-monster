// node k_squad.js — かみの 5 たいを 1 たいずつ きめる（軽い 計算: 前の 体で 止まらなかった 形とだけ 戦わせる）
// ものさし C = いまの ランキング 上位 30（ぜったい 止める）＋ みんなを クリアした 実際の 形。かみの 5 たいは こちらで 作った 形だけ
const fs = require('fs'), { run } = require('../_terrain/tp_par.js'), { G, plain } = require('../_terrain/tp_gen.js'), RB = require('../sim.js');
const R = require('./rank_top.json'), S0 = require('./real_strong.json').strong;
const rank = R.top.map(t => t.c), rankSet = new Set(rank);
const clear = S0.filter(o => o.t.includes('minnaclear') || o.rm >= 5).map(o => o.c).filter(c => !rankSet.has(c));
const C = [...new Set(rank.concat(clear))];
const ura = RB.URA.map(d => RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg }));
const evo = require('./evo_1.json');
const pool = [...new Set(evo.slice(0, 60).map(x => x.c).concat(ura))];
const stops = r => r !== 'A';   // ひきわけも 先へ 進めない
let seed = 4711; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let fights = 0; const go = async ps => { fights += ps.length; return run(ps); };
const evoP = new Map(evo.map(x => [x.c, x.p]));

// 生き残り（S）を いちばん 多く 止める 候補。S が 大きい ときは 100 で ふるいに かけて 上位 12 だけ 全部と
async function best(S, cand) {
  let list = cand;
  if (S.length > 150) {
    const smp = S.filter((_, i) => i % Math.ceil(S.length / 100) === 0);
    const r = await go(list.flatMap(d => smp.map(a => [a, d, 'flat'])));
    list = list.map((d, i) => ({ d, n: r.slice(i * smp.length, (i + 1) * smp.length).filter(stops).length })).sort((a, b) => b.n - a.n).slice(0, 12).map(x => x.d);
  }
  const r = await go(list.flatMap(d => S.map(a => [a, d, 'flat'])));
  return list.map((d, i) => ({ d, left: S.filter((a, k) => !stops(r[i * S.length + k])) })).sort((a, b) => a.left.length - b.left.length)[0];
}
// 生き残りが すくない ときは その 形たち 専用に 進化させる（相手が すくないので 軽い）
async function special(S, base) {
  const P = 30, GEN = 25; let pop = [];
  for (const c of base) if (evoP.has(c)) pop.push({ p: evoP.get(c), c });
  while (pop.length < P) { const par = pop.length ? pop[Math.floor(rnd() * pop.length)] : null, q = par ? G.mutate(par.p, 0.15) : G.randP(), d = G.build(q); if (d) pop.push({ p: q, c: plain(d) }); }
  let top = null;
  for (let g = 0; g < GEN; g++) {
    const r = await go(pop.flatMap(x => S.map(a => [a, x.c, 'flat'])));
    pop.forEach((x, i) => x.left = S.filter((a, k) => !stops(r[i * S.length + k])));
    pop.sort((a, b) => a.left.length - b.left.length);
    if (!top || pop[0].left.length < top.left.length) top = { d: pop[0].c, p: pop[0].p, left: pop[0].left };
    if (top.left.length === 0) break;
    const keep = pop.slice(0, 10), next = keep.slice(), step = 0.15 * (1 - g / GEN) + 0.03;
    while (next.length < P) { const par = keep[Math.floor(rnd() * keep.length)], q = G.mutate(par.p, step), d = G.build(q); if (d) next.push({ p: q, c: plain(d) }); }
    pop = next;
  }
  evoP.set(top.d, top.p);
  return top;
}
(async () => {
  G.setSeed(2468);
  console.log('ものさし', C.length, '（ランキング', rank.length, '＋ みんなクリア', clear.length, '）候補', pool.length);
  const squad = []; let S = C, t0 = Date.now();
  for (let k = 0; k < 5; k++) {
    const cand = pool.filter(d => !squad.includes(d));
    let b = await best(S, cand);
    if (b.left.length > 0 && S.length <= 120) { const sp = await special(S, cand.slice(0, 10)); if (sp.left.length < b.left.length) b = sp; }
    squad.push(b.d); S = b.left;
    console.log((k + 1) + ' たいめ: のこり', S.length, '（ランキング', S.filter(c => rankSet.has(c)).length, '）', '戦い', fights, ((Date.now() - t0) / 1000).toFixed(0) + '秒');
    if (!S.length) { console.log('ぜんぶ 止まった'); }
  }
  fs.writeFileSync('squad.json', JSON.stringify({ squad, left: S, fights }));
})();
