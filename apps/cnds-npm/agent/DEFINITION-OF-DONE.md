# Definition of Done — agent tickets

How an agent (or the `cnds-builder` subagent) decides a ticket is **done, good enough, or
blocked**. Read with [`GUARDRAILS.md`](./GUARDRAILS.md). The point is twofold: produce correct,
on-system output **and** stop cleanly — don't gold-plate, don't loop, don't improvise around a
missing piece.

---

## 0. Universal rules (every ticket, before anything else)

1. **Reuse first.** Never build what already exists. Order: *use existing → compose from
   existing → only then build new.* A new thing that duplicates an existing one **fails DoD.**
2. **DoD is the floor and the ceiling.** Meeting it = done. Polishing past it = stop. Extra
   variants, animations, or "nice to haves" not in the ticket are out of scope.
3. **Never break a guardrail to finish a ticket.** If the only way to satisfy the ticket is a
   hardcoded color, a forked component, a new dependency, or a missing token/component — that is
   a **stop-and-ask** (§6), not a workaround.
4. **Self-verify before declaring done** (§5). "I wrote the code" is not done. "The checks pass
   and it renders" is done.
5. **Data always comes through a seam** (a hook/source), never hardcoded inline. This is a
   **standing rule** — tickets name the data *source* and link this DoD; they don't restate it
   (see [`TICKET-GUIDE.md`](./TICKET-GUIDE.md)). If a ticket has no data source, **STOP-AND-ASK** —
   don't invent data.

---

## 1. Shared DoD checklist (applies to all ticket types)

- [ ] Only `@createnew/tokens` + `@createnew/ui-react` used — no other UI libs, no new deps.
- [ ] No hardcoded hex/rgb/hsl; all styling via semantic token variables.
- [ ] Tokens applied **semantically** — the right token for the role (e.g. `--signal-foreground-bad`
      / `--signal-background-bad` for errors, not `--color-brand-primary`), not just "a token that
      looks right."
