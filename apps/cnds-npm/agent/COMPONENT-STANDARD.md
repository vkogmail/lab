# Component contribution standard — the promotion gate

The bar a **Create-new** component (DEMO-PLAN.md §11c) must clear to be **eligible for inclusion**
in `@createnew/ui-react`. This is a different layer from [`GUARDRAILS.md`](./GUARDRAILS.md):
guardrails govern *using* the system; this governs *contributing* to it.

**When it applies:** only the Create-new path. Until promoted, the component lives app-level as a
**candidate**, clearly marked (e.g. the "· new" chip — no playground page yet). A candidate that
does not meet this standard is "new", **not** "promotion-ready", and must not be flagged as such.

## 1. API conventions (match the existing package)
- [ ] Exported TypeScript props interface `XxxProps`; every prop documented (JSDoc).
- [ ] **Pure UI** — presentational; no data fetching, no business logic. State is owned by the
      caller (controlled): expose `value`/`open`/… + `onChange`/`onOpenChange` callbacks.
- [ ] `className` passthrough; spread native attributes when it wraps a host element
      (e.g. `extends React.InputHTMLAttributes<…>`).
- [ ] Variants/sizes as **string-literal unions**, reusing the system's scales where they apply
      (`"primary" | "secondary" | …`, `"sm" | "md" | "lg"`).
- [ ] Compound parts via namespace (`Component.Header`, `Component.Item`) when it has sub-parts.
- [ ] `forwardRef` for components that wrap a focusable or measurable DOM element.
- [ ] No new runtime dependency without justification; prefer composing existing primitives.

## 2. Styling
- [ ] **Token-only** — semantic CSS variables by role; no hex/rgb/hsl, no hardcoded color/spacing.
- [ ] Own, component-scoped stylesheet; class names namespaced so they can't collide.
- [ ] No reliance on consumer-app CSS — the component is self-contained.

## 3. States & accessibility
- [ ] All **applicable** states implemented (default / hover / focus / disabled / loading / error /
      empty — only those that apply; a presentational display component may have just default + empty).
- [ ] Keyboard operable, visible focus, correct roles/labels — built on an accessible primitive
      (e.g. Radix) or with proper ARIA. Don't rely on color alone.

## 4. Reuse & scope
- [ ] Doesn't duplicate an existing export; composes existing primitives where possible.
- [ ] **Generic and reusable** — no app/domain-specific logic baked in (that belongs in the app,
      not the library). The promotable unit is the *pattern*, not the data.

## 5. Quality & docs
- [ ] Builds clean under strict TS; no console errors; `npm run smoke` passes.
- [ ] Usage snippet in the component's JSDoc.
- [ ] On promotion: a playground/story entry **and** a Code Connect mapping are added.

## Promotion process
```
Create-new candidate (built to THIS standard, lives app-level, marked "new")
   → self-check the checklist above
   → design + DS-owner review (API fit, a11y depth, naming, generality)
   → PASS → move into @createnew/ui-react + playground page + Code Connect
   → now it's an approved block → every future use is Compose
   FAIL → stays app-level (or is reworked); not promoted, not "promotion-ready"
```

## Enforcement tiers (who certifies what)
| Standard | Certified by |
|----------|--------------|
| Token-only, package-only imports, vars resolve, builds | **Automated** — `npm run drift` / `smoke` (blocks merge) |
| States render, no console errors, self-contained | **Agent self-check** (visual harness) |
| API fit, a11y depth, naming, genericness, docs/Code Connect | **Human review** (DS owner) before promotion |

The automated tier already runs on candidates (they live in `src/`), so a candidate with hardcoded
colors or a stray import can't even pass smoke — let alone promotion.
