// node k_opt.js [回数] — かみの 5 たいを よく する（A2: ぬける 形の 型ごとに 天敵 → A1: 入れかえて 全体が よく なる ときだけ）
// 状態は base.json（U: 形・ランキングか・たしかめ用か・m=5 たいの どれが 止めるか、squad）。たしかめ用は 作るのに 使わない
const fs = require('fs'), { run } = require('../_terrain/dist_par.js'), G2 = require('./k_gen2.js'), RB = require('../sim.js');
const ROUNDS = +process.argv[2] || 5, K = 4, P = 16, GEN = 10;
const st = JSON.parse(fs.readFileSync('base.json', 'utf8')), U = st.U, squad = st.squad;
let seed = 2027; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let fights = 0; const go = ps => { fights += ps.length; return ps.length ? run(ps) : []; };
const stop = v => v !== 'A', W = u => u.rank ? 100 : 1;
const passOf = us => us.filter(u => !u.m.some(Boolean));
const L = a => a.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - a[i][0], p[1] - a[i][1]), 0);
function feat(c) { const d = RB.decodeDesign(c), xs = d.body.map(p => p[0]), ys = d.body.map(p => p[1]), ly = d.leg.map(p => p[1]); return [(Math.max(...xs) - Math.min(...xs)) / 200, (Math.max(...ys) - Math.min(...ys)) / 150, Math.max(...ys) / 100, RB.create(d, d).A.hp / 250, L(d.arm) / 150, L(d.leg) / 130, (Math.max(...ly) - Math.min(...ly)) / 60]; }
function kmeans(X, k) {
  let c = X.filter((_, i) => i % Math.max(1, Math.floor(X.length / k)) === 0).slice(0, k), a = [];
  for (let it = 0; it < 20; it++) {
    a = X.map(x => { let b = 0, bd = 1e9; c.forEach((y, j) => { const d = x.reduce((s, v, i) => s + (v - y[i]) ** 2, 0); if (d < bd) { bd = d; b = j; } }); return b; });
    c = c.map((y, j) => { const m = X.filter((_, i) => a[i] === j); return m.length ? y.map((_, i) => m.reduce((s, x) => s + x[i], 0) / m.length) : y; });
  }
  return a;
}
// 相手 S を いちばん 止める 形を 進化で（はじめは 5 たいの 遺伝子の 変化 ＋ ランダム）
async function evolve(S, tag) {
  let pop = []; while (pop.length < P) { const base = squad[Math.floor(rnd() * 5)].p, q = rnd() < 0.6 ? G2.mutate(base, 0.15) : G2.randP(), d = G2.build(q); if (d) pop.push({ p: q, c: G2.plain(d) }); }
  const seen = new Map();
  for (let g = 0; g < GEN; g++) {
    const r = await go(pop.flatMap(x => S.map(u => [u.c, x.c, 'flat'])));
    pop.forEach((x, i) => { x.fit = S.reduce((s, u, j) => s + (stop(r[i * S.length + j]) ? W(u) : 0), 0); if (!seen.has(x.c)) seen.set(x.c, x); });
    pop.sort((a, b) => b.fit - a.fit);
    const keep = pop.slice(0, 6), next = keep.slice(), step = 0.15 * (1 - g / GEN) + 0.03;
    while (next.length < P) { const par = keep[Math.floor(rnd() * keep.length)], q = G2.mutate(par.p, step), d = G2.build(q); if (d) next.push({ p: q, c: G2.plain(d) }); }
    pop = next;
  }
  const best = [...seen.values()].sort((a, b) => b.fit - a.fit).slice(0, 3);
  console.log('   天敵', tag, '相手', S.length, '止める', best.map(x => x.fit).join('/'));
  return best;
}
(async () => {
  G2.setSeed(4242); const t0 = Date.now();
  const report = tag => { const p = passOf(U); console.log(tag, 'ぬける', p.length, '/', U.length, '（作る用', p.filter(u => !u.test).length, '・たしかめ用', p.filter(u => u.test).length, '/', U.filter(u => u.test).length, '・ランキング', p.filter(u => u.rank).length, '）戦い', fights, ((Date.now() - t0) / 1000).toFixed(0) + '秒'); };
  report('はじめ');
  for (let round = 0; round < ROUNDS; round++) {
    const T = passOf(U).filter(u => !u.test);
    if (!T.length) { console.log('作る用は ぜんぶ 止まった'); break; }
    // A2: ぬける 形を 型に 分けて、型ごとに 天敵。ぜんたい 用も 1 つ
    const a = kmeans(T.map(u => feat(u.c)), Math.min(K, T.length));
    let cand = [];
    for (let j = 0; j < K; j++) { const S = T.filter((_, i) => a[i] === j); if (S.length >= 3) cand.push(...await evolve(S, '型' + (j + 1))); }
    cand.push(...await evolve(T, 'ぜんたい'));
    cand = [...new Map(cand.map(x => [x.c, x])).values()];
    // A1: どの 体と 入れかえると いちばん よく なるか（ふえる 止め − へる 止め）。T と「その 体だけが 止める 形」だけ 計算
    const rT = await go(cand.flatMap(x => T.map(u => [u.c, x.c, 'flat'])));
    let best = null;
    for (let k = 0; k < 5; k++) {
      const Bk = U.filter(u => !u.test && u.m[k] && u.m.reduce((s, v) => s + v, 0) === 1);
      const rB = await go(cand.flatMap(x => Bk.map(u => [u.c, x.c, 'flat'])));
      cand.forEach((x, i) => {
        const gain = T.reduce((s, u, j) => s + (stop(rT[i * T.length + j]) ? W(u) : 0), 0), loss = Bk.reduce((s, u, j) => s + (stop(rB[i * Bk.length + j]) ? 0 : W(u)), 0);
        if (!best || gain - loss > best.net) best = { k, x, net: gain - loss, gain, loss };
      });
    }
    if (!best || best.net <= 0) { console.log('ラウンド', round + 1, ': よく なる 入れかえが ない'); break; }
    squad[best.k] = { c: best.x.c, p: best.x.p };
    const r = await go(U.map(u => [u.c, best.x.c, 'flat'])); U.forEach((u, i) => u.m[best.k] = stop(r[i]) ? 1 : 0);
    report('ラウンド ' + (round + 1) + ': ' + (best.k + 1) + ' たいめを 入れかえ（+' + best.gain + ' −' + best.loss + '）');
    fs.writeFileSync('base.json', JSON.stringify({ U, squad }));
  }
})();
