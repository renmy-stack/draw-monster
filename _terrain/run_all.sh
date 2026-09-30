#!/bin/sh
# ちけいの おもて・うら を 全部 作る（こちらで 作った 形だけ）。ログは run_all.log
set -e
cd "$(dirname "$0")"
node tp_make2.js yama omote
for t in heya dokutsu gake dansa; do node tp_make2.js $t omote; done
for t in yama heya dokutsu gake dansa; do node tp_evo.js $t; node tp_make2.js $t ura; done
echo ALLDONE
