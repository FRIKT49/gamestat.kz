/**
 * Splash screen: CSS-driven animation, no external animation libraries.
 */
(function initLoader() {
  "use strict";

  const isReload = performance.getEntriesByType('navigation')[0]?.type === 'reload';
  const hasBeenLoaded = sessionStorage.getItem('gs_loaded');

  if (hasBeenLoaded && !isReload) {
      document.addEventListener("DOMContentLoaded", function() {
          const main = document.getElementById("mainContent");
          if (main) main.classList.add("is-visible");
          const overlay = document.getElementById("animBody");
          if (overlay) overlay.style.display = "none";
      });
      return;
  }

  sessionStorage.setItem('gs_loaded', 'true');

  const SYSTEM_MESSAGES = [
    "INITIALIZING_VIRTUAL_DOM...",
    "MOUNTING_LOCAL_STORAGE...",
    "FETCHING_STEAM_DATA_ARRAY...",
    "COMPUTING_ANALYTICS_DELTA...",
    "ASYNC_HANDSHAKE_COMPLETE.",
    "PARSING_GLOBAL_MANIFEST...",
    "SYSTEM_READY_STABLE."
  ];

  function createLoaderUI() {
    const overlay = document.getElementById("animBody");
    if (!overlay) return;

    const content = document.createElement("div");
    content.className = "loader-content";
    content.innerHTML = `
      <div class="loader-progress">
        <div class="loader-progress-bar" id="loaderProgress"></div>
      </div>
      <div class="loader-status" id="loaderStatus">SYSTEM_INIT</div>
    `;
    overlay.appendChild(content);
  }

  function showMainContent() {
    const main = document.getElementById("mainContent");
    const overlay = document.getElementById("animBody");
    
    if (overlay) overlay.classList.add("is-glitching");

    setTimeout(() => {
      if (main) main.classList.add("is-visible");
      if (overlay) {
        overlay.classList.add("is-hidden");
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 800);
      }
    }, 400); // Small delay for the final glitch
  }

  document.addEventListener("DOMContentLoaded", function () {
    createLoaderUI();
    
    const progressEl = document.getElementById("loaderProgress");
    const statusEl = document.getElementById("loaderStatus");
    
    let currentStep = 0;
    const totalSteps = SYSTEM_MESSAGES.length;

    const interval = setInterval(() => {
      if (currentStep < totalSteps) {
        if (statusEl) statusEl.textContent = SYSTEM_MESSAGES[currentStep];
        if (progressEl) progressEl.style.width = ((currentStep + 1) / totalSteps * 100) + "%";
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(showMainContent, 500);
      }
    }, 400);
  });
})();
