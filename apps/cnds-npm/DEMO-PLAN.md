# Client demo plan — agent-driven prototyping from a packaged design system

> Working draft. Purpose: a runnable demo **and** a blueprint the client can apply in their
> own environment. Shows how a designer or a developer asks an agent to build a flow /
> component / screen from a published token + component package — with the **npm packages as
> the single source of truth** and Figma as an optional design-side verification layer.
>
> Status legend: ✅ exists in this lab · 🟡 partial · ⬜ to build for the demo · 🔮 future

---

## 0. Decisions locked (read this first)

1. **Demo uses CNDS only.** No Unica assets (no Unica Figma, code, or brand). The CNDS demo
   is the **proof-of-concept / blueprint** for how a client would do the same in their own repo.
2. **The npm packages are the source of truth** — `@createnew/tokens` + `@createnew/ui-react`.
   The agent composes screens directly from the package contract. Code is canonical.
3. **No Figma in v1.** Figma's role (verify / review / propose changes via Code Connect) is
   explained conceptually in §3 but is **out of scope to build or show** for this demo. CNDS
   having no Figma library is therefore irrelevant to v1.
4. **Live, not recorded — and failure is part of the point.** The goal is that this works from
   *any* prompt. Watching the agent stumble, hit a guardrail, and recover is the learning, not
   an embarrassment. We demo live and narrate the misses honestly.
5. **Data is faked with a local JSON file** (not mocked inline, not a live backend). This shows
   a realistic data *seam* — swap the JSON for an API later, components unchanged.
6. **A generic explainer slide deck** accompanies the demo: what this is, what it does, why it
   matters — **vendor-neutral, no Unica named.** It works for any client conversation.
7. **Unica is the (unnamed) audience, addressed by analogy.** A client with a mature Figma DS
   that isn't packaged: they already have the design half; the engagement is the packaging.

---

## 1. What we are actually proving

One sentence: **A design system shipped as versioned npm packages lets both designers and
developers drive an AI agent to assemble real, on-brand, clickable screens — with no redline /
handoff step — because the packages, not Figma, are the shared source of truth.**

Three claims the demo makes concrete:

1. **One contract, two seats.** A *design agent* and a *dev agent* read the same package
   exports. The seat changes the prompt, not the system.
2. **Design intent → working screen, no handoff.** The designer describes intent; the agent
   builds from real components. There is no "draw it in Figma, then rebuild in code" step.
3. **The prototype is real React**, so clickable → production is a straight line, and a data
   connection slots into the same components later.

---

## 2. The mental model (the one slide that matters)

```
                  ┌─────────────────────────────────────────┐
                  │            SOURCE OF TRUTH                │
                  │   @createnew/tokens                       │
                  │   @createnew/ui-react           (npm)     │
                  └──────────────────┬──────────────────────┘
              the agent reads the package contract directly
                  ┌──────────────────┴──────────────────┐
            DESIGNER + agent                     DEVELOPER + agent
          "build me a screen"                   "wire this flow"
                  └──────────────────┬──────────────────┘
                       screens & flows  (real React, clickable)
                                     │
            ┌────────────────────────┼────────────────────────┐
            ▼                                                   ▼
   🟡 Figma — OPTIONAL layer                       🔮 data connection (later)
   verify · review · propose visual               same components, real data
   changes ──── Code Connect ───────┘
```

The inversion to sell: **the design system is a dependency, not a deliverable**, and **the
design tool is a lens, not a factory.** You `npm install` the same contract in a throwaway
prototype and in the real product. The agent composes; the guardrails keep it from inventing;
Figma is where design checks the result and proposes changes back to the package.

---

## 3. Where Figma fits (concept only — NOT in v1)

> **Out of scope for the demo.** This section is talk-track / future positioning only. We build
> and show none of it in v1. Keep it for the moment a client asks "what about our Figma?"

Figma is **repositioned, not removed** — a promotion, not a demotion:

| Old role (handoff model) | New role (packaged model) |
|--------------------------|---------------------------|
| Produces the artifact devs rebuild | Verifies the screen the agent already built |
| Source of truth for visuals | A lens on a code source of truth |
| Redlines / specs / handoff | Proposes visual changes as PRs to the package |

