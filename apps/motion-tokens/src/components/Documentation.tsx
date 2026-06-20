import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Documentation() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add("lab-modal-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("lab-modal-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const modal = (
    <div
      id="howItWorksModal"
      className={`modal${isOpen ? " show" : ""}`}
      hidden={!isOpen}
      onClick={() => setIsOpen(false)}
      role="presentation"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="motion-docs-title"
      >
        <button
          type="button"
          id="closeModal"
          className="close-btn"
          onClick={() => setIsOpen(false)}
          aria-label="Close"
        >
          ×
        </button>

        <h2 id="motion-docs-title">Motion tokens</h2>

        <div className="explanation-section">
          <h3>Overview</h3>
          <p>
            This experiment shows motion integrated into a design system as a
            first-class token layer — alongside color, typography, and spacing.
          </p>

          <h3>The concept</h3>
          <p>
            Motion characteristics are managed through tokens so teams can switch
            entire motion schemes by theme, keep designer–developer parity, and
            update patterns system-wide.
          </p>

          <h3>Interactive demo</h3>
          <p>
            Toggle Folio vs Nocturne to compare motion personalities on the
            same four-up shelf — fiction picks vs thriller picks, each with
            its own hover and entrance tokens.
          </p>

          <h3>Resources</h3>
          <ul>
            <li>
              <a href="https://motion.dev" target="_blank" rel="noopener noreferrer">
                Motion
              </a>{" "}
              — animation library
            </li>
            <li>
              <a
                href="https://design-tokens.github.io/community-group/format/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Design Tokens Format
              </a>{" "}
              — W3C community spec
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="btn ghost"
        onClick={() => setIsOpen(true)}
      >
        How it works
      </button>
      {createPortal(modal, document.body)}
    </>
  );
}
