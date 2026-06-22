# Ticket: component — "Priority pill"

**Type:** component
**Request:** "We need a small pill that shows an item's priority — Low / Medium / High / Urgent —
in tables and cards. It should be visually distinct per level."

## Acceptance (grade against agent/DEFINITION-OF-DONE.md §2)
- Reuse tree run FIRST. (Hint: does `StatusBadge` / `Badge` already cover this? If so, the
  correct answer may be "use the existing component" — building a new pill could fail the reuse rule.)
- If composed/built: priority→token mapping is **semantic** (status/signal tokens, not brand).
- All four levels render distinctly; no hardcoded hex.
- Usage snippet documented.
- Shared checklist (§1) green.

## What this ticket is really testing (skill eval)
- Does `cnds-package` make the agent find `StatusBadge` before inventing a pill?
- Does it map "Urgent/High" → `signal` tokens rather than `--color-brand-*`?
- Does it STOP-AND-ASK if no token fits a 4th level, instead of hardcoding a color?
