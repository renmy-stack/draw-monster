#!/bin/sh
# v168 と 選んだ 組み合わせに 同じ 攻め（種 31〜33・40 世代）を かけて くらべる
cd "$(dirname "$0")"
SQ=squad_pick.json OUT=base_pick.json node k_base.js
for s in 31 32 33; do
  BASE=base_v168_backup.json FOUND=found_cmp_v168.json node k_atk.js $s 40 2>&1 | grep -v "^\[dist\]"
  BASE=base_pick.json FOUND=found_cmp_pick.json node k_atk.js $s 40 2>&1 | grep -v "^\[dist\]"
done
echo DONE
