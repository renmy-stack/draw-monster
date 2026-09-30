// ちけい ぼうけんの 相手（_terrain/tp_emit.js で 作る。手で 書きかえない）。形は こちらで 作った もの だけ（プレイヤーの 形は 使って いない）
// [名前, 色, 形の コード]。数字は えらんだ ときの「その 段まで 勝ちのこった 挑戦者が 勝つ 割合」
const ARENA_CPU = {
  yama: {
    omote: [   // 90% 79% 78% 67% 72%、実際の 形 1500 で 全部ぬけ 29.3%（89% 81% 80% 73% 69%）
      ['コロコロ', '#8d6e63', 'D5VclGaKZ4JnemdxZ2tjbF5sVXFSelKCUYpRlFKTWAWAgId5j3OWbJ5mDoCAgIqAk3-dfad7sHm5dsNyzG7Uat1l5WDtWvU'],
      ['ヤマイモ', '#7cb342', 'EKOqoLCZtY25gLpzuWe1YLBdqmCjZ55zmoCZjZqZnqCjBICAeoyRg4uPCYCAe4J1hW-CbH1ud3R0enZ9fA'],
      ['ノボリン', '#00897b', 'EJK8kdGN4ofugPN57nPib9FuvG-nc5V5iYCFh4mNlZGnDYCAin2RdZt0omyta7RjvmLFWs9XyUvVRNxdBoCAhoiLjJCMmIydjA'],
      ['イワオ', '#6d4c41', 'C6eSoqyOuHrAYrtbn2CHY2p7apFlp3UIgICNgYptnHWaYaxpqVW2VgiAgIGJg5OGnIqkj62UtJq8'],
      ['ヤマノヌシ', '#33691e', 'EKBrnHOVeoyAgIJzgWh8ZXNha2NjaVx0WIBVjVaXXJ9jBYCAjZKRaqCPpGcEgICCh4aOi5M'],
    ],
    ura: [   // 73% 43% 40% 43% 59%、実際の 形 1500 で 全部ぬけ 2.3%（71% 42% 38% 30% 67%）
      ['ガンセキ', '#455a64', 'Dsdkx2ydbIBsY2w5bDlnOWE5XGNcgFydXMdcx2EGgICJhJSDnYinh6eMCoCAeoh1kHCYa6FnqmOyYLxdxVrO'],
      ['ヤマアラシ', '#4a148c', 'ENqv2sHa2qXagNpb2ibaJsEmryadJoRbhICEpYTahNqdBoCAlIV7ZZR2hlWUZgmAgH2EeIZzhHJ_dHp5eX57f4A'],
      ['ナダレ', '#3e2723', 'ENqO06i_v6LOgNNezkG_Lagmji1zQVxeTYBIok2_XNNzCoCAjn2CaZRtjVmUXJRIlD2UMpRBCICAhoCLf5CCkIeKi4WHhYI'],
      ['カザン', '#b71c1c', 'ENqt07m_w6LKgMxeykHDLbkmrS2hQZdekICOopC_l9OhBoCAk3t0aJRoeVWUVAeAgHh6c3lwc3NveW98dQ'],
      ['ヤマノカミ', '#111111', 'ENqW06K_rKKzgLVes0GsLaImli2KQYFeeoB4onq_gdOKBoCAlIJ9ZpRziVaUYwmAgHl6dHpxdXJweW19cH51e3k'],
    ],
  },
  heya: {
    omote: [   // 89% 82% 80% 70% 72%、実際の 形 1500 で 全部ぬけ 32.9%（88% 86% 82% 73% 73%）
      ['ハコイリ', '#8d6e63', 'EJe4l8uX5YrlgOV25WnlactpuGmmaYt2i4CLiouXi5emBICAiIGHdY52BICAe4l6lHua'],
      ['スミッコ', '#7cb342', 'EZyQmJqUpIyqg6x5qnGla55llmWLa4NveXl1gnWNdpR-mYYEgICGhYyKko4EgICAi32WeaA'],
      ['カベドン', '#00897b', 'ErlJqliqbZ18iHl2gmd2V2xWWFFJUDdeLGoidxOJE5wXoiynOgiAgIV3im2PZJRamVGeR6I-DYCAg4qGlIqdjaeRsJW6msOezKPVqN6t57Lv'],
      ['トビラ', '#6d4c41', 'EKx0rHmjfZaAhIB0gGR-WXpUdldtZGpzaIRolGmhbK1vCICAioCTgZ2BpoKwgrqCwYMJgIB_in2UfJ96qXmzd711x3TR'],
      ['ヘヤヌシ', '#33691e', 'EqxSr1-wcJpziXd4dGR2Um9OX1JSVUZZOmIreDKIL5wurzWsRgiAgIiGkY2Zk6KaqqCzp7utBoCAfop8lHyefKh-sw'],
    ],
    ura: [   // 74% 44% 40% 44% 59%、実際の 形 1500 で 全部ぬけ 3.5%（76% 41% 41% 45% 60%）
      ['ロウヤ', '#455a64', 'DompicGJ4oTifOJ34nfBd6l3kXdwfHCEcIlwiZEEgIB9mJ16j6MRgICKe46Bj4iNj4iUgph7mXSXb5JrjGuFbH5xeXd1fnWFdw'],
      ['カンゴク', '#4a148c', 'ENCKypK5mZ-dgJ9hnUeZNpIwijaCR3thd4B1n3e5e8qCBICAl3puaZpmC4CAhn-Ih4eMgZJ8knSOcYZygXl8gnw'],
      ['ツメコミ', '#3e2723', 'Dt-K35SnlICUWZQhlCGOIYYhgVmBgIGngd-B34YFgICPemtoj2duVQaAgIJ7h3qKf4aDgYI'],
      ['ギュウギュウ', '#b71c1c', 'EMJ_vYuvlZmbgJ5nm1GVQ4s-f0N0UWpnY4BhmWOvar10BoCAj4uOaqOEoWOsfRGAgHyEdoZwhmqDZn9keWVzZ21saXJneGd-aoJvhHWDe4GA'],
      ['ミッシツオウ', '#111111', 'DuSZ5KGpoYChV6EcoRycHJUckFeQgJCpkOSQ5JUGgICKemtoimduVIpTB4CAgXqIeYt-iYOChH-A'],
    ],
  },
  dokutsu: {
    omote: [   // 78% 81% 68% 62% 51%、ランダムの 形で（前の ものさし） 全部ぬけ 14.1%（天井に つかえる 形を のぞく 546 体。77% 81% 61% 75% 50%）
      ['コウモリ', '#8d6e63', 'CoyAipeDn32edZl1gHVmfFyEWoxlB4CAiouUdZ6LqHWyi711B4CAf4p-lHudeKd1sHG5'],
      ['ツララ', '#7cb342', 'EJiAmJiYuoq6gLp2umi6aJhogGhnaEV2RYBFikWYRZhnB4CAi4SVe5-DqXu0g75-CYCAeYB1eXdyfm6FcIl2h36AgQ'],
      ['モグラ', '#00897b', 'DKGXnbCQwIDLcMBhsl2XY39wboBjkG2ffQaAgJCAg2mdcZBZqmIJgICEioiUjJ2SppevnbSktKq0'],
      ['ヒカリゴケ', '#6d4c41', 'E7JTsmSyeqGGjYZ8hmqGUoVObk1bTkpON1Igah98H40foCCyK7JBBoCAi36WfKB6q3m2dwWAgIKJhZGKmZGf'],
      ['ドウクツヌシ', '#33691e', 'EqtSplyiZZZsh295bmxpYWRWXVRSWkleP2w6eDOHOJU6nkGoSAWAgIp_lX-ffql-BICAgIt_l3ui'],
    ],
  },
  gake: {
    omote: [   // 80% 82% 65% 55% 51%、ランダムの 形で（前の ものさし） 全部ぬけ 10.3%（77% 79% 62% 49% 56%）
      ['ガケマル', '#8d6e63', 'DYpKilKJXYNdelx2WHZOdkZ2PHo4fziJOIpCDICAin-Tfp19p3uwerp5w3jNd9d24HXkcgyAgIOKhZOHnYqni7GNu4_FkM-R2ZLjku0'],
      ['ヒュルル', '#7cb342', 'CotdiXuEj32Nd3x1XXdAfCyELIlABYCAfJWcf4yjrIwKgIB-in2UfJ57qHuye7x8xn3Qf9o'],
      ['オチソウ', '#00897b', 'C593moyMmHyebZJlgWZtbVp8U41Sl2MEgICKfpR9nXsGgICDiYaSipqOo5Kr'],
      ['フチッコ', '#6d4c41', 'ELmguby55JjkgORo5EfkR7xHoEeDR1toW4BbmFu5W7mDCoCAiYaUgJuKpoiperV9sZmjlqaICYCAfXx6d3pxf22GbolziXmEfQ'],
      ['ガケノヌシ', '#33691e', 'EJB9kIqQnYedgJ15nXCdcIpwfXBvcFx5XIBch1yQXJBvBICAa5Gdi3GkCYCAfIV2hXGBcXp1dnt1gHqBgA'],
    ],
  },
  dansa: {
    omote: [   // 89% 81% 78% 70% 72%、実際の 形 1500 で 全部ぬけ 32.9%（89% 84% 82% 73% 74%）
      ['ダンダン', '#8d6e63', 'EatcomCfZZtriGd9anBpXWlgYl9aYFByUX1Qik6WUKVSplcLgICLfYlumG6WYKVgo1KyUrBDv0S9NQ2AgH-Kf5R_nn-of7F_u4DFgM-B2YLjhO2F9g'],
      ['カイダン', '#7cb342', 'EI28jcONzYXNgM17zXPNc8NzvHO1c6t7q4CrhauNq421DICAioOUgJ6FqIGyh72DxojRhdqK4YfhjAaAgH-LfpV9oHyrerI'],
      ['ノッポ', '#00897b', 'Epucmqect5C8hb17u3C8ZrZlqGOcZJBlgnF-e3yFfJB8m4KakQyAgIiHkI6XlJ-bp6KvqbewvrbGvc7E08sHgIB9iniUc51tpmavX7Y'],
      ['ウエノヒト', '#6d4c41', 'EJy7nMSc0IvQgNB10GTQZMRku2SyZKV1pYCli6WcpZyyCoCAi4OQc518om2vdrRmwm_GYNJoBYCAhYeLjpKVmJs'],
      ['タカミ', '#33691e', 'Eq1ur3Ohd5d7iX54fWl7YHZVc1BuWmlbY2pheWCIX5lfoWSqaAWAgJKNiWWlg5tbCICAgIp_lH6ee6h4sXS6bsM'],
    ],
  },
};
if (typeof module !== 'undefined' && module.exports) module.exports = ARENA_CPU;
