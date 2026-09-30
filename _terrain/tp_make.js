// 地形の 1 段（おもて など）の 5 体を えらぶ: 各段で「そこまで 勝ちのこった 挑戦者」が 勝つ 割合を 平らの 基準に あわせる
// node tp_make.js 地形 段   例: node tp_make.js yama omote
const RB = require('C:/Users/umiya/OneDrive/Desktop/Share/claude/03_game-cc-company/draw-monster/sim.js');
const { run, TER } = require(__dirname + '/tp_par.js'); const P = require(__dirname + '/tp_pool.json'); const fs = require('fs');
const plain = d => RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg });
let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rank = require(__dirname + '/gd_in.json').ranked.map(m => m.code);
const old = new Set(RB.CPU.concat(RB.URA, RB.MINNA).map(plain));
const R = shuffle(P.R), RK = shuffle(rank), UR = shuffle(P.ura.filter(c => !rank.includes(c)));
const TIERS = {
  omote: { target: [0.785, 0.842, 0.683, 0.531, 0.453], pool: R.slice(0, 600), cand: R.slice(600, 1000).concat(RK.slice(0, 100)), check: R.slice(1000) },
  ura: { target: [0.90, 0.84, 0.78, 0.72, 0.66], pool: RK.slice(100, 500), cand: RK.slice(500).concat(UR.slice(0, 150)), check: RK.slice(100, 500) },
  minna: { target: [0.85, 0.80, 0.75, 0.70, 0.65], pool: UR.slice(150, 550), cand: UR.slice(550, 850).concat(RK.slice(0, 100)), check: UR.slice(850, 1250) },
};
const OUT = __dirname + '/tp_out.json';
const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const used = new Set(Object.values(out).flatMap(t => Object.values(t).flatMap(x => x.map(c => c.code))));
const [tk, tier] = process.argv.slice(2), T = TIERS[tier];
(async () => {
  const t0 = Date.now();
  let alive = T.pool;
  if (TER[tk].ceil) { const r = await run(alive.map(a => [a, alive[0], tk])); alive = alive.filter((_, i) => r[i] !== 'T'); }
  let cand = T.cand.filter(c => !used.has(c) && !old.has(c));
  if (TER[tk].ceil) { const r = await run(cand.map(c => [c, c, tk])); cand = cand.filter((_, i) => r[i] !== 'T'); }
  // 下見: 挑戦者 60 体に 対する 強さで ならべる（挑戦者が よく 勝つ ＝ 弱い CPU が 先）
  const smp = alive.slice(0, 60), pairs = [];
  for (const c of cand) for (const a of smp) pairs.push([a, c, tk]);
  const pr = await run(pairs), base = cand.map((c, i) => { let w = 0; for (let k = 0; k < smp.length; k++) if (pr[i * smp.length + k] === 'A') w++; return [c, w / smp.length]; }).sort((x, y) => y[1] - x[1]);
  console.log('下見', cand.length, '体', ((Date.now() - t0) / 1000).toFixed(0) + '秒');
  const pick = [];
  for (let st = 0; st < 5; st++) {
    const tg = T.target[st]; let lo = 0, hi = base.length - 1, best = null; const tried = new Set();
    const evalC = async idxs => { const cs = idxs.filter(i => i >= 0 && i < base.length && !tried.has(i) && !used.has(base[i][0])); cs.forEach(i => tried.add(i)); if (!cs.length) return [];
      const ps = [], ns = []; for (const i of cs) { const al = alive.filter(a => a !== base[i][0]); ns.push(al.length); for (const a of al) ps.push([a, base[i][0], tk]); }
      const r = await run(ps); let o = 0; return cs.map((i, q) => { let w = 0; for (let k = 0; k < ns[q]; k++) if (r[o + k] === 'A') w++; o += ns[q]; return { i, rate: w / ns[q] }; }); };
    for (let round = 0; round < 7; round++) {
      const mid = Math.floor((lo + hi) / 2), res = await evalC([mid - 1, mid, mid + 1]);
      for (const x of res) if (!best || Math.abs(x.rate - tg) < Math.abs(best.rate - tg)) best = x;
      if (best && Math.abs(best.rate - tg) < 0.015) break;
      const m = res.find(x => x.i === mid) || res[0]; if (!m) break;
      if (m.rate > tg) lo = mid + 1; else hi = mid - 1;   // 挑戦者が 勝ちすぎ → もっと 強い（うしろ）
      if (lo > hi) break;
    }
    const c = base[best.i][0]; used.add(c);
    const al = alive.filter(a => a !== c), r = await run(al.map(a => [a, c, tk]));
    pick.push({ code: c, rate: +best.rate.toFixed(3), target: tg, alive: alive.length });
    alive = al.filter((_, i) => r[i] === 'A');
    console.log(' ', st + 1, '体目 挑戦者の 勝ち', (best.rate * 100).toFixed(1) + '%（目標 ' + (tg * 100).toFixed(1) + '%）のこり', alive.length, ((Date.now() - t0) / 1000).toFixed(0) + '秒');
  }
  out[tk] = out[tk] || {}; out[tk][tier] = pick; fs.writeFileSync(OUT, JSON.stringify(out));
  // 確かめ: 選ぶのに 使って いない 挑戦者で かちぬき
  let al = T.check; const rates = [];
  for (const p of pick) { const r = await run(al.map(a => [a, p.code, tk])); const nx = al.filter((_, i) => r[i] === 'A'); rates.push((nx.length / al.length * 100).toFixed(0) + '%'); al = nx; }
  console.log('確かめ（べつの', T.check.length, '体）: 各段', rates.join(' '), '全部ぬけ', (al.length / T.check.length * 100).toFixed(1) + '%', ((Date.now() - t0) / 1000).toFixed(0) + '秒');
})();
