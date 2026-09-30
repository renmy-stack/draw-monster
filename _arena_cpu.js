// 闘技場 × CPU 候補（おもて・うら・みんな 15 体）で、挑戦者 80 体の 勝率（天井に つかえる 挑戦者は 入れない）
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const RB = require('./sim.js'), AR = require('./_arena_try.js');
const CAND = RB.CPU.concat(RB.URA, RB.MINNA);
if (!isMainThread) {
  const out = [];
  for (const [ak, ci, codes] of workerData) { const a = AR[ak], C = CAND[ci]; let w = 0, n = 0, flatW = 0;
    const res = codes.map(c => { const d = RB.decodeDesign(c); if (RB.create(d, C, a).A.tall) return -1; const S = RB.fight(d, C, a); return S.winner === 'A' ? 1 : 0; });
    out.push([ak, ci, res]); }
  parentPort.postMessage(out);
} else {
  const { ranked } = require(process.env.GD);
  const ch = ranked.slice(0, 40).concat(ranked.filter((m, i) => i >= 100 && i % 16 === 0).slice(0, 40));
  const codes = ch.map(m => m.code), jobs = [];
  for (const ak of ['flat'].concat(Object.keys(AR))) for (let ci = 0; ci < CAND.length; ci++) jobs.push([ak, ci, codes]);
  AR.flat = null;
  const W = 15, parts = Array.from({ length: W }, (_, w) => jobs.filter((_, i) => i % W === w));
  Promise.all(parts.map(p => new Promise((ok, ng) => { const w = new Worker(__filename, { workerData: p }); w.on('message', ok); w.on('error', ng); }))).then(rs => {
    const out = {}; for (const r of rs) for (const [ak, ci, res] of r) (out[ak] = out[ak] || {})[CAND[ci].name] = res;
    require('fs').writeFileSync(process.env.OUT, JSON.stringify({ names: ch.map(m => m.name), pos: ch.map(m => m.pos), out }));
    console.log('done');
  });
}
