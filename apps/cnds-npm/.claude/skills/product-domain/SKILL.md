---
name: product-domain
description: Product/domain knowledge — entities, terminology, business rules, and canonical screens for the specific product being built. For CNDS this is an EMPTY STUB (a generic package has no product). A client fills this in with their domain. Load it when present so the agent builds the right thing, not just a correct thing.
---

# Product-domain skill (the client seam — EMPTY for CNDS)

> **Status for this repo: STUB.** CNDS is a generic "dumb" package — it has no product, no
> domain, no business rules. There is intentionally nothing real here. This file exists to (a)
> show the agent the layer exists and (b) give a client a template to populate.

The other skills make output *correct and well-built*. This layer makes it the *right thing* —
it knows what a "claim", "policy", or "tenant" is, which fields matter, and what the rules are.
Without it, the agent builds plausible generic screens; with it, it builds the product's screens.

This is the **same "which half do you have" split** as DEMO-PLAN.md §9: a client typically
already has this knowledge (their product + design); what they lack is the packaged contract.

## How the orchestrator uses this skill
- If this file has real content → load it and treat its entities/rules as ground truth.
- If it's still a stub (like now) → **do not invent domain facts.** Use neutral, generic example
  data (e.g. a "review queue" with steps/owners/status) and, per the DoD, **STOP-AND-ASK** when a
  ticket needs a domain decision that isn't the agent's to make.

---

## TEMPLATE — what a client fills in

### Glossary / entities
| Term | Means | Key fields |
|------|-------|------------|
| _e.g. Claim_ | _a customer request for payout_ | _id, status, amount, submittedAt, owner_ |

### Business rules
- _e.g. A claim over €10k requires a second approver._
- _e.g. Status flows: Draft → Submitted → In review → Approved/Rejected (no skipping)._

### Canonical screens / flows
- _e.g. Review queue, Claim detail, Approval flow._

### Domain vocabulary for microcopy
- _Preferred terms, tone, things never to call something._

### Data sources (later)
- _Where real data comes from when the JSON seam is replaced (API/endpoints/auth)._
