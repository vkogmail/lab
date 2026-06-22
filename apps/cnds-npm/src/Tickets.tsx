import { useState } from "react";
import { Badge, StatusBadge } from "@createnew/ui-react";
import { ReviewItemDetail } from "./screens/ReviewItemDetail";
import { TICKETS, playgroundUrl, type TicketDemo } from "./tickets-data";
import type { DemoSection } from "./demo-sections";
import "./tickets.css";

/**
 * Tickets workspace: a vertical accordion of tickets (left) — collapsed rows, the active one
 * expands inline to its full detail — beside the live result of the active ticket (right).
 */
export function Tickets({ onOpen }: { onOpen: (section: DemoSection) => void }) {
  const [activeKey, setActiveKey] = useState(TICKETS[0].key);
  const active = TICKETS.find((t) => t.key === activeKey) ?? TICKETS[0];

  return (
    <div className="ticket-workspace">
      <div className="ticket-list" role="tablist" aria-label="Tickets">
        {TICKETS.map((t) => (
          <TicketCard
            key={t.key}
            ticket={t}
            isActive={t.key === active.key}
            onSelect={() => setActiveKey(t.key)}
            onOpen={onOpen}
          />
        ))}
      </div>
      <Preview ticket={active} />
    </div>
  );
}

const statusKind = (t: TicketDemo) => (t.status === "Done" ? "success" : "neutral");

function TicketCard({
  ticket: t,
  isActive,
  onSelect,
  onOpen,
}: {
  ticket: TicketDemo;
  isActive: boolean;
  onSelect: () => void;
  onOpen: (section: DemoSection) => void;
}) {
  return (
    <article className="tcard" data-active={isActive}>
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-expanded={isActive}
        className="tcard__head"
        onClick={onSelect}
      >
        <span className="tcard__top">
          <span className="tcard__key">
            {t.key} · {t.issueType}
          </span>
          <StatusBadge status={statusKind(t)}>{t.status}</StatusBadge>
        </span>
        <span className="tcard__title">{t.title}</span>
        {!isActive && <span className="tcard__preview">{t.description}</span>}
      </button>

      {isActive && (
        <div className="tcard__body">
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
            <button type="button" className="ticket__link" onClick={() => onOpen("how")}>
              Definition of Done →
            </button>
          </div>

          <div className="issue__field">
            <span className="issue__field-label">Labels</span>
            <div className="chips">
              {t.labels.map((l) => (
                <Badge key={l} variant="secondary">
                  {l}
                </Badge>
              ))}
            </div>
          </div>

          {t.result && (
            <>
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
            </>
          )}
        </div>
      )}
    </article>
  );
}

function Preview({ ticket: t }: { ticket: TicketDemo }) {
  return (
    <section className="preview" aria-label="Result">
      <div className="preview__bar">
        <span className="preview__dots" aria-hidden="true">
          <i className="preview__dot" />
          <i className="preview__dot" />
          <i className="preview__dot" />
        </span>
        <span className="preview__label">
          {t.result ? "Live result — built from the design system" : "No result yet"}
        </span>
      </div>
      <div className="preview__body">
        {t.result?.live === "review-item" ? (
          <ReviewItemDetail />
        ) : (
          <div className="preview__empty">
            <p className="issue__muted">
              <strong>Queued.</strong> Run this ticket through <code>cnds-builder</code> to build
              and verify the result — it will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
