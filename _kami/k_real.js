// 強い 実際の 形を あつめる（かみ の ものさし・攻略者 として だけ 使う。かみの 5 たいには 使わない）→ real_strong.json
const L = require('../../renmy-logs/load.js'), RB = require('../sim.js'), fs = require('fs');
const plain = c => { const d = RB.decodeDesign(c); return d ? RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg }) : null; };
const ref = new Map(), reach = { ura: new Map(), minna: new Map() }, tag = new Map(), dev = new Map();
const add = (c, t, dv) => { if (!c) return; if (!tag.has(c)) tag.set(c, new Set()); tag.get(c).add(t); if (dv) { if (!dev.has(c)) dev.set(c, new Set()); dev.get(c).add(dv); } };
for (const e of L.events({ from: '2026-09-27', g: 'draw-monster' })) {
  const x = e.data || {};
  if (e.name === 'design' && x.c) { ref.set(e.ses + '|' + x.d, plain(x.c)); continue; }
  if (e.name === 'uraclear' && x.me) add(plain(x.me), 'uraclear', e.dev);
  if (e.name === 'minnaclear' && x.me) add(plain(x.me), 'minnaclear', e.dev);
  if (e.name === 'terrainclear' && x.me && x.s === 'ura') add(plain(x.me), 'tura_' + x.t, e.dev);
  if (e.name === 'rankreg' && x.me) add(plain(x.me), 'rankreg', e.dev);
  if (e.name !== 'result' || !reach[x.side] || x.ter || x.d == null) continue;
  const c = ref.get(e.ses + '|' + x.d); if (!c) continue;
  const r = x.win === 'win' ? x.stage + 1 : x.stage, m = reach[x.side]; m.set(c, Math.max(m.get(c) || 0, r)); add(c, 'play_' + x.side, e.dev);
}
const out = [];
for (const [c, t] of tag) {
  const ru = reach.ura.get(c) || 0, rm = reach.minna.get(c) || 0;
  const strong = t.has('minnaclear') || t.has('uraclear') || rm >= 2 || ru >= 5 || [...t].some(s => s.startsWith('tura_'));
  if (strong) out.push({ c, rm, ru, t: [...t], dev: [...(dev.get(c) || [])].length });
}
out.sort((a, b) => b.rm - a.rm || b.ru - a.ru);
console.log('強い 形', out.length, 'みんなクリア', out.filter(o => o.t.includes('minnaclear') || o.rm >= 5).length, 'みんな 3 以上', out.filter(o => o.rm >= 3).length, 'うらクリア', out.filter(o => o.t.includes('uraclear') || o.ru >= 5).length);
console.log('ランク登録の 形', [...tag].filter(([, t]) => t.has('rankreg')).length);
fs.writeFileSync('real_strong.json', JSON.stringify({ strong: out, rank: [...tag].filter(([, t]) => t.has('rankreg')).map(([c]) => c) }));
