import { Alert, Card, Loading, PageTemplate, StatusBadge } from "@createnew/ui-react";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { useReviewItem, type ReviewItemResult } from "../data/useReviewItem";

/**
 * Review item detail screen.
 *
 * Composition order (cnds-package skill): template -> tokens -> components.
 *   - PageTemplate         : page shell (no bespoke chrome)
 *   - Card + StatusBadge   : item summary
 *   - ActivityTimeline     : new app-level compound for the activity feed
 *
 * Data enters through the `useReviewItem` seam, and the screen renders all of
 * loading / error / empty / data states (ux skill state matrix).
 */
/**
 * `result` is optional and exists for the visual harness, so each state
 * (loading / error / not-found / data) can be rendered deterministically.
 * In the app it's omitted and the live data seam is used.
 */
export function ReviewItemDetail({ result }: { result?: ReviewItemResult }) {
  const live = useReviewItem();
  const { data, loading, error } = result ?? live;

  return (
    <PageTemplate
      eyebrow="Review queue"
      title={data ? data.title : "Review item"}
      subtitle="The applicant's summary and the timeline of their review."
      maxWidth="wide"
    >
      {loading && <Loading size="md" text="Loading review item…" />}

      {!loading && error && (
        <Alert variant="error" title="Couldn't load this item">
          {error} Try refreshing the page.
        </Alert>
      )}

      {!loading && !error && !data && (
        <Alert variant="info" title="Item not found">
          This review item no longer exists or was removed.
        </Alert>
      )}

      {!loading && !error && data && (
        <div className="review-detail">
          <Card>
            <Card.Header>
              <div className="review-detail__summary-head">
                {/* The applicant name is the page H1 — a Card.Title here would duplicate it
                    and (rendered as H3) skip a heading level. A plain label keeps H1 → H2. */}
                <span className="review-detail__summary-label">Application summary</span>
                <StatusBadge status={data.status}>{data.step}</StatusBadge>
              </div>
              <Card.Description>{data.description}</Card.Description>
            </Card.Header>
            <Card.Content>
              <dl className="review-detail__meta">
                <div className="review-detail__meta-row">
                  <dt>Step</dt>
                  <dd>{data.step}</dd>
                </div>
                <div className="review-detail__meta-row">
                  <dt>Owner</dt>
                  <dd>{data.owner}</dd>
                </div>
              </dl>
            </Card.Content>
          </Card>

          <section className="review-detail__activity" aria-labelledby="activity-heading">
            <h2 id="activity-heading" className="review-detail__activity-title">
              Activity
            </h2>
            <ActivityTimeline
              events={data.activity}
              emptyLabel="No activity on this item yet."
            />
          </section>
        </div>
      )}
    </PageTemplate>
  );
}
