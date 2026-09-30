// 並列: pairs = [[左の形, 右の形, 地形キー]] → 勝者の 配列
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const SIM = 'C:/Users/umiya/OneDrive/Desktop/Share/claude/03_game-cc-company/draw-monster/sim.js';
const TER = {
  flat: null,
  yama: { floor: [[-120, 0], [0, 70], [120, 0]], hw: 380 },
  heya: { floor: [], hw: 170, sx: 100 },
  dokutsu: { floor: [], hw: 380, ceil: 170 },
  gake: { floor: [[-290, -400], [-260, 0], [260, 0], [290, -400]], hw: 0, fall: 120 },
  dansa: { floor: [[-50, 0], [50, 60]], hw: 380 },
  // きつく した 案（ひくい・がけ で 最適解が ほかと ちがう ように なるか 試す）
  yama110: { floor: [[-150, 0], [0, 110], [150, 0]], hw: 380 },
  dansa100: { floor: [[-60, 0], [60, 100]], hw: 380 },
  dokutsu140: { floor: [], hw: 380, ceil: 140 },
  dokutsu120: { floor: [], hw: 380, ceil: 120 },
  gake180: { floor: [[-210, -400], [-180, 0], [180, 0], [210, -400]], hw: 0, fall: 120, sx: 110 },
  gake150: { floor: [[-180, -400], [-150, 0], [150, 0], [180, -400]], hw: 0, fall: 120, sx: 90 },
};
if (!isMainThread) {
  const RB = require(SIM); const cache = new Map(); const dec = c => { if (!cache.has(c)) cache.set(c, RB.decodeDesign(c)); return cache.get(c); };
  parentPort.postMessage(workerData.map(([a, b, t]) => { const A = dec(a), B = dec(b); if (TER[t] && TER[t].ceil && (RB.create(A, B, TER[t]).A.tall)) return 'T'; return RB.fight(A, B, TER[t]).winner || 'D'; }));
} else {
  module.exports = { TER, run: async (pairs, W = 15) => {
    const parts = Array.from({ length: W }, () => []), idx = Array.from({ length: W }, () => []);
    pairs.forEach((p, i) => { parts[i % W].push(p); idx[i % W].push(i); });
    const out = new Array(pairs.length);
    const rs = await Promise.all(parts.map(p => p.length ? new Promise((ok, ng) => { const w = new Worker(__filename, { workerData: p }); w.on('message', ok); w.on('error', ng); }) : []));
    rs.forEach((r, w) => r.forEach((v, k) => out[idx[w][k]] = v)); return out;
  } };
}
