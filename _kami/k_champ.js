// node k_champ.js [世代] [種] [つづきの ファイル] [ランキングの 重さ] — 最強の 1 たい（万能）を 作る。強さ = 強い 形の 見本 200 を 何 % 止めるか
// 軽く: 毎世代 全員を 60 で ためし、上位 10 だけ のこり 140 とも（見本は 作る用の 形だけ、たしかめ用は 最後に 測る）
const fs = require('fs'), { run } = require('../_terrain/tp_par.js'), G2 = require('./k_gen2.js');
const GEN = +process.argv[2] || 40, sd = +process.argv[3] || 1, P = 40, TOPN = 10, INIT = process.argv[4] || '', RW = +process.argv[5] || 1;
const B = JSON.parse(fs.readFileSync('base_opt.json', 'utf8'));
let seed = 31 + sd * 1000; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const real = B.U.filter(u => !u.atk), train = real.filter(u => !u.test && !u.rank), test = real.filter(u => u.test);
const pick = (a, n) => { const s = a.slice(); for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; } return s.slice(0, n); };
const ref = real.filter(u => u.rank).map(u => u.c).concat(pick(train, 170).map(u => u.c));
const quick = ref.slice(0, 15).concat(ref.slice(30, 75));   // ランキング 15 ＋ ほか 45
const rest = ref.filter(c => !quick.includes(c));
const stop = v => v !== 'A';
const rankC = new Set(real.filter(u => u.rank).map(u => u.c));
const pts = (v, list) => v.reduce((s, x, j) => s + (stop(x) ? (rankC.has(list[j]) ? RW : 1) : 0), 0);   // ランキング 上位は RW 倍
// 上位の 形の 特徴に よせた 出発点（作り方 2 の 数字だけ。プレイヤーの 形は 入れない）
function metaP() {
  const p = G2.randP();
  p.w = 120 + 60 * rnd(); p.h = 35 + 35 * rnd(); p.cy = -25 - 45 * rnd(); p.rad = p.rad.map(() => 0.85 + 0.15 * rnd()); p.wind = 1.5 + 1.1 * rnd(); p.spir = 0.06 * rnd();   // 体を 1.5〜2.6 周 巻く
  p.armLen = 150; p.armA0 = 0.6 + 0.8 * rnd(); p.at = p.at.map((_, i) => i < 6 ? -0.05 + 0.1 * rnd() : -(0.35 + 0.35 * rnd()));   // 下へ のびて 上へ まがる フック
  p.legLen = 90 + 40 * rnd(); p.legA0 = 3.1 * (rnd() - 0.5) * 2; p.lt = p.lt.map(() => 0.45 + 0.25 * rnd());   // 腰で まるめた 足
  return p;
}
let fights = 0; const go = ps => { fights += ps.length; return run(ps); };
(async () => {
  G2.setSeed(99 + sd); const t0 = Date.now();
  let pop = INIT ? JSON.parse(fs.readFileSync(INIT, 'utf8')).top.map(x => ({ p: x.p, c: x.c })) : B.squad.map(s => ({ p: s.p, c: s.c }));
  while (pop.length < 22) { const q = metaP(), d = G2.build(q); if (d) pop.push({ p: q, c: G2.plain(d) }); }
  while (pop.length < P) { const q = G2.randP(), d = G2.build(q); if (d) pop.push({ p: q, c: G2.plain(d) }); }
  const full = new Map();   // 形 → 200 の 点
  let best = null;
  for (let g = 0; g < GEN; g++) {
    const r = await go(pop.flatMap(x => quick.map(c => [c, x.c, 'flat'])));
    pop.forEach((x, i) => x.q = pts(r.slice(i * quick.length, (i + 1) * quick.length), quick));
    pop.sort((a, b) => b.q - a.q);
    const tops = pop.slice(0, TOPN).filter(x => !full.has(x.c));
    const r2 = await go(tops.flatMap(x => rest.map(c => [c, x.c, 'flat'])));
    tops.forEach((x, i) => full.set(x.c, { p: x.p, c: x.c, n: x.q + pts(r2.slice(i * rest.length, (i + 1) * rest.length), rest) }));
    pop.forEach(x => { if (full.has(x.c)) x.f = full.get(x.c).n; else x.f = x.q * (ref.length + 30 * (RW - 1)) / (quick.length + 15 * (RW - 1)) * 0.9; });
    pop.sort((a, b) => b.f - a.f);
    const b = [...full.values()].sort((a, b) => b.n - a.n)[0];
    if (!best || b.n > best.n) best = b;
    if (g % 5 === 4 || g === GEN - 1) console.log('種', sd, '世代', g, 'いちばん', '点', best.n, '/', ref.length + 30 * (RW - 1), '戦い', fights, ((Date.now() - t0) / 1000).toFixed(0) + '秒');
    const keep = pop.slice(0, 10), next = keep.map(x => ({ p: x.p, c: x.c })), step = 0.14 * (1 - g / GEN) + 0.03;
    while (next.length < P - 4) { const par = keep[Math.floor(rnd() * keep.length)], q = G2.mutate(par.p, step), d = G2.build(q); if (d) next.push({ p: q, c: G2.plain(d) }); }
    while (next.length < P) { const q = rnd() < 0.5 ? metaP() : G2.randP(), d = G2.build(q); if (d) next.push({ p: q, c: G2.plain(d) }); }
    pop = next;
  }
  // たしかめ用（作るのに 使って いない 形）で 測る
  const tt = test.map(u => u.c), r3 = await go(tt.map(c => [c, best.c, 'flat'])), rk = [...rankC], r4 = await go(rk.map(c => [c, best.c, 'flat']));
  console.log('さいきょうの 1 たい: 点', best.n, '・たしかめ用', (r3.filter(stop).length / tt.length * 100).toFixed(1) + '%（' + tt.length + '）', '・ランキング 上位', r4.filter(stop).length + '/30');
  const top5 = [...full.values()].sort((a, b) => b.n - a.n).slice(0, 20);
  fs.writeFileSync('champ_' + sd + '.json', JSON.stringify({ best, top: top5, ref }));
})();
