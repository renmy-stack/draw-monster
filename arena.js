// ちけい ぼうけん（2026-09-30〜、?arenatest の 端末だけ）: 5 つの 闘技場で 1 たいずつ。負けても その ステージから、描きなおしても 進みは そのまま
// 相手は おもて・うら・みんな の 形を 借りて 地形むきに えらんだ（_arena_cpu.js: ランクせんの 80 体で、平らなら 26 体が 1 つの 形で 5 つ 全部 勝てるが、この 地形では 0 体）
(function (root) {
const RB = root.RB || require('./sim.js');
const pick = (list, name) => list.find(c => c.name === name);
const STAGES = [
  { key: 'yama', name: 'おやま', hint: 'まんなかが もりあがってる', arena: { floor: [[-120, 0], [0, 70], [120, 0]], hw: 380 },
    cpu: ['ヤマノボリ', '#6d4c41', RB.URA, 'ドクロ'], sky: ['#10233a', '#2f5d50'], ground: '#4e6b3a', edge: '#8bc34a' },
  { key: 'heya', name: 'せまい へや', hint: 'かべが すぐ そこ', arena: { floor: [], hw: 170, sx: 100 },
    cpu: ['ハコイリ', '#37474f', RB.URA, 'ダイマオウ'], sky: ['#1b1b2f', '#40304f'], ground: '#5d4a6d', edge: '#b39ddb' },
  { key: 'dokutsu', name: 'ひくい どうくつ', hint: 'てんじょうが ひくい（せが たかいと はいれない）', arena: { floor: [], hw: 380, ceil: 170 },
    cpu: ['ツララ', '#00838f', RB.URA, 'オニ'], sky: ['#0b1417', '#1d3a40'], ground: '#455a64', edge: '#80deea' },
  { key: 'gake', name: 'がけっぷち', hint: 'かべが ない。おちたら まけ', arena: { floor: [[-290, -400], [-260, 0], [260, 0], [290, -400]], hw: 0, fall: 120 },
    cpu: ['ガケマル', '#ef6c00', RB.URA, 'ヤミ'], sky: ['#2a1633', '#7a3b2e'], ground: '#6d4c41', edge: '#ffb74d' },
  { key: 'dansa', name: 'だんさ', hint: 'あいては たかい ところに いる', arena: { floor: [[-50, 0], [50, 60]], hw: 380 },
    cpu: ['タカミ', '#283593', RB.MINNA, 'オオヤマ'], sky: ['#0f1a3a', '#3a2a63'], ground: '#3f4a8f', edge: '#9fa8da' },
];
const ARENA_CPU = STAGES.map(s => { const d = pick(s.cpu[2], s.cpu[3]); return Object.assign({}, d, { name: s.cpu[0], color: s.cpu[1] }); });
root.ARENA = { STAGES, CPU: ARENA_CPU };
if (typeof module !== 'undefined' && module.exports) module.exports = root.ARENA;
})(typeof window !== 'undefined' ? window : globalThis);
