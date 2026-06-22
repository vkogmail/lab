---
name: ux
description: Generic UX — flows, journeys, the full interaction-state matrix (empty/loading/error/success), accessibility basics, and microcopy. Use when building a screen or multi-step flow so it's usable, not just rendered. DS-agnostic.
---

# UX skill (the usability layer)

Turns a rendered screen into a usable one. DS-agnostic. Covers what happens *around* the happy
path — the states, paths, and words that decide whether a flow actually works.

## The interaction-state matrix (design ALL of these)
For every data-driven surface and action:
| State | Must answer |
|-------|-------------|
| **Empty** | Nothing here yet — what is this, and what do I do next? (a CTA, not a blank box) |
| **Loading** | Something's happening — skeleton/spinner, don't freeze or jump layout |
| **Error** | It failed — what happened, and how do I recover/retry? (plain language) |
| **Success** | It worked — confirm it (toast/inline), then get out of the way |
| **Partial/edge** | Long text, 1 item vs 1000, missing fields, no permission |

A screen that only handles "data present" is not done.

## Flows (multi-step)
- Map every path before building: entry, forward, **back, cancel, and failure** — not just the
  golden path.
- Preserve work: state persists across steps; back doesn't wipe input.
- Tell users where they are and how many steps remain.
- Define the **end state** explicitly (confirmation + clear next action). Don't dead-end.
- Make destructive/irreversible actions confirm; make everything else forgiving (undo > confirm).

## Semantic HTML & headings (build the page out of meaning)
- Use real elements: `<main>`, `<nav>`, `<header>`, `<footer>`, labelled `<section>`, `<ul>/<ol>`
  for lists, `<button>` for actions and `<a>` for navigation, `<dl>` for key/value.
- **Exactly one `<h1>`** per page (its subject). Headings increase by one level — **never skip**
  (no `h1 → h3`). Heading level reflects *structure*, not visual size (size comes from tokens).
- Page content lives inside a `<main>` landmark; label repeated regions
  (`aria-label` / `aria-labelledby`).
- Watch DS components that emit their own heading (e.g. `Card.Title` renders a heading) — don't let
  them create a skipped level or duplicate the page `<h1>`.

## Accessibility (baseline, non-negotiable)
- Every input has a label; every icon-only button has an accessible name.
- Keyboard: everything reachable and operable; focus order is logical; focus visible.
- Prefer native semantics over ARIA; add `aria-*` only to fill gaps. Meaningful images get `alt`,
  decorative ones get `alt=""`.
- Don't rely on color alone to convey meaning (pair with text/icon).

> Enforced automatically by **axe** in the visual gate (`npm run smoke`) on full-page scenarios.
> For a deeper manual WCAG audit, use the **`design:accessibility-review`** skill.

## Microcopy
- Buttons name the action ("Publish", "Delete project"), not "OK"/"Submit" where avoidable.
- Errors: what happened + what to do, no codes/jargon, no blame.
- Empty states: orient + offer the next step.
- Be consistent in terms (don't call it "project" here and "workspace" there).

## Self-check
- Are empty/loading/error/success all handled?
- Can I complete, cancel, AND go back without losing work?
- Keyboard-only: can I do everything?
- Does every button/error say something useful and specific?
