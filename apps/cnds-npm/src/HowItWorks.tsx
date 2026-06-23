import { Badge, Card } from "@createnew/ui-react";

/**
 * The method page: why agent-built screens stay on-brand and correct, and how the system
 * gets better over time. Built from CNDS components + tokens.
 */
export function HowItWorks() {
  return (
    <div className="how">
      <h2>How it works</h2>
      <p className="how__lead">
        Why an agent's screens stay on-brand and correct, and how the system improves with every
        ticket.
      </p>

      <Card>
        <Card.Header>
          <Card.Title>1 · The brain composes, it doesn't invent</Card.Title>
        </Card.Header>
        <Card.Content>
          <p>
            The agent builds each ticket by composing the packaged design system: tokens,
            components, and templates. Skills guide it: the design-system contract plus generic
            UI / UX / front-end craft, plus your product domain. It reuses before it builds, and it
            never forks the system.
          </p>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>2 · Guardrails &amp; standards keep it honest</Card.Title>
        </Card.Header>
        <Card.Content>
          <p>
            A ticket carries only specific intent and links the standing bar; the agent stops and
            asks instead of guessing. New components must meet a contribution standard before they
            can enter the library.
          </p>
          <div className="how__chips">
            <Badge variant="outline">GUARDRAILS</Badge>
            <Badge variant="outline">Definition of Done</Badge>
            <Badge variant="outline">Ticket guide</Badge>
            <Badge variant="outline">Component standard</Badge>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>3 · Every result is verified automatically</Card.Title>
        </Card.Header>
        <Card.Content>
          <p>
            Before anything ships, an automated gate runs. So even if the agent's judgment slips,
            it can't merge with drift. Non-experts can trust the output because the check, not a
            human eye, guarantees the basics.
          </p>
          <div className="how__chips">
            <Badge variant="success">drift</Badge>
            <Badge variant="success">composition</Badge>
            <Badge variant="success">visual states</Badge>
            <Badge variant="success">accessibility (axe)</Badge>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>4 · It improves itself</Card.Title>
        </Card.Header>
        <Card.Content>
          <p>
            Findings tighten the skills, or better, become new automated checks, so a mistake made
            once can't happen twice. Issues found in package components flag upstream to the
            design-system team; genuinely new components get promoted into the library. The system
            gets more capable with every ticket.
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}