- [ ] No forked/vendored component source from `node_modules`.
- [ ] `npm run build` passes (tsc + vite).
- [ ] No console errors at runtime.
- [ ] Renders in the live preview (the shareable URL works).
- [ ] Accessible basics: labels on inputs, focus visible, sufficient contrast (token defaults
      handle most of this — don't override into failure).
- [ ] Semantic HTML: real landmarks, content inside a `<main>`, exactly one `<h1>`, **no skipped
      heading levels**, lists/`<dl>` for list/key-value data. Enforced by **axe** in the visual
      gate on full-page scenarios (package-level color-contrast is excluded — tracked upstream).

If any shared item can't be met **and** can't be fixed within the failure budget (§6) → escalate.

---

## 2. Component ticket

### Decision tree (run this FIRST — it decides the generation MODE, see DEMO-PLAN.md §11c)
```
1. Does it already exist in @createnew/ui-react?
      YES → use it. Ticket = "import + document usage." DONE. Do not rebuild.        [COMPOSE]
2. Can it be composed from existing components/primitives?
      YES → compose. Do NOT create a new primitive.                                  [COMPOSE]
3. Genuinely new primitive (doesn't exist, can't be composed)?
      YES → this is CREATE-NEW: it needs human/designer TASTE.                        [CREATE-NEW]
            Prefer STOP-AND-ASK for a sketch/spec/approval. If you do build, build a
            clearly-flagged CANDIDATE → design review → promotion. Never free-style a
            new visual unit into the product as if it were composition.
```
Steps 1–2 are **Compose** (autonomous, no taste, visual success is provable). Step 3 is the only
path where a human/designer is required — keep it the exception.

### DoD (when a build is actually needed)
- [ ] Correct component *type* for the job (e.g. don't build a custom dropdown when `Select` fits).
- [ ] All applicable **states** implemented: default, hover, focus, disabled, loading, error,
      empty — only those that apply to this component. (A purely presentational display component
      — e.g. a timeline/feed — legitimately has only **default + empty**; that is complete, not
      missing states.)
- [ ] **Interactions** match the ticket (click/keyboard/change behavior, controlled vs uncontrolled).
- [ ] Props/variants are documented (a short usage snippet).
- [ ] Shared checklist (§1) green.

### Promotion flag
A genuinely new primitive built in the consumer app may belong in the *package*, not here. It must
be built to the [`COMPONENT-STANDARD.md`](./COMPONENT-STANDARD.md) (the contribution bar) to be
**promotion-ready**. Note it in the PR with the readiness checklist:
**"New primitive `X` — candidate for `@createnew/ui-react`; meets COMPONENT-STANDARD: <yes/gaps>."**
A candidate that doesn't meet the standard is "new", not "promotion-ready". Don't silently fork the
system, and don't bake app/domain logic into a promotable component.

---

## 3. Screen ticket

- [ ] Starts from a **template** (`PageTemplate` / `FormPageTemplate` / `BasicPageTemplate`) —
      not bespoke layout CSS.
- [ ] Composed from existing components (reuse tree applied to each piece).
- [ ] **Data seam present**: data comes via a hook/JSON file, not hardcoded inline — and the
      screen handles **empty / loading / error** states, not just the happy path.
- [ ] Clear visual hierarchy; the **primary action is obvious**.
- [ ] Responsive at the defined breakpoints (no broken layout on narrow/wide).
- [ ] Navigable in the preview (reachable, no dead links).
- [ ] Shared checklist (§1) green.

---

## 4. Flow ticket

- [ ] Every step is reachable; transitions between steps are wired.
- [ ] **State persists** across steps where the flow requires it.
- [ ] Entry, **exit, back, and cancel** are all handled (not just forward).
- [ ] Error and **recovery paths** exist (what happens when a step fails).
- [ ] A clear **success end-state**.
- [ ] **Each screen in the flow independently meets the Screen DoD (§3).**
- [ ] Shared checklist (§1) green.

---

## 5. Self-verification loop (how the agent confirms "done")

Before declaring done, run this loop — don't skip to "looks right":
```
1. Build:        npm run build           → must pass
2. Drift-check:  (hook/CI)               → no hex, no non-@createnew imports
3. Render:       open the preview        → no console errors, states visible
4. Checklist:    tick the DoD for this ticket type
5. Any item un-tickable?
      → try to fix (within failure budget, §6)
      → still failing? ESCALATE (§6). Do not declare done.
```

---

## 6. Stopping & escalation protocol  ← the anti-token-burn core

There are exactly **three** ways a ticket ends. Pick one; never just keep going.

### A. DONE (success exit)
All DoD checks for the ticket type are green (§5 passed). Open a PR with the self-cert checklist
ticked + any defaults noted (below). **Stop. Do not add unrequested polish.**

### B. DEFAULT-AND-NOTE (don't ask for small stuff)
For **low-stakes ambiguity** — choices that don't change structure and are cheap to reverse —
pick a sensible default, proceed, and **document it** in the PR: *"Assumed X (e.g. table page
size 25); change if wrong."* Asking about these wastes everyone's time.

> Rule of thumb: **ask only when the cost of guessing wrong exceeds the cost of asking.**

### C. STOP-AND-ASK (hard halt — escalate, don't improvise)
Halt immediately and ask the human when **any** of these is true:

- A required **token or component doesn't exist** in the package (don't invent one — see §0.3).
- The request is **structurally ambiguous** — the answer changes the layout/flow/data shape
  (e.g. "build a dashboard" with no data or priority given).
- Two requirements **conflict**, or the only path forward **violates a guardrail**.
- The **same check fails after the failure budget** is spent.
- The ticket needs a **decision that isn't the agent's to make** (product rule, business logic,
  destructive action).

### Failure budget (stops the loop)
- Max **3 fix attempts** on the *same* failing check (build error, drift violation, broken render).
- After 3, **stop** — report what was tried. Do not try a 4th variation, do not switch strategies
  silently, do not work around it by relaxing a guardrail.

### Escalation message format (cheap + actionable)
Keep it to four lines — never a wall of text, never silent failure:
```
Blocked: <one-line reason>
Tried:   <what was attempted, briefly>
Options: <2–3 concrete choices, with a recommendation>
Need:    <the single decision required to continue>
```

---

## 7. Verifiability tiers (who certifies what)

| DoD item | Certified by |
|----------|--------------|
| No hex / package-only imports / build passes | **Automated** (drift-check hook + CI) — blocks merge |
| Renders, no console errors, states present | **Agent self-check** (§5) |
| Visual fidelity, hierarchy, UX correctness | **Human PR review** (a dev rubber-stamps) |
| Product/domain correctness (is this the right thing?) | **Human PR review** (product owner) |

The automated tier is the safety net for non-dev-initiated work (DEMO-PLAN.md §12): even if the
agent's judgment slips, the PR can't merge with drift. The human tiers are the §12 PR review.
