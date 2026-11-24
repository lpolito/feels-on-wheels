#!/bin/zsh
cd /Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-view-size-labels-80d8e9
while pgrep -f "matrix.sh" >/dev/null; do sleep 5; done
echo "== reruns"; node .bench/missing.mjs .bench/results.jsonl | .bench/rerun.sh .bench/results.jsonl http://localhost:4561
echo "== refined 1+2 (fresh fit at rest)"; : > .bench/results-f.jsonl
for e in webkit chromium firefox; do for sz in phone desktop; do for m in inout pinch; do for v in v12f v123f; do echo "$e $sz $m $v"; done; done; done; done | .bench/rerun.sh .bench/results-f.jsonl http://localhost:4564
echo "== in-frame renders per ring change (chromium)"
VW=390 VH=844 DPR=3 node .bench/count2.mjs http://localhost:4564
VW=1440 VH=900 DPR=2 node .bench/count2.mjs http://localhost:4564
echo "== traces"
for e in webkit firefox; do ENGINE=$e LVS="fix v1 v12f v123f" VW=390 VH=844 DPR=3 node .bench/trace2.mjs http://localhost:4564; ENGINE=$e LVS="fix v1 v12f v123f" VW=1440 VH=900 DPR=2 node .bench/trace2.mjs http://localhost:4564; done
echo "== done"
