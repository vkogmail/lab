# Guide: cnds-npm

Live app: https://cnds-npm.vercel.app (open the **Session guide** tab in the sidebar).

This walkthrough explains what the demo is, what we built, and how the pieces fit together.

For strategy, client pitch, and the full demo runsheet see [`DEMO-PLAN.md`](./DEMO-PLAN.md). For future ideas see [`INSIGHTS.md`](./INSIGHTS.md).

---

## Demo with real packages (and what still needs work)

The UI here is built from **published npm packages** (`@createnew/tokens`, `@createnew/ui-react`). That part is real: install, import, compose components, ship a screen.

What makes it a **demo**:

- Sample data in a JSON file, not a live backend
- A generic product story (no client-specific domain)
- One finished ticket and two placeholders in the queue

What you can take as a **pattern** for a real project:

- The design system lives in npm, not in this repo
- Guardrails, skills, and a Definition of Done live alongside the app code
- Automated checks run before anything merges

The **shape** of that agent setup will look familiar on most stacks: a package-specific skill, a few generic craft skills (UI, UX, front-end), hard rules, and a clear finish line. But the **contents** are not copy-paste ready for your environment. Package names, the component catalog, product terminology, ticket examples, and even which checks you enforce all need tailoring. You refine those files as you use the system; output gets better over time, not all at once on day one.

---

## The idea in one sentence

**A design system shipped as npm packages lets an AI agent build real React screens from a shared contract.** Guardrails and automated checks keep the output on-brand, without a separate Figma-to-code rebuild step.

If that sounds abstract: think of it like using `npm install` on a component library, then asking Cursor (or similar) to build a screen from those components, with rules in the repo so the agent does not invent its own buttons or colors.

---

## What this repo is (and is not)

| This repo | Not this |
|-----------|----------|
| A **consumer app**, like a normal client product repo | A design-system monorepo where components are authored |
| Installs `@createnew/tokens` + `@createnew/ui-react` from **npm** | Linked to a local `packages/ui-react` folder in a monorepo |
| A sandbox for **agent-driven UI**, with rules files the agent reads | The source code of the component library itself |
| One finished ticket plus two queued ones | A complete product |

The app is set up the way a client repo would be: `npm install`, import CSS and components, build screens in `src/`. There is no special wiring to a design-system codebase elsewhere.

---

## Run it

```bash
cd apps/cnds-npm
npm install          # also copies fonts from the token package
npm run dev          # http://localhost:5175
```

Optional checks (these also run in CI):

```bash
npm run build        # TypeScript + Vite production build
npm run drift        # static checks: hex/rgb, wrong imports, composition rules
npm run smoke        # drift + build + Playwright visual/a11y harness
```

**drift** catches common mistakes (hardcoded colors, imports outside the design system). **smoke** adds a full build and browser tests on top.

---

## Walk the UI

Open the dev server. The sidebar has three sections: **Ticket → result**, **How it works**, and **Session guide**.

### 1. Tickets (default)

This is a **ticket workspace**: work items on the left, live preview on the right.

| Ticket | Status | What it shows |
|--------|--------|---------------|
| **CNDS-128** Professional review screen | Done | The only built screen. Click to expand the ticket and see the live result. |
| CNDS-131 Applicant review queue | Queued | Next story. Not built yet. |
| CNDS-140 Join-the-network form | Queued | Multi-step flow. Not built yet. |

**CNDS-128** is the main example. Expand it and read:

- **Description / Data / Acceptance**: how a ticket is written (what you want, which data it uses, how you know it is done)
- **Built from**: which design-system components were used. `ActivityTimeline · new` means we built something new that is not in the package yet.
- **Live preview**: the `ReviewItemDetail` screen, built only from the design system.

Queued tickets show an empty preview on purpose. We do not fake results for work that has not been done.

### 2. How it works

Four cards that summarize the method:

1. The agent **composes** from the npm packages. It does not invent parallel UI or custom CSS from scratch.
2. **Guardrails** and a **Definition of Done** (DoD) set the rules and the finish line.
3. **Automated checks** (`drift`, composition rules, visual states, accessibility via axe) run before code is merged.
4. When something goes wrong, we tighten the rules or add a new check. Genuinely new UI pieces get flagged for promotion into the design system package.

---

## The built screen: file tour

Right now the review screen is driven by **JSON data**:

```
src/data/review-item.json          sample applicant + activity records
src/data/useReviewItem.ts          loads that JSON for the screen
src/screens/ReviewItemDetail.tsx   the screen
src/components/ActivityTimeline.tsx   a new compound component (not in the package yet)
```

Open `review-item.json` if you want to see the shape of the data (name, step, owner, activity list, and so on). The live preview on the site is rendering from that file.

### ReviewItemDetail (`src/screens/ReviewItemDetail.tsx`)

- Starts from **`PageTemplate`**, a page shell from the package. No custom page layout CSS.
- Uses package components: `Card`, `StatusBadge`, `Alert`, `Loading`.
- Handles **loading, error, empty, and success** states, not just the happy path (the JSON path always succeeds today; the extra states exist for tests and to show the pattern).
- The optional `result` prop exists only for automated tests so each state can be rendered on demand.

### Data (`src/data/`)

The screen does not hardcode copy inside the components. It reads structured data through `useReviewItem.ts`, which currently imports `review-item.json`.

That keeps the UI separate from where the data comes from. In a real product you would wire up your own data layer however your stack expects. The point of the demo is that the **screen is built to consume data**, not that we prescribe how you connect it on your side. The same layout and components should work with actual data once that is in place.

### ActivityTimeline (`src/components/ActivityTimeline.tsx`)

The package has no timeline component. We needed one, so this is **Create-new** mode (see below):

