/**
 * Lab top navigation — portfolio-style pill nav for all experiments.
 * Wire-up (theme, mobile menu, modals): chrome.js
 */
(function () {
  const navHTML = `
    <div class="lab-nav-backdrop" id="labNavBackdrop" hidden></div>
    <nav class="lab-nav-drawer" id="labNavDrawer" aria-label="Lab menu" hidden>
      <a href="https://vincentkoopmans.nl/">Portfolio</a>
      <a href="https://www.linkedin.com/in/1stfloor/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      <a href="mailto:vincent.koopmans@gmail.com">Email</a>
    </nav>
    <div class="lab-nav-shell">
      <nav aria-label="Lab">
        <div class="lab-nav-desktop">
          <a href="https://vincentkoopmans.nl/">Portfolio</a>
          <a href="https://www.linkedin.com/in/1stfloor/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="mailto:vincent.koopmans@gmail.com">Email</a>
        </div>
        <button class="menu-btn" id="labMenuBtn" type="button" aria-expanded="false" aria-controls="labNavDrawer" aria-label="Open menu">
          <svg class="ham" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <line class="hl hl1" x1="4" y1="7" x2="20" y2="7"/>
            <line class="hl hl2" x1="4" y1="12" x2="20" y2="12"/>
            <line class="hl hl3" x1="4" y1="17" x2="20" y2="17"/>
          </svg>
        </button>
        <span class="sep"></span>
        <button class="toggle" id="labThemeBtn" type="button" aria-label="Toggle theme">
          <svg id="labThemeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"></svg>
        </button>
      </nav>
    </div>
    <div class="lab-nav-spacer" aria-hidden="true"></div>
  `;

  function inject() {
    document.body.insertAdjacentHTML("afterbegin", navHTML);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
