#!/bin/sh
cd "$(dirname "$0")"
while ! grep -q ALLDONE run_all.log; do sleep 30; done
node tp_evo.js dansa strong
node -e "const f='./tp_out3.json',fs=require('fs'),o=JSON.parse(fs.readFileSync(f,'utf8'));delete o.dansa.ura;fs.writeFileSync(f,JSON.stringify(o))"
node tp_make2.js dansa ura
echo DANSADONE
