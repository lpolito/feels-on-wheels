#!/bin/zsh
# Builds the test bundle and benchmarks it in headed Firefox: the whole wheel, a word opened, the body wheel, pinching.
# usage: scripts/firefox-gpu-bench/run.sh [prefsJSON]   e.g. '{"gfx.canvas.accelerated.profile-frames":0}'
set -e
cd "$(dirname "$0")/../.."
npm run build:test -- --outDir dist-bench >/dev/null
node scripts/firefox-gpu-bench/serve.mjs dist-bench 4191 >/dev/null &
server=$!
trap 'kill $server' EXIT
sleep 1
prefs=${1:-'{}'}
node scripts/firefox-gpu-bench/bench.mjs http://localhost:4191/ whole-wheel "$prefs" 6 spin
node scripts/firefox-gpu-bench/bench.mjs http://localhost:4191/angry/aggressive/hostile opened "$prefs" 3 spin
node scripts/firefox-gpu-bench/bench.mjs http://localhost:4191/body body "$prefs" 3 spin
node scripts/firefox-gpu-bench/bench.mjs http://localhost:4191/ pinch "$prefs" 3 pinch
