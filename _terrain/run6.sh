#!/bin/sh
# がけ・うごくゆか を 直した 落ちる 判定で 選びなおし、がけ の 攻め側も 育てなおして くらべる
cd "$(dirname "$0")"
node tp_evo.js gake; node tp_make2.js gake omote; node tp_make2.js gake ura
node tp_evo.js belt; node tp_make2.js belt omote; node tp_make2.js belt ura
node tp_atk.js gake; node tp_atk.js kori; node tp_atk.js mizu; node tp_atk.js belt
node tp_cross_atk.js flat yama heya dokutsu gake dansa kori mizu belt
echo FIXDONE
