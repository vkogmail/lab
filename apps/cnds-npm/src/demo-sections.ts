export type DemoSection = "tickets" | "how";

/**
 * Two destinations, matching what we're actually building:
 *  - the work (ticket → result), and
 *  - how it works (the method — why agent output is trustworthy and how it improves).
 * The design system itself is not re-exhibited here — it lives in the playground.
 */
export const NAV_ITEMS: Array<{ id: DemoSection; label: string }> = [
  { id: "tickets", label: "Ticket → result" },
  { id: "how", label: "How it works" },
];