Why this holds technically:

- **Code Connect points Figma → code.** It tells Figma "this Figma component *is* this npm
  import." Figma defers to code; the agent never needs Figma to know how to use a component.
- **Figma Make can consume npm packages**, so even visual prototyping runs on the real components.
- Therefore an agent + Figma MCP/CLI can pick the right *code* component without Figma being
  the entry point. Figma earns its place when a **human designer** wants to see, check, or tweak.

**Talk-track guardrail:** designers stay in the loop via Code Connect — Figma just stops being
a *blocking* step. Don't let the pitch read as "Figma stops mattering."

For the demo, the Figma touchpoint is **optional / stretch** (see §7 item 6): a couple of
Code-Connected components or a Figma Make file consuming the npm package — enough to show the
layer exists, not a full library build.

---

## 4. What already exists in this lab (our starting asset)

`apps/cnds-npm` is the seed. It consumes the public npm packages exactly the way a client
product repo would — deliberately **not** wired to a DS monorepo.

| Asset | State | Role |
|-------|-------|------|
| Vite + React 19 app | ✅ | The "client product repo" stand-in |
| `@createnew/tokens` ^0.1.9 | ✅ | Semantic CSS variables (color/spacing/radius) |
| `@createnew/ui-react` ^0.1.6 | ✅ | Button, Card, Dialog, DataTable, Select, TextField, templates |
| `src/App.tsx` showcase | ✅ | Overview / Tokens / Components / Templates / Flow / Agents tabs |
| `AGENTS.md` | ✅ | Repo conventions + required imports |
| `agent/GUARDRAILS.md` | ✅ | Hard rules: tokens-only, no forked CSS, templates-first |
| `agent/SKILL.md` | ✅ | Reusable "compose from npm" skill |
| `copy-tokens-fonts.mjs` | ✅ | Pulls fonts from the token package on install |
| `vercel.json` | ✅ | Deploy target for the live clickable link |
| Figma library for CNDS | ⬜ | Not required for core demo; optional stretch only |

Templates in the package today: `PageTemplate`, `FormPageTemplate`, `BasicPageTemplate`.
Composition order is codified in `AGENTS.md`: **template → tokens → components**.

---

## 5. The pipeline (packages → clickable)

The spine of the demo and the client blueprint. Note: Figma is **not** a stage here — it's the
optional cross-cutting layer from §3.

### Stage 1 — Tokens (package)
- **Artifact:** `@createnew/tokens` — semantic CSS variables + fonts, on npm.
- **Client takeaway:** agents reference variable *names* (`--color-surface-default`), never hex.

### Stage 2 — Components (package)
- **Artifact:** `@createnew/ui-react` — real React components consuming the tokens.
- **Client takeaway:** the agent reads exports, props, and types — it imports by name, not by
  copying source or screenshots.

### Stage 3 — Templates (package)
- **Artifact:** `PageTemplate` / `FormPageTemplate` / `BasicPageTemplate`.
- **Why:** templates pre-encode spacing, surfaces, and chrome so the agent never builds layout
  from scratch (a GUARDRAILS rule).

### Stage 4 — Screens & flows (the agent's job)
- **Artifact:** a composed screen or multi-step flow from template + components + tokens.
- **Owner:** designer-with-agent or developer-with-agent.
- **Tooling:** Claude Code / Cursor reading `AGENTS.md` + `SKILL.md` + `GUARDRAILS.md`.
- **Output:** real `.tsx` in `src/`, navigable in the running app.

### Layer — Figma (optional, cross-cutting)
- Verify the agent-built screen against brand; propose visual tweaks back to the package via
  Code Connect. Demonstrated lightly if at all (§7 item 6).

### Stage 5 — Data connection (faked via local JSON in v1)
- **Artifact:** the same components fed from a local JSON file (e.g. `src/data/*.json`) loaded
  through a small data hook — not inline arrays, not a live backend.
