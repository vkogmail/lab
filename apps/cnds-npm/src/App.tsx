import { useState } from "react";
import { NAV_ITEMS, type DemoSection } from "./demo-sections";
import { Tickets } from "./Tickets";
import { HowItWorks } from "./HowItWorks";
import { Guide } from "./Guide";

export function App() {
  const [section, setSection] = useState<DemoSection>("tickets");
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="demo-shell" data-nav={navOpen ? "open" : "collapsed"}>
      <aside className="demo-sidebar">
        <div className="demo-sidebar__top">
          <button
            type="button"
            className="demo-nav-toggle"
            aria-label={navOpen ? "Collapse navigation" : "Expand navigation"}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((o) => !o)}
          >
            ☰
          </button>
          {navOpen && (
            <div className="demo-brand">
              <h1>CNDS npm demo</h1>
              <p>Published packages + agent guardrails.</p>
            </div>
          )}
        </div>

        {navOpen && (
          <>
            <nav className="demo-nav" aria-label="Sections">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-active={section === item.id}
                  onClick={() => setSection(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="demo-meta">
              <span>@createnew/tokens ^0.1.9</span>
              <span>@createnew/ui-react ^0.1.6</span>
            </div>
          </>
        )}
      </aside>

      <main className="demo-main">
        {section === "tickets" && <Tickets onOpen={setSection} />}
        {section === "how" && <HowItWorks />}
        {section === "guide" && <Guide />}
      </main>
    </div>
  );
}
