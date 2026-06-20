export type DemoSection =
  | "overview"
  | "tokens"
  | "components"
  | "templates"
  | "flows"
  | "agents";

export const DEMO_SECTIONS: Array<{ id: DemoSection; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "tokens", label: "Tokens (npm)" },
  { id: "components", label: "Components (npm)" },
  { id: "templates", label: "Templates (npm)" },
  { id: "flows", label: "Composed flow" },
  { id: "agents", label: "Agent workflow" },
];
