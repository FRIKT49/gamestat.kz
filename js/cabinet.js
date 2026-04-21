/**
 * Personal cabinet: watchlist from localStorage, cards enriched via API.
 */

let cabinetListenersBound = false;

function buildCabinetCard(item, game) {
  const title = game ? game.title : "ASSET_ID_" + item.gameId;
  const thumb = game && game.thumbnail;
  const genre = game ? game.genre : "DEFAULT_GENRE";
  const developer = game ? game.developer : "SYSTEM_NODE";
  const pausedLabel = item.paused ? "SUSPENDED" : "TRACKING";
  
  return (
    '<article class="game-card cabinet-card" data-entry-id="' + escapeHtml(item.id) + '">' +
      '<div class="card-media" style="height: 340px; opacity: 0.8;">' +
        (thumb
          ? '<img src="' + escapeHtml(thumb) + '" alt="" loading="lazy" />'
          : '<div class="card-media-fallback" style="height:100%; display:flex; align-items:center; justify-content:center; background:#111; color:#333; font-size:10px;">SIGNAL_LOST_RECOVERING...</div>') +
      '</div>' +
      '<div class="card-body" style="padding: 20px;">' +
        '<div style="display:flex; justify-content:space-between; margin-bottom: 5px;">' +
            '<div class="diag-label">Node_ID: ' + escapeHtml(item.gameId) + '</div>' +
            '<div class="diag-label" style="opacity:0.5;">ARCHIVE_DATE: ' + formatDateIso(game ? game.releaseDate : null) + '</div>' +
        '</div>' +
        '<h3 class="card-title" style="font-size: 1.2rem; margin: 0 0 15px;">' +
          '<span class="scanline-text" style="color: var(--accent);">' + escapeHtml(title) + '</span>' +
        '</h3>' +
        '<p class="card-meta" style="font-size: 11px; color: #666; margin-bottom: 10px;">' +
          'GENRE: ' + escapeHtml(genre) + ' // SOURCE: ' + escapeHtml(developer) +
        '</p>' +
        '<div style="background: rgba(255,60,0,0.03); border: 1px solid rgba(255,60,0,0.08); padding: 10px; margin-bottom: 15px; border-left: 2px solid var(--accent);">' +
          '<div class="diag-label">Injection_Timestamp: ' + formatDateIso(item.addedAt) + '</div>' +
          '<p style="font-size: 12px; margin: 5px 0 0; color: #aaa;">' + escapeHtml(item.note || "NO_DATA_LOGGED") + '</p>' +
        '</div>' +
        '<div class="cabinet-controls" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #222; padding-top: 15px;">' +
          '<span class="data-tag" style="border-color: ' + (item.paused ? '#555' : '#0f0') + '; color: ' + (item.paused ? '#555' : '#0f0') + '; padding: 2px 8px; font-size: 10px;">' +
             pausedLabel +
          '</span>' +
          '<div class="card-actions" style="margin-top: 0;">' +
            '<button type="button" class="btn js-edit-entry" data-entry-id="' + item.id + '" style="font-size: 10px; padding: 4px 8px; background: transparent; border-color: #333;">MOD_LOG</button>' +
            '<button type="button" class="btn btn-danger js-remove-entry" data-entry-id="' + item.id + '" style="font-size: 10px; padding: 4px 8px; margin-left: 5px;">DEL_NODE</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</article>'
  );
}

async function fetchGameForEntry(item) {
  try {
    return await fetchGameById(item.gameId);
  } catch (e) {
    console.warn("Game fetch failed", item.gameId, e);
    return null;
  }
}

function renderCabinet(gridEl, countEl, items, gamesById) {
  countEl.textContent = String(items.length);
  if (!items.length) {
    gridEl.innerHTML = `
      <div class="empty-watchlist-box mechanical-panel" style="grid-column: 1 / -1; padding: 60px; text-align: center; background: rgba(255,60,0,0.02);">
          <div class="diag-label" style="font-size: 14px; margin-bottom: 20px; color: var(--accent);">EMPTY_ARCHIVE_MANIFEST</div>
          <p style="font-size: 12px; color: #666; margin-bottom: 30px; max-width: 400px; margin-inline: auto;">
              Your local system has no active node entries. Sync data from the central catalog or manually inject a new node ID to begin tracking.
          </p>
          <a class="btn btn-primary" href="index.html" style="font-weight: 900; padding: 15px 40px;">OPEN_CATALOG_SYNC</a>
      </div>
    `;
    return;
  }
  gridEl.innerHTML = items
    .map(function (item) {
      return buildCabinetCard(item, gamesById[item.gameId] || null);
    })
    .join("");
}

