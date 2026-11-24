#!/bin/zsh
# Times several builds one after another, one browser at a time, and prints one JSON line per run.
# Run it with nothing else on the machine: parallel benchmarks skew each other (docs/wheel-rendering/findings.md).
# usage: scripts/wheel-bench/matrix.sh name=dist-dir [name=dist-dir ...] > results.jsonl
# Builds come from `npx vite build --mode test --outDir dist-bench/<name>` (the test build has the __fw hooks).
cd "$(dirname "$0")/../.."
typeset -A dir port; builds=(); p=4800; pids=()
for arg in "$@"; do n=${arg%%=*}; dir[$n]=${arg#*=}; builds+=($n); port[$n]=$p
  node scripts/firefox-gpu-bench/serve.mjs ${dir[$n]} $p >/dev/null & pids+=($!); p=$((p+1)); done
trap 'kill $pids 2>/dev/null' EXIT; sleep 2
run() { # engine size mode rounds
  if [[ $2 == phone ]]; then export VW=390 VH=844 DPR=3; else export VW=1440 VH=900 DPR=2; fi
  for b in $builds; do
    WAIT=600 ENGINE=$1 node scripts/wheel-bench/wk.mjs http://localhost:${port[$b]} $b $3 $4 2>/dev/null | tail -1 | sed "s/^{/{\"size\":\"$2\",/"
  done
}
run webkit phone inout 6
run webkit phone pinch 4
run webkit phone spin 4
run firefox desktop spin 4
run firefox desktop inout 6
run chromium phone inout 6
run webkit desktop inout 6
run firefox phone inout 6
