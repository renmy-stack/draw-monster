// 確かめ用の 実際の 形（real_ref.json の om / ur 1500 ずつ）は ばらばらか: 端末の かたより と 形の 似かた
const L = require('../../renmy-logs/load.js'), RB = require('../sim.js'), RF = require('./real_ref.json');
const plain = c => { const d = RB.decodeDesign(c); return d ? RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg }) : null; };
const devOf = new Map();
for (const e of L.events({ from: '2026-09-29', to: '2026-09-30', g: 'draw-monster' })) { if (e.name === 'design' && e.data && e.data.c) { const c = plain(e.data.c); if (c && !devOf.has(c)) devOf.set(c, e.dev); } }
const len = p => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; };
function feat(c) { const d = RB.decodeDesign(c); const xs = d.body.map(p => p[0]), ys = d.body.map(p => p[1]); const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys); return { w, h, arm: len(d.arm), leg: len(d.leg), key: [Math.round(w / 25), Math.round(h / 25), Math.round(len(d.arm) / 25), Math.round(len(d.leg) / 25)].join(',') }; }
for (const [lab, list] of [['おもて用', RF.om], ['うら用', RF.ur]]) {
  const byDev = {}; for (const c of list) { const d = devOf.get(c) || '?'; byDev[d] = (byDev[d] || 0) + 1; }
  const counts = Object.values(byDev).sort((a, b) => b - a);
  const cl = {}; for (const c of list) { const k = feat(c).key; cl[k] = (cl[k] || 0) + 1; }
  const cc = Object.values(cl).sort((a, b) => b - a);
  const F = list.map(feat), q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return Math.round(s[Math.floor((s.length - 1) * p)]); };
  console.log(`${lab} ${list.length} 形: 端末 ${counts.length} 台。いちばん 多い 端末 ${counts[0]} 形（${(counts[0] / list.length * 100).toFixed(1)}%）、上位 5 台で ${counts.slice(0, 5).reduce((a, b) => a + b, 0)} 形、上位 10 台で ${counts.slice(0, 10).reduce((a, b) => a + b, 0)} 形`);
  console.log(`  似た 形の まとまり（体の 幅・高さ・腕・足を 25 きざみ）: ${cc.length} 種類、いちばん 大きい まとまり ${cc[0]} 形（${(cc[0] / list.length * 100).toFixed(1)}%）、上位 5 で ${cc.slice(0, 5).reduce((a, b) => a + b, 0)} 形`);
  console.log(`  ばらつき（10%・中央・90%）: 体の 幅 ${q(F.map(f => f.w), .1)}・${q(F.map(f => f.w), .5)}・${q(F.map(f => f.w), .9)} ／ 高さ ${q(F.map(f => f.h), .1)}・${q(F.map(f => f.h), .5)}・${q(F.map(f => f.h), .9)} ／ 腕 ${q(F.map(f => f.arm), .1)}・${q(F.map(f => f.arm), .5)}・${q(F.map(f => f.arm), .9)} ／ 足 ${q(F.map(f => f.leg), .1)}・${q(F.map(f => f.leg), .5)}・${q(F.map(f => f.leg), .9)}`);
}
