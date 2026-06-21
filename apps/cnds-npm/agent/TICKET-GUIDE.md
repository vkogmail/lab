# Ticket writing guide — what makes a request "pass as a ticket"

A ticket carries the **specific** intent of one piece of work. The **generic** bar — use the
design system, start from a template, data through a seam (never hardcoded), handle
empty/loading/error, accessibility, tests — is the [Definition of Done](./DEFINITION-OF-DONE.md)
and applies to **every** ticket. **Link the DoD; never restate its rules in a ticket.**

A request that repeats global rules, or omits the concrete entity/data/acceptance, is not a ticket
yet — normalize it or stop and ask.

## A ticket has
- **Title** — concise feature name.
- **Type** — Story / Task / Bug.
- **Description** — the intent: *what* and *why*, in the product's own terms (the real entity, not
  "an item").
- **Data** — the source/entity and the fields that drive it. **If there is no data yet, that's a
  STOP-AND-ASK, not a ticket.**
- **Acceptance criteria** — specific, testable, feature-level (what *this* screen/component must
  do). Not generic rules.
- **Definition of Done** — a link. The standing bar.
- (Optional) labels, assignee.

## What does NOT belong in a ticket
- Generic engineering/DS rules ("use tokens", "no hardcoded data", "handle loading states",
  "start from a template") → these are the **DoD**, linked.
- Implementation prescriptions that over-constrain the agent (which exact component to use) —
  unless that constraint is genuinely required.
- Vague asks with no entity, data, or acceptance → normalize, or STOP-AND-ASK.

## The data rule (why "pull it from data, not hardcoded" is NOT a ticket line)
"Data comes through a seam, never hardcoded inline" is a **standing DoD rule**. Therefore:
- **Data exists** → the ticket *names the source*; it does not say "don't hardcode."
- **No data exists** → that's missing input → **STOP-AND-ASK**. Don't invent data, and don't paper
  over the gap with a rule in the ticket.

## Turning a prompt into a ticket
A team member's prompt is usually informal. Before building, normalize it into the shape above:
extract the intent, name the entity/data, write feature-specific acceptance, attach the DoD link.
Drop any generic rules the prompt restates (they're already the bar). If the prompt lacks a
concrete entity/data or any acceptance, STOP-AND-ASK rather than guess.

## Example (good)
> **Title:** Professional review screen · **Type:** Story
> **Description:** When a professional applies to join the network, a reviewer needs a screen to
> assess them — their review summary plus the full history of their vetting.
> **Data:** The applicant record (name, current step, reviewer, status, description) and its
> review-activity entries.
> **Acceptance:** Summary shows name/step/reviewer/status + description · activity timeline lists
> every event in order (who/what/when/outcome) · a new applicant with no activity reads clearly.
> **Definition of Done:** (link)

No "use the design system", no "handle loading states", no "don't hardcode" — those are the DoD.
