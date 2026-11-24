#!/bin/zsh
# serves each build on its own port: main 4500, fix 4501, p2-15 4502, p2-30 4503, p2-30b 4505, count-* 4510..
FF=/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf
ME=/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p2-nearby-sizes-5d951c
srv() { node $FF/scripts/firefox-gpu-bench/serve.mjs $1 $2 & }
srv $FF/dist-bench/main 4500; srv $FF/dist-bench/fix 4501
srv $ME/dist-bench/p2-15 4502; srv $ME/dist-bench/p2-30 4503; srv $ME/dist-bench/p2-30b 4505
srv $ME/dist-bench/count-main 4510; srv $ME/dist-bench/count-fix 4511; srv $ME/dist-bench/count-p2-15 4512; srv $ME/dist-bench/count-p2-30 4513; srv $ME/dist-bench/count-p2-30b 4515
wait
