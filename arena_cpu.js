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
    omote: [   // 86% 79% 80% 70% 72%、実際の 形 1500 で 全部ぬけ 30.2%（84% 79% 84% 74% 73%）
      ['ガケマル', '#8d6e63', 'EY9LkFaQZYdjgmp7a3NqcF1zUHBGcTt1MHw1gTCIL48zkj8EgICIhpCMmJIOgICBioKThJ2Gpoiwi7mOwpHLldSZ3Z3mou6n9g'],
      ['ヒュルル', '#7cb342', 'DopqiHyGioScfZZ5k3d-d2p3VHlEfUCDP4ZJh1gFgICHeI5xlWmcYgWAgH2JeZN1m2-k'],
      ['オチソウ', '#00897b', 'DIyGiJKFnYCke553k3aGd3d6aoBrhmmJeQaAgH-SmYKQn6qPoawIgIB_in2Te515p3ewdLlxww'],
      ['フチッコ', '#6d4c41', 'EJfCl96X_4r_gP92_2n_ad5pwmmnaYF2gYCBioGXgZenBoCAg4uThpKWopGlnAmAgHiAcX9ueHFweG5_cYJ4f38'],
      ['ガケノヌシ', '#33691e', 'EJV7k5ePr4i_gMV4v3GvbZdre21ecUZ4NoAwiDaPRpNeBoCAjIWOcJ59n2irbQmAgHyEd4J0fHd3fHSCd4R8goI'],
    ],
    ura: [   // 73% 47% 38% 43% 61%、実際の 形 1500 で 全部ぬけ 3.2%（74% 44% 38% 44% 59%）
      ['ツキオトシ', '#455a64', 'EJZ1ln2Wh4mHgId3h2qHan1qdWpuamR3ZIBkiWSWZJZuDoCAiIeUgZqNpoetkrmNwJjLktKe2JjYo9ie2KUHgICHhI2FjoqJjoSLhYU'],
      ['ナライキ', '#4a148c', 'ELhetHOohJWQgJRrkFiETHNIXkxJWDdrK4AnlSuoN7RJBYCAiJOXcZ2WrHMJgICAeYZ2jXeQfY-EiYiChn6A'],
      ['ダンガイ', '#3e2723', 'EMihwqSzp5upgKllqU2nPqQ4oT6eTZxlmoCZm5qznMKeBYCAiJGVcpyTpnQRgICDd4t4kXuWgZmImI-Vlo-biJ2BnHqZdZRzjXOFd358eg'],
      ['フウジン', '#b71c1c', 'ENVxzne8fKB_gIBgf0R8MncrcTJrRGdgZIBioGS8Z85rBYCAl4d-Ypl3jVIRgIBzf3R5d3R8cIJuiW-OcpJ3k36ThI-Jio2Ej36OeIt0hg'],
      ['ガケノオウ', '#111111', 'EORk3GvGcaZ1gHdadTpxJGscZCRdOlZaUoBRplLGVtxdBoCAinprZ4plb1KKUBGAgHN_dHh4cn1uhGyLbZFwlXaXfZaEkoqNjoaQf495i3WF'],
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
  kori: {
    omote: [   // 88% 79% 81% 69% 73%、実際の 形 1500 で 全部ぬけ 28.3%（87% 83% 79% 65% 76%）
      ['ツルリン', '#8d6e63', 'EI5gjm-Ke4eGgot5hXV8c25yYHNSdUR5O341hzuKRY1RB4CAhZCYe5iXq4KrnrmWCICAg4qHlIydkaaWr5y4o8A'],
      ['スベラー', '#7cb342', 'EZ-XmpuSo4ikfaR0o2ygZJ5nmWmSb5B1jX6Lho2RjJeQnpMFgICEdolsjWGSVwSAgH2GeItyjw'],
      ['ユキダマ', '#00897b', 'ELJ8ro2km5OkgKdtpV2aUo1NfFFrXV5tVYBRk1SkXa9sBoCAjHyDa5ZrjVqZVgqAgIOKhpSInomoibKJvYjHhtGD2A'],
      ['ヒョウザン', '#6d4c41', 'DK2aqKybvoC9aLtXrUeaWolpeoBwmneshgyAgIl7knWbcKRqrWW2YL9awVXBT8FKwUUKgIB9inuUep55qHmyebx7woLCi8I'],
      ['コオリノヌシ', '#33691e', 'Ds5vznmgeYB5YHkyeTJzMmsyZWBlgGWgZc5lzmsFgICVe3JomWd2VQmAgIN4g3KHbY1tknGSeI58iHw'],
    ],
    ura: [   // 74% 45% 39% 42% 63%、実際の 形 1500 で 全部ぬけ 2.7%（73% 41% 40% 45% 51%）
      ['フブキ', '#455a64', 'EJEukUSRZIdkgGR5ZG9kb0RvLm8XbwV5BYAFhwWRBZEXB4CAhY-XfZeXqoWqn7yOEYCAin6MhYuLiJGDlX2XdpdwlGyPaohqgm58c3d5dYB2hnk'],
      ['ツララオニ', '#4a148c', 'EL47uUSsTJhRgFNoUVRMR0RCO0cyVCpoJYAjmCWsKrkyCYCAjH6LbppxmWGpZKhUsFewShGAgIiBiYeIjYSSf5V5lnKUbpBqi2qFa39venR3enaAeIV7'],
      ['アイスバーン', '#3e2723', 'EL62vsq-5prmgOZm5kLmQspCtkKjQodmh4CHmoe-h76jD4CAiHqOcZdsnWOmXatUsE-wRrBBsDiwM7AqsCWwHQaAgIV8i3uOf4uEhoM'],
      ['ゼッタイレイド', '#b71c1c', 'Dt2k3b7d46fjgONZ4yPjI74jpCOJI2RZZIBkp2QQgICDd4ZtiWSMWpBQkUeRPZE0kSqRIZEXkQ2RBJEAkQAJgICCeoJ1hnGMcY91j3uLfoZ-'],
      ['コオリノオウ', '#111111', 'EMjDyNzI_57_gP9i_zj_ONw4wziqOIdih4CHnofIh8iqDoCAiXyRdZtzomumYqZYpk6mRaY8pjCmKaZBpkgHgICHeYl0j3SReY19iHs'],
    ],
  },
  mizu: {
    omote: [   // 89% 79% 81% 71% 74%、実際の 形 1500 で 全部ぬけ 30.9%（88% 78% 84% 76% 70%）
      ['プカプカ', '#8d6e63', 'EZBOkV6QcIl3gnh7dHJ5b2hvVm9GcDdzJXsngiaJI5ArkT4LgICMfYZsl22RXaNdnU2uTqhHuke0Rw6AgICKf5R_nn-nfrF-u37Ffs9_2X_jf-2A9oD_'],
      ['クラゲン', '#7cb342', 'ErKWq6ikuZnIiMh30WjGWbxVqFKWUIFccmppeGOJWphlpHKuggSAgJGKgmiTcgWAgHyKeJRznW2m'],
      ['カッパ', '#00897b', 'ELasssem3pXugPNr7lreTsdKrE6RWnpraoBllWqmerKRBICAb5CZf4iPCYCAeoF2fnR5d3R9c4F2g3uAgA'],
      ['ウミガメ', '#6d4c41', 'DqZXm1uYYIdheWFoYGRbXldeUmtPeU6HTpVPnFMPgICIhpGMmZKimKqes6S7qsSwyLbIvMjCyMjIzsjUCoCAf4l9k3qcd6Vzrm62ab5kxl3N'],
      ['ミズノヌシ', '#33691e', 'D65hqnelkY6Ve5pmlleEV2tUVlQ8aDF7J48rpjCxSAiAgIqClISdh6eJsYu7jb2SDICAg4qGk4qdjqaTrpm3n7-lxqzNtNS82g'],
    ],
    ura: [   // 73% 44% 38% 41% 60%、実際の 形 1500 で 全部ぬけ 2.9%（72% 45% 42% 34% 64%）
      ['ウズマキ', '#455a64', 'ELejt7S3y5fLgMtpy0nLSbRJo0mTSXtpe4B7l3u3e7eTBICAiJiXbJyaBoCAf4p8k3icdKVurQ'],
      ['シンカイギョ', '#4a148c', 'ENhM0ma-fKKLgJBei0J8LmYoTC4yQhxeDYAIog2-HNIyCoCAi3yGa5Zrll-MV5RLllyWZ5ZfCYCAe4N3h3GHbYNtfXF5d3l7fQ'],
      ['オオダコ', '#3e2723', 'DtZA1l3WhqSGgIZchiqGKl0qQCokKgVcBYAFpAUNgICBjI-Pi52YoZWvmLOYwZjTmNmY0pjemOwMgIB_in6Tfp1_poCwgrmFw4jMi9WQ3ZXm'],
      ['ツナミ', '#b71c1c', 'ENRMzWW7eqCIgI1giEV6M2UsTDMzRR5gEIALoBC7Hs0zC4CAhnaBaothhlWMS39IgjqaQZpOjEsHgIB5gnSGb4JwfHZ7eoA'],
      ['ミズノオウ', '#111111', 'ENKjy7u60J_dgOJh3UbQNbsuozWLRnZhaYBkn2m6dsuLCICAeIuNknufkaV-spS4gsURgICIcY51knyTg5GKjZCHlH-VeJRyj26JbYJvenN0eXGBbw'],
    ],
  },
  belt: {
    omote: [   // 88% 80% 79% 69% 73%、実際の 形 1500 で 全部ぬけ 26.1%（87% 82% 76% 70% 69%）
      ['ゴロゴロ', '#8d6e63', 'D5eElp2QsIjCfrlyvmypZ5FoeGxgc019QYhFj1yXawmAgIqBlYKfg6qEtIS_hcmG1IcFgICBi4OVhqCKqg'],
      ['ベルトン', '#7cb342', 'DaRIo2CWcYV8cnZiallUWztjJnMZhRWXHKMvCoCAioKUhZ6HqImyjLyOxpDKlcqcBoCAf4l_koCbg6SIrA'],
      ['ハコビヤ', '#00897b', 'DYxSjWqJfoKGfHl4bXNddUh3NnwogiWIJ4w7BICAiH-Qfph9CYCAgoqDlISeg6iCsoC8fcZ60A'],
      ['ユラユラ', '#6d4c41', 'EMNCw1zDgZyBgIFkgT2BPVw9Qj0oPQVkBYAFnAXDBcMoB4CAioyVdJ-MqXSrjKt1DICAe4h2kXOZb6JtrGu1ar9qyGvSbNtu5Q'],
      ['ユカノヌシ', '#33691e', 'D9Bc0HfQnqGegJ5fnjCeMHcwXDBBMBpfGoAaoRrQGg6AgIqCk3iefp50nnqecJ52nmyecp5snl-ed55sC4CAgoqEk4Sdg6eBsX66esR2zHDUadw'],
    ],
    ura: [   // 75% 45% 38% 40% 65%、実際の 形 1500 で 全部ぬけ 3.0%（74% 47% 41% 38% 55%）
      ['ナガレボシ', '#455a64', 'EN5m14DClqSlgKpcpT6WKYAiZilLPjVcJoAhpCbCNddLBYCAhpWQcZCYkHQJgIB7hXODcHxydXlxgHOEeoKB'],
      ['ベルトコンベア', '#4a148c', 'ELBysHmwgpSCgIJsglCCUHlQclBsUGJsYoBilGKwYrBsB4CAhY-XfJiVqoKrnL2JDYCAen95enxxgW-Kbo9xknqRf4uGhoeBhn2D'],
      ['ツキトバシ', '#3e2723', 'EOSA3IPHhqaIgIlaiDmGJIMcgCR8OXpaeIB3pnjHetx8B4CAinxyZ4pod1SKVXxBCYCAfIR3hHOBc3x2eHt3f3uAgA'],
      ['ジシン', '#b71c1c', 'ENKFy4u6kZ-UgJVhlEaRNYsuhTV_RnphdoB1n3a6est_BYCAeJObhYSjnJURgIBzf3R3d3F9bIRqi2uSbpZ0mXuYg5SJj46IkICPeox1hg'],
      ['ユカノオウ', '#111111', 'EOSc3KHGpaaogKlaqDqlJKEcnCSXOpNakICPppDGk9yXBoCAintrZ4pnb1OKUxGAgH6GeIdzh26EaoBoeml1a3BwbHVqe2uAbYRyhXeFfYKC'],
    ],
  },
};
if (typeof module !== 'undefined' && module.exports) module.exports = ARENA_CPU;
