#!/bin/sh
# 似すぎ なしの KO 組（squad_ko2）に v168・v170 と 同じ 攻め（種 31〜33・40 世代）
cd "$(dirname "$0")"
SQ=squad_ko2.json OUT=base_ko2.json node k_base.js
rm -f found_cmp_ko2.json
for s in 31 32 33; do BASE=base_ko2.json FOUND=found_cmp_ko2.json node k_atk.js $s 40 2>&1 | grep "おわり"; done
echo DONE
