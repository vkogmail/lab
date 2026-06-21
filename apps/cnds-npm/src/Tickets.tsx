import { Badge, StatusBadge } from "@createnew/ui-react";
import { ReviewItemDetail } from "./screens/ReviewItemDetail";
import { TICKET, playgroundUrl } from "./tickets-data";
import type { DemoSection } from "./demo-sections";
import "./tickets.css";

/**
 * Ticket → result, side by side: a Jira-style ticket on the right, and the live screen the
 * agent built from it in the large panel on the left (rendered inline — no navigation).
 */
export function Tickets({ onOpen }: { onOpen: (section: DemoSection) => void }) {
  const t = TICKET;

  return (
    <div className="ticket-split">
      <section className="preview" aria-label="Live result">
        <div className="preview__bar">
          <span className="preview__dots" aria-hidden="true">
            <i className="preview__dot" />
            <i className="preview__dot" />
            <i className="preview__dot" />
          </span>
          <span className="preview__label">Live result — built from the design system</span>
        </div>
        <div className="preview__body">
          <ReviewItemDetail />
        </div>
      </section>

      <aside className="issue" aria-label="Ticket">
        <div className="issue__key">
          {t.key} · {t.issueType}
        </div>
        <h3 className="issue__title">{t.title}</h3>

        <dl className="issue__meta">
          <div className="issue__row">
            <dt>Status</dt>
            <dd>
              <StatusBadge status="success">{t.status}</StatusBadge>
            </dd>
          </div>
          <div className="issue__row">
            <dt>Assignee</dt>
            <dd>{t.author}</dd>
          </div>
          <div className="issue__row">
            <dt>Labels</dt>
            <dd className="chips">
              {t.labels.map((l) => (
                <Badge key={l} variant="secondary">
                  {l}
                </Badge>
              ))}
            </dd>
          </div>
        </dl>

        <div className="issue__sep" />

        <div className="issue__field">
          <span className="issue__field-label">Description</span>
          <p className="issue__desc">{t.description}</p>
        </div>

        <div className="issue__field">
          <span className="issue__field-label">Data</span>
          <p className="issue__muted">{t.data}</p>
        </div>

        <div className="issue__field">
          <span className="issue__field-label">Acceptance criteria</span>
          <ul className="acceptance">
            {t.acceptance.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <button type="button" className="ticket__link" onClick={() => onOpen("agents")}>
            Definition of Done →
          </button>
        </div>

        <div className="issue__field">
          <span className="issue__field-label">Outcome</span>
          <p className="issue__muted">{t.result.outcome}</p>
        </div>

        <div className="issue__field">
          <span className="issue__field-label">Built from</span>
          <div className="chips">
            {t.result.builtFrom.map((b) =>
              b.isNew ? (
                <span key={b.name} className="chip chip--new" title="New — flagged for promotion">
                  {b.name} · new
                </span>
              ) : (
                <a
                  key={b.name}
                  className="chip chip--link"
                  href={playgroundUrl(b)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {b.name} ↗
                </a>
              ),
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
