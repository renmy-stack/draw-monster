#!/bin/sh
cd "$(dirname "$0")"
for t in flat yama heya dokutsu gake dansa; do node tp_atk.js $t; done
echo ATKDONE
