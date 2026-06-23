export type DemoSection = "tickets" | "how" | "guide";

/**
 * Three destinations:
 *  - the work (ticket → result),
 *  - how it works (the method),
 *  - session guide (walkthrough doc for pairing sessions).
 */
export const NAV_ITEMS: Array<{ id: DemoSection; label: string }> = [
  { id: "tickets", label: "Ticket → result" },
  { id: "how", label: "How it works" },
  { id: "guide", label: "Session guide" },
];
