// いまの ランキング 上位 30（＋イベント上位）の 形 → rank_top.json。みんなを ぬけるか も 見る
const RB = require('../sim.js'), { run } = require('../_terrain/dist_par.js'), fs = require('fs');
const plain = c => { const d = RB.decodeDesign(c); return d ? RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg }) : null; };
const top = require('./top_now.json').top.map(t => ({ name: t.name, pos: t.pos, c: plain(t.code) })).filter(t => t.c);
let ev = []; try { const e = require('./evtop_now.json'); ev = (e.top || []).map(t => ({ name: t.name, pos: t.pos, c: plain(t.code) })).filter(t => t.c); } catch (e) {}
const M = RB.MINNA.map(d => RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg }));
(async () => {
  const pairs = []; for (const t of top) for (const m of M) pairs.push([t.c, m, 'flat']);
  const r = await run(pairs); let n = 0;
  top.forEach((t, i) => { let k = 0; while (k < 5 && r[i * 5 + k] === 'A') k++; t.minna = k; if (k === 5) n++; });
  console.log('ランキング 上位', top.length, 'みんなを ぬける', n, '深さ', top.map(t => t.minna).join(''));
  console.log('イベント 上位', ev.length);
  fs.writeFileSync('rank_top.json', JSON.stringify({ top, ev }));
})();
