#!/bin/sh
cd "$(dirname "$0")"
for t in kori mizu belt; do node tp_evo.js $t; node tp_make2.js $t omote; node tp_make2.js $t ura; done
echo NEWDONE
