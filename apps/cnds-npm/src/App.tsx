import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  DataTable,
  Dialog,
  FormPageTemplate,
  PageTemplate,
  Select,
  TextField,
  type ColumnDef,
} from "@createnew/ui-react";
import { DEMO_SECTIONS, type DemoSection } from "./demo-sections";

const TOKEN_SWATCHES = [
  { label: "--color-surface-default", css: "var(--color-surface-default)" },
  { label: "--color-surface-raised", css: "var(--color-surface-raised)" },
  { label: "--color-surface-sunken", css: "var(--color-surface-sunken)" },
  { label: "--color-brand-primary", css: "var(--color-brand-primary)" },
  { label: "--color-foreground-default", css: "var(--color-foreground-default)" },
  { label: "--color-foreground-muted", css: "var(--color-foreground-muted)" },
  { label: "--color-border-subtle", css: "var(--color-border-subtle)" },
  { label: "--color-signal-success", css: "var(--color-signal-success)" },
];

type FlowRow = {
  id: string;
  step: string;
  owner: string;
  status: string;
};

const FLOW_ROWS: FlowRow[] = [
  { id: "1", step: "Import tokens + styles.css", owner: "Dev agent", status: "Done" },
  { id: "2", step: "Compose PageTemplate shell", owner: "Design agent", status: "Done" },
  { id: "3", step: "Add DataTable for review queue", owner: "Dev agent", status: "Active" },
  { id: "4", step: "Wire Dialog confirm actions", owner: "Either", status: "Next" },
];

