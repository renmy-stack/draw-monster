// かみの たしかめ（ものさしに 使って いない 形）: ランクせんに 登録された 形 全部・うらクリアの 形・みんな の 5 たい（負けたら 打ち切り）
const { run } = require('../_terrain/dist_par.js'), RB = require('../sim.js');
const J = require('./real_strong.json'), R = require('./rank_top.json');
const used = new Set(R.top.map(t => t.c).concat(J.strong.filter(o => o.t.includes('minnaclear') || o.rm >= 5).map(o => o.c)));
const enc = d => RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg }), K = RB.KAMI.map(enc);
const sets = { 'ランク登録（ものさし外）': J.rank.filter(c => !used.has(c)), 'うらクリア（ものさし外）': J.strong.filter(o => (o.t.includes('uraclear') || o.ru >= 5) && !used.has(o.c)).map(o => o.c), 'みんなの 5 たい': RB.MINNA.map(enc), 'うらの 5 たい': RB.URA.map(enc) };
(async () => {
  for (const [name, A] of Object.entries(sets)) {
    let S = A; const depth = [];
    for (const k of K) { const r = await run(S.map(a => [a, k, 'flat'])); S = S.filter((a, i) => r[i] === 'A'); depth.push(S.length); }
    console.log(name, A.length, '→ 1〜5 たいめを ぬけた 数', depth.join(' / '));
  }
})();
