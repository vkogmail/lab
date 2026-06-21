export type DemoSection =
  | "tickets"
  | "overview"
  | "tokens"
  | "components"
  | "templates"
  | "flows"
  | "agents";

/**
 * Grouped nav: the three KINDS of things, so the hierarchy reads clearly.
 *  - Work: the tickets (the story). The only primary entry.
 *  - Building blocks: what the agent composes from (reference).
 *  - About: how the method works.
 * Note: "review-detail" is intentionally NOT in the nav — it's a ticket RESULT,
 * reached by drilling into its ticket, not a peer of the reference exhibits.
 */
export const NAV_GROUPS: Array<{
  group: string;
  items: Array<{ id: DemoSection; label: string }>;
}> = [
  {
    group: "Work",
    items: [{ id: "tickets", label: "Ticket → result" }],
  },
  {
    group: "Building blocks",
    items: [
      { id: "tokens", label: "Tokens" },
      { id: "components", label: "Components" },
      { id: "templates", label: "Templates" },
      { id: "flows", label: "Composed flow" },
    ],
  },
  {
    group: "About the method",
    items: [
      { id: "overview", label: "Overview" },
      { id: "agents", label: "Agent workflow" },
    ],
  },
];
