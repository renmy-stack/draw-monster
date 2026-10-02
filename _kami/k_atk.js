// node k_atk.js [種] [世代] — A3: 攻める がわを 進化させて かみを ぬける 形を さがす（プレイヤーが さがしそうな 形の 先回り）
// はじめは「かみの 5 たいの うち たくさん 勝てる 実際の 形」を 少しずつ 変えた もの＋作り方 2 の 形。強さ = 5 たいの うち 何体に 勝つか
// 見つけた ぬける 形は found.json に 足す（あとで ものさし U に 入れる）
const fs = require('fs'), { run } = require('../_terrain/dist_par.js'), RB = require('../sim.js'), G2 = require('./k_gen2.js');
const sd = +process.argv[2] || 1, GEN = +process.argv[3] || 30, P = 40;
const st = JSON.parse(fs.readFileSync(process.env.BASE || 'base.json', 'utf8')), U = st.U, squad = st.squad.map(s => s.c);
let seed = 900 + sd * 37; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
const plain = d => RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg });
// 形を 少し 変える: 体の 点を ずらす・のばす、腕と 足は 肩・腰に つけなおして 点を ずらす・長さを かえる
function jitter(c, s) {
  const d = RB.decodeDesign(c); if (!d) return null;
  const sx = 1 + gauss() * 0.08 * s, sy = 1 + gauss() * 0.08 * s, dy = gauss() * 8 * s;
  const body = RB.cleanStroke(d.body.map(([x, y]) => [Math.round(x * sx + gauss() * 3 * s), Math.round(y * sy + dy + gauss() * 3 * s)]), RB.INK.body); if (body.length < 3) return null;
  const j = RB.joints(body);
  const limb = (pts, at, ink) => { const k = 1 + gauss() * 0.1 * s, rot = gauss() * 0.15 * s, [x0, y0] = pts[0];
    const out = pts.map(([x, y]) => { const ux = (x - x0) * k, uy = (y - y0) * k; return [Math.round(at[0] + ux * Math.cos(rot) - uy * Math.sin(rot) + gauss() * 2 * s), Math.round(at[1] + ux * Math.sin(rot) + uy * Math.cos(rot) + gauss() * 2 * s)]; });
    out[0] = [Math.round(at[0]), Math.round(at[1])]; return RB.cleanStroke(out, ink); };
  const nd = RB.design(body, limb(d.arm, j.shoulder, RB.INK.arm), limb(d.leg, j.hip, RB.INK.leg));
  return RB.validDesign(nd) ? plain(nd) : null;
}
(async () => {
  G2.setSeed(77 + sd);
  // はじめ: 4 体 以上に 勝つ 実際の 形（ぬけて いない もの）から ＋ 作り方 2
  const near = U.filter(u => u.m.reduce((s, v) => s + v, 0) === 1).map(u => u.c);
  let pop = [];
  while (pop.length < P * 0.75 && near.length) { const c = jitter(near[Math.floor(rnd() * near.length)], 1); if (c) pop.push({ c }); }
  while (pop.length < P) { const d = G2.build(G2.randP()); if (d) pop.push({ c: G2.plain(d) }); }
  const known = new Set(U.map(u => u.c)), found = new Map(), t0 = Date.now();
  for (let g = 0; g < GEN; g++) {
    const r = await run(pop.flatMap(x => squad.map(k => [x.c, k, 'flat'])));
    pop.forEach((x, i) => { const v = r.slice(i * 5, i * 5 + 5); x.win = v.filter(w => w === 'A').length; x.fit = x.win + 0.3 * v.filter(w => w === 'D' || w == null).length / 5; if (x.win === 5 && !known.has(x.c)) found.set(x.c, g); });
    pop.sort((a, b) => b.fit - a.fit);
    if (g % 5 === 4 || g === GEN - 1) console.log('種', sd, '世代', g, 'いちばん', pop[0].win, 'たいに 勝つ・見つけた ぬける 形', found.size, ((Date.now() - t0) / 1000).toFixed(0) + '秒');
    const keep = pop.slice(0, 12), next = keep.slice(), s = 1.2 * (1 - g / GEN) + 0.3;
    while (next.length < P - 4) { const c = jitter(keep[Math.floor(rnd() * keep.length)].c, s); if (c) next.push({ c }); }
    while (next.length < P) { const c = jitter(near[Math.floor(rnd() * near.length)] || pop[0].c, 1); if (c) next.push({ c }); }
    pop = next;
  }
  let all = []; try { all = JSON.parse(fs.readFileSync(process.env.FOUND || 'found.json', 'utf8')); } catch (e) {}
  all = [...new Set(all.concat([...found.keys()]))];
  fs.writeFileSync(process.env.FOUND || 'found.json', JSON.stringify(all));
  console.log('種', sd, 'おわり: 新しく 見つけた', found.size, '・ぜんぶで', all.length);
})();
