// node k_pool.js — 候補（pool_cand.json）× 的（ものさし U ＋ 攻めの 形 found_all.json）の 表を 作る → pool_matrix.json
// 表: stop[候補][的] = 1（その 候補が 的を 止める＝的が 勝てない）
const fs = require('fs'), { run } = require('../_terrain/dist_par.js'), RB = require('../sim.js');
const key = c => { const d = RB.decodeDesign(c); return JSON.stringify([d.body, d.arm, d.leg]); };
let cand = JSON.parse(fs.readFileSync('pool_cand.json', 'utf8'));
// むかしの 組み合わせも 候補に
const seen = new Set(cand.map(x => key(x.c)));
for (const f of ['squad.json', 'squad2.json']) { try { for (const s of JSON.parse(fs.readFileSync(f, 'utf8')).squad) { const k = key(s.c); if (!seen.has(k)) { seen.add(k); cand.push({ c: s.c, from: f.replace('.json', '') }); } } } catch (e) {} }
const U = JSON.parse(fs.readFileSync('base_opt.json', 'utf8')).U.map(u => ({ c: u.c, rank: !!u.rank, test: !!u.test, atk: false }));
const F = JSON.parse(fs.readFileSync('found_all.json', 'utf8')).map(c => ({ c, rank: false, test: false, atk: true }));
const T = U.concat(F);
(async () => {
  const t0 = Date.now(), stop = [];
  // とちゅうまでの 結果（pool_cache.json: 候補の 形 → 表の 1 行。的の 数が 同じ ときだけ 使う）
  let cache = {}; try { cache = JSON.parse(fs.readFileSync('pool_cache.json', 'utf8')); } catch (e) {}
  if (cache.NT !== T.length) cache = { NT: T.length, rows: {} };
  for (let i = 0; i < cand.length; i++) {
    if (cache.rows[cand[i].c]) { stop.push(cache.rows[cand[i].c]); continue; }
    const r = await run(T.map(t => [t.c, cand[i].c, 'flat']));
    stop.push(r.map(v => v !== 'A' ? 1 : 0).join(''));
    cache.rows[cand[i].c] = stop[i]; fs.writeFileSync('pool_cache.json', JSON.stringify(cache));
    if (i % 5 === 4 || i === cand.length - 1) console.log('候補', i + 1, '/', cand.length, ((Date.now() - t0) / 1000).toFixed(0) + '秒');
  }
  fs.writeFileSync('pool_matrix.json', JSON.stringify({ cand, T: T.map(t => ({ rank: t.rank, test: t.test, atk: t.atk })), Tc: T.map(t => t.c), stop }));
  console.log('おわり 候補', cand.length, '的', T.length);
})();
