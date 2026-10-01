// tp_out2.json（えらんだ 形）→ ../arena_cpu.js（名前・色 つき）。node tp_emit.js
const fs = require('fs');
// tp_out3.json（ものさし ＝ 実際の プレイヤーの 形）を 使い、まだ ない ところは tp_out2.json（ランダムの 形の ものさし）。SKIP は 作りなおし 中で 出さない
const o2 = require('./tp_out2.json'), o3 = require('./tp_out3.json'), SKIP = (process.env.SKIP || '').split(',').filter(Boolean);
const out = {};
for (const k of ['yama', 'heya', 'dokutsu', 'gake', 'dansa', 'kori', 'mizu', 'belt']) { out[k] = {}; for (const t of ['omote', 'ura']) { if (SKIP.includes(k + '.' + t)) continue; const p = (o3[k] && o3[k][t]) || (t === 'omote' && o2[k] && o2[k][t]); if (p) { out[k][t] = p; p.yard = o3[k] && o3[k][t] ? 'real' : 'random'; } } }
const NAMES = {
  yama: { omote: ['コロコロ', 'ヤマイモ', 'ノボリン', 'イワオ', 'ヤマノヌシ'], ura: ['ガンセキ', 'ヤマアラシ', 'ナダレ', 'カザン', 'ヤマノカミ'] },
  heya: { omote: ['ハコイリ', 'スミッコ', 'カベドン', 'トビラ', 'ヘヤヌシ'], ura: ['ロウヤ', 'カンゴク', 'ツメコミ', 'ギュウギュウ', 'ミッシツオウ'] },
  dokutsu: { omote: ['コウモリ', 'ツララ', 'モグラ', 'ヒカリゴケ', 'ドウクツヌシ'], ura: ['ヤミコウモリ', 'ショウニュウ', 'イワツバメ', 'マグマ', 'チテイオウ'] },
  gake: { omote: ['ガケマル', 'ヒュルル', 'オチソウ', 'フチッコ', 'ガケノヌシ'], ura: ['ツキオトシ', 'ナライキ', 'ダンガイ', 'フウジン', 'ガケノオウ'] },
  kori: { omote: ['ツルリン', 'スベラー', 'ユキダマ', 'ヒョウザン', 'コオリノヌシ'], ura: ['フブキ', 'ツララオニ', 'アイスバーン', 'ゼッタイレイド', 'コオリノオウ'] },
  mizu: { omote: ['プカプカ', 'クラゲン', 'カッパ', 'ウミガメ', 'ミズノヌシ'], ura: ['ウズマキ', 'シンカイギョ', 'オオダコ', 'ツナミ', 'ミズノオウ'] },
  belt: { omote: ['ゴロゴロ', 'ベルトン', 'ハコビヤ', 'ユラユラ', 'ユカノヌシ'], ura: ['ナガレボシ', 'ベルトコンベア', 'ツキトバシ', 'ジシン', 'ユカノオウ'] },
  dansa: { omote: ['ダンダン', 'カイダン', 'ノッポ', 'ウエノヒト', 'タカミ'], ura: ['ミオロシ', 'テンジョウ', 'タカビシャ', 'ソビエ', 'テッペンオウ'] },
};
const COLORS = {
  omote: ['#8d6e63', '#7cb342', '#00897b', '#6d4c41', '#33691e'],
  ura: ['#455a64', '#4a148c', '#3e2723', '#b71c1c', '#111111'],
};
let s = '// ちけい ぼうけんの 相手（_terrain/tp_emit.js で 作る。手で 書きかえない）。形は こちらで 作った もの だけ（プレイヤーの 形は 使って いない）\n// [名前, 色, 形の コード]。数字は えらんだ ときの「その 段まで 勝ちのこった 挑戦者が 勝つ 割合」\nconst ARENA_CPU = {\n';
for (const [tk, tiers] of Object.entries(out)) {
  s += '  ' + tk + ': {\n';
  for (const [tier, pick] of Object.entries(tiers)) {
    s += '    ' + tier + ': [   // ' + pick.map(p => Math.round(p.rate * 100) + '%').join(' ') + (pick[0].check ? '、' + (pick.yard === 'real' ? '実際の 形 1500 で' : 'ランダムの 形で（前の ものさし）') + ' 全部ぬけ ' + pick[0].check : '') + '\n';
    pick.forEach((p, i) => { s += "      ['" + NAMES[tk][tier][i] + "', '" + COLORS[tier][i] + "', '" + p.code + "'],\n"; });
    s += '    ],\n';
  }
  s += '  },\n';
}
s += '};\n';
s += "if (typeof module !== 'undefined' && module.exports) module.exports = ARENA_CPU;\n";
fs.writeFileSync(__dirname + '/../arena_cpu.js', s);
console.log('arena_cpu.js', Object.entries(out).map(([k, v]) => k + ':' + Object.keys(v).join('/')).join(' '));
