# かいて！ロボファイト

からだ・うで・あし を 1 本ずつ描くと、ロボが歩いてパンチで戦う（自動）。足は回って歩き、腕は前後に振る。強く殴られると転ぶ。HP 0 で KO。
CPU ロボ 5 体と勝ち抜き。自分のロボを URL（`#r=`）で友達に送ると、友達がそのロボと戦える。1 戦 最大 30 秒。

https://renmy-stack.github.io/draw-robot/

## ファイル
- `sim.js` — ロボの組み立て（肩・腰の位置、重さ・重心）とバトルの物理。土台はドローカーの物理。決定的・DOM 非依存（Node でも動く）。数値を変えたら `SIM_VERSION` を上げる
- `game.js` — 描く画面（からだ → うで → あし）・バトルの描画（2 体に寄るカメラ）・勝ち抜き・ロボを送る
- `test_sim.js` — CPU ロボの総当たり、決定的か、URL の往復
- `trace.js A B` — CPU ロボどうしの 1 戦を 1 秒ごとに
- `tools/icon.html` — アイコン

## 確認
`python -m http.server 8096` → `http://127.0.0.1:8096/_frame.html?shot=5&stage=2`（`&result` で結果、`?draw` で描く画面）。
スクリプトを変えたら `game.js` の `VERSION`・`version.txt`・`index.html` の `?v=` を一緒に上げる。
