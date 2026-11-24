#!/bin/zsh
# timing matrix: wk.mjs over engines × sizes × modes × variants; then count.mjs over engines × sizes × variants
B=/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p2-nearby-sizes-5d951c/.bench
typeset -A port; port=(main 4500 fix 4501 p2-15 4502 p2-30 4503 p2-30b 4505)
typeset -A cport; cport=(main 4510 fix 4511 p2-15 4512 p2-30 4513 p2-30b 4515)
variants=(main fix p2-15 p2-30 p2-30b)
for e in ${=ENGINES:-chromium firefox webkit}; do for sz in "phone 390 844 3" "desktop 1440 900 2"; do set -- ${=sz}
  for m in spin inout pinch; do for v in $variants; do
    print -n "$2x$3@$4 "; VW=$2 VH=$3 DPR=$4 ENGINE=$e node $B/wk.mjs http://localhost:${port[$v]} $v $m ${ROUNDS:-6} 2>&1 | tail -1
  done; done; done; done
[[ -n $NOCOUNT ]] && exit
for e in ${=ENGINES:-chromium firefox webkit}; do for sz in "phone 390 844 3" "desktop 1440 900 2"; do set -- ${=sz}
  for v in $variants; do echo "## count $e $1 $v"; BASE=http://localhost:${cport[$v]} VW=$2 VH=$3 DPR=$4 ENGINE=$e node $B/count.mjs 2>&1 | head -4; done; done; done
