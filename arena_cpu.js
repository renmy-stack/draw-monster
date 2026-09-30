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
  heya: {
    omote: [   // 77% 83% 67% 54% 55%、べつの 挑戦者で 全部ぬけ 14.0%（78% 82% 65% 54% 63%）
      ['ハコイリ', '#8d6e63', 'EJFHj0-LVYdcgF16WnNXcFBuR3E_dDd5MYAwhzGMOI8_CYCAhHaIbYxjkFqUUJhHnECkQA2AgH-KfpR9nXunerF4u3bEdM5x12_hbOpp9A'],
      ['スミッコ', '#7cb342', 'C5BjjXeHhH6HdX9xbXFZdkp-QodEjlAHgICNh5BvoYGjabR6um0OgICCiYSThpyIpomvirmKw4rMitaK4InpiPOH-Q'],
      ['カベドン', '#00897b', 'Dq52tIyxrY2rdKZVpkWPTHZRYU4-cj6MRa1DvVwIgICDjJOHkZmilKClsaGvsgqAgH-JfpN9nHumeq94uHfCdctz1A'],
      ['トビラ', '#6d4c41', 'EKJCokeiTo5OgE5yTl5OXkdeQl49XjZyNoA2jjaiNqI9DICAi4SSdp5_pnKye7luxXfMasxzzGbMbwSAgICKgJOAnQ'],
      ['ヘヤヌシ', '#33691e', 'EqxSr1-wcJpziXd4dGR2Um9OX1JSVUZZOmIreDKIL5wurzWsRgiAgIiGkY2Zk6KaqqCzp7utBoCAfop8lHyefKh-sw'],
    ],
  },
  dokutsu: {
    omote: [   // 78% 81% 68% 62% 51%、べつの 挑戦者で 全部ぬけ 14.1%（天井に つかえる 形を のぞく 546 体。77% 81% 61% 75% 50%）
      ['コウモリ', '#8d6e63', 'CoyAipeDn32edZl1gHVmfFyEWoxlB4CAiouUdZ6LqHWyi711B4CAf4p-lHudeKd1sHG5'],
      ['ツララ', '#7cb342', 'EJiAmJiYuoq6gLp2umi6aJhogGhnaEV2RYBFikWYRZhnB4CAi4SVe5-DqXu0g75-CYCAeYB1eXdyfm6FcIl2h36AgQ'],
      ['モグラ', '#00897b', 'DKGXnbCQwIDLcMBhsl2XY39wboBjkG2ffQaAgJCAg2mdcZBZqmIJgICEioiUjJ2SppevnbSktKq0'],
      ['ヒカリゴケ', '#6d4c41', 'E7JTsmSyeqGGjYZ8hmqGUoVObk1bTkpON1Igah98H40foCCyK7JBBoCAi36WfKB6q3m2dwWAgIKJhZGKmZGf'],
      ['ドウクツヌシ', '#33691e', 'EqtSplyiZZZsh295bmxpYWRWXVRSWkleP2w6eDOHOJU6nkGoSAWAgIp_lX-ffql-BICAgIt_l3ui'],
    ],
  },
  gake: {
    omote: [   // 80% 82% 65% 55% 51%、べつの 挑戦者で 全部ぬけ 10.3%（77% 79% 62% 49% 56%）
      ['ガケマル', '#8d6e63', 'DYpKilKJXYNdelx2WHZOdkZ2PHo4fziJOIpCDICAin-Tfp19p3uwerp5w3jNd9d24HXkcgyAgIOKhZOHnYqni7GNu4_FkM-R2ZLjku0'],
      ['ヒュルル', '#7cb342', 'CotdiXuEj32Nd3x1XXdAfCyELIlABYCAfJWcf4yjrIwKgIB-in2UfJ57qHuye7x8xn3Qf9o'],
      ['オチソウ', '#00897b', 'C593moyMmHyebZJlgWZtbVp8U41Sl2MEgICKfpR9nXsGgICDiYaSipqOo5Kr'],
      ['フチッコ', '#6d4c41', 'ELmguby55JjkgORo5EfkR7xHoEeDR1toW4BbmFu5W7mDCoCAiYaUgJuKpoiperV9sZmjlqaICYCAfXx6d3pxf22GbolziXmEfQ'],
      ['ガケノヌシ', '#33691e', 'EJB9kIqQnYedgJ15nXCdcIpwfXBvcFx5XIBch1yQXJBvBICAa5Gdi3GkCYCAfIV2hXGBcXp1dnt1gHqBgA'],
    ],
  },
  dansa: {
    omote: [   // 80% 83% 66% 55% 51%、べつの 挑戦者で 全部ぬけ 11.4%（78% 83% 63% 54% 52%）
      ['ダンダン', '#8d6e63', 'EZ10nXuUf4yDg4d3hm6CZ31keGBxZmtvZ3dig2SOY5ZpnG4MgICIh5CNmJSfmqehr6e3rr-0x7vOwdHICoCAf4p9lHqed6dzsW66acNjy13T'],
      ['カイダン', '#7cb342', 'EZmJnqGcv4u5g8d5vGvFZ6pok2R-ZGVrTnhQg02OTZxTnHIGgICMi5Fwn4ilbbOFB4CAg4mGk4mci6aNr4-5'],
      ['ノッポ', '#00897b', 'EZCMkZ6PsYq8g8F9uXe4brZwnG-Mcn1uYHhjfmOIZI5qkXoJgICKgZWCn4OphbOGvofIiNKJBYCAg4mGkYiai6M'],
      ['ウエノヒト', '#6d4c41', 'EJw5mlWUbot-gIN1fmxuZlVkOWYdbAV1BYAFiwWUBZodB4CAjH-IbZpxll-oZKlXBYCAg4qHk42claM'],
      ['タカミ', '#33691e', 'EJNpkYSNm4eqgLB5qnObb4RtaW9NczZ5J4AhhyeNNpFNBYCAlIJ-Zp9yilYKgICIf4yCj4mLkYSUfJF5iXyCgH8'],
    ],
  },
};
if (typeof module !== 'undefined' && module.exports) module.exports = ARENA_CPU;
