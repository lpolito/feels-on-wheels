#!/bin/zsh
# usage: rerun.sh <out.jsonl> <url-for-vs> ; reads "engine size mode variant" lines on stdin
cd /Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-view-size-labels-80d8e9
out=$1; vsurl=$2
while read e sz m v; do
  if [[ $sz == phone ]]; then export VW=390 VH=844 DPR=3; else export VW=1440 VH=900 DPR=2; fi
  r=4; [[ $m == pinch ]] && r=3
  if [[ $v == main ]]; then url=http://localhost:4562; lv=; else url=$vsurl; lv=$v; fi
  line=$(LV=$lv WAIT=${WAIT:-600} ENGINE=$e node .bench/wk2.mjs $url $v $m $r 2>&1 | grep -v '^$' | tail -1)
  echo "{\"size\":\"$sz\",\"wait\":${WAIT:-600},\"r\":$line}" >> $out
  echo "$e $sz $m $v $line" | cut -c1-200
done
