// ランクせんの 「人が すくない グループ」に 入れる 弱い CPU を 作る（2026-10-03 オーナー 案・中間案: 行には CPU と 出さない・ルールに 1 行）
// 人が 描きそうな ランダムな 形（_terrain/tp_gen.js）を ぼうけんの おもて 5 たいと 左右 2 戦ずつ 戦わせ、勝率 20〜45% の 形を 40 体
// node tools/make_fillers.js → tools/fillers.json（[{ id, name, code }]）。id は 'cpu_' で はじまる（rank_batch.js が 計算に 足す）
const fs = require('fs'), path = require('path');
const RB = require('../sim.js'), { gen, plain } = require('../_terrain/tp_gen.js'), { run } = require('../_terrain/tp_par.js');
const NAMES = ['もちまる', 'ガブガブ', 'ぽんた', 'つよし', 'みかん', 'くろすけ', 'ドラゴン', 'ぴょんきち', 'ゴロー', 'てつ', 'うさぎ', 'タコ丸', 'ぷるぷる', 'ニャン太', 'ばくだん', 'ロボ', 'くまさん', 'さかな', 'ゆうしゃ', 'ハチ',
  'ぺんぎん', 'ぎざぎざ', 'おばけ', 'カニ', 'しろまる', 'あかべえ', 'つの丸', 'ちびすけ', 'ゴン', 'マル', 'ぴかり', 'とげとげ', 'ごま', 'もぐ', 'ヒーロー', 'かめきち', 'ふわり', 'がおー', 'ドン', 'すいか'];
(async () => {
  const cand = gen(240, 20261003).map(c => plain(RB.decodeDesign(c) || {})).filter(c => c && RB.decodeDesign(c));
  const opp = RB.CPU.map(plain), pairs = [];
  for (const c of cand) for (const o of opp) pairs.push([c, o, 'flat'], [o, c, 'flat']);
  const r = await run(pairs), score = cand.map((c, k) => { let w = 0; for (let j = 0; j < opp.length * 2; j++) { const v = r[k * opp.length * 2 + j]; w += j % 2 === 0 ? (v === 'A' ? 1 : v === 'D' ? 0.5 : 0) : (v === 'B' ? 1 : v === 'D' ? 0.5 : 0); } return w / (opp.length * 2); });
  const pick = cand.map((c, k) => [c, score[k]]).filter(([, s]) => s >= 0.2 && s <= 0.45);
  for (let i = pick.length - 1; i > 0; i--) { const j = (i * 7919 + 13) % (i + 1); [pick[i], pick[j]] = [pick[j], pick[i]]; }
  const out = pick.slice(0, NAMES.length).map(([code, s], k) => ({ id: 'cpu_' + String(k).padStart(2, '0'), name: NAMES[k], code, s: Math.round(s * 100) }));
  fs.writeFileSync(path.join(__dirname, 'fillers.json'), JSON.stringify(out, null, 1));
  console.log('候補 ' + cand.length + '・勝率 20〜45% ' + pick.length + ' → ' + out.length + ' 体（勝率 ' + out.map(x => x.s).join(',') + '）');
})();
