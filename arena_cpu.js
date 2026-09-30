// ちけい ぼうけんの 相手（_terrain/tp_emit.js で 作る。手で 書きかえない）。形は こちらで 作った もの だけ（プレイヤーの 形は 使って いない）
// [名前, 色, 形の コード]。数字は えらんだ ときの「その 段まで 勝ちのこった 挑戦者が 勝つ 割合」
const ARENA_CPU = {
  yama: {
    omote: [   // 79% 80% 67% 57% 52%、べつの 挑戦者で 全部ぬけ 12.5%（80% 76% 63% 56% 58%）
      ['コロコロ', '#8d6e63', 'EJBJkGGQgoaCgIJ6gnCCcGFwSXAxcBB6EIAQhhCQEJAxBoCAjIyRb5-IpGyyhQqAgIOJhZOGnYanhrCGuoTEgs6A1w'],
      ['ヤマイモ', '#7cb342', 'E7JYrWuuhZ6TjJZ8lW2PV5BSd1JiUU5PNlMabB98F4sgnh6zJqtFCICAjoWPbqB9oWazdLRdvGwNgICDiYeSipuNpJCtkreVwJfJmdKb3J3ln-o'],
      ['ノボリン', '#00897b', 'C52TmqCMpnymZapmmWSNaH58gIx_n4UIgICFd4puj2WUXJpTn0qkQQWAgICKf5N7nHel'],
      ['イワオ', '#6d4c41', 'Dalspn6Wh4SLdIlihFp0VGNhVHFKhUaUU6daCoCAiX2Sept3pXWucrdvwGzGacZjB4CAfYp6lHeedKhxsm67'],
      ['ヤマノヌシ', '#33691e', 'EKNhoHeZio2WgJtzlmeKYHddYWBLZzhzK4AnjSuZOKBLDICAiYKSg5uGpIatibaKuXzHf8GbtJi2iguAgIKJhJOFnISmg6-BuH7Besp10m_a'],
    ],
  },
};
if (typeof module !== 'undefined' && module.exports) module.exports = ARENA_CPU;
