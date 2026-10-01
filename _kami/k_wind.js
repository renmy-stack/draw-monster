// 体の「ぐるぐる巻き」を 調べる: 巻いた 回数・計算上の 面積（HP の もと）と 見た目の 面積（ぬりつぶした 広さ）の 比・HP
const RB = require('../sim.js'), fs = require('fs');
function stats(c) {
  const d = RB.decodeDesign(c), b = d.body.concat([d.body[0]]);
  let turn = 0;
  for (let i = 1; i < b.length - 1; i++) { const a1 = Math.atan2(b[i][1] - b[i - 1][1], b[i][0] - b[i - 1][0]), a2 = Math.atan2(b[i + 1][1] - b[i][1], b[i + 1][0] - b[i][0]); let t = a2 - a1; while (t > Math.PI) t -= 2 * Math.PI; while (t < -Math.PI) t += 2 * Math.PI; turn += t; }
  const wind = Math.abs(turn) / (2 * Math.PI);
  let sh = 0; for (let i = 0; i < d.body.length; i++) { const p = d.body[i], q = d.body[(i + 1) % d.body.length]; sh += p[0] * q[1] - q[0] * p[1]; } sh = Math.abs(sh) / 2;
  // 見た目の 面積: 2px の ます目で 巻き数が 0 でない ところ
  const xs = d.body.map(p => p[0]), ys = d.body.map(p => p[1]); let vis = 0;
  for (let x = Math.min(...xs); x <= Math.max(...xs); x += 2) for (let y = Math.min(...ys); y <= Math.max(...ys); y += 2) {
    let w = 0; for (let i = 0; i < d.body.length; i++) { const p = d.body[i], q = d.body[(i + 1) % d.body.length];
      if (p[1] <= y) { if (q[1] > y && (q[0] - p[0]) * (y - p[1]) - (x - p[0]) * (q[1] - p[1]) > 0) w++; } else if (q[1] <= y && (q[0] - p[0]) * (y - p[1]) - (x - p[0]) * (q[1] - p[1]) < 0) w--; }
    if (w) vis += 4; }
  const r = RB.create(d, d);
  return { wind, ratio: sh / Math.max(vis, 1), hp: r.A.hp, vis, ink: RB.inkOf(d.body), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}
const R = require('./rank_top.json'), B = JSON.parse(fs.readFileSync('base_opt.json', 'utf8'));
const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const show = (name, list) => { const S = list.map(stats); console.log(name.padEnd(22), '数', String(S.length).padStart(4), '| 2 周 以上', (S.filter(s => s.wind >= 1.8).length / S.length * 100).toFixed(0).padStart(3) + '%', '| 巻き数 まんなか', med(S.map(s => s.wind)).toFixed(1), '| 面積の 水増し（計算 ÷ 見た目）まんなか', med(S.map(s => s.ratio)).toFixed(2), '| HP まんなか', med(S.map(s => s.hp)), '| 見た目の 面積', med(S.map(s => s.vis))); return S; };
const top = show('ランキング 上位 30', R.top.map(t => t.c));
R.top.forEach((t, i) => { const s = top[i]; if (i < 12) console.log('   ', t.pos + '位', '巻き', s.wind.toFixed(1), '水増し', s.ratio.toFixed(2), 'HP', s.hp, '見た目', s.vis, '大きさ', s.w + 'x' + s.h, 'インク', Math.round(s.ink)); });
const real = B.U.filter(u => !u.atk && !u.rank);
show('強い 形（止まる）', real.filter(u => u.m.some(Boolean)).filter((_, i) => i % 4 === 0).map(u => u.c));
show('強い 形（かみを ぬける）', real.filter(u => !u.m.some(Boolean)).map(u => u.c));
show('かみの 5 たい', B.squad.map(s => s.c));
show('みんなの 5 たい', RB.MINNA.map(d => RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg })));
