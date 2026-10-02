#!/bin/sh
# いたちごっこ（2026-10-01 夜）: ムゲン（champ_2）は そのまま、のこり 4 たいを「攻めで 見つけた 形」も 入れて 作りなおす → 測る → 攻める
# node k_round.sh 回数 はじめの回 。found_all.json に 攻めの 形が たまる。結果は round.log
cd "$(dirname "$0")"
N=${1:-3}; R0=${2:-1}
r=$R0
while [ $r -lt $((R0 + N)) ]; do
  echo "=== 回 $r $(date +%H:%M) 攻めの 形 $(node -e "console.log(require('./found_all.json').length)")"
  EXTRA=found_all.json OUT=squad_r$r.json node k_more.js champ_2.json 25 2>&1 | grep -v "^\[dist\]"
  SQ=squad_r$r.json OUT=base_r$r.json node k_base.js 2>&1 | grep -v "^\[dist\]"
  node -e "
    const RB=require('../sim.js'),sq=require('./squad_r$r.json').squad.map(s=>RB.decodeDesign(s.c)),F=require('./found_all.json');
    let n=0;for(const c of F){const d=RB.decodeDesign(c);if(sq.every(k=>RB.fight(d,k).winner==='A'))n++;}console.log('いままでの 攻めの 形',F.length,'のうち まだ ぬける',n);"
  cp base_r$r.json base.json; rm -f found.json
  for s in 1 2 3; do node k_atk.js $((r * 10 + s)) 40 2>&1 | grep "おわり"; done
  node -e "const fs=require('fs');const a=require('./found_all.json'),b=JSON.parse(fs.readFileSync('found.json','utf8'));const all=[...new Set(a.concat(b))];fs.writeFileSync('found_all.json',JSON.stringify(all));console.log('攻め: 新しく',b.length,'→ ためた',all.length);"
  cp found_all.json found_all_r$r.json
  r=$((r + 1))
done
echo "=== おわり $(date +%H:%M)"
