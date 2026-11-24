
### Chromium, 390x844 at 3x

| | main | branch | P2 15% | P2 30% | P2 30% + budget |
|---|---|---|---|---|---|
| Middle → core (zoom out): labels rendered, run 1 / run 2 | 680 / 709 | 680 / 675 | 340 / 404 | 276 / 292 | 265 / 286 |
| … most in one frame (p90 frame) | 66 (61) | 66 (63) | 65 (55) | 66 (54) | 61 (20) |
| Core → middle (zoom in): labels rendered, run 1 / run 2 | 345 / 374 | 312 / 349 | 379 / 389 | 393 / 413 | 366 / 281 |
| … most in one frame (p90 frame) | 81 (52) | 81 (33) | 103 (52) | 84 (54) | 66 (52) |
| Spin, 10 steps: labels rendered | 24 | 22 | 25 | 23 | 25 |
| Pinch, 2.5 s: labels rendered | 0 | 0 | 0 | 0 | 0 |
| Dropped frames, worst frame | not measured | not measured | not measured | not measured | not measured |

### Chromium, 1440x900 at 2x

| | main | branch | P2 15% | P2 30% | P2 30% + budget |
|---|---|---|---|---|---|
| Middle → core (zoom out): labels rendered, run 1 / run 2 | 250 / 246 | 332 / 164 | 168 / 82 | 86 / 82 | 168 / 0 |
| … most in one frame (p90 frame) | 82 (63) | 82 (63) | 82 (1) | 82 (0) | 64 (16) |
| Core → middle (zoom in): labels rendered, run 1 / run 2 | 104 / 104 | 186 / 186 | 185 / 145 | 96 / 104 | 16 / 53 |
| … most in one frame (p90 frame) | 82 (0) | 82 (21) | 123 (0) | 82 (0) | 21 (0) |
| Spin, 10 steps: labels rendered | 9 | 9 | 9 | 9 | 5 |
| Pinch, 2.5 s: labels rendered | 46 | 46 | 46 | 46 | 46 |
| Dropped frames, worst frame | not measured | not measured | not measured | not measured | not measured |

### Firefox, 390x844 at 3x

| | main | branch | P2 15% | P2 30% | P2 30% + budget |
|---|---|---|---|---|---|
| Middle → core (zoom out): labels rendered, run 1 / run 2 | 694 / 678 | 698 / 729 | 375 / 449 | 261 / 327 | 298 / 237 |
| … most in one frame (p90 frame) | 66 (64) | 64 (61) | 66 (56) | 66 (36) | 61 (21) |
| Core → middle (zoom in): labels rendered, run 1 / run 2 | 346 / 296 | 333 / 356 | 358 / 382 | 368 / 413 | 303 / 308 |
| … most in one frame (p90 frame) | 59 (53) | 80 (35) | 101 (34) | 119 (52) | 72 (34) |
| Spin, 10 steps: labels rendered | 25 | 25 | 25 | 23 | 25 |
| Pinch, 2.5 s: labels rendered | 0 | 0 | 0 | 0 | 0 |
| Canvas after spin, ring changes and pinch | sw | GPU | GPU | GPU | GPU |
| Dropped frames, worst frame | not measured | not measured | not measured | not measured | not measured |

### Firefox, 1440x900 at 2x

| | main | branch | P2 15% | P2 30% | P2 30% + budget |
|---|---|---|---|---|---|
| Middle → core (zoom out): labels rendered, run 1 / run 2 | 332 / 260 | 332 / 246 | 168 / 32 | 168 / 0 | 168 / 0 |
| … most in one frame (p90 frame) | 82 (82) | 82 (21) | 82 (0) | 82 (0) | 64 (16) |
| Core → middle (zoom in): labels rendered, run 1 / run 2 | 104 / 104 | 104 / 104 | 96 / 172 | 0 / 0 | 16 / 16 |
| … most in one frame (p90 frame) | 103 (0) | 82 (0) | 150 (0) | 0 (0) | 16 (0) |
| Spin, 10 steps: labels rendered | 15 | 8 | 9 | 8 | 9 |
| Pinch, 2.5 s: labels rendered | 46 | 46 | 46 | 46 | 46 |
| Canvas after spin, ring changes and pinch | sw | GPU | GPU | GPU | GPU |
| Dropped frames, worst frame | not measured | not measured | not measured | not measured | not measured |

### Webkit, 390x844 at 3x

| | main | branch | P2 15% | P2 30% | P2 30% + budget |
|---|---|---|---|---|---|
| Middle → core (zoom out): labels rendered, run 1 / run 2 | 679 / 653 | 657 / 710 | 325 / 339 | 245 / 259 | 239 / 244 |
| … most in one frame (p90 frame) | 66 (64) | 65 (64) | 61 (40) | 61 (35) | 61 (20) |
| Core → middle (zoom in): labels rendered, run 1 / run 2 | 318 / 333 | 387 / 391 | 368 / 452 | 410 / 336 | 330 / 328 |
| … most in one frame (p90 frame) | 79 (33) | 100 (52) | 117 (52) | 96 (53) | 69 (52) |
| Spin, 10 steps: labels rendered | 23 | 25 | 25 | 25 | 25 |
| Pinch, 2.5 s: labels rendered | 0 | 0 | 0 | 0 | 0 |
| Dropped frames, worst frame | not measured | not measured | not measured | not measured | not measured |

### Webkit, 1440x900 at 2x

| | main | branch | P2 15% | P2 30% | P2 30% + budget |
|---|---|---|---|---|---|
| Middle → core (zoom out): labels rendered, run 1 / run 2 | 332 / 246 | 332 / 164 | 168 / 82 | 168 / 82 | 150 / 0 |
| … most in one frame (p90 frame) | 82 (63) | 82 (65) | 82 (0) | 82 (0) | 85 (16) |
| Core → middle (zoom in): labels rendered, run 1 / run 2 | 104 / 104 | 186 / 104 | 185 / 145 | 185 / 145 | 34 / 16 |
| … most in one frame (p90 frame) | 82 (0) | 82 (0) | 103 (0) | 103 (0) | 16 (0) |
| Spin, 10 steps: labels rendered | 9 | 9 | 9 | 9 | 9 |
| Pinch, 2.5 s: labels rendered | 46 | 46 | 46 | 46 | 46 |
| Dropped frames, worst frame | not measured | not measured | not measured | not measured | not measured |
