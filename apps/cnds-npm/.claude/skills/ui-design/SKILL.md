---
name: ui-design
description: Generic, design-system-agnostic UI craft — visual hierarchy, layout, spacing rhythm, density, responsive behavior, and which component fits which job. Use alongside a package skill when composing screens or components. The judgment layer the package skill lacks.
---

# UI-design skill (the judgment layer)

The package skill knows `Button` takes `variant="primary"`; it does NOT know a screen needs one
clear primary action top-right with a loading state. That judgment lives here. This skill is
**DS-agnostic** — it ports to any design system; it names roles, the package maps roles to tokens.

## Visual hierarchy
- **One primary action per view.** Everything else is secondary/outline/ghost. If two things look
  primary, neither is.
- Establish a clear scan order: title → key data → actions. Size, weight, and spacing encode rank —
  not color alone (color is for status/brand, not hierarchy).
- Group related things; separate unrelated things. Whitespace is the cheapest grouping tool.

## Layout & spacing
- Use the spacing **scale**, never arbitrary px. Consistent rhythm > pixel-perfect one-offs.
- Align to a grid; left edges should line up. Ragged left edges read as broken.
- Density matches context: dashboards/tables = tighter; forms/marketing = airier.
- Constrain line length and content width (templates usually expose a `maxWidth`).

## Which component for which job
- Tabular, scannable, many rows → a **table** (sortable/filterable if the user must find things).
- A few grouped fields/stats → a **card**.
- Transient confirmation/decision → a **dialog**, not a new page.
- Inline feedback → an **alert**; per-item state → a **status badge**.
- Choosing from a known set → a **select/radio**; binary → a **switch/checkbox**.
- Picking the heavier component "to be safe" is a smell — match weight to the job.

## Responsive
- Design the narrow case too: what stacks, what hides, what scrolls.
- Tables on mobile: prioritize columns or switch to a stacked/card view.
- Touch targets stay tappable; don't shrink interactive elements below comfortable size.

## States are part of the design (not an afterthought)
Every data-driven surface has **empty / loading / error**, not just the happy path. Design the
empty state (what to do next) and the loading state (skeleton/spinner) deliberately — see the
`ux` skill for the full state matrix.

## Self-check
- Is there exactly one primary action?
- Does spacing use the scale consistently?
- Is the scan order obvious without reading every word?
- Are empty/loading/error visually handled?
- Does it hold up at a narrow width?
