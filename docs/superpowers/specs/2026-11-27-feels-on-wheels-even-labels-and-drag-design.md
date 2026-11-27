# Even label sizes and drag that follows the finger

Two small changes to how the wheel looks and moves, decided 2026-11-27.

## 1. One label size per ring

**Why.** On phones, some labels look much bigger than others in the same ring, which reads as emphasis that isn't meant (Lucas). Each label is sized to its own cell: as big as the cell allows, up to the cap. Cells in a ring differ (a middle word with 3 outer words gets a wider slice than one with 2), so on a 375 px phone with the whole wheel showing, the feelings wheel's middle ring has words at 15.6 px beside words at 10.4 px, and the body wheel's areas run from 9 to 21.5 px. Once a word is opened, every label already reaches the cap, so the problem is the whole-wheel view and the zoom between.

**What.** Every label in a ring is drawn at one size: the biggest size at which every label in that ring fits, by today's fitting rules (one line, then two lines, then shrinking). It's worked out over the whole ring, not just the cells on screen, so turning the wheel never changes it. At that size each label still picks one line or two for itself.

On a 375 px phone with the whole wheel showing, that gives: feelings cores 19.5, middle 10.4, outer 9; body areas about 9, sensations about 9, feelings 8.

**Approaches.**

- **One size per ring** (picked): fully even. The cost is the body areas, which drop to about the size of their sensations (Chest from 21.5 to about 9).
- **Same, but the center ring fits each word:** evens the middle and outer rings only, and leaves cores and body areas varied (body areas 9 to 21.5).
- **A lower max size:** doesn't fix it. The big middle words are 15.6 px because their cells are tall, not because of the 24 px cap. Evening them out this way would take a cap of about 10 px, which would shrink the cores too.

**Left to the builder.** Caching, so pinch frames stay smooth (the perf tests' 20 ms bar holds).

## 2. With a word opened, dragging follows the finger

**Why.** The [known issue](../../ROADMAP.md#navigation) found by Lucas 2026-11-23: with a word opened, an up/down drag turns the wheel by the finger's vertical movement divided by the opened ring's radius, so the wheel only keeps pace with the finger on that ring. Grab nearer the center and it lags; grab nearer the edge and it runs ahead.

**What.** An up/down drag with a word opened turns the wheel by the change in the finger's angle around the wheel's center, the rule the whole wheel already uses, so the spot you grabbed stays under your finger. The fling on release uses the same angular speed. Drags still lock to an axis: up/down turns the wheel, left/right swipes in or out. Scrolling with a mouse wheel or trackpad isn't a grab and stays as it is.

**Approaches.**

- **Follow the finger's angle** (picked): exact wherever you grab, and one rule for both views.
- **Divide by where you grabbed:** keeps using only the vertical movement, divided by the grabbed point's distance from the center. Close, but a little off toward the top and bottom of the screen.
