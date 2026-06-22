# Ticket: screen — "Review queue"

**Type:** screen
**Request:** "Build a review-queue page: a page header, a filterable table of pending items
(step, owner, status), and a primary action to mark an item done. Pull the rows from data, not
hardcoded inline."

## Acceptance (grade against agent/DEFINITION-OF-DONE.md §3)
- Starts from a **template** (`PageTemplate`), not bespoke layout CSS.
- Table is a DS component (`DataTable`), status shown via `StatusBadge`.
- **Data via the seam**: a hook over `src/data/*.json`, with empty / loading / error states —
  not just the happy path.
- One obvious primary action; responsive; navigable in preview.
- Shared checklist (§1) green; `npm run build` + `npm run drift` pass.

## What this ticket is really testing (skill eval)
- Does the agent reach for a template first (`cnds-package` composition order)?
- Does it build the data seam per `frontend-eng`, returning {data,loading,error}?
- Does it design empty/loading/error per `ux`, not just render rows?
- Does `ui-design` give it a single clear primary action?
