// KO タイプ（時間切れ 勝ち 25% 未満）だけ・似すぎ（特徴 0.25 未満 か 体の 線 6px 未満。0.3・8px では 5 たい そろわない）は 同時に 入れない で 5 たいを 全部 ためす
const fs = require('fs'), RB = require('../sim.js');
const M = JSON.parse(fs.readFileSync('pool_matrix.json', 'utf8')), TO = new Map(JSON.parse(fs.readFileSync('cand_to_all.json', 'utf8')).map(o => [o.c, o]));
const T = M.T, NT = T.length, NW = Math.ceil(NT / 32);
const feat = d => { const xs = d.body.map(p => p[0]), ys = d.body.map(p => p[1]), a = RB.create(d, d).A; return [(Math.max(...xs) - Math.min(...xs)) / 200, (Math.max(...ys) - Math.min(...ys)) / 150, a.maxHp / 250, RB.inkOf(d.arm) / 150, RB.inkOf(d.leg) / 130, Math.max(...ys) / 100]; };
const segD = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy; let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t); };
const cen = p => { const cx = p.reduce((s, q) => s + q[0], 0) / p.length, cy = p.reduce((s, q) => s + q[1], 0) / p.length; return p.map(q => [q[0] - cx, q[1] - cy]); };
const bodyD = (P, Q) => { P = cen(P); Q = cen(Q); const f = (P, Q) => P.map(p => { let m = 1e9; for (let i = 1; i < Q.length; i++) m = Math.min(m, segD(p, Q[i - 1], Q[i])); return m; }); const a = f(P, Q).concat(f(Q, P)); return a.reduce((s, v) => s + v, 0) / a.length; };
const ko = M.cand.map((c, i) => i).filter(i => TO.has(M.cand[i].c) && TO.get(M.cand[i].c).timeShare < 0.25);
const D = M.cand.map(c => RB.decodeDesign(c.c)), F = D.map(feat);
const ok = new Map(); for (const a of ko) for (const b of ko) if (a < b) { const fd = Math.sqrt(F[a].reduce((s, v, k) => s + (v - F[b][k]) ** 2, 0)); ok.set(a + "," + b, fd >= 0.25 && bodyD(D[a].body, D[b].body) >= 6); }
const comp = (a, b) => ok.get(Math.min(a, b) + ',' + Math.max(a, b));
const pass = M.stop.map(s => { const m = new Uint32Array(NW); for (let i = 0; i < NT; i++) if (s[i] === '0') m[i >> 5] |= 1 << (i & 31); return m; });
const mk = f => { const m = new Uint32Array(NW); T.forEach((t, i) => { if (f(t)) m[i >> 5] |= 1 << (i & 31); }); return m; };
const mR = mk(t => t.rank), mA = mk(t => t.atk), mTr = mk(t => !t.rank && !t.atk && !t.test), mTe = mk(t => t.test && !t.rank);
const pc = x => { x -= (x >>> 1) & 0x55555555; x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24; };
const cnt = (m, k) => { let s = 0; for (let w = 0; w < NW; w++) s += pc(m[w] & k[w]); return s; };
const and = (a, b) => { const o = new Uint32Array(NW); for (let w = 0; w < NW; w++) o[w] = a[w] & b[w]; return o; };
const best = []; const n = ko.length;
for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) { if (!comp(ko[a], ko[b])) continue; const ab = and(pass[ko[a]], pass[ko[b]]);
  for (let c = b + 1; c < n; c++) { if (!comp(ko[a], ko[c]) || !comp(ko[b], ko[c])) continue; const abc = and(ab, pass[ko[c]]);
    for (let d = c + 1; d < n; d++) { if (![a, b, c].every(x => comp(ko[x], ko[d]))) continue; const abcd = and(abc, pass[ko[d]]);
      for (let e = d + 1; e < n; e++) { if (![a, b, c, d].every(x => comp(ko[x], ko[e]))) continue; const m = and(abcd, pass[ko[e]]);
        const r = cnt(m, mR), at = cnt(m, mA), tr = cnt(m, mTr), s = r * 100 + at * 3 + tr;
        if (best.length < 10 || s < best[best.length - 1].s) { best.push({ s, k: [a, b, c, d, e].map(i => ko[i]), r, at, tr, te: cnt(m, mTe) }); best.sort((x, y) => x.s - y.s); if (best.length > 10) best.pop(); } } } } }
console.log('KO タイプ', n, 'たい（うち champ_ko_3', ko.filter(i => M.cand[i].from === 'champ_ko_3').length, '）');
for (const b of best.slice(0, 5)) console.log('点', b.s, '| 実際の形 ぬけ', b.tr + b.te, '(たしかめ用', b.te + ')', 'ランキング', b.r, '前の攻め', b.at, '|', b.k.map(i => i + ':' + M.cand[i].from + '(' + Math.round(100 * TO.get(M.cand[i].c).timeShare) + '%)').join(' '));
fs.writeFileSync('pick_ko2.json', JSON.stringify(best.map(b => ({ ...b, c: b.k.map(i => M.cand[i].c), from: b.k.map(i => M.cand[i].from) }))));
