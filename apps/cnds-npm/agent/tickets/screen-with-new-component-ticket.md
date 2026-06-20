# Ticket: screen + new compound component — "Review item detail"

**Type:** screen (that requires a NEW compound component)
**Request:** "From the review queue, add a detail screen for a single item. Show the item's
summary (step, owner, status, a short description) and below it a **timeline of its activity** —
each event has who did it, what they did, when, and a status. Pull it from data, not inline."

This deliberately needs a component the package does **not** have (no timeline/activity-feed in
`@createnew/ui-react`). So it tests component-creation AND screen-composition in one go.

## Acceptance (grade against agent/DEFINITION-OF-DONE.md §2 AND §3)
**Component half (§2):**
- Run the reuse tree FIRST: confirm no timeline exists; **compose from existing primitives where
  possible** (`Avatar`, `StatusBadge`, text) rather than building everything from scratch.
- Build a new compound `ActivityTimeline` (app-level, `src/components/`) — tokens only, no hex.
- Handle the empty timeline state.
- **Flag it as a candidate for `@createnew/ui-react`** in the summary (promotion flag).

**Screen half (§3):**
- Starts from a template (`PageTemplate`).
- Item summary uses DS components (`Card`, `StatusBadge`).
- **Data via the seam**: a hook over `src/data/*.json`, with empty / loading / error states.
- Wired into the demo app as a navigable section (`demo-sections.ts` + `App.tsx`).
- `npm run smoke` passes (build + drift).

## Judgment to watch (skill eval)
- The item's exact summary fields aren't fully specified → is this DEFAULT-AND-NOTE (low stakes,
  pick sensible fields, document) or STOP-AND-ASK? (Correct call: default-and-note for a demo.)
- Does it map event status → `signal` tokens, not `--color-brand-*`?
- Does it STOP-AND-ASK rather than hardcode if a needed token/primitive is genuinely missing?

## Output required
A short report: DoD checklist tick per item, which exit it took (DONE / DEFAULT-AND-NOTE /
STOP-AND-ASK) and why, the promotion flag, and — most important — **where the skills were vague
or insufficient** (the signal for what to tighten).
