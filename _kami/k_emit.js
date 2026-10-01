// node k_emit.js squad3.json — かみの 5 たいを sim.js に 書く（よわい 順 → つよい 順）。
// 強さ = ものさし（ランキング 上位＋みんなクリア）を 1 たいで 何 % 止めるか
const fs = require('fs'), path = require('path'), { run } = require('../_terrain/tp_par.js'), RB = require('../sim.js');
const IN = process.argv[2] || 'squad3.json', sq = JSON.parse(fs.readFileSync(IN, 'utf8')).squad;
const R = require('./rank_top.json'), S0 = require('./real_strong.json').strong;
const C = [...new Set(R.top.map(t => t.c).concat(S0.filter(o => o.t.includes('minnaclear') || o.rm >= 5).map(o => o.c)))];
const NAMES = ['ハジマリ', 'ムゲン', 'ゼツボウ', 'シンエン', 'カミサマ'], COLORS = ['#fff8e1', '#ffe082', '#ffca28', '#ffb300', '#ffffff'];
(async () => {
  const r = await run(sq.flatMap(s => C.map(c => [c, s.c, 'flat'])));
  const st = sq.map((s, k) => ({ c: s.c, rate: r.slice(k * C.length, (k + 1) * C.length).filter(v => v !== 'A').length / C.length }));
  st.sort((a, b) => a.rate - b.rate);
  const lines = st.map((s, i) => { const d = RB.decodeDesign(s.c); console.log(NAMES[i], (s.rate * 100).toFixed(0) + '% 止める'); return '  { name: "' + NAMES[i] + '", color: \'' + COLORS[i] + '\', body: ' + JSON.stringify(d.body) + ', arm: ' + JSON.stringify(d.arm) + ', leg: ' + JSON.stringify(d.leg) + ' },'; });
  const f = path.join(__dirname, '..', 'sim.js'); let src = fs.readFileSync(f, 'utf8');
  const block = '// かみ（4 つめ、2026-10-01）: 作者が 作った 5 たい（_kami/ の 作り方 2 ＋ 進化。プレイヤーの 形は 使って いない）。\n' +
    '// ものさし: いまの ランキング 上位 30 は ぜんぶ 止まる。並びは 1 たいで 止める 割合が ひくい 順＝後ろほど 強い\n' +
    'const KAMI_RAW = [\n' + lines.join('\n') + '\n];\nconst KAMI = KAMI_RAW.map(c => Object.assign({ name: c.name, color: c.color }, design(c.body, c.arm, c.leg)));\n\n';
  if (src.includes('const KAMI_RAW')) src = src.replace(/\/\/ かみ（4 つめ[\s\S]*?const KAMI = [^\n]*\n\n/, () => block);
  else src = src.replace('const API = {', () => block + 'const API = {');
  if (!/\bMINNA, KAMI,/.test(src)) src = src.replace('CPU, URA, MINNA,', 'CPU, URA, MINNA, KAMI,');
  fs.writeFileSync(f, src);
  // 書いた あとの sim.js で もういちど 並びどおり たしかめ（KAMI が 同じ 形に なって いるか）
  delete require.cache[require.resolve('../sim.js')];
  const RB2 = require('../sim.js'), K = RB2.KAMI.map(d => RB2.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg }));
  let S = C; for (const k of K) { const rr = await run(S.map(a => [a, k, 'flat'])); S = S.filter((a, i) => rr[i] === 'A'); }
  console.log('sim.js の KAMI で: ものさし', C.length, 'のうち ぬけた', S.length, '（ランキング', S.filter(c => R.top.some(t => t.c === c)).length, '）');
})();
