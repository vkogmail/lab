# GUARDRAILS — cnds-npm demo

Hard rules for design and dev agents working in this consumer app.

## Package boundary

1. UI must come from `@createnew/tokens` and `@createnew/ui-react` only.
2. Never import from the parent monorepo `packages/` path.
3. Never vendor or fork files from `node_modules/@createnew/*` into `src/`.

## Styling

1. Use semantic token variables: `var(--color-surface-default)`, `var(--spacing-m)`, etc.
2. No hardcoded hex, rgb, or hsl in component/page code (except in token documentation swatches).
3. No new global CSS frameworks (Tailwind, Bootstrap, etc.).
4. Page chrome: prefer **templates** before custom layout CSS.

## Components

1. Check `@createnew/ui-react` exports before creating a new primitive.
2. Prefer `PageTemplate` / `FormPageTemplate` for page shells.
3. Use `DataTable` for sortable/filterable tables — do not add a second table library.
4. Dialogs, selects, and form controls must use the package — no native-styled replacements.

## Templates

| Template | Use when |
|----------|----------|
| `PageTemplate` | In-app page with title, sections, content slot |
| `FormPageTemplate` | Standalone form page with logo + footer |
| `BasicPageTemplate` | Marketing-style page with TopNav + hero + Footer |

## Agent handoff

When one agent passes work to another, include:

- Package versions from `package.json`
- Which template was chosen and why
- Token variables used for any custom layout CSS
- List of components imported (no duplicates invented)

## Failure modes to avoid

| Anti-pattern | Why |
|--------------|-----|
| "I'll just add a quick custom button" | Drifts from DS; breaks agent parity |
| Copying `Button.css` locally | Forks the system; npm updates won't apply |
| `@createnewco/*` scope | Deprecated naming; use `@createnew/*` |
| Building layout from scratch | Templates already encode spacing and surfaces |
