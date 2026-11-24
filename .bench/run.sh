#!/bin/zsh
# usage: run.sh "<variants>" "<engines>" "<modes>" "<sizes: phone desktop>" rounds
W=/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p3-coarse-sizes-de0771
cd $W
variants=(${=1}); engines=(${=2}); modes=(${=3}); sizes=(${=4}); rounds=${5:-6}
typeset -A port; p=4710; pids=()
for v in $variants; do port[$v]=$p; node scripts/firefox-gpu-bench/serve.mjs dist-bench/$v $p >/dev/null & pids+=($!); p=$((p+1)); done
trap 'kill $pids 2>/dev/null' EXIT; sleep 1
for s in $sizes; do
  if [[ $s == phone ]]; then export VW=390 VH=844 DPR=3; else export VW=1440 VH=900 DPR=2; fi
  for e in $engines; do for m in $modes; do for v in $variants; do
    echo -n "$s "; ENGINE=$e node $W/.bench/wk.mjs http://localhost:${port[$v]} $v $m $rounds 2>&1 | tail -1
  done; done; done
done
