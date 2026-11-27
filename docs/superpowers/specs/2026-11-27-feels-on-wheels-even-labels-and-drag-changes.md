# Even label sizes and drag: changes from the spec

What shipped differs from the [spec](2026-11-27-feels-on-wheels-even-labels-and-drag-design.md) in these ways.

- **The opened word's label is sized to its own cell, not its ring** (Lucas, 2026-11-27). The spec assumed that once a word is opened, every label already reaches the cap. That holds with a middle word opened, but not with a core or a body area opened: one size per ring set every area to what "Head / face" fits, so the opened "Chest" went from about 28 px to about 14 px on a phone. The labels around it stay even.
- **The cores come out at 17.5 px on a 375 px phone**, not the 19.5 the spec estimated: "Scared", the core that fits least, was hidden behind the opened word when the sizes were first measured.
