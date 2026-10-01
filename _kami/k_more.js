// node k_more.js [最強の ファイル] [世代] — 最強の 1 たい（5 たいめ）を 決めて、のこり 4 たいを 1 たいずつ 作る
// k たいめの 相手 = いま いる 体を ぜんぶ ぬける 形（作る用の 実際の 形＋ランキング 上位。多ければ 200 に しぼる）
// ちがう 形に: いま いる 体と 似すぎ（大きさ・巻き・腕・足・HP が 近い）なら 0.85 倍
const fs = require('fs'), { run } = require('../_terrain/tp_par.js'), G2 = require('./k_gen2.js'), RB = require('../sim.js');
const CH = process.argv[2] || 'champ_2.json', GEN = +process.argv[3] || 25, P = 32, TOPN = 8, RW = 3;
const B = JSON.parse(fs.readFileSync('base_opt.json', 'utf8')), champ = JSON.parse(fs.readFileSync(CH, 'utf8')).best;
const real = B.U.filter(u => !u.atk), train = real.filter(u => !u.test), test = real.filter(u => u.test);
let seed = 4321; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const shuffle = a => { const s = a.slice(); for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; } return s; };
const stop = v => v !== 'A';
let fights = 0; const go = ps => { fights += ps.length; return ps.length ? run(ps) : []; };
function feat(c) { const d = RB.decodeDesign(c), xs = d.body.map(p => p[0]), ys = d.body.map(p => p[1]), a = RB.create(d, d).A;
  return [(Math.max(...xs) - Math.min(...xs)) / 200, (Math.max(...ys) - Math.min(...ys)) / 150, a.maxHp / 250, RB.inkOf(d.arm) / 150, RB.inkOf(d.leg) / 130, (Math.max(...ys)) / 100]; }
const dist = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
function metaP() { const p = G2.randP(); p.w = 100 + 100 * rnd(); p.h = 30 + 120 * rnd(); p.cy = -25 - 100 * rnd(); p.rad = p.rad.map(() => 0.8 + 0.2 * rnd()); p.wind = 1 + 1.8 * rnd(); p.spir = 0.06 * rnd(); p.armLen = 100 + 50 * rnd(); return p; }
(async () => {
  G2.setSeed(606); const t0 = Date.now();
  const squad = [{ c: champ.c, p: champ.p }];
  // 生き残り: 今いる 体を ぜんぶ ぬける 形
  let alive = train.slice();
  { const r = await go(alive.map(u => [u.c, champ.c, 'flat'])); alive = alive.filter((u, i) => !stop(r[i])); }
  console.log('5 たいめ（最強）を ぬける 形', alive.length, '（ランキング', alive.filter(u => u.rank).length, '）');
  for (let k = 0; k < 4 && alive.length; k++) {
    const S = alive.length > 200 ? alive.filter(u => u.rank).concat(shuffle(alive.filter(u => !u.rank)).slice(0, 200 - alive.filter(u => u.rank).length)) : alive;
    const quick = S.filter(u => u.rank).slice(0, 10).concat(shuffle(S.filter(u => !u.rank)).slice(0, 50)), rest = S.filter(u => !quick.includes(u));
    const pts = (v, L) => v.reduce((s, x, j) => s + (stop(x) ? (L[j].rank ? RW : 1) : 0), 0);
    const F = squad.map(s => feat(s.c)), div = c => { const f = feat(c), m = Math.min(...F.map(g => dist(f, g))); return m < 0.25 ? 0.85 : 1; };
    let pop = []; while (pop.length < P) { const q = rnd() < 0.5 ? metaP() : G2.randP(), d = G2.build(q); if (d) pop.push({ p: q, c: G2.plain(d) }); }
    const full = new Map(); let best = null;
    for (let g = 0; g < GEN; g++) {
      const r = await go(pop.flatMap(x => quick.map(u => [u.c, x.c, 'flat'])));
      pop.forEach((x, i) => x.q = pts(r.slice(i * quick.length, (i + 1) * quick.length), quick));
      pop.sort((a, b) => b.q - a.q);
      const tops = pop.slice(0, TOPN).filter(x => !full.has(x.c));
      const r2 = await go(tops.flatMap(x => rest.map(u => [u.c, x.c, 'flat'])));
      tops.forEach((x, i) => { const n = x.q + pts(r2.slice(i * rest.length, (i + 1) * rest.length), rest); full.set(x.c, { p: x.p, c: x.c, n, f: n * div(x.c) }); });
      pop.forEach(x => x.f = full.has(x.c) ? full.get(x.c).f : x.q * S.length / quick.length * 0.85);
      pop.sort((a, b) => b.f - a.f);
      const b = [...full.values()].sort((a, b) => b.f - a.f)[0]; if (!best || b.f > best.f) best = b;
      const keep = pop.slice(0, 8), next = keep.map(x => ({ p: x.p, c: x.c })), step = 0.14 * (1 - g / GEN) + 0.03;
      while (next.length < P - 4) { const par = keep[Math.floor(rnd() * keep.length)], q = G2.mutate(par.p, step), d = G2.build(q); if (d) next.push({ p: q, c: G2.plain(d) }); }
      while (next.length < P) { const q = rnd() < 0.5 ? metaP() : G2.randP(), d = G2.build(q); if (d) next.push({ p: q, c: G2.plain(d) }); }
      pop = next;
    }
    squad.unshift({ c: best.c, p: best.p });
    const r = await go(alive.map(u => [u.c, best.c, 'flat'])); alive = alive.filter((u, i) => !stop(r[i]));
    console.log((4 - k) + ' たいめ: 止めた', best.n, '点', '（似てる 減点', best.f < best.n ? 'あり' : 'なし', '）→ ぜんぶ ぬける 作る用の 形', alive.length, '（ランキング', alive.filter(u => u.rank).length, '）戦い', fights, ((Date.now() - t0) / 1000).toFixed(0) + '秒');
    fs.writeFileSync('squad5.json', JSON.stringify({ squad }));
  }
  // たしかめ用（作るのに 使って いない 形）
  let S = test; for (const s of squad) { const r = await go(S.map(u => [u.c, s.c, 'flat'])); S = S.filter((u, i) => !stop(r[i])); }
  console.log('たしかめ用', test.length, 'のうち 5 たい ぜんぶ ぬけた', S.length);
  fs.writeFileSync('squad5.json', JSON.stringify({ squad, testLeft: S.length }));
})();
