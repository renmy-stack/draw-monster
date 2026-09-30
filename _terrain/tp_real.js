// 実際の プレイヤーの 形（9/29〜9/30 に 水平の おもて・うらで 戦った 形）を あつめる → real_pool.json
// 形 1 つごと（同じ 形は 1 つ）に: その 段で いちばん 先まで 進んだ ところ（5 ＝ 5 たい ぬいた）
const L = require('../../renmy-logs/load.js'), RB = require('../sim.js'), fs = require('fs');
const plain = c => { const d = RB.decodeDesign(c); return d ? RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg }) : null; };
const ref = new Map(), best = { omote: new Map(), ura: new Map() };
for (const e of L.events({ from: '2026-09-29', to: '2026-09-30', g: 'draw-monster' })) {
  const x = e.data || {};
  if (e.name === 'design' && x.c) { ref.set(e.ses + '|' + x.d, plain(x.c)); continue; }
  if (e.name !== 'result' || !best[x.side] || x.d == null) continue;
  const c = ref.get(e.ses + '|' + x.d); if (!c) continue;
  const reach = x.win === 'win' ? x.stage + 1 : x.stage;   // 勝てば 次へ
  const m = best[x.side]; m.set(c, Math.max(m.get(c) || 0, reach));
}
const out = {};
for (const [s, m] of Object.entries(best)) { const v = [...m.values()]; out[s] = [...m.keys()]; console.log(s, '形', m.size, '5 たい ぬいた', (v.filter(r => r >= 5).length / v.length * 100).toFixed(1) + '%', '段ごと', [1, 2, 3, 4, 5].map(k => (v.filter(r => r >= k).length / v.length * 100).toFixed(0) + '%').join(' ')); }
fs.writeFileSync('real_pool.json', JSON.stringify({ omote: out.omote, ura: out.ura, reach: { omote: Object.fromEntries(best.omote), ura: Object.fromEntries(best.ura) } }));
