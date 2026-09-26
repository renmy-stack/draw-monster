const RB = require('./sim.js'); const E = require('./explore.js'); const { randomRobot } = require('./clear_rate.js');
const T = require('./_explore_all.json');
// 相手（探索のときと 別の種）: 人の形 30・表の CPU・いろいろな形 20
const P = RB.CPU.slice(); { let k = 0; while (k < 30) { const d = randomRobot(); if (d) { P.push(d); k++; } } }
{ const s = require('./explore.js'); let k = 0; while (k < 20) { const d = s.build(s.randP()); if (d) { P.push(d); k++; } } }
const rate = d => { if (!d) return null; let w = 0, t = 0; for (const o of P) for (const [A, B, me] of [[d, o, 'A'], [o, d, 'B']]) { if (RB.fight(A, B).winner === me) w++; t++; } return Math.round(w / t * 100); };
const seen = new Set(); let n = 0;
console.log('形 | そのまま | 体を 60x70 に | 足を 棒に | 腕を まっすぐに | 体の幅だけ 60 に');
for (const x of T) {
  const k = JSON.stringify(x.p); if (seen.has(k)) continue; seen.add(k); if (++n > 10) break;
  const v = mod => rate(E.build(Object.assign({}, x.p, mod)));
  console.log(x.p.body + '/' + x.p.arm + '/' + x.p.leg + ' ' + Math.round(x.p.w) + 'x' + Math.round(x.p.h) + ' | ' + v({}) + '% | ' + v({ body: 'rect', w: 60, h: 70 }) + '% | ' + v({ leg: 'stick', legLen: 60, legAng: 0 }) + '% | ' + v({ arm: 'straight' }) + '% | ' + v({ w: 60 }) + '%');
}
