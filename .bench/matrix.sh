#!/bin/zsh
# usage: matrix.sh <out.jsonl> "<engines>" "<sizes>" "<modes>" "<variants>"
cd /Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-view-size-labels-80d8e9
out=$1; engines=(${=2}); sizes=(${=3}); modes=(${=4}); variants=(${=5})
for e in $engines; do for sz in $sizes; do
  if [[ $sz == phone ]]; then export VW=390 VH=844 DPR=3; else export VW=1440 VH=900 DPR=2; fi
  for m in $modes; do
    r=4; [[ $m == pinch ]] && r=3
    for v in $variants; do
      if [[ $v == main ]]; then url=http://localhost:4562; lv=; else url=http://localhost:4561; lv=$v; fi
      line=$(LV=$lv WAIT=${WAIT:-600} ENGINE=$e node .bench/wk2.mjs $url $v $m $r 2>&1 | grep -v '^$' | tail -1)
      echo "{\"size\":\"$sz\",\"wait\":${WAIT:-600},\"r\":$line}" >> $out
      echo "$sz $line"
    done
  done
done; done
