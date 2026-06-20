/**
 * The demo ticket — ONE ticket, shown on one page: the request a team member wrote, and what
 * the agent built from it. The fixed process (agent + skills + tests) and the full acceptance
 * criteria live elsewhere — the ticket just LINKS to the Definition of Done.
 */
export interface TicketDemo {
  title: string;
  /** Who wrote the request. */
  author: string;
  /** The request — basically the team member's prompt. */
  request: string;
  /** Short constraints ("keep in mind"). The full bar is the linked DoD. */
  keepInMind: string[];
  result: {
    /** Plain-language: what the agent built from the ticket. */
    summary: string;
    /** Approved blocks it was composed from. */
    builtFrom: string[];
    /** demo-section id to open the live build. */
    liveSection: string;
  };
}

export const TICKET: TicketDemo = {
  title: "Professional review",
  author: "a designer",
  request:
    "When a professional applies to join the network, we need a screen to review them: show their summary — current step, who's reviewing, status and a short description — and below it a timeline of the vetting steps. Pull it from data, not hardcoded values.",
  keepInMind: [
    "Use our design system only — tokens + components.",
    "Start from a page template.",
    "Handle the empty, loading and error states, not just the happy path.",
  ],
  result: {
    summary:
      "The agent started from a PageTemplate and built the applicant summary with Card + StatusBadge. There was no activity timeline in the design system, so it created one — a new ActivityTimeline — from existing parts (Avatar + StatusBadge) and flagged it to be promoted into the library. Data comes through a swappable seam, and every state renders.",
    builtFrom: [
      "PageTemplate",
      "Card",
      "StatusBadge",
      "Alert",
      "Loading",
      "ActivityTimeline (new)",
    ],
    liveSection: "review-detail",
  },
};
