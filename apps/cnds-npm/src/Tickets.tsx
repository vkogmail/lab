import { Badge, Button, Card } from "@createnew/ui-react";
import { TICKET } from "./tickets-data";
import type { DemoSection } from "./demo-sections";
import "./tickets.css";

/**
 * One ticket, one page: the request a team member wrote, and what the agent built from it.
 * The Definition of Done is linked, not spelled out; the fixed process lives in Agent workflow.
 */
export function Tickets({ onOpen }: { onOpen: (section: DemoSection) => void }) {
  const t = TICKET;

  return (
    <div className="tickets">
      <h2>Ticket → result</h2>
      <p className="tickets__lead">
        A team member writes a request. The agent turns it into a working result, built from the
        design system. Here is one, end to end.
      </p>

      <Card>
        <Card.Header>
          <Card.Title>The ticket</Card.Title>
          <Card.Description>Written by {t.author}</Card.Description>
        </Card.Header>
        <Card.Content>
          <p className="ticket__request">“{t.request}”</p>

          <div className="ticket__block">
            <span className="ticket__label">Keep in mind</span>
            <ul className="ticket__kim">
              {t.keepInMind.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </div>

          <p className="ticket__block">
            <button type="button" className="ticket__link" onClick={() => onOpen("agents")}>
              Definition of Done →
            </button>
          </p>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>What the agent built</Card.Title>
        </Card.Header>
        <Card.Content>
          <p>{t.result.summary}</p>
          <div className="chips">
            {t.result.builtFrom.map((b) => (
              <Badge key={b} variant="outline">
                {b}
              </Badge>
            ))}
          </div>
          <div className="ticket__block">
            <Button variant="primary" onClick={() => onOpen(t.result.liveSection as DemoSection)}>
              See it live →
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
