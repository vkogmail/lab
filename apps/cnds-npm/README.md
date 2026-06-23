# CNDS npm consumer

Reference app for **agent-driven development** using published `@createnew/tokens` and `@createnew/ui-react` from npm.

Not wired to a design-system monorepo — the same path a design or dev agent uses in any client product repo.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5175`), or the live deploy at https://cnds-npm.vercel.app.

Use the **Session guide** tab in the sidebar to read the walkthrough doc in the browser.

## What it shows

| Section | Purpose |
|---------|---------|
| Ticket → result | Work items with live preview (CNDS-128) |
| How it works | Method: guardrails, checks, improvement loop |
| Session guide | Walkthrough doc (`SESSION-GUIDE.md`) rendered in the app |

## Packages

- `@createnew/tokens` ^0.1.9
- `@createnew/ui-react` ^0.1.6

## Session / walkthrough

- [`SESSION-GUIDE.md`](./SESSION-GUIDE.md) walkthrough: what we built, file tour, suggested order
- [`DEMO-PLAN.md`](./DEMO-PLAN.md) — full demo strategy and client blueprint

## Agent files

- [`AGENTS.md`](./AGENTS.md) — app rules for AI contributors
- [`agent/GUARDRAILS.md`](./agent/GUARDRAILS.md) — hard constraints
- [`agent/SKILL.md`](./agent/SKILL.md) — compose UI from npm packages

## Layout

| Path | Role |
|------|------|
| `src/App.tsx` | Demo sections and component showcase |
| `src/app.css` | Layout helpers using token CSS variables |
| `copy-tokens-fonts.mjs` | Copies font files from `@createnew/tokens` on install |
