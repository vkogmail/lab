/**
 * Demo tickets shown in a swimlane. Each is one request; selecting it shows the ticket (left)
 * and its live result (right). Only the first is executed — the rest are queued. We don't
 * fabricate results. The fixed agent process and the full acceptance bar live elsewhere
 * (Agent workflow + the linked Definition of Done); a ticket carries only specific intent.
 */

/** CNDS component playground. Routes are /components/<slug>, e.g. /components/loading. */
export const PLAYGROUND_URL = "https://cnds-playground.vercel.app";
export function playgroundUrl(block: BuiltBlock): string {
  const slug = block.slug ?? block.name.toLowerCase();
  return `${PLAYGROUND_URL}/components/${slug}`;
}

export interface BuiltBlock {
  name: string;
  /** Explicit playground slug if it isn't just name.toLowerCase(). */
  slug?: string;
  /** A Create-new block — not in the library yet (no playground page), flagged for promotion. */
  isNew?: boolean;
}

export interface TicketDemo {
  key: string;
  issueType: string;
  status: "Done" | "Queued";
  title: string;
  author: string;
  labels: string[];
  /** The intent: what + why, in the product's own terms. */
  description: string;
  /** The data source/entity that drives the screen. */
  data: string;
  /** Feature-specific, testable acceptance. The generic bar is the linked Definition of Done. */
  acceptance: string[];
  /** Present only when the ticket has been built. */
  result?: {
    outcome: string;
    builtFrom: BuiltBlock[];
    /** Marks the one ticket whose live screen we render. */
    live: "review-item";
  };
}

export const TICKETS: TicketDemo[] = [
  {
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
      live: "review-item",
    },
  },
  {
    key: "CNDS-131",
    issueType: "Story",
    status: "Queued",
    title: "Applicant review queue",
    author: "a designer",
    labels: ["design-system"],
    description:
      "Reviewers need a queue of the professionals currently under review, so they can pick who to assess next.",
    data: "The list of applicant records with their current step, reviewer and status.",
    acceptance: [
      "A filterable table of applicants showing step, reviewer and status.",
      "Selecting an applicant opens their review screen.",
      "A clear empty state when the queue is clear.",
    ],
  },
  {
    key: "CNDS-140",
    issueType: "Task",
    status: "Queued",
    title: "Join-the-network application form",
    author: "a developer",
    labels: ["ux"],
    description:
      "A professional applies to join the network through a short, multi-step form.",
    data: "The application fields: name, expertise area, portfolio link and references.",
    acceptance: [
      "Steps: details → expertise → review → submitted.",
      "Back and cancel preserve what was entered.",
      "A clear confirmation once submitted.",
    ],
  },
];