- **Why JSON:** it shows the realistic *seam*. Swapping the JSON import for an API/Supabase/
  Airtable call later changes one module; the components and screens stay identical.
- **Demo beat:** "the data is a file today, an endpoint tomorrow — nothing else moves."

---

## 6. The two entry paths (same system, different seat)

### Path A — Designer asks the agent
Prompt shape:
> "Build a **review-queue screen**: page header, a filterable table of pending items with a
> status badge, and a confirm dialog on the primary action. Use our design system."

What the audience sees: agent reads `SKILL.md` → picks `PageTemplate` → pulls `DataTable`,
`Badge`, `Dialog`, `Button` → styles with token variables → renders a working screen the
designer clicks through. **No CSS, no hex, no Figma draw-first step.**

### Path B — Developer asks the agent
Prompt shape:
> "Wire the review-queue: add row selection, a `Mark step done` toolbar action that opens the
> confirm dialog, and disable confirm while pending."

What the audience sees: same imports, same template (no divergence from Path A) → agent adds
state, handlers, and the data seam (mock now, hook later) → `npm run build` verifies the contract.

**Punchline:** Path A and Path B produce *compatible* code because both are bounded by the same
package exports and guardrails. No reconciliation step.

---

## 7. Build list for the demo

| # | Item | State | Notes |
|---|------|-------|-------|
| 1 | Confirm packages install + run clean (`npm i && npm run dev`) | 🟡 | Verify before any recording |
| 2 | Path A: live "designer prompt" builds a new screen | ⬜ | Script the prompt; dry-run it |
| 3 | Path B: live "developer prompt" wires the same screen | ⬜ | Script the prompt; dry-run it |
| 4 | Guardrails moment: agent refuses "add a quick custom button" | ⬜ | Trust-builder; test it triggers |
| 5 | Deploy clickable prototype to Vercel | 🟡 | `vercel.json` present; need the URL |
| 6 | JSON-backed data seam: `src/data/*.json` + a small data hook feeding a screen | ⬜ | §5 Stage 5; in scope for v1 |
| 7 | Generic explainer slide deck (vendor-neutral, no Unica) | ⬜ | See §11 |
| 8 | Demo runsheet / talk track | 🟡 | See §8 |

---

## 8. Demo runsheet (≈18 min, **live**)

Live throughout. We don't hide misses — a stumble that the guardrails catch *is* the proof the
system holds up under arbitrary prompts. Narrate what's happening as the agent works.

1. **Frame (2 min).** The §2 slide. "Design system = dependency. Source of truth = the package."
2. **Show the contract (3 min).** Tokens + Components tabs in the running app; `package.json` —
   it's just two npm deps.
3. **Designer path (4 min).** Path A prompt → new screen renders → click through it.
4. **Developer path (4 min).** Path B prompt → wire interaction + the JSON data seam.
5. **Guardrails / failure moment (3 min).** Throw an off-script or "add a quick custom button"
   prompt; show it hit `GUARDRAILS.md` and recover. This is the trust-builder — works on any prompt.
6. **Data seam (1 min).** Point at the JSON file: "a file today, an endpoint tomorrow."
7. **Close (1 min).** The §9 blueprint: "for a client, the work is packaging their existing DS —
   they already have the design half."

---

## 9. Client blueprint: applying this to Unica (or any client)

The reusable framework — **assess which half the client has, build the missing half, link with
Code Connect:**

