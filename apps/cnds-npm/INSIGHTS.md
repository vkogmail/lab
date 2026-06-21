# Insights & thoughts — for later

> Captured during design chats. **Not yet built** — this is the thinking we want to keep and
> design/implement later. Companion to [`DEMO-PLAN.md`](./DEMO-PLAN.md).

---

## 1. The system as a learning machine

The loop we built (ticket → build → gate → find gaps → tighten) isn't just a pipeline — it's a
**learning machine**. Three acts of learning happened in one session:
1. A dead token was found → **verified** → the `cnds-package` skill was tightened (prose).
2. The same finding → the **drift check** was upgraded to catch undefined vars forever (enforcement).
3. A heading-order bug → an **axe gate** was added so it can never regress (enforcement).

### The durability ladder (push every lesson as far down as it goes)
- **Ephemeral** — lesson lives in a conversation/memory. Gone next session unless promoted.
- **Prose** — written into a skill/DoD. Durable but *advisory*; can be skipped or buried as skills bloat.
- **Enforced** — encoded as a check (drift, axe, a DoD assertion). **Cannot** be forgotten or ignored.

> Strong opinion: **prefer turning a lesson into a check over writing it as advice.** A check is
> learning that defends itself.

### The non-negotiable: verify before you commit a lesson
The agent once confidently claimed `--font-size-*` didn't exist — and was **wrong**. Auto-applying
that "lesson" would have corrupted the skill. So **learning needs a verification gate before a
lesson is committed.** A system that trusts the agent's after-action report is just an agent
grading an agent, compounding its own errors. Every proposed skill change must be checkable against
ground truth.

---

## 2. Open questions on learning (verbatim)

