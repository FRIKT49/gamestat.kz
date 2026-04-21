/**
 * Stats page: aggregates from API (genre distribution) + localStorage counts.
 */

function countByGenre(games) {
  const map = {};
  games.forEach(function (g) {
    const genre = (g.genre || "GENERAL").toUpperCase();
    map[genre] = (map[genre] || 0) + 1;
  });
  return map;
}

function renderBarChart(containerEl, counts) {
  const entries = Object.keys(counts)
    .map(function (k) {
      return { label: k, value: counts[k] };
    })
    .sort(function (a, b) {
      return b.value - a.value;
    })
    .slice(0, 8);

  const max = entries.length ? entries[0].value : 1;

  containerEl.innerHTML = entries
    .map(function (row) {
      const pct = Math.round((row.value / max) * 100);
      return `
        <div class="bar-row" style="margin-bottom: 15px;">
          <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
            <span class="ui-label" style="font-size: 10px;">${escapeHtml(row.label)}</span>
            <span class="ui-value" style="font-size: 10px; color: var(--accent);">${row.value}</span>
          </div>
          <div class="bar-track" style="height: 4px; background: #111; position: relative;">
            <div class="bar-fill" style="height: 100%; width: ${pct}%; background: var(--accent); transition: width 0.3s;"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function updateStats(games) {
    const totalApiEl = document.getElementById("statTotalApi");
    const chartEl = document.getElementById("genreChart");
    const platformEl = document.getElementById("statPlatforms");

    if (totalApiEl) totalApiEl.textContent = String(games.length);
    
    if (chartEl) {
        const byGenre = countByGenre(games);
        renderBarChart(chartEl, byGenre);
    }

    if (platformEl) {
        const latest = games.slice(-5).reverse().map(g => g.title).join(" // ");
        platformEl.innerHTML = latest || "WAITING_FOR_DATA_NODES...";
    }
}

function initStatsPage() {
  const logEl = document.getElementById("processLogs");
  const watchlistEl = document.getElementById("statWatchlist");

  if (logEl) {
    setInterval(() => {
        const hex = Math.floor(Math.random() * 65535).toString(16).toUpperCase();
        const msg = ["[SCAN]", "[SYNC]", "[QUERY]", "[FETCH]"][Math.floor(Math.random() * 4)];
        const div = document.createElement("div");
        div.textContent = `[0x${hex}] ${msg}_STATUS_OK`;
        logEl.prepend(div);
        if (logEl.children.length > 20) logEl.lastElementChild.remove();
    }, 1500);
  }

  if (watchlistEl) {
    watchlistEl.textContent = String(getWatchlist().length);
  }

  // Initial update
  updateStats(cachedGames);

  // Listen for background hydration updates
  window.addEventListener("archive_updated", function() {
      updateStats(cachedGames);
  });

  // If cache is totally empty, trigger first load
  if (cachedGames.length === 0) {
      loadCatalogGames().then(games => {
          updateStats(games);
      });
  }
}

document.addEventListener("DOMContentLoaded", initStatsPage);
