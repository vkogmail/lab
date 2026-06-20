/**
 * Visual scenario harness (dev-only — not part of the production build).
 *
 * Renders a target component/screen in a specific, explicitly-injected STATE so the
 * Playwright spec can prove each state actually renders (incl. the branches the static
 * data seam never exercises), check token conformance at runtime, and capture a
 * screenshot artifact for the human/design audit.
 *
 *   /visual/index.html?scenario=<key>
 */
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "@createnew/tokens/tokens.css";
import "@createnew/ui-react/styles.css";
import "../src/app.css";
import { ActivityTimeline } from "../src/components/ActivityTimeline";
import { ReviewItemDetail } from "../src/screens/ReviewItemDetail";
import type { ReviewItem } from "../src/data/useReviewItem";
import item from "../src/data/review-item.json";

const sample = item as ReviewItem;

const scenarios: Record<string, ReactNode> = {
  // component states (props-controlled)
  "timeline-default": <ActivityTimeline events={sample.activity} />,
  "timeline-empty": (
    <ActivityTimeline events={[]} emptyLabel="No activity on this item yet." />
  ),
  // screen states (injected via the optional `result` prop)
  "screen-data": (
    <ReviewItemDetail result={{ data: sample, loading: false, error: null }} />
  ),
  "screen-loading": (
    <ReviewItemDetail result={{ data: null, loading: true, error: null }} />
  ),
  "screen-error": (
    <ReviewItemDetail result={{ data: null, loading: false, error: "Network error." }} />
  ),
  "screen-notfound": (
    <ReviewItemDetail result={{ data: null, loading: false, error: null }} />
  ),
};

const key = new URLSearchParams(location.search).get("scenario") ?? "screen-data";
const node = scenarios[key] ?? <div>unknown scenario: {key}</div>;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div data-scenario={key}>{node}</div>
  </StrictMode>,
);
