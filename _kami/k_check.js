// ものさしの 確認: みんなクリアの 形が 今の sim で 本当に みんな 5 たいを ぬけるか
const { run } = require('../_terrain/dist_par.js'), RB = require('../sim.js');
const S = require('./real_strong.json').strong;
const mc = S.filter(o => o.t.includes('minnaclear') || o.rm >= 5);
const devs = new Set(); 
const M = RB.MINNA.map(d => RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg }));
(async () => {
  const pairs = []; for (const o of mc) for (const m of M) pairs.push([o.c, m, 'flat']);
  const t0 = Date.now(), r = await run(pairs);
  let all = 0; const depth = [0,0,0,0,0,0];
  mc.forEach((o, i) => { let k = 0; while (k < 5 && r[i * 5 + k] === 'A') k++; depth[k]++; if (k === 5) all++; });
  console.log('みんなクリアの 形', mc.length, '今の sim で 5 たい', all, '深さ', depth.join(' '), ((Date.now() - t0) / 1000) + '秒', pairs.length / ((Date.now() - t0) / 1000) + '戦/秒');
})();
