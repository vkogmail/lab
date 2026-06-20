/**
 * Lab page meta — favicon, description, Open Graph / Twitter cards.
 * Set on <html>: data-lab-title, data-lab-description (optional; falls back to <title>).
 */
(function () {
  const root = document.documentElement;
  const desc = root.getAttribute("data-lab-description") || "";
  const labTitle = root.getAttribute("data-lab-title") || document.title.replace(/\s*[—·]\s*Lab\s*$/, "");
  const pageTitle = document.title;
  const origin = location.origin;
  const ogImage = `${origin}/brand/og-lab.svg`;

  function upsert(attr, key, content) {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  if (!document.querySelector('link[rel="icon"]')) {
    const icon = document.createElement("link");
    icon.rel = "icon";
    icon.type = "image/svg+xml";
    icon.href = "/brand/favicon.svg";
    document.head.appendChild(icon);
  }

  if (desc) upsert("name", "description", desc);
  upsert("property", "og:title", pageTitle);
  upsert("property", "og:description", desc);
  upsert("property", "og:type", "website");
  upsert("property", "og:url", location.href.split("#")[0]);
  upsert("property", "og:image", ogImage);
  upsert("property", "og:image:alt", `${labTitle} · lab experiment by Vincent Koopmans`);
  upsert("name", "twitter:card", "summary_large_image");
  upsert("name", "twitter:title", pageTitle);
  if (desc) upsert("name", "twitter:description", desc);
  upsert("name", "twitter:image", ogImage);
  upsert(
    "name",
    "theme-color",
    root.getAttribute("data-theme") === "light" ? "#f3f1ea" : "#0c0c0d",
  );
})();
