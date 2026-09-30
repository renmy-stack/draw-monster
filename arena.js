// ちけい ぼうけん（2026-10-01〜、?arenatest の 端末だけ）: 6 つの 地形 × おもて・うら・みんな の かちぬき
// 水平 は いまの ぼうけん（RB.CPU / URA / MINNA）。ほかの 地形は 地形ごとに 新しい 相手（形は コードで もつ）
// 相手の えらび方: 平らの 同じ 段と おなじ むずかしさ（各段で「そこまで 勝ちのこった 挑戦者」が 勝つ 割合を あわせる）
//   おもて: 人が 描きそうな ランダムな 形 で 水平の おもてと おなじ クリア率。うら: その 地形で 進化させた 形 から、水平の うらと おなじ くらい
//   みんな: あとで その 地形の うらを クリアした プレイヤーの 形から できる かぎり むずかしく（オーナー 2026-10-01）
// 前の 地形の おもてを クリアすると 次の 地形が ひらく（?arenaall の 端末は ぜんぶ ひらく）
(function (root) {
const RB = root.RB || require('./sim.js');
const cpu = list => list.map(([name, color, code]) => Object.assign({ name, color }, RB.decodeDesign(code)));
const AC = typeof ARENA_CPU !== 'undefined' ? ARENA_CPU : require('./arena_cpu.js');   // 地形ごとの 相手（arena_cpu.js）
const cpus = k => { const o = {}; for (const [t, l] of Object.entries(AC[k] || {})) o[t] = cpu(l); return o; };
const TERRAINS = [
  { key: 'flat', name: '水平', arena: null, cpu: { omote: RB.CPU, ura: RB.URA, minna: RB.MINNA } },
  { key: 'yama', name: 'おやま', hint: 'まんなかが もりあがってる', arena: { floor: [[-120, 0], [0, 70], [120, 0]], hw: 380 },
    sky: ['#10233a', '#2f5d50'], ground: '#4e6b3a', edge: '#8bc34a',
    cpu: cpus('yama') },
  { key: 'heya', name: 'せまい', hint: 'かべが すぐ そこ', arena: { floor: [], hw: 170, sx: 100 },
    sky: ['#1b1b2f', '#40304f'], ground: '#5d4a6d', edge: '#b39ddb', cpu: cpus('heya') },
  { key: 'dokutsu', name: 'ひくい', hint: 'てんじょうが ひくい（せが たかいと はいれない）', arena: { floor: [], hw: 380, ceil: 170 },
    sky: ['#0b1417', '#1d3a40'], ground: '#455a64', edge: '#80deea', cpu: cpus('dokutsu') },
  { key: 'gake', name: 'がけ', hint: 'かべが ない。おちたら まけ', arena: { floor: [[-290, -400], [-260, 0], [260, 0], [290, -400]], hw: 0, fall: 120 },
    sky: ['#2a1633', '#7a3b2e'], ground: '#6d4c41', edge: '#ffb74d', cpu: cpus('gake') },
  { key: 'dansa', name: 'だんさ', hint: 'あいては たかい ところに いる', arena: { floor: [[-50, 0], [50, 60]], hw: 380 },
    sky: ['#0f1a3a', '#3a2a63'], ground: '#3f4a8f', edge: '#9fa8da', cpu: cpus('dansa') },
];
root.ARENA = { TERRAINS };
if (typeof module !== 'undefined' && module.exports) module.exports = root.ARENA;
})(typeof window !== 'undefined' ? window : globalThis);
