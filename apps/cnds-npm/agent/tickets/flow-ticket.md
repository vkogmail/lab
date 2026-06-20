# Ticket: flow — "Request access"

**Type:** flow
**Request:** "A 3-step request-access flow: (1) enter details, (2) review what you entered,
(3) confirmation. The user can go back, cancel, and must see a clear success state at the end."

## Acceptance (grade against agent/DEFINITION-OF-DONE.md §4)
- All steps reachable; forward/back/cancel all wired.
- State persists across steps (back doesn't wipe input).
- A clear success end-state with a next action; no dead-ends.
- Error/recovery path on the submit step.
- Each step screen independently meets the Screen DoD (§3) — incl. form validation states.
- Uses `FormPageTemplate` + DS form controls (`TextField`, `Select`, etc.). Shared checklist (§1) green.

## What this ticket is really testing (skill eval)
- Does `ux` make the agent build back/cancel/error, not just the golden path?
- Does `frontend-eng` keep flow state in one owner across steps (no duplicated state)?
- Does it STOP-AND-ASK if "details" fields aren't specified (structural ambiguity) rather than
  inventing a domain form? (product-domain is a stub here.)
