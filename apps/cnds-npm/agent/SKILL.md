---
name: cnds-npm-consumer
description: Compose pages and flows in a consumer app using @createnew/tokens and @createnew/ui-react from npm. Use when building or extending apps/cnds-npm in vkogmail/lab or any app that installs CNDS via npm.
---

# CNDS npm consumer skill

## When to use

- Adding a section, page, or flow to `apps/cnds-npm`
- Bootstrapping a new client demo that consumes `@createnew/*` from npm
- Explaining how design/dev agents share a versioned DS contract

## Prerequisites

```bash
npm install @createnew/tokens @createnew/ui-react
```

```ts
import "@createnew/tokens/tokens.css";
import "@createnew/ui-react/styles.css";
```

Read `agent/GUARDRAILS.md` before writing UI code.

## Workflow

### 1. Pick a template

```
PageTemplate       → in-app tool pages
FormPageTemplate   → auth / request / single-purpose forms
BasicPageTemplate  → marketing shells with nav + footer
```

### 2. Map content to components

| Need | Package export |
|------|----------------|
| Actions | `Button` |
| Status | `Badge` |
| Grouped content | `Card` |
| Modal confirm | `Dialog` |
| Data grid | `DataTable` |
| Text input | `TextField`, `Textarea`, `Select` |

### 3. Style with tokens only

```css
.my-section {
  background: var(--color-surface-raised);
  padding: var(--spacing-l);
  border-radius: var(--radius-l);
}
```

### 4. Verify

```bash
npm run build
```

## Example: add a new demo section

1. Add id to `src/demo-sections.ts`
2. Add nav item (automatic from `DEMO_SECTIONS`)
3. Add conditional panel in `src/App.tsx` using template + components
4. Use token variables in `src/app.css` for any layout helpers

## Teaching narrative (for client demos)

> Tokens, components, and templates are **npm packages**. Design agents choose structure and semantics; dev agents wire data — both read the same exports. No copying CSS from Figma exports, no parallel button implementations.

Contrast with source-only DS repos: without npm, every agent session re-derives styling and APIs.

## Do not

- Workspace-link to `packages/ui-react`
- Add shadcn/MUI/Chakra alongside `@createnew/ui-react`
- Skip CSS imports in the entry file
