#!/bin/sh
cd "$(dirname "$0")"
node tp_atk.js yama110; node tp_atk.js dansa100
node tp_cross_atk.js flat yama110 heya dokutsu gake dansa100
node tp_cross_atk.js yama dansa yama110 dansa100
echo VARDONE
