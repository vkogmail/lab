import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@createnew/tokens/tokens.css";
import "@createnew/ui-react/styles.css";
import { App } from "./App";
import "./app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