async function refreshCabinetView() {
  const grid = document.getElementById("cabinetGrid");
  const countEl = document.getElementById("cabinetCount");
  const statusEl = document.getElementById("cabinetStatus");
  if (!grid || !countEl) {
    return;
  }

  initConfig();
  const items = getWatchlist();
  
  // Initial render with placeholders
  renderCabinet(grid, countEl, items, {});
  
  if (items.length > 0) {
      statusEl.textContent = "HYDRATING_METADATA_NODES...";
      const gamesById = {};
      
      // Load one by one for better UX
      for (const item of items) {
          try {
              const g = await fetchGameById(item.gameId);
              if (g) {
                  gamesById[item.gameId] = g;
                  // Re-render as each node hydrates
                  renderCabinet(grid, countEl, items, gamesById);
              }
          } catch (e) {
              console.warn("Node hydration failed:", item.gameId);
          }
      }
      statusEl.textContent = "SYNCHRONIZATION_COMPLETE.";
      setTimeout(() => { if (statusEl.textContent.includes("COMPLETE")) statusEl.textContent = ""; }, 3000);
  }
}

function bindCabinetEvents() {
  const grid = document.getElementById("cabinetGrid");
  if (!grid || cabinetListenersBound) {
    return;
  }
  cabinetListenersBound = true;

  grid.addEventListener("click", function (event) {
    const del = event.target.closest(".js-remove-entry");
    if (del) {
      const id = del.getAttribute("data-entry-id");
      if (confirm("Remove this entry from your watchlist?")) {
        removeWatchlistById(id);
        refreshCabinetView();
      }
      return;
    }

    const editBtn = event.target.closest(".js-edit-entry");
    if (editBtn) {
      const id = editBtn.getAttribute("data-entry-id");
      const item = getWatchlist().find(function (x) {
        return x.id === id;
      });
      if (!item) {
        return;
      }
      const nextNote = window.prompt("TECHNICAL_LOG_ENTRY", item.note || "");
      if (nextNote === null) {
        return;
      }
      const nextPriority = window.prompt(
        "PRIORITY_OVERRIDE: LOW / MEDIUM / HIGH",
        item.priority || "medium"
      );
      if (nextPriority === null) {
        return;
      }
      const p = String(nextPriority).trim().toLowerCase();
      if (p !== "low" && p !== "medium" && p !== "high") {
        window.alert("INVALID_PROTOCOL: Must be LOW, MEDIUM, or HIGH.");
        return;
      }
      updateWatchlistItem(id, { note: nextNote.trim(), priority: p });
      refreshCabinetView();
    }
  });

  grid.addEventListener("change", function (event) {
    const input = event.target.closest(".js-toggle-pause");
    if (!input) {
      return;
    }
    const id = input.getAttribute("data-entry-id");
    const item = getWatchlist().find(function (x) {
      return x.id === id;
    });
    if (!item) {
      return;
    }
    const shouldPause = input.checked;
    updateWatchlistItem(id, { paused: shouldPause });
    refreshCabinetView();
  });
}

function initCabinetPage() {
  bindCabinetEvents();
  refreshCabinetView();

  const timeEl = document.getElementById("sysTime");
  const logEl = document.getElementById("sysLogs");

  if (timeEl) {
    setInterval(() => {
      const now = new Date();
      timeEl.textContent = now.getHours().toString().padStart(2, '0') + ":" +
                           now.getMinutes().toString().padStart(2, '0') + ":" +
                           now.getSeconds().toString().padStart(2, '0');
    }, 1000);
  }

  if (logEl) {
    setInterval(() => {
        const hex = Math.floor(Math.random() * 65535).toString(16).toUpperCase();
        const msg = ["[HANDSHAKE]", "[SYNC]", "[PING]", "[INDEXING]"][Math.floor(Math.random() * 4)];
        const div = document.createElement("div");
        div.textContent = `[0x${hex}] ${msg}_NODE_STABLE`;
        logEl.prepend(div);
        if (logEl.children.length > 20) logEl.lastElementChild.remove();
    }, 2000);
  }
}

document.addEventListener("DOMContentLoaded", initCabinetPage);
