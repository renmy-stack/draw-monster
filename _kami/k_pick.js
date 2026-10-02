// node k_pick.js [攻めの 重さ=3] — pool_matrix.json から 5 たいの 組み合わせを 全部 ためして、ぬける 的が いちばん 少ない ものを 選ぶ
// 選ぶ ときの 点 = ランキング×100 ＋ 攻めの 形×W ＋ 作る用×1（たしかめ用は 使わない → あとで 成績を 見る）
const fs = require('fs'), M = JSON.parse(fs.readFileSync('pool_matrix.json', 'utf8')), W = +process.argv[2] || 3;
const n = M.cand.length, NT = M.T.length, NW = Math.ceil(NT / 32);
const mask = f => { const m = new Uint32Array(NW); M.T.forEach((t, i) => { if (f(t)) m[i >> 5] |= 1 << (i & 31); }); return m; };
const mRank = mask(t => t.rank), mAtk = mask(t => t.atk), mTrain = mask(t => !t.rank && !t.atk && !t.test), mTest = mask(t => t.test && !t.rank);
// pass[i] = 候補 i に 勝てる 的
const pass = M.stop.map(s => { const m = new Uint32Array(NW); for (let i = 0; i < NT; i++) if (s[i] === '0') m[i >> 5] |= 1 << (i & 31); return m; });
const pc = x => { x -= (x >>> 1) & 0x55555555; x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24; };
const cnt = (m, k) => { let s = 0; for (let w = 0; w < NW; w++) s += pc(m[w] & k[w]); return s; };
const score = m => { let r = 0, a = 0, t = 0; for (let w = 0; w < NW; w++) { const x = m[w]; if (!x) continue; r += pc(x & mRank[w]); a += pc(x & mAtk[w]); t += pc(x & mTrain[w]); } return r * 100 + a * W + t; };
const and = (a, b, o) => { for (let w = 0; w < NW; w++) o[w] = a[w] & b[w]; return o; };
const L = [1, 2, 3, 4].map(() => new Uint32Array(NW)), best = [];
const t0 = Date.now();
for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) { and(pass[a], pass[b], L[0]);
  for (let c = b + 1; c < n; c++) { and(L[0], pass[c], L[1]);
    for (let d = c + 1; d < n; d++) { and(L[1], pass[d], L[2]);
      for (let e = d + 1; e < n; e++) { and(L[2], pass[e], L[3]); const s = score(L[3]);
        if (best.length < 30 || s < best[best.length - 1].s) { best.push({ s, k: [a, b, c, d, e] }); best.sort((x, y) => x.s - y.s); if (best.length > 30) best.pop(); } } } } }
const desc = k => { const m = k.map(i => pass[i]).reduce((x, y) => and(x, y, new Uint32Array(NW))); return { rank: cnt(m, mRank), atk: cnt(m, mAtk), train: cnt(m, mTrain), test: cnt(m, mTest) }; };
// v168（いまの いちばん）を さがして 同じ ものさしで
const RB = require('../sim.js'), key = c => { const d = RB.decodeDesign(c); return JSON.stringify([d.body, d.arm, d.leg]); };
const v168 = RB.KAMI.map(k => M.cand.findIndex(x => key(x.c) === key(RB.encodeDesign(k))));
console.log('全部', n, 'たいから 5 たい・', ((Date.now() - t0) / 1000).toFixed(0) + '秒');
console.log('v168', v168.join(','), JSON.stringify(desc(v168)));
best.slice(0, 15).forEach((b, i) => console.log(i + 1, '点', b.s, b.k.join(','), JSON.stringify(desc(b.k)), b.k.map(i => M.cand[i].from).join(' ')));
fs.writeFileSync('pick_W' + W + '.json', JSON.stringify({ W, v168, best: best.map(b => ({ s: b.s, k: b.k, ...desc(b.k), c: b.k.map(i => M.cand[i].c) })) }));
