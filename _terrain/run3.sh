#!/bin/sh
cd "$(dirname "$0")"
while ! grep -q PART1DONE run_all.log; do sleep 20; done
for t in dokutsu gake; do node tp_make2.js $t omote; node tp_make2.js $t ura; done
echo ALLDONE
