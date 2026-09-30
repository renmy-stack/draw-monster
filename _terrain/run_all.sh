#!/bin/sh
# ちけいの おもて・うら（ものさしは 実際の プレイヤーの 形）。ログは run_all.log
set -e
cd "$(dirname "$0")"
for t in yama heya dokutsu gake dansa; do [ -f evo_$t.json ] || node tp_evo.js $t; done
for t in yama heya dokutsu gake dansa; do node tp_make2.js $t omote; node tp_make2.js $t ura; done
echo ALLDONE
