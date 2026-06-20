/**
 * Lab chrome — theme toggle (persisted), mobile nav, optional modal helper.
 *
 * Modal: add id="howItWorksModal" + id="howItWorksBtn" + id="closeModal"
 * or call LabChrome.setupModal({ trigger, modal, close }).
 */
(function () {
  const root = document.documentElement;
  const moon = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';
  const sun =
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';

  function setTheme(t) {
    root.setAttribute("data-theme", t);
    const icon = document.getElementById("labThemeIcon");
    const btn = document.getElementById("labThemeBtn");
    if (icon) icon.innerHTML = t === "dark" ? sun : moon;
    if (btn) {
      btn.setAttribute(
        "aria-label",
        t === "dark" ? "Switch to light theme" : "Switch to dark theme",
      );
    }
    try {
      localStorage.setItem("theme", t);
    } catch (e) {}
    if (typeof window.renderDither === "function") window.renderDither();
    root.dispatchEvent(new CustomEvent("lab-theme-change", { detail: { theme: t } }));
  }

  function setupTheme() {
    const btn = document.getElementById("labThemeBtn");
    if (!btn) return;
    setTheme(root.getAttribute("data-theme") || "dark");
    let rot = 0;
    btn.addEventListener("click", () => {
      setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
      rot += 180;
      const icon = document.getElementById("labThemeIcon");
      if (icon) icon.style.transform = "rotate(" + rot + "deg)";
    });
  }

  function setupMobileNav() {
    const btn = document.getElementById("labMenuBtn");
    const drawer = document.getElementById("labNavDrawer");
    const backdrop = document.getElementById("labNavBackdrop");
    if (!btn || !drawer || !backdrop) return;

    function setOpen(open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (open) {
        drawer.hidden = false;
        backdrop.hidden = false;
        void drawer.offsetWidth;
        drawer.classList.add("open");
        backdrop.classList.add("open");
      } else {
        drawer.classList.remove("open");
        backdrop.classList.remove("open");
        setTimeout(() => {
          if (!drawer.classList.contains("open")) {
            drawer.hidden = true;
            backdrop.hidden = true;
          }
        }, 340);
      }
      document.body.style.overflow = open ? "hidden" : "";
    }

    btn.addEventListener("click", () =>
      setOpen(btn.getAttribute("aria-expanded") !== "true"),
    );
    backdrop.addEventListener("click", () => setOpen(false));
    drawer.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => setOpen(false)),
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  function setupModal(opts) {
    const modal = document.querySelector(opts?.modal || "#howItWorksModal");
    const trigger = document.querySelector(opts?.trigger || "#howItWorksBtn");
    const closeBtn = document.querySelector(opts?.close || "#closeModal");
    if (!modal || !trigger || !closeBtn) return;

    function openModal() {
      modal.hidden = false;
      document.body.classList.add("lab-modal-open");
      void modal.offsetHeight;
      modal.classList.add("show");
    }

    function closeModal() {
      modal.classList.remove("show");
      document.body.classList.remove("lab-modal-open");
      setTimeout(() => {
        modal.hidden = true;
      }, 300);
    }

    trigger.addEventListener("click", openModal);
    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeModal();
    });
  }

  function setupShare() {
    const btn = document.getElementById("shareBtn");
    if (!btn) return;

    let resetT = 0;
    function flash(label) {
      const prev = btn.textContent;
      btn.textContent = label;
      btn.classList.add("is-copied");
      clearTimeout(resetT);
      resetT = setTimeout(() => {
        btn.textContent = prev;
        btn.classList.remove("is-copied");
      }, 2000);
    }

    btn.addEventListener("click", async () => {
      const url = location.href.split("#")[0];
      const title = document.title;
      const text =
        document.querySelector(".demo-header .lead")?.textContent?.trim() || title;
      try {
        if (navigator.share) {
          await navigator.share({ title, text, url });
          return;
        }
        await navigator.clipboard.writeText(url);
        flash("Link copied");
      } catch (err) {
        if (err && err.name === "AbortError") return;
        try {
          await navigator.clipboard.writeText(url);
          flash("Link copied");
        } catch (_) {}
      }
    });
  }

  // GitHub "Code" action — sits in .demo-actions beside Share so the source is
  // discoverable from the page itself, not just the top-nav link. Per-app target
  // comes from <html data-repo-url="…">; falls back to the lab monorepo root.
  function setupCode() {
    const actions = document.querySelector(".demo-actions");
    if (!actions || document.getElementById("codeBtn")) return;

    const url =
      document.documentElement.dataset.repoUrl || "https://github.com/vkogmail/lab";
    const a = document.createElement("a");
    a.id = "codeBtn";
    a.className = "btn ghost";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.innerHTML =
      '<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg><span>Code</span>';

    const share = document.getElementById("shareBtn");
    if (share) actions.insertBefore(a, share);
    else actions.appendChild(a);
  }

  function init() {
    setupTheme();
    setupMobileNav();
    setupModal();
    setupShare();
    setupCode();
  }

  window.LabChrome = { setTheme, setupModal, setupShare, setupCode };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
