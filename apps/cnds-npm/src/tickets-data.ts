/**
 * The demo ticket — ONE ticket shown beside its live result.
 * The ticket reads like a Jira issue; the result is the actual screen the agent built,
 * rendered inline. "Built from" links each approved block to the CNDS playground.
 */

/** CNDS component playground. Routes are /components/<slug>, e.g. /components/loading. */
export const PLAYGROUND_URL = "https://cnds-playground.vercel.app";
export function playgroundUrl(block: BuiltBlock): string {
  const slug = block.slug ?? block.name.toLowerCase();
  return `${PLAYGROUND_URL}/components/${slug}`;
}

export interface BuiltBlock {
  name: string;
  /** Explicit playground slug if it isn't just name.toLowerCase() (e.g. multi-word components). */
  slug?: string;
  /** A Create-new block — not in the library yet (no playground page), flagged for promotion. */
  isNew?: boolean;
}

export interface TicketDemo {
  key: string;
  issueType: string;
  status: string;
  title: string;
  author: string;
  labels: string[];
  /** The intent: what + why, in the product's own terms. */
  description: string;
  /** The data source/entity that drives the screen. */
  data: string;
  /** Feature-specific, testable acceptance. The generic bar is the linked Definition of Done. */
  acceptance: string[];
  result: {
    /** One line: what the agent produced. */
    outcome: string;
    /** Approved blocks it was composed from (link to the playground). */
    builtFrom: BuiltBlock[];
  };
}

export const TICKET: TicketDemo = {
  key: "CNDS-128",
  issueType: "Story",
  status: "Done",
  title: "Professional review screen",
  author: "a designer",
  labels: ["design-system", "ux"],
  description:
    "When a professional applies to join the network, a reviewer needs a screen to assess them — their review summary plus the full history of their vetting.",
  data: "The applicant record (name, current step, reviewer, status, description) and its review-activity entries.",
  acceptance: [
    "Summary shows the applicant's name, current step, reviewer and status, plus a short description.",
    "An activity timeline lists every vetting event in order — who, what, when, and the outcome.",
    "A brand-new applicant with no activity yet still reads clearly.",
  ],
  result: {
    outcome:
      "Built from a PageTemplate with Card + StatusBadge. The activity timeline didn't exist in the design system, so a new ActivityTimeline was created from existing parts and flagged for promotion.",
    builtFrom: [
      { name: "PageTemplate" },
      { name: "Card" },
      { name: "StatusBadge" },
      { name: "Alert" },
      { name: "Loading" },
      { name: "ActivityTimeline", isNew: true },
    ],
  },
};
