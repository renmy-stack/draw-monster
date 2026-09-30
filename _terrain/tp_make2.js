// 地形の 1 段（おもて など）の 5 体を えらぶ: 各段で「そこまで 勝ちのこった 挑戦者」が 勝つ 割合を 平らの 基準に あわせる
// node tp_make.js 地形 段   例: node tp_make.js yama omote
const RB = require('../sim.js');
const { run, TER } = require('./tp_par.js'); const P = require('./tp_pool.json'); const fs = require('fs'); const { gen } = require('./tp_gen.js');
const plain = d => RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg });
let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rank = require('./gd_in.json').ranked.map(m => m.code);
const old = new Set(RB.CPU.concat(RB.URA, RB.MINNA).map(plain));
const R = shuffle(P.R), RK = shuffle(rank), UR = shuffle(P.ura.filter(c => !rank.includes(c)));
// 候補は こちらで 作った 形だけ: おもて ＝ ランダム（人が 描きそうな 形・遺伝子の 形）、うら ＝ その 地形で 進化させた 形（evo_<地形>.json）
const [tk, tier] = process.argv.slice(2);
// ものさし: 実際の プレイヤーの 形（real_pool.json、9/29〜9/30 に 水平で 戦った 形）。確かめは real_ref.json の 1500 形（えらぶ ときは 使わない）
// 目標: 水平で 同じ 形が 勝ちのこる 割合（tp_real_ref.js: おもて 全部ぬけ 28.1%・うら 3.2%。記録は 25.3%・2.7%）
const RP = require('./real_pool.json'), RF = require('./real_ref.json');
const inRef = { omote: new Set(RF.om), ura: new Set(RF.ur) };
const evoC = () => { try { let e = require('./evo_' + tk + '.json'); try { e = require('./evo_' + tk + '_s.json').concat(e); } catch (x) {} return e.filter((_, i) => i % Math.max(1, Math.floor(e.length / 300)) === 0).map(x => x.c); } catch (e) { return []; } };
const TIERS = {
  omote: { target: RF.omote.rates, pool: shuffle(RP.omote.filter(c => !inRef.omote.has(c))).slice(0, 600), cand: () => gen(260, 5000 + tk.length * 131 + tk.charCodeAt(0)).concat(evoC().slice(-160)), check: RF.om },
  ura: { target: RF.ura.rates, pool: shuffle(RP.ura.filter(c => !inRef.ura.has(c))).slice(0, 600), cand: () => evoC(), check: RF.ur },
};
const OUT = __dirname + '/tp_out3.json';
const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const used = new Set(Object.values(out).flatMap(t => Object.values(t).flatMap(x => x.map(c => c.code))));
const T = TIERS[tier];
(async () => {
  const t0 = Date.now();
  let alive = T.pool;
  if (TER[tk].ceil) { const r = await run(alive.map(a => [a, alive[0], tk])); alive = alive.filter((_, i) => r[i] !== 'T'); }
  const inPool = new Set(P.R.concat(rank, P.ura, RP.omote, RP.ura)); let cand = T.cand().filter(c => !used.has(c) && !old.has(c) && !inPool.has(c));
  if (TER[tk].ceil) { const r = await run(cand.map(c => [c, c, tk])); cand = cand.filter((_, i) => r[i] !== 'T'); }
  // 下見: 挑戦者 60 体に 対する 強さで ならべる（挑戦者が よく 勝つ ＝ 弱い CPU が 先）
  const smp = alive.slice(0, 40), pairs = [];
  for (const c of cand) for (const a of smp) pairs.push([a, c, tk]);
  const pr = await run(pairs), base = cand.map((c, i) => { let w = 0; for (let k = 0; k < smp.length; k++) if (pr[i * smp.length + k] === 'A') w++; return [c, w / smp.length]; }).sort((x, y) => y[1] - x[1]);
  console.log(tk, tier, '下見', cand.length, '体', ((Date.now() - t0) / 1000).toFixed(0) + '秒');
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
  if (TER[tk].ceil) { const r = await run(al.map(a => [a, pick[0].code, tk])); al = al.filter((_, i) => r[i] !== 'T'); }   // 天井に つかえる 挑戦者は 入れない ので 数えない
  const n0 = al.length;
  for (const p of pick) { const r = await run(al.map(a => [a, p.code, tk])); const nx = al.filter((_, i) => r[i] === 'A'); rates.push((nx.length / al.length * 100).toFixed(0) + '%'); al = nx; }
  { const o2 = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}; if (o2[tk] && o2[tk][tier]) { o2[tk][tier][0].check = (al.length / n0 * 100).toFixed(1) + '%（' + rates.join(' ') + '）'; fs.writeFileSync(OUT, JSON.stringify(o2)); } }
  console.log('確かめ（べつの', n0, '体）: 各段', rates.join(' '), '全部ぬけ', (al.length / n0 * 100).toFixed(1) + '%', ((Date.now() - t0) / 1000).toFixed(0) + '秒');
})();
