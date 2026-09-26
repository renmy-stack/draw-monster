const RB = require('./sim.js');
const T = require('./_explore_all.json');
const L = [], seen = new Set();
for (const x of T) { const k = JSON.stringify(x.d); if (seen.has(k)) continue; seen.add(k); L.push({ n: x.p.body + '/' + x.p.arm + '/' + x.p.leg + ' ' + Math.round(x.p.w) + 'x' + Math.round(x.p.h), d: RB.design(x.d.body, x.d.arm, x.d.leg) }); if (L.length >= 30) break; }
for (const [f, n] of [['_owner.json', 'オーナー1（平たい）'], ['_owner2.json', 'オーナー2（輪の足）'], ['_owner3.json', 'オーナー3'], ['_owner4.json', 'オーナー4（大きい体）']]) { try { const c = require('./' + f); L.push({ n, d: RB.design(c.body, c.arm, c.leg) }); } catch (e) {} }
RB.URA.forEach(c => L.push({ n: 'うら ' + c.name, d: c }));
for (const x of L) { x.w = 0; x.t = 0; }
for (let i = 0; i < L.length; i++) for (let j = 0; j < L.length; j++) { if (i === j) continue; const S = RB.fight(L[i].d, L[j].d); L[i].t++; L[j].t++; if (S.winner === 'A') L[i].w++; else if (S.winner === 'B') L[j].w++; }
L.sort((a, b) => b.w / b.t - a.w / a.t);
console.log('強い形どうしの総当たり（' + L.length + ' 体）');
L.forEach((x, i) => { if (i < 12 || /オーナー|うら/.test(x.n)) console.log(String(i + 1).padStart(2), Math.round(x.w / x.t * 100) + '%', x.n); });
