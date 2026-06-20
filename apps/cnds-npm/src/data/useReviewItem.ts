import itemJson from "./review-item.json";

/**
 * The data seam for the review-item detail screen.
 *
 * Today this reads a local JSON file; swap the body for a `fetch()` later and the
 * signature — `{ data, loading, error }` — stays identical, so the screen and its
 * components don't change. That's the seam (frontend-eng skill).
 */

/** Status of a single activity event — maps to a `signal` role, not a brand color. */
export type ActivityStatus = "success" | "warning" | "error" | "info" | "neutral";

export interface ActivityEvent {
  id: string;
  /** Who performed the action. */
  actor: string;
  /** What they did (plain language). */
  action: string;
  /** ISO timestamp of when it happened. */
  at: string;
  /** Status of the event, drives the StatusBadge. */
  status: ActivityStatus;
}

export interface ReviewItem {
  id: string;
  title: string;
  step: string;
  owner: string;
  status: ActivityStatus;
  description: string;
  activity: ActivityEvent[];
}

export interface ReviewItemResult {
  data: ReviewItem | null;
  loading: boolean;
  error: string | null;
}

export function useReviewItem(): ReviewItemResult {
  // Swap this body for a real fetch() later; the return signature is the seam.
  const data = itemJson as ReviewItem;
  return { data, loading: false, error: null };
}
