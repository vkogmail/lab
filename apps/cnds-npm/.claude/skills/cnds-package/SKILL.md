---
name: cnds-package
description: The CNDS design-system contract — @createnew/tokens + @createnew/ui-react. Use whenever building or changing UI in this app: which token applies (semantics), which component to reuse, props, and composition order. The DS-specific constraint layer; load it for every UI ticket.
---

# CNDS package skill (the constraint layer)

The single source of truth for UI in this app is two npm packages. This skill is **necessary
but not sufficient** — it tells you *what exists and how to use it correctly*; pair it with the
`ui-design`, `frontend-eng`, and `ux` skills for *how to compose well*, and obey
[`agent/GUARDRAILS.md`](../../../agent/GUARDRAILS.md) and
[`agent/DEFINITION-OF-DONE.md`](../../../agent/DEFINITION-OF-DONE.md).

Versions: `@createnew/tokens` ^0.1.9 · `@createnew/ui-react` ^0.1.6.

## The contract (entry file imports — required)
```ts
import "@createnew/tokens/tokens.css";
import "@createnew/ui-react/styles.css";
import { Button, PageTemplate, DataTable /* … */ } from "@createnew/ui-react";
```
All components come from the package index. **Never** import from `@radix-ui/*` directly,
from `node_modules/@createnew/*` internals, or from any other UI library.

## Tokens — pick by ROLE, not by look
Reference names only (never hex). Full list in `node_modules/@createnew/tokens/dist/tokens.css`.

| Role | Use |
|------|-----|
| Page / surfaces | `--color-surface-default`, `--color-surface-raised`, `--color-surface-sunken`, `--color-surface-subtle` |
| Text | `--color-foreground-default`, `--color-foreground-muted`, `--color-foreground-inverted` |
| Borders | `--color-border-subtle`, `--color-border-strong` |
| Brand / primary accents | `--color-brand-primary` (+ `-accent`, `-blue`, `-teal`, …) |
| **Status / feedback** | `--signal-foreground-{good,bad,info,neutral,warning}` + `--signal-background-{…}` — **good=success, bad=error**. Do NOT use `--color-brand-*` for status. |
| Spacing (use the scale) | `--spacing-xs · s · m · l · xl · 2xl · 3xl` |
| Radius | `--radius-xs · s · m · l · xl · 2xl · full` |
| Typography (composite) | `--text-display`, `--text-title`, `--text-heading-2/3`, `--text-body`, `--text-label`, `--text-caption` (each has `-font-size/-weight/-line-height/-font-family`) |
| Elevation | `--shadow-sm · m · l · xl` |

Prefer letting components carry their own token styling; only reach for token vars in custom
layout CSS (`src/app.css`), never as inline hex.

### Tokens that look right but DO NOT exist (verified — common mistakes)
A `var(--x)` that isn't defined fails silently (renders nothing / falls back). `npm run drift`
now catches these, but don't write them:
| ❌ Does not exist | ✅ Use instead |
|------------------|---------------|
| `--color-signal-success` / `--color-signal-*` | `--signal-background-good` / `--signal-foreground-good` (bad/info/neutral/warning) |
| `--spacing-2xs` | `--spacing-xs` (smallest on the scale) |
| `--font-family-body` | `--font-family-sans` (also `-heading`, `-mono`) |

Typography note: BOTH the composite `--text-*` tokens AND the atomic `--font-size-*`,
`--font-weight-*`, `--line-height-*` scales **do** exist — either is fine. (Only the names in the
table above are missing.)

## Component catalog (reuse map — check here BEFORE building anything)

**Page shells / templates (start here):**
- `PageTemplate` — in-app page: `eyebrow, title, subtitle, sectionTitle, sectionDescription, variant("default"|"raised"|"sunken"), maxWidth("full"|"narrow"|"wide"), align`.
- `FormPageTemplate` — standalone form page (logo + footer slot).
- `BasicPageTemplate` — marketing shell (TopNav + hero + Footer).
- `Container`, `TopNav`, `SubNav`, `Sidebar`, `Footer`, `Logo` — chrome pieces.

**Actions & feedback:**
- `Button` — `variant("primary"|"secondary"|"outline"|"text"|"ghost"), size("xs"|"sm"|"md"|"lg"|"icon"), loading, leftIcon/rightIcon, icon, iconOnly, fullWidth, as("button"|"a")`.
- `ActionGroup` — compact row of icon/label actions (`actions: {id,label,icon,onClick,variant("default"|"danger")}[]`). Use in tables/cards instead of hand-rolling button rows.
- `Alert` — `variant("success"|"warning"|"error"|"info"), title, onClose`. Inline messages.
- `Badge` — `variant("default"|"secondary"|"outline"|"success"|"warning"|"error")`. Generic label.
- `StatusBadge` — `status("success"|"warning"|"error"|"info"|"neutral")`. **Use this for status, not Badge.**
- `Progress`, `Loading` (`size, text, fullscreen`), `StatCard`, `Avatar`, `Tooltip`.

**Overlays:**
- `Dialog` — pure UI, **state managed externally** (`open, onOpenChange, title, description, variant("default"|"alert"), trigger`). Subcomponents: `Dialog.Header/Footer/Description/Action/Cancel`.
- `Popover`, `DropdownMenu`, `Accordion`, `Collapsible`, `Tabs`, `Separator`.

**Forms (all controlled; manage state in the parent):**
- `TextField` (`label, error, + input attrs`), `Textarea`, `Label`, `Select` (`label, error, options:{value,label,disabled}[], value, onValueChange, placeholder`), `Checkbox`, `Radio`/`RadioGroup`, `Switch`, `Slider`, `FileUpload`.

**Data display — three tiers, pick deliberately:**
- `Table` — basic table primitive.
- `DataTable` — sortable/filterable/selectable grid (tanstack-based): `columns: ColumnDef<T>[], data, searchColumn, searchPlaceholder, enableRowSelection, toolbarActions, rowActions`. Use for interactive queues/lists.
- `ResourceTable` — opinionated resource list (`columns: ResourceColumn[]`).
- `Card` (+ `Card.Header/Title/Description/Content/Footer`) — grouped content.

## Composition order (always)
1. **Template** (`PageTemplate` / `FormPageTemplate` / `BasicPageTemplate`) — never build page chrome from scratch.
2. **Tokens** — semantic vars for any custom layout CSS.
3. **Components** — fill slots from the catalog above; reuse before composing, compose before building.

## Reuse traps (these cost DoD points)
- Reaching for `Badge` when the thing is a *status* → use `StatusBadge`.
- Hand-building a button row → use `ActionGroup`.
- Building a custom table → use `DataTable`/`Table`/`ResourceTable`.
- A native `<select>`/`<dialog>` → use `Select`/`Dialog`.
- Custom page header/margins → use a template.

## Gotchas
- `Dialog` and `Select` are **controlled** — the parent owns `open`/`value` state.
- Don't forget the two CSS imports in the entry file, or everything renders unstyled.
- `icon`/`leftIcon` expect `lucide-react` icon components (already a transitive dep).
- `Avatar` has `Avatar.Fallback` (for initials) and `size: "sm" | "md" | "lg"` (no `xs`).

## Finding exact prop types
- `index.d.ts` is **re-exports only** — real prop interfaces live per-component at
  `dist/<Name>/<Name>.d.ts` (e.g. `dist/Avatar/Avatar.d.ts`). Read those for full props.
- In this **workspace the package is hoisted to the repo-root `node_modules`**, not the app's —
  look at `../../node_modules/@createnew/ui-react/dist/...` if it's not under the app.
