---
name: frontend-eng
description: Generic React front-end engineering — component structure, state ownership, props/data flow, hooks, and where data binds in components/screens (the data seam). Use when wiring interactivity or data into UI built from a design system. DS-agnostic.
---

# Front-end-engineering skill (the mechanics layer)

How to wire what the package gives you into working, maintainable React. DS-agnostic. The
"where does the data go" half of building screens (the UI skill covers where it goes *visually*;
this covers the *mechanics*).

## Component structure
- Keep presentational components dumb: props in, events out. Push state up to the screen/flow.
- Don't fork DS components to add behavior — wrap or compose them, passing props/handlers.
- Co-locate a screen's state in the screen; lift to a flow only when shared across steps.

## State ownership
- DS form controls and `Dialog`/`Select` are **controlled** — the parent owns `value`/`open`.
- Derive, don't duplicate: compute from source state (e.g. `useMemo`) instead of mirroring it.
- One source of truth per piece of state. No two components owning the same value.

## The data seam (where data binds)
Data enters through **one swappable boundary**, never hardcoded inside components:
```
src/data/*.json   →   a data hook (e.g. useReviewQueue)   →   screen   →   DS components
```
- Today the hook reads a local JSON file; tomorrow it calls an API. **Components don't change** —
  only the hook's body does. That's the seam.
- The hook returns `{ data, loading, error }` (or similar) so the screen can render all three
  states. Never return only the happy-path array.
- **Collection vs single resource:** for a list, "empty" = `data.length === 0`. For a *detail*
  screen (one object), there's a distinct **not-found** state = `data === null` — handle it
  separately from loading/error (e.g. an info `Alert`), don't conflate it with an empty list.
- Shape the data at the seam to match what components expect (e.g. `ColumnDef` accessors), so
  components stay declarative.

```ts
// src/data/useReviewQueue.ts
import rows from "./review-queue.json";
export function useReviewQueue() {
  // swap this body for fetch() later; signature stays identical
  return { data: rows, loading: false, error: null as string | null };
}
```

## Hooks & effects
- Effects are for synchronizing with the outside world (fetch, subscriptions), not for deriving state.
- Clean up subscriptions/timers. Guard against setting state after unmount when you add real fetches.
- Stable keys in lists (an id, never the array index).

## Types
- Type the data shape once at the seam and flow it through. Let DS component prop types (e.g.
  `ColumnDef<Row>`, `SelectOption`) drive your local types.

## Self-check
- Does data enter through a single hook/seam, not inline literals?
- Does the screen handle loading and error, not just data?
- Is every piece of state owned in exactly one place?
- Would swapping JSON→API touch only the hook body?
- `npm run build` clean (no type errors)?
