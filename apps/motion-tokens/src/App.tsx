import { TokenProvider, ProductTheme } from "./components/motion/TokenProvider";
import { Bookshelf } from "./components/Bookshelf";
import { TokenToggle } from "./components/motion/TokenToggle";
import { Documentation } from "./components/Documentation";
import "./styles/App.css";
import "./styles/components.css";
import "./styles/chrome.css";

export const App = () => {
  return (
    <TokenProvider>
      <div className="app">
        <header className="demo-header">
          <div className="demo-header-main">
            <p className="label">Motion tokens</p>
            <h1>Motion as design tokens</h1>
            <p className="lead">
              Two fictional bookstore imprints — Folio for literary fiction, Nocturne
              for thrillers — sharing one grid, different motion tokens on every card.
            </p>
          </div>
          <div className="demo-actions">
            <TokenToggle />
            <Documentation />
            <button id="shareBtn" className="btn btn-ghost" type="button">
              Share
            </button>
          </div>
        </header>

        <main className="main-content">
          <ProductTheme>
            <Bookshelf />
          </ProductTheme>
        </main>
      </div>
    </TokenProvider>
  );
};
