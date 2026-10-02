#!/bin/sh
# v170 に v168 と 同じ 攻め（種 31〜33・40 世代）。desk2 だけで（この PC は B の 計算中）
cd "$(dirname "$0")"
export REMOTE_ONLY=1
SQ=kami_v170_ko.json OUT=base_v170.json node k_base.js
rm -f found_cmp_v170.json
for s in 31 32 33; do BASE=base_v170.json FOUND=found_cmp_v170.json node k_atk.js $s 40 2>&1 | grep "おわり"; done
echo DONE
