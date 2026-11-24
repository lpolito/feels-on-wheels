#!/bin/zsh
B=/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p2-nearby-sizes-5d951c/.bench
typeset -A cport; cport=(main 4510 fix 4511 p2-15 4512 p2-30 4513 p2-30b 4515)
for e in chromium firefox webkit; do for sz in "phone 390 844 3" "desktop 1440 900 2"; do set -- ${=sz}
  for v in main fix p2-15 p2-30 p2-30b; do echo "## $e $1 $v"; BASE=http://localhost:${cport[$v]} VW=$2 VH=$3 DPR=$4 ENGINE=$e node $B/count.mjs 2>&1; done; done; done
echo ALLDONE
