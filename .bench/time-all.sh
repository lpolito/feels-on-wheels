#!/bin/zsh
# Times every view-size variant with the shared wk.mjs, one after another. Run it with nothing else running.
# usage: .bench/time-all.sh [rounds]   (writes .bench/time-all.log)
# Each build has its variant baked in (VITE_LV), so plain wk.mjs needs no extra flags.
W=/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-view-size-labels-80d8e9
B=/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf
WK=/Users/lucas/dev/feels-on-wheels/.bench/explore/wk.mjs
rounds=${1:-6}
cd $B
typeset -A port
p=4600; pids=()
for v in fix v1 v12 v12f v123f v4 v5; do port[$v]=$p; node scripts/firefox-gpu-bench/serve.mjs $W/dist-bench/vs-$v $p >/dev/null & pids+=($!); p=$((p+1)); done
trap 'kill $pids 2>/dev/null' EXIT; sleep 1
for e in webkit chromium firefox; do
  for sz in "390 844 3" "1440 900 2"; do set -- ${=sz}
    for m in inout pinch spin; do
      for v in fix v1 v12 v12f v123f v4 v5; do
        ENGINE=$e VW=$1 VH=$2 DPR=$3 node $WK http://localhost:${port[$v]} vs-$v $m $rounds 2>&1 | tail -1 | sed "s/^/${1}x${2} /"
      done
    done
  done
done | tee $W/.bench/time-all.log
