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
    omote: [   // 89% 81% 80% 68% 71%、実際の 形 1500 で 全部ぬけ 28.1%（85% 87% 82% 62% 75%）
      ['コウモリ', '#8d6e63', 'D5hdlWGPZIdnfmd0Zm1jaV9pWm5WdVR-UodSj1WVWAaAgIx_im2bcZlgpV8JgICBioKTgp2CpoGwgLl-w3vM'],
      ['ツララ', '#7cb342', 'C7J0pX-UiHmJZYNZeVVuYmR6YpRgoWoMgICEd4hujGWRXZVUmUudQqE5pTCqJ64eBoCAhIiJkI-Xlp2eow'],
      ['モグラ', '#00897b', 'D82Uza7N06DTgNNg0zPTM64zlDN6M1RgVIBUoFTNVASAgIGbm2-ToQqAgIV6inqRfpSFkoqMj4SOfoh_fw'],
      ['ヒカリゴケ', '#6d4c41', 'EMVtwH2xipqTgJZmk0-KQH07bUBeT1BmSIBEmkixUMBeB4CAiZKSbpuSpICjcqlxC4CAfIl3kXKabaJnqmGyW7lUwE3HRs0'],
      ['ドウクツヌシ', '#33691e', 'EL1PuVerXphjgGRoY1VeR1dDT0dGVT9oOoA5mDqrP7lGBYCAhouWiJmXpZkIgICBioSTiJyNpJSrm7Kktg'],
    ],
    ura: [   // 72% 43% 38% 50% 62%、実際の 形 1500 で 全部ぬけ 3.7%（70% 39% 36% 48% 77%）
      ['ヤミコウモリ', '#455a64', 'EK2PqZ6gq5G0gLdvtGCrV55Tj1eAYHNvaoBnkWqgc6mABICAfpmddo-jCYCAhoiMkZGblKSXrpm5msOZyA'],
      ['ショウニュウ', '#4a148c', 'EL2fvaq9upm6gLpnukO6Q6pDn0OUQ4RnhICEmYS9hL2UB4CAkYaFaKB6k1ylYpxXCYCAe4F0hG2Ba3puc3Vxe3R-ew'],
      ['イワツバメ', '#3e2723', 'EMeWx7DH1Z3VgNVj1TnVObA5ljl8OVdjV4BXnVfHV8d8BYCAlIyIZKaBmlkJgICIg46DkoeSjI6RiZGEjYSH'],
      ['マグマ', '#b71c1c', 'DuRZ5GOpY4BjV2McYxxdHFUcT1dPgE-pT-RP5FUGgICKemtoimduVYpTEYCAgXqGd4x2kXeWepl_moWZipaPkZKMk4aSgY9-in2Ffn8'],
      ['チテイオウ', '#111111', 'EM9cyWW4bp5zgHVic0huN2UxXDdSSEpiRYBDnkW4SslSBoCAj4mMap-Bn2KfeQ6AgIV-in2SgpWGlouUkJGUiJeDln-TfY58iX2E'],
    ],
  },
  gake: {
    omote: [   // 86% 80% 78% 71% 72%、実際の 形 1500 で 全部ぬけ 29.4%（84% 80% 83% 72% 74%）
      ['ガケマル', '#8d6e63', 'DY9Fjk6IVYJYe1d1UnFKcUF1OXszgjKINo08CoCAjIGOcZ13oGeubbFewGTCVNFaCoCAgoqFlIidjKeQsJW5msGgyqbS'],
      ['ヒュルル', '#7cb342', 'CpZIkWuHhHp4cWZsSHIseQ2GGI4sBICAg3qGc4ltDYCAgIqAk4CdgKaBsIG5gsODzYTWhuCI6Yny'],
      ['オチソウ', '#00897b', 'EpZvl3STeYt7hH98fnJ9bXlqdGhvZ2puZnVje1-EYY1hlGWYagSAgIN6hnOJbQWAgIGKgpOCnYGn'],
      ['フチッコ', '#6d4c41', 'DLdPr2uhiYB_ZIFKb0lPSjBlIIAbmiGxMweAgI9-gmmabY5YpVyZRw6AgH-Kf5N_nYCngbCCuoPDhs2I1ovgjumR8pX2'],
      ['ガケノヌシ', '#33691e', 'Crd9t42Sk26TS41JfUltbmeSZ7RuBYCAiHuQdZdwn2sJgICCioaUip6OqJSxmrmgwajJ'],
    ],
    ura: [   // 74% 47% 40% 40% 64%、実際の 形 1500 で 全部ぬけ 4.1%（76% 46% 41% 42% 66%）
      ['ツキオトシ', '#455a64', 'DoyIi5GImISdfJ14mHWRdIh1f3h4fHOEc4h4i38EgIBxj5mJipgLgICCioOThJ2Ep4Sxg7uCxYDOfth74g'],
      ['ナライキ', '#4a148c', 'EKhYpWCcZo9qgGxxamRmW2BYWFtQZEpxRYBEj0WcSqVQBICAf5uec5KkB4CAe4J2g3N_dHl5d357'],
      ['ダンガイ', '#3e2723', 'ENZNz1O9WKFcgF1fXENYMVMqTTFHQ0JfP4A-oT-9Qs9HBICAeZmYeoilEYCAfoV4iHKJbYdog2V-ZXhncmpucGt2antsgHCDdYN7gYE'],
      ['フウジン', '#b71c1c', 'EN2D1orCkKSUgJZclD6QKoojgyp7PnVccYBwpHHCddZ7BoCAkXlxaZFldVSRUAmAgHyHdIlthGt8b3Z3dH54gIA'],
      ['ガケノオウ', '#111111', 'EN2G1o7ClKSZgJpcmT6UKo4jhip-Pndcc4BxpHPCd9Z-BoCAkntzaJJnd1SSUwuAgIGFe4xyjWuHaYJseXB2eXV9eIKA'],
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
    ura: [   // 74% 44% 49% 59% 70%、実際の 形 1500 で 全部ぬけ 6.8%（75% 41% 49% 61% 73%）
      ['ミオロシ', '#455a64', 'EMdywXeyfJt-gH9lfk58P3c5cj9tTmllZoBlm2ayacFtCYCAeouLkn6ejqWBspG5hMWVzAWAgISKh5WKoIuq'],
      ['テンジョウ', '#4a148c', 'EN433kHeUKdQgFBZUCJQIkEiNyItIh9ZH4Afpx_eH94tBYCAfJqQeY-mkJkIgIB7iXeTdJ1yp3GxcLxxxg'],
      ['タカビシャ', '#3e2723', 'DuR65I3kqKmogKhXqByoHI0cehxnHEtXS4BLqUsIgICNgHhmjW-CVI1di0ONTAeAgHqEd4hxiG6DcX93fw'],
      ['ソビエ', '#b71c1c', 'EORB3FPHYqZsgHBabDliJFMcQSQvOSBaFoASphbHINwvB4CAcI2KkXShiqV3tYq5DoCAhoiNj5WVnZyloa6mt6vAr8my07Tdtue37bg'],
      ['テッペンオウ', '#111111', 'DeSU5LLk3KncgNxX3BzcHLIclBx2HExXTIBMBoCAa46Kj2-hiqJztASAgIGHgo2ClA'],
    ],
  },
};
if (typeof module !== 'undefined' && module.exports) module.exports = ARENA_CPU;
