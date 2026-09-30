#!/bin/sh
# 順番を 入れかえ: 地形が かわる かも しれない ひくい・がけ は あとで（run_dg.sh）。ログは run_all.log に 足す
cd "$(dirname "$0")"
while tasklist 2>/dev/null | grep -q "^node.exe *30444 "; do sleep 15; done
node tp_make2.js yama ura
for t in heya dansa; do node tp_make2.js $t omote; node tp_make2.js $t ura; done
echo PART1DONE
