import { Avatar, StatusBadge } from "@createnew/ui-react";
import "./ActivityTimeline.css";

/**
 * ActivityTimeline — app-level compound component (NOT in @createnew/ui-react).
 *
 * The package has no timeline / activity-feed primitive, and none of the existing
 * components compose into one directly, so this is a genuinely new compound. It is
 * built ONLY from package primitives (`Avatar`, `StatusBadge`) + token-based layout
 * CSS — no hex, no forked DS source.
 *
 * Presentational: props in, no data fetching. The screen owns the data (via the
 * data seam) and passes events down.
 *
 * PROMOTION FLAG: candidate for `@createnew/ui-react` — see the agent report.
 *
 * Usage:
 *   <ActivityTimeline
 *     events={[{ id, actor, action, at, status }]}
 *     emptyLabel="No activity yet."
 *   />
 */

export type ActivityTimelineStatus =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

export interface ActivityTimelineEvent {
  id: string;
  /** Who performed the action — also used for the avatar fallback initials. */
  actor: string;
  /** What they did. */
  action: string;
  /** ISO timestamp; formatted for display by the component. */
  at: string;
  /** Drives the StatusBadge variant. */
  status: ActivityTimelineStatus;
  /** Optional avatar image; falls back to the actor's initials. */
  avatarSrc?: string;
}

export interface ActivityTimelineProps {
  events: ActivityTimelineEvent[];
  /** Shown when there are no events. */
  emptyLabel?: string;
  className?: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABEL: Record<ActivityTimelineStatus, string> = {
  success: "Success",
  warning: "Warning",
  error: "Error",
  info: "Info",
  neutral: "Logged",
};

export function ActivityTimeline({
  events,
  emptyLabel = "No activity yet.",
  className,
}: ActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <div
        className={["cnds-timeline cnds-timeline--empty", className]
          .filter(Boolean)
          .join(" ")}
        role="status"
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <ol
      className={["cnds-timeline", className].filter(Boolean).join(" ")}
      aria-label="Activity timeline"
    >
      {events.map((event) => (
        <li key={event.id} className="cnds-timeline__item">
          <div className="cnds-timeline__rail" aria-hidden="true">
            <Avatar size="sm">
              <Avatar.Fallback>{initials(event.actor)}</Avatar.Fallback>
            </Avatar>
          </div>
          <div className="cnds-timeline__body">
            <div className="cnds-timeline__head">
              <span className="cnds-timeline__actor">{event.actor}</span>
              <StatusBadge status={event.status}>
                {STATUS_LABEL[event.status]}
              </StatusBadge>
            </div>
            <p className="cnds-timeline__action">{event.action}</p>
            <time className="cnds-timeline__time" dateTime={event.at}>
              {formatTimestamp(event.at)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
