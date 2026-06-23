import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import guide from "../SESSION-GUIDE.md?raw";
import "./guide.css";

const REPO_BASE = "https://github.com/vkogmail/lab/blob/main/apps/cnds-npm";

/** Relative .md links in the guide open on GitHub; external links stay as-is. */
function docHref(href: string | undefined): string | undefined {
  if (!href) return href;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.endsWith(".md") || href.includes(".md#")) {
    const path = href.replace(/^\.\//, "");
    return `${REPO_BASE}/${path}`;
  }
  return href;
}

const markdownComponents: Components = {
  a: ({ href, children }) => (
    <a href={docHref(href)} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
};

/**
 * Renders SESSION-GUIDE.md in the app so the same Vercel URL serves the walkthrough.
 */
export function Guide() {
  return (
    <article className="guide">
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {guide}
      </Markdown>
    </article>
  );
}