export function App() {
  const [section, setSection] = useState<DemoSection>("overview");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [role, setRole] = useState("design");

  const columns = useMemo<ColumnDef<FlowRow>[]>(
    () => [
      { accessorKey: "step", header: "Step" },
      { accessorKey: "owner", header: "Owner" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const variant =
            status === "Done" ? "success" : status === "Active" ? "default" : "outline";
          return <Badge variant={variant}>{status}</Badge>;
        },
      },
    ],
    [],
  );

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <div className="demo-brand">
          <h1>CNDS npm demo</h1>
          <p>Published packages + agent guardrails. No monorepo workspace imports.</p>
        </div>

        <nav className="demo-nav" aria-label="Demo sections">
          {DEMO_SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              data-active={section === item.id}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="demo-meta">
          <span>@createnew/tokens ^0.1.9</span>
          <span>@createnew/ui-react ^0.1.6</span>
        </div>
      </aside>

      <main className="demo-main">
        {section === "overview" && (
          <section className="demo-panel">
            <h2>Agent development with npm packages</h2>
            <p>
              This app installs CNDS from the public npm registry. Design and dev agents
              share the same contract: tokens, components, and templates — not ad-hoc CSS or
              copied source files.
            </p>
            <div className="demo-callout">
              Contrast with a client DS repo that only ships source (e.g. Unica&apos;s path):
              npm packages give agents a stable, versioned API to compose pages and flows.
            </div>
            <div className="demo-row">
              <Badge variant="default">npm install</Badge>
              <Badge variant="success">AGENTS.md</Badge>
              <Badge variant="outline">GUARDRAILS.md</Badge>
              <Badge variant="warning">SKILL.md</Badge>
            </div>
            <pre className="demo-code">{`npm install @createnew/tokens @createnew/ui-react

import "@createnew/tokens/tokens.css";
import "@createnew/ui-react/styles.css";
import { Button, PageTemplate, DataTable } from "@createnew/ui-react";`}</pre>
          </section>
        )}

        {section === "tokens" && (
          <section className="demo-panel">
            <h2>Tokens from @createnew/tokens</h2>
            <p>Semantic CSS variables — agents reference names, not hex values.</p>
            <div className="demo-grid demo-grid--2">
              {TOKEN_SWATCHES.map((swatch) => (
                <div key={swatch.label} className="demo-swatch">
                  <div className="demo-swatch__chip" style={{ background: swatch.css }} />
                  <div className="demo-swatch__label">{swatch.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {section === "components" && (
          <section className="demo-panel">
            <h2>Components from @createnew/ui-react</h2>
            <p>Primitives and patterns imported by name — including DataTable (0.1.6).</p>
            <div className="demo-row">
              <Button variant="primary" onClick={() => setDialogOpen(true)}>Open dialog</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
            </div>
            <Card>
              <Card.Header>
                <Card.Title>Card + form controls</Card.Title>
                <Card.Description>Agents compose these instead of raw HTML.</Card.Description>
              </Card.Header>
              <Card.Content className="demo-grid">
                <TextField label="Project name" placeholder="e.g. onboarding-flow" />
                <Select
                  label="Agent role"
                  value={role}
                  onValueChange={setRole}
                  options={[
                    { value: "design", label: "Design agent" },
                    { value: "dev", label: "Dev agent" },
                  ]}
                />
              </Card.Content>
            </Card>
            <DataTable
              columns={columns}
              data={FLOW_ROWS}
              searchColumn="step"
              searchPlaceholder="Filter steps..."
              enableRowSelection
            />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="Confirm publish">
              <p>Agents can wire flows with Dialog + actions from the same package.</p>
              <div className="demo-row">
                <Button variant="primary" onClick={() => setDialogOpen(false)}>Confirm</Button>
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
              </div>
            </Dialog>
          </section>
        )}

        {section === "templates" && (
          <section className="demo-grid">
            <div className="demo-panel">
              <h2>PageTemplate</h2>
              <p>Layout shell for in-app pages — eyebrow, title, sections.</p>
              <PageTemplate
                eyebrow="Template"
                title="Review queue"
                subtitle="Agents start from templates, then fill slots with domain content."
                sectionTitle="Open items"
                sectionDescription="Use PageTemplate before custom layout CSS."
                variant="raised"
                maxWidth="wide"
              >
                <p>Slot content lives here. No bespoke page chrome required.</p>
              </PageTemplate>
            </div>
            <div className="demo-panel">
              <h2>FormPageTemplate</h2>
              <p>Full-page form layout with logo area and footer slot.</p>
              <FormPageTemplate
                title="Request access"
                subtitle="Example form shell from npm — not a one-off page layout."
                footerContent={<span>Powered by @createnew/ui-react templates</span>}
              >
                <div className="demo-grid">
                  <TextField label="Work email" type="email" placeholder="you@company.com" />
                  <TextField label="Team" placeholder="Design systems" />
                  <Button variant="primary">Submit</Button>
                </div>
              </FormPageTemplate>
            </div>
          </section>
        )}

        {section === "flows" && (
          <section className="demo-panel">
            <h2>Composed flow (design + dev)</h2>
            <p>
              A realistic slice: PageTemplate header, DataTable queue, Dialog confirmation —
              all from npm, no copied component source.
            </p>
            <PageTemplate
              title="Ship checklist"
              subtitle="What agents build when tokens, components, and templates are packages."
              sectionTitle="Steps"
            >
              <DataTable
                columns={columns}
                data={FLOW_ROWS}
                toolbarActions={
                  <Button variant="primary" onClick={() => setDialogOpen(true)}>
                    Mark step done
                  </Button>
                }
              />
            </PageTemplate>
          </section>
        )}

        {section === "agents" && (
          <section className="demo-panel">
            <h2>Agent workflow files in this demo</h2>
            <p>Read these before generating UI in a consumer repo.</p>
            <ul>
              <li><code>AGENTS.md</code> — repo conventions and npm import rules</li>
              <li><code>agent/GUARDRAILS.md</code> — hard constraints (no hex, no forked CSS)</li>
              <li><code>agent/SKILL.md</code> — Cursor skill: compose pages from @createnew/*</li>
            </ul>
            <pre className="demo-code">{`Design agent → picks template + tokens from package docs
Dev agent    → npm install, import CSS, compose components
Either       → must pass guardrails (token vars, package imports only)`}</pre>
          </section>
        )}
      </main>
    </div>
  );
}