> That leaves the real open questions — pick what you want to chat about:
>
> **Curated vs automatic.** Should the system propose lessons (from gate failures, repeated
> stop-and-asks, review comments) into a backlog that a human ratifies — or ever edit its own
> skills unattended? My lean: auto-surface, human-ratify.
>
> **Where the signal comes from.** Gate failures, recurring STOP-AND-ASKs (if it keeps asking the
> same thing, that's a missing rule), PR review comments, promotion outcomes. Which of these do we
> actually capture?
>
> **Shared brain vs client brain.** The generic skills (ui/fe/ux/ticket-standard) improve once and
> benefit every client — huge leverage. The package + product-domain are client-specific. Learning
> in the shared layer compounds across Unica and everyone after.
>
> **Propagation.** Learning ships through plugin versioning — improve the plugin, everyone pulls it.
> (That's why task #9, packaging the brain, is also the learning-distribution mechanism.)
>
> **Pruning, not just accretion.** Every lesson makes a skill longer. Without consolidation, skills
> rot and bloat (and cost tokens). Learning has to include forgetting the stale stuff.
>
> **Ownership.** Someone has to be the steward of the brain. For Unica that's a real org question —
> who owns the rules' evolution?
>
> Which thread do you want to go deep on? My instinct says the "lesson → enforced check, with a
> human-ratified backlog" mechanism is the highest-leverage one to design — but I'm curious where
> your head's at.

---

## 3. Upstream component flagging (consumer → package)

The **mirror image** of the brain. The brain teaches the consumer how to use the package; this is
the consumer teaching the **package** back. Real usage surfaces a design system's actual gaps —
without a channel, those findings evaporate in code comments (like the contrast note did).

### It's two linked artifacts, not one

**1. The flag (outbound, transactional)** — a structured issue addressed to the DS team:
> **Component:** `StatusBadge` (variants `info` / `success` / `warning`)
> **Type:** a11y · **Severity:** serious (axe `color-contrast`)
> **Evidence:** axe rule + the exact nodes (reproducible)
> **Impact:** every screen using these variants fails WCAG AA contrast
> **Advice:** darken the variant foregrounds to ≥ 4.5:1, or add a high-contrast variant
> **Found by:** ticket CNDS-128 · **Status:** open

**2. The component ledger (local, persistent)** — per-component known-issues + advice that the
agent reads *when choosing components*. The catalog becomes "here's the API **plus** its caveats."
When `cnds-builder` reaches for `StatusBadge`, it sees: *"⚠ known contrast issue on
info/success/warning — fine for a prototype, flagged for production."* That can change a
composition decision.

The flag drives the package's **fixes**; the ledger informs the agent's **choices**. Same finding,
two directions.

### The trigger is already in our gate
When the smoke gate excluded `color-contrast` *because it's package-level*, that exclusion **is a
flag waiting to be born**. Today it's a code comment. The upgrade: make the exclusion *emit a
structured flag + open a ledger entry* automatically.

### It closes a loop
```
flag → DS team fixes → package ships v0.1.7 → consumer REMOVES the exclusion → the gate now ENFORCES contrast
```
Could even auto-detect a **stale exclusion** ("no longer needed in @createnew/ui-react@0.1.7") and
clean it up. The flag has a lifecycle that *ends* when the version bump lands.

### Tensions (both already bit us)
- **Attribution.** Is it the package's fault or our misuse? The heading-order bug was *mixed*
  (partly `Card.Title` = package, partly our `<h3>` = ours). A flag needs the same
  **verify-before-you-file** discipline as the dead-token claim — don't file a package bug that's
  actually a composition error.
- **Dedup / noise.** The gate hits the same `StatusBadge` contrast on *every* ticket. One open flag
  per component+issue. Support **acknowledge / ignore-once-set** to suppress re-flagging, and track
  status (open / acknowledged / fixed). Otherwise the same package issue floods the queue on every
  ticket across every client.

### Two upstream flows from consumer → package
- **Promotion** — a Create-new adds a *new* component to the library (DEMO-PLAN §11c).
- **Flags** — fix/improve *existing* components.

Together, that's how real usage actually shapes the design system — "improve ourselves," pointed at
the library instead of the brain.

### From flag to ticket (where it lands)
A flag is the raw signal; it should **eventually land as a ticket** with enough info to be fixed
(repro, evidence, impact, advice). Where: GitHub/Azure issues on the package repo, or a shared
maintenance queue the DS team triages. (Demo: an in-repo structured ledger; production: file to the
tracker.) In the subscription model (§5), that ticket queue **is** the service's work intake.

---

## 4. Component overrides — the line is "API, never internals"

A human can ask the agent to override a component's look. The rule:

- **Allowed:** content/parameters — **icons, svg, text** — and the component's **public API**
  (`variant`, `size`, …). Varying via props is *using* the contract, not overriding it.
- **Forbidden:** reaching inside a component to restyle it — targeting its internal classes
  (`.cn-button`), or forcing `style`/`className` to recolor/repad a DS component (e.g. making a
  `Button` red by hand). That breaks the whole point of components. Agent-generated code **cannot
  override components by definition.**

### Graceful solve (a routing decision, never a hack)
```
Asked to change a component's appearance?
1. Is it content (icon / svg / text)?      → allowed (it's a parameter).
2. Does a prop/variant cover it?           → use the API.
3. No variant, but genuinely needed?       → DON'T override.
                                              → STOP-AND-ASK, or raise a MISSING-VARIANT FLAG (§3).
4. Never target .cn-* internals or restyle a DS component via style/className.
```
So "make this button a colour that doesn't exist" stops being an override and **becomes a flag** —
it feeds the upstream channel instead of forking the system.

- **Enforcement candidate (durability ladder):** a drift-style check that flags CSS/inline styles
  overriding DS component internals. Turn the rule into a check.
- **Prototype escape hatch (debatable):** a *marked* one-off override allowed only if it
  auto-emits a flag; default forbidden, production never.

---

## 5. Why this exists — design-system-as-a-service (the business model)

The commercial reason all the governance (standards, gates, flags, ledger) exists:

> A **subscription** that **remotely maintains clients' design systems** — for **small teams who
> need to BUILD, not maintain.**

- **Clients build** with the brain (agent + skills + guardrails). They don't maintain the DS.
- **The service maintains** it remotely: triage flags → fix components → evolve the skills → ship
  new package versions.
- So **flag → ticket is the service's work intake / SLA.** The **component ledger** is the
  cross-client knowledge base of known issues.
- **Shared brain compounds:** the generic skills + the maintenance loop benefit *every* subscriber;
  each client keeps their own package + product-domain.
- This is why the upstream feedback channel matters most commercially — it's the operational
  backbone of the product, not a nice-to-have.

---

## Next-design candidates (when we pick this up)
- The **lesson backlog**: auto-surface lesson candidates (from gate failures / repeated
  stop-and-asks / review comments) → human ratifies → promote to skill/DoD, preferring an enforced
  check. Include a **pruning** pass so skills don't rot.
- The **component flag schema + ledger**, with the gate's exclusions emitting flags, dedup +
  acknowledge/ignore-once-set, flag → ticket routing, and a stale-exclusion detector tied to
  package version.
- The **no-override check**: drift-style enforcement that an agent never restyles DS component
  internals (icons/svg/text excepted), routing "needs a new look" to a missing-variant flag.