1. **Is the DS packaged?** If no (Unica's case) → this is the work: publish tokens + components
   to a registry (private npm / GitHub Packages). Names mirror existing Figma variable names.
2. **Do they have a Figma library?** Unica: yes. Then you *skip* the part we generate for CNDS —
   you just add Code Connect to link the existing Figma components to the new packages.
3. **Drop in the three agent files** (`AGENTS.md`, `GUARDRAILS.md`, `SKILL.md`), adapted to
   their package names. This is what makes agent output predictable.
4. **Point an agent at a throwaway consumer repo** (like this one) and ask for a screen. That
   repo is both the prototype sandbox and proof the packages work standalone.

> Unica framing in one line: *"You already have the design half. The missing piece is packaging
> — and once packaged, your Figma library plugs in via Code Connect as the verify/change layer."*

Early decision for any client: **registry & versioning** (public vs private), because that's how
prototypes and the real product both `install` the same contract.

---

## 10. Resolved decisions (was: open questions)

- ✅ **Live, not recorded.** Failure-and-recovery is part of the value (see §0.4, §8.5).
- ✅ **No Figma in v1.** Concept-only (§3).
- ✅ **Data faked via local JSON** (§5 Stage 5, §7 item 6).
- ✅ **Generic, vendor-neutral slide deck** (§11) — no Unica named.

Remaining to decide:
- **Slide tool/format** — Marp/markdown, Keynote, Google Slides, or the `pptx` skill?
- **The demo's example domain** — review queue (current `App.tsx` data), or something more
  relatable to the client (e.g. a request/approval flow, a simple CRM list)?

---

## 11. Explainer slide deck (generic, no client named)

Goal: explain *what this is, what it does, why it's there* for any client conversation.
Keep it short — it sets up the live demo, it doesn't replace it.

Proposed outline (~8 slides):

1. **The problem.** Prototypes and products drift; every AI session re-derives styling; design
   handoff is a rebuild tax.
2. **The shift.** A design system as **versioned npm packages** = one shared contract for humans
   and agents.
3. **Source of truth = the package.** Not screenshots, not redlines, not a parallel CSS file.
4. **Two seats, one system.** Designer-with-agent and developer-with-agent produce compatible code.
5. **Guardrails make it predictable.** `AGENTS.md` / `GUARDRAILS.md` / `SKILL.md` — why agent
   output stays on-brand and refuses to drift.
6. **From clickable to real.** It's real React; data is a swappable seam (JSON → API).
7. **Where design tools fit.** Figma becomes a verify/propose-changes lens, not a factory (brief).
8. **How you adopt it.** The §9 blueprint: assess which half you have, package the missing half.

> Tone: vendor-neutral. The deck should make sense to a client who has *no* packaged DS and a
> client who has *no* design system at all.

---

## 11b. Measuring visual success (composition-aware) — BUILT

Key insight (refined with the user): when generation is constrained to **approved-composition**
(a template owns layout + slots filled only with approved blocks + validated content), **ugliness
is designed out** — taste was settled at design time. So the gate *proves composition*, it doesn't
*judge taste*. Taste only re-enters for a **net-new** block, which is the minority path, gated once
to human/design, then promoted into the approved set.

**BUILT (task #15)** — folded into `npm run smoke`:
- **Static composition-proof** (in `scripts/smoke-test.mjs`): screens must use a CNDS template.
- **Render tier** (Playwright, `playwright.config.ts` + `visual/`): a scenario harness drives each
  UI state and asserts it renders — including the `loading`/`error`/`not-found` branches that are
  **dead under the static data seam** (made provable by an injectable `result` prop on the screen).
- **Runtime conformance**: token-driven backgrounds resolve to real colors (catches dead-var bugs
  at render time, which the static scan can't), and a no-horizontal-overflow guard.
- **Screenshots as a human ARTIFACT, not a gate** (`visual/__screens__/`): best-effort capture; a
  capture hiccup never fails the suite. These are what the shifted human (design audit / UX) looks
  at — verified by eye that the review-item screen composes cleanly and signal tokens render.
- CI installs Chromium before `npm run smoke` (both `.github/workflows/drift.yml` and `azure-pipelines.yml`).

What's still human: approving a new block once, and the irreducible taste slice for net-new units —
*not* per-screen pixel-policing.

---

## 11c. The two generation modes — Compose vs Create-new (the generalizable principle)

This is the heart of the method and the part that transfers to Unica or any client. Every build
request resolves to exactly one of two modes, and the mode decides whether a human is needed.

### Mode 1 — Compose (default, most tickets) · NO taste required
Assemble **existing, approved** building blocks: tokens → components → sections → templates. The
agent does this **autonomously**. Because every block was designed/approved once and a template
governs arrangement, the result **can't be ugly** — visual success is provable by the composition
gate (§11b), no human eyeball. This is where scale and speed come from.

### Mode 2 — Create-new (exception) · taste REQUIRED
The request needs a block that doesn't exist and **can't be composed** from existing ones — a novel
component/section/pattern. This is where human/designer judgment lives: a **sketch**, a design
decision, taste. The agent must **not** free-style it into the product. It either:
- **STOP-AND-ASK** for a sketch / spec / approval, or
- build a clearly-flagged **candidate** that goes through **design review → promotion** into the
  approved set.

Once promoted, the block is "existing" → every future use is Mode 1.

### The flywheel (why this is the client pitch)
Each Create-new, once promoted, **enlarges the approved set → more future tickets become pure
Compose → the human bottleneck shrinks over time.** Agent autonomy scales with the size of the
approved set. So the engagement for any client is:
1. **Package the DS** (tokens + components) so it's a consumable contract.
2. **Grow the approved `sections`/blocks layer** (mid-level compositions between components and
   templates) — that's where most "screen-shaped" reuse lives and where Compose coverage rises fastest.

A client who already has a rich Figma/section library (Unica) is **mostly in Compose from day one,
once it's packaged.** Designers then spend their taste only on genuinely-new patterns — not on
re-assembling known parts.

**Live example in this demo:** `ActivityTimeline` was a Create-new (no timeline in the package) —
correctly flagged for promotion. Promote it once, and every future activity-feed screen is pure Compose.

---

*Next action when you return: settle the two remaining items in §10, then knock out build-list
items 1–6 (the core loop + JSON data seam). Slide deck (§11) can be drafted in parallel.*

---

## 12. Distribution & access — one brain, many doors

The hard part isn't the design system; it's letting **the whole product team (incl. non-devs)**
reach an agent that knows it — without a token-burning MCP, without forcing non-devs into a CLI,
and without building a custom app. Decisions locked here:

### Separate the two things people conflate
- **The brain** = knowledge + governance (skills, guardrails, `cnds-builder` subagent). *What the
  agent knows.*
- **The door** = where a human types "build me x, y, z" and sees the result. *How they reach it.*

"MCP vs CLI" mixes these up. CLI is a (dev-only) door. MCP is a transport for the brain's
*actions* — not where knowledge should live (fat always-on MCP = the token burn).

### Principle 1 — Governance is **repo-resident**
Skills + `AGENTS.md` + guardrails live in the consumer repo's `.claude/`. Any agent that opens
the repo inherits the brain for free — IDE, desktop, or cloud. The repo *is* the distribution
mechanism. Package the same bundle as a **Claude Code plugin** for reuse across repos/clients.

### Principle 2 — Knowledge in **skills** (on-demand, cheap); MCP only for **actions**
Multiple small skills (`compose-screen`, `compose-flow`, `add-data-seam`, `components-reference`)
load only when needed. A thin MCP is optional, reserved for tool-actions (scaffold / query props).
No fat context server.

### Principle 3 — The door is the **Claude UI**, not a custom build
Decision: **everyone uses a graphical Claude surface; we build no frontend.**

| Persona | Door | Access need |
|---|---|---|
| Developer | Claude Code in IDE or desktop app | repo (already has it) |
| Non-dev (designer/PM/stakeholder) | **claude.ai/code (web)** — open repo, prompt, get preview link | one GitHub invite + a Claude seat |

CLI: dev-only, never the non-dev path. Custom hosted app: **not needed** — the Claude UI is the app.

### What this makes us responsible for (the weight moves to the brain + safety net)
1. **Non-dev repo entry:** standardize on **claude.ai/code web** (no install, no clone, no terminal).
2. **They must SEE it:** wire **automatic Vercel preview deploys per branch/PR** (`vercel.json`
   already present) so every prompt yields a shareable live URL.
3. **Enforcement, not trust:** a **hook / CI check that fails the PR** on hardcoded hex/rgb,
   non-`@createnew` imports, AND undefined token vars. Non-devs can't judge drift, so the check
   guarantees what skills only advise. **BUILT (task #7):** `scripts/smoke-test.mjs`
   (`npm run drift` / `npm run smoke`), a local `.githooks/pre-commit` (`npm run hooks:install`),
   GitHub Actions `.github/workflows/drift.yml` (demo sandbox), and `azure-pipelines.yml` (client
   env — set as a required PR build-validation policy). Authored to live at the standalone sandbox
   repo's root.
4. **Branch/PR flow:** non-dev prompts → branch → preview → dev rubber-stamps PR → merge to `main`.
5. **Real skills + subagent:** a `cnds-builder` subagent decomposes compound/vague requests into
   the template → tokens → components workflow.
6. **Admin (the real blocker):** Claude seats for the whole team (Team/Enterprise) + GitHub access
   for anyone who prompts.

### One-line shape
> One brain (a Claude Code plugin in the repo) → many doors (Claude UI web for non-devs, IDE/desktop
> for devs) → every prompt becomes a branch + Vercel preview URL, gated by an automated drift check
> before merge.

### Evaluated & parked: AG-UI (agent↔frontend protocol)
[AG-UI](https://docs.ag-ui.com/introduction) standardizes events between an agent backend and a
**custom-built frontend** (streaming, generative UI, human-in-the-loop) — the infrastructure for a
CopilotKit-style embedded agent app. **Not used in v1:** it only pays off if we build our own
frontend, which §12 explicitly rejected in favor of the Claude UI (which already provides streaming,
cancellation, and human-in-the-loop for free). It's also a *transport*, orthogonal to the actual hard
parts (skill stack §13, DoD §14) — it doesn't make an agent design-system-literate. **Revisit only**
if a future engagement wants an embedded, branded, **in-product agent for the client's end-users**
(a different product); there, AG-UI + the Agent SDK is a reasonable stack.

### Git host matrix — demo (GitHub) vs client (Azure DevOps)
Verified June 2026:

| Capability | Demo = **GitHub** | Client = **Azure DevOps** |
|---|---|---|
| Non-dev cloud door (claude.ai/code web): clone + push-back PR | ✅ native | ❌ **not yet** — non-GitHub repos go in as a read-only bundle, can't push back (FR open: anthropics/claude-code#54054) |
| Dev door (Claude Code desktop app / VS Code / JetBrains on a cloned repo) | ✅ | ✅ **host-agnostic git** — only sees `.git`, pushes to Azure Repos |
| Vercel PR preview deploys (shareable live URL) | ✅ native | ✅ via the **Vercel Azure DevOps extension** (preview URL commented on the PR) |
| Drift-check CI | GitHub Actions | Azure Pipelines |

**Key consequence — the non-dev cloud door needs GitHub today.** So:

> **Put the prototyping sandbox repo on GitHub even though the client's product lives in Azure
> DevOps.** Prototyping is throwaway by design (the §9 "throwaway consumer repo") — it doesn't
> belong in the production Azure repo anyway. Non-devs get the slick GitHub cloud door + Vercel
> previews; **approved output migrates into Azure DevOps**, where devs work via the desktop/IDE
> door (host-agnostic). This sidesteps the Cloud Sessions gap instead of waiting on the feature.

For the client's Azure DevOps *dev* side, also note: a Claude-in-pipeline task and an Azure
DevOps MCP/skill set exist for work-items/repos/PRs — useful later, not needed for the demo.

### Remaining sub-decisions
- **Sandbox model:** does each non-dev get their own playground repo/branch, or one shared demo repo?
- **Reviewer:** who rubber-stamps non-dev PRs before merge?
- **Plugin packaging:** do it now (reusable across clients) or after the core loop is proven?
- **Client rollout:** confirm the "GitHub sandbox → migrate to Azure DevOps" split with the client,
  or track the Azure DevOps Cloud Sessions feature request as the longer-term path.

---

## 13. The skill stack — what the agent actually needs to know

"Agent builds components/pages/flows from the package" is **not one skill** — it's a stack of
competencies that split cleanly by *reusability*. The package skill is **necessary but not
sufficient**: it knows `Button` takes `variant`, not that a screen needs a primary action
top-right with a loading state. That judgment lives in the other layers.

| Layer | Knows | Reusable across clients? | CNDS demo |
|-------|-------|--------------------------|-----------|
| **Package skill** | Token names + structure, component catalog + props, composition order, guardrails | ❌ one per design system | ✅ build (from existing `SKILL.md`/`GUARDRAILS.md`) |
| **UI-design skill** | Visual hierarchy, layout/spacing, density, responsive, which-component-for-which-job | ✅ universal | build generic |
| **Front-end-eng skill** | React composition, state, **where data binds**, hooks, the data seam | ✅ universal | build generic |
| **UX skill** | Flows, interaction states (empty/loading/error), a11y, microcopy | ✅ universal | build generic |
| **Product/domain skill** | Entities, jargon, business rules, canonical screens | ❌ client-specific | **empty stub** (CNDS is a "dumb" package; Unica fills it) |

Two consequences:

1. *"Where to put data inside components"* is itself a mini-stack: **FE** knows the mechanics
   (props → hook → JSON seam), **UI** knows where it goes visually, **product** knows what it means.
2. The **product layer is the client seam** — the same "which half do you have" split as §9. CNDS
   ships it empty (with a template + load contract); a client populates it with their domain.

A **`cnds-builder` subagent** orchestrates the stack: always loads the package skill, pulls
UI/UX/FE on demand, loads the product skill if present, then decomposes "build me x, y, z."
Skills load only when needed → cheap.

**BUILT (tasks #1–6, #13–14):** the stack now exists in the repo and is grounded in the *real*
package API (read from `node_modules`, not guessed):
- `.claude/skills/cnds-package/` — token role map + ~45-component catalog + reuse traps + composition order
- `.claude/skills/{ui-design,frontend-eng,ux}/` — the generic judgment/mechanics/usability layers
- `.claude/skills/product-domain/` — empty stub + client template
- `.claude/agents/cnds-builder.md` — orchestrator that enforces the DoD + stop protocol
- `agent/DEFINITION-OF-DONE.md` — the grading rubric
- `agent/tickets/{component,screen,flow}-ticket.md` — smoke-test tickets
- `scripts/smoke-test.mjs` + `npm run drift` / `npm run smoke` — the automated DoD tier.
  **Verified:** passes on clean code, catches hex/rgb/disallowed-import violations (file:line),
  and the full build gate is green.

**The skill-eval loop:** `cnds-builder` attempts a ticket → grade against the DoD (`npm run smoke`
= automated half; human/agent = judgment half) → find where a skill was vague → tighten it →
re-run. Supporting infra still pending: tasks #7–12.

---

## 14. Definition of Done & the stop/escalate protocol

A ticket isn't "build it" — it's "build it to a bar, then stop cleanly." Drafted in
[`agent/DEFINITION-OF-DONE.md`](./agent/DEFINITION-OF-DONE.md) (task #13). Key decisions:

- **DoD is the floor AND ceiling** — meeting it is done; exceeding it (gold-plating) is silent
  token burn, so stop.
- **Per ticket type:** *component* (with a reuse decision tree — use → compose → build — plus a
  "promote to package" flag for genuinely new primitives), *screen* (template-first, data seam
  with empty/loading/error, obvious primary action), *flow* (all paths incl. back/cancel/error,
  each screen meets the screen DoD).
- **Three exits, never "keep going":** **DONE** (all checks green) · **DEFAULT-AND-NOTE** (low-
  stakes ambiguity → pick a sensible default, document it, don't ask) · **STOP-AND-ASK** (missing
  token/component, structural ambiguity, guardrail conflict, or budget exhausted).
- **Anti-token-burn:** a **3-attempt failure budget** per failing check, then halt; a 4-line
  escalation format (Blocked / Tried / Options / Need). Rule of thumb: *ask only when the cost of
  guessing wrong exceeds the cost of asking.*
- **Never break a guardrail to finish** — a conflict is always a stop-and-ask, killing drift and
  the worst loops at once.
- **Verifiability tiers:** automated (drift-check, blocks merge) vs agent self-check vs human PR
  review — so non-dev-initiated work is safe even when judgment slips.
