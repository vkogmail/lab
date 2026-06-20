# CNDS npm consumer

Reference app for **agent-driven development** using published `@createnew/tokens` and `@createnew/ui-react` from npm.

Not wired to a design-system monorepo — the same path a design or dev agent uses in any client product repo.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5175`).

## What it shows

| Section | Purpose |
|---------|---------|
| Overview | npm install + import pattern |
| Tokens | Semantic CSS variables from the package |
| Components | Button, Card, Dialog, DataTable, … |
| Templates | PageTemplate, FormPageTemplate |
| Composed flow | Template + table + dialog from npm only |
| Agent workflow | Guardrails and skills for AI contributors |

## Packages

- `@createnew/tokens` ^0.1.9
- `@createnew/ui-react` ^0.1.6

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