- Built only from existing package parts (`Avatar`, `StatusBadge`) plus token-based CSS
- Marked as a **candidate for promotion** into `@createnew/ui-react`
- Once it lives in the package, every future activity screen can reuse it in **Compose** mode

---

## Two generation modes

Every piece of work falls into one of two modes:

| Mode | When | Do you need a designer? |
|------|------|-------------------------|
| **Compose** | Assemble existing tokens, components, and templates | No. The agent can do this on its own. |
| **Create-new** | Something is missing from the package and cannot be built from existing parts | Yes. You need a sketch, spec, or review before it becomes part of the system. |

CNDS-128 is mostly Compose (`PageTemplate`, `Card`, `StatusBadge`, and so on) with one Create-new block (`ActivityTimeline`).

---

## The agent "brain"

These files live in the repo so any agent that opens the project knows the rules. If you work with Cursor or Claude Code here, they read these automatically.

| File | What it does |
|------|--------------|
| [`AGENTS.md`](./AGENTS.md) | App rules: required imports, composition order |
| [`agent/GUARDRAILS.md`](./agent/GUARDRAILS.md) | Hard limits: tokens only, templates first, no forked CSS |
| [`agent/DEFINITION-OF-DONE.md`](./agent/DEFINITION-OF-DONE.md) | When a ticket counts as done, blocked, or needs a human decision |
| [`agent/TICKET-GUIDE.md`](./agent/TICKET-GUIDE.md) | How to write a request that works as a ticket |
| [`agent/SKILL.md`](./agent/SKILL.md) | How to compose UI from the npm packages |
| [`.claude/agents/cnds-builder.md`](./.claude/agents/cnds-builder.md) | A subagent that runs the skill stack and enforces the DoD |

### Skill stack (`.claude/skills/`)

Skills are instruction files the agent loads for specific jobs:

| Skill | Reusable across clients? | What it covers |
|-------|--------------------------|----------------|
| `cnds-package` | No (per design system) | Token names, component catalog, composition order |
| `ui-design` | Yes | Layout, spacing, which component fits which job |
| `frontend-eng` | Yes | React, state, where data binds in components |
| `ux` | Yes | Flows, empty/loading/error states, accessibility basics |
| `product-domain` | No (per client) | Product terms and business rules. **Empty stub here** because this is a generic demo. |

**Composition order** (used everywhere): pick a **template**, style with **tokens**, fill with **components**.

### Three ways a ticket ends

Every ticket ends in exactly one of these:

- **DONE**: all checks pass. Stop. Do not add extra polish.
- **DEFAULT-AND-NOTE**: small ambiguity (e.g. table page size). Pick a sensible default, note it, move on.
- **STOP-AND-ASK**: something is missing (token, component, clear requirements). Halt and ask instead of guessing.

Good demo moment: ask the agent to "add a quick custom red button" and watch it refuse per `GUARDRAILS.md`.

---

## Packages

```json
"@createnew/tokens": "^0.1.9",
"@createnew/ui-react": "^0.1.6"
```

- **`@createnew/tokens`**: CSS variables for color, spacing, radius, typography (`var(--color-surface-default)`, and so on).
- **`@createnew/ui-react`**: React components (`Button`, `Card`, `PageTemplate`, `DataTable`, and so on).

Entry imports (in `src/main.tsx`):

```ts
import "@createnew/tokens/tokens.css";
import "@createnew/ui-react/styles.css";
```

`copy-tokens-fonts.mjs` runs on `postinstall` to copy font files from the token package into `public/`.

Component playground (linked from ticket chips): https://cnds-playground.vercel.app

---

## Suggested walkthrough order

1. **Frame the idea.** Design system as an npm dependency, not a handoff artifact. Open `package.json` and show the two deps. Mention this is a demo pattern, not your production wiring.
2. **Tickets → CNDS-128.** Ticket shape, live preview, "Built from" chips. Open `review-item.json` to show where the preview data lives.
3. **Code tour.** JSON → `useReviewItem` → `ReviewItemDetail` → `ActivityTimeline`. Explain Compose vs Create-new.
4. **How it works tab.** The four pillars in the UI.
5. **Governance files.** Skim `GUARDRAILS.md`, `DEFINITION-OF-DONE.md`, and `cnds-builder`. Note these need tailoring per stack.
6. **Run a check.** `npm run drift` or `npm run build` to show the automated bar.
7. **Discuss fit.** What transfers (npm DS, repo rules, checks) vs what you would adapt (package names, domain skill, data layer).

---

## What you should take away

1. **Same contract for everyone.** A designer-driven agent and you both import from npm. No reconciliation step between design and code.
2. **Templates prevent layout drift.** Agents use `PageTemplate` and friends instead of inventing page chrome.
3. **UI is data-driven.** The demo uses JSON; a real app would feed the same screen from your own data layer.
4. **Rules live in the repo.** Skills, guardrails, and DoD travel with the codebase. They start rough and improve as you refine them.
5. **Checks enforce the rules.** drift/CI catches hex colors, wrong imports, and composition violations even when the agent slips.
6. **Create-new is the exception.** New compounds get reviewed and promoted. Everything else is Compose.

---

## Deeper reading

| Doc | When to open it |
|-----|-----------------|
| [`README.md`](./README.md) | Quick run notes and layout map |
| [`DEMO-PLAN.md`](./DEMO-PLAN.md) | Full demo strategy, client blueprint, distribution model |
| [`INSIGHTS.md`](./INSIGHTS.md) | Learning machine, upstream flags, business model notes |
| [`agent/tickets/screen-ticket.md`](./agent/tickets/screen-ticket.md) | Example ticket template for agents |
| [`agent/COMPONENT-STANDARD.md`](./agent/COMPONENT-STANDARD.md) | Bar for promoting a new component to the package |
