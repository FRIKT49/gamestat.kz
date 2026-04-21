/**
 * Catalog page: load games from API, search, filters, quick add to watchlist.
 */

function buildCatalogCard(game) {
  const inList = isGameInWatchlist(game.id);
  const metaParts = [
    escapeHtml(game.genre || "—"),
    escapeHtml(game.developer || "—")
  ];
  if (game.releaseDate) {
    metaParts.push(escapeHtml(game.releaseDate));
  }

  return (
    '<article class="game-card" data-game-id="' + game.id + '">' +
      '<div class="card-media">' +
        (game.thumbnail
          ? '<img src="' + escapeHtml(game.thumbnail) + '" alt="" loading="lazy" width="400" height="225" />'
          : '<div class="card-media-fallback">No image</div>') +
      "</div>" +
      '<div class="card-body">' +
        '<p class="card-meta">' + metaParts.join(" // ") + "</p>" +
        '<h3 class="card-title">' + escapeHtml(game.title) + "</h3>" +
        '<p class="card-desc">' +
          escapeHtml(truncateText(game.shortDescription, 160)) +
        "</p>" +
        (game.rating ? 
          '<div class="card-rating" aria-label="Rating ' + game.rating + '%">' +
             game.rating + '%' +
          '</div>'
        : '') +
        '<div class="card-actions">' +
          (inList
            ? '<span class="badge">Stored in list</span>'
            : '<button type="button" class="btn btn-primary js-add-watch" data-game-id="' +
              game.id +
              '">Add to Watchlist</button>' +
              '<a class="btn" href="form.html?gameId=' +
              encodeURIComponent(String(game.id)) +
              '">Add with Note</a>') +
        "</div>" +
      "</div>" +
    "</article>"
  );
}

let allGames = [];

let currentFilteredGames = [];
let itemsToRender = 0;
const ITEMS_PER_PAGE = 20;

function updateSentinel() {
  const sentinel = document.getElementById("scrollSentinel");
  if (sentinel) {
    sentinel.style.display = "block"; // Always attempt to observe, to trigger API fetch if needed
  }
}

function renderCatalogFirstChunk(gridEl) {
  const sentinel = document.getElementById("scrollSentinel");
  
  if (!currentFilteredGames.length) {
    gridEl.innerHTML = '<p class="empty-hint">No data found matching current parameters.</p>';
    if (sentinel) sentinel.style.display = "none";
    return;
  }
  
  itemsToRender = 0;
  const chunk = currentFilteredGames.slice(0, ITEMS_PER_PAGE);
  gridEl.innerHTML = chunk.map(buildCatalogCard).join("");
  itemsToRender += ITEMS_PER_PAGE;
  
  updateSentinel();
}

function loadMoreItems() {
  const grid = document.getElementById("catalogGrid");
  if (!grid) return;
  
  if (itemsToRender < currentFilteredGames.length) {
    // We have more filtered items locally, just render the next chunk
    const chunk = currentFilteredGames.slice(itemsToRender, itemsToRender + ITEMS_PER_PAGE);
    grid.insertAdjacentHTML("beforeend", chunk.map(buildCatalogCard).join(""));
    itemsToRender += ITEMS_PER_PAGE;
    updateSentinel();
  } else {
    // Reached the end of local filtered data, fetch next page from API
    if (typeof fetchNextGamesPage === "function") {
       const statusEl = document.getElementById("catalogStatus");
       if (statusEl) statusEl.textContent = "SYNCING_NEXT_API_CHUNK...";
       
       fetchNextGamesPage().then(function(newAllGames) {
          allGames = newAllGames; // update local store with newly fetched data
          if (statusEl) statusEl.textContent = "";
          
          // Apply current filters to the now larger dataset
          const state = getFilterState();
          currentFilteredGames = filterCatalogGames(allGames, state);
          
          if (itemsToRender < currentFilteredGames.length) {
             const chunk = currentFilteredGames.slice(itemsToRender, itemsToRender + ITEMS_PER_PAGE);
             grid.insertAdjacentHTML("beforeend", chunk.map(buildCatalogCard).join(""));
             itemsToRender += ITEMS_PER_PAGE;
          } else {
             // If after filtering we still have nothing new to render, the sentinel will eventually trigger again
          }
          
          updateSentinel();
       }).catch(function(err) {
          console.error("API error", err);
       });
    }
  }
}

function getFilterState() {
  const searchEl = document.getElementById("catalogSearch");
  const sortEl = document.getElementById("filterSort");
  
  const selectedDevs = Array.from(document.querySelectorAll('.filter-dev:checked')).map(cb => cb.value);

  return {
    search: searchEl ? searchEl.value : "",
    sort: sortEl ? sortEl.value : "release",
    developers: selectedDevs
  };
}

function applyFiltersAndRender(gamesData) {
  const grid = document.getElementById("catalogGrid");
  if (!grid) {
    return;
  }
  const state = getFilterState();
  var query = (state.search || "").trim();
  currentFilteredGames = filterCatalogGames(gamesData, state);
  
  // If no results and we have a search query, try DEEP SEARCH
  if (currentFilteredGames.length === 0 && query.length > 2) {
      grid.innerHTML = '<div class="status-line">Deep searching global database...</div>';
      searchGamesOnline(query).then(function(onlineResults) {
          if (onlineResults.length > 0) {
              // Merge into main data but keep current view focused on results
              onlineResults.forEach(og => {
                  if (!gamesData.find(g => g.id === og.id)) gamesData.push(og);
              });
              currentFilteredGames = onlineResults;
              renderCatalogFirstChunk(grid);
          } else {
              grid.innerHTML = '<div class="empty-hint">No results found in global database.</div>';
          }
      }).catch(function() {
          grid.innerHTML = '<div class="empty-hint">System Error // Search Failed.</div>';
      });
      return; // Exit early as we are handling it in the promise
  }

  renderCatalogFirstChunk(grid);
}

function buildCheckboxList(containerEl, items, typeClass) {
  containerEl.innerHTML = items.map(function(item) {
    return (
      '<label class="checkbox-item">' +
        '<input type="checkbox" class="' + typeClass + '" value="' + escapeHtml(item) + '" />' +
        '<span>' + escapeHtml(item) + '</span>' +
      '</label>'
    );
  }).join("");
}

function initCatalogPage() {
  const grid = document.getElementById("catalogGrid");
  const statusEl = document.getElementById("catalogStatus");
  const searchEl = document.getElementById("catalogSearch");

  if (!grid) {
    return;
  }

  initConfig();

  statusEl.textContent = "Loading catalog from API…";

    loadCatalogGames()
    .then(function (games) {
      console.log("[UI] API loaded successfully, games count:", games.length);
      allGames = games; 
      statusEl.textContent = "";
      
      const devContainer = document.getElementById("filterDevsContainer");
      if (devContainer) {
        const topDevs = collectUniqueDevelopers(allGames);
        buildCheckboxList(devContainer, topDevs, 'filter-dev');
      }
      
      // Start Background Hydration
      if (typeof startBackgroundHydration === "function") {
          startBackgroundHydration(8000);
          window.addEventListener("archive_updated", function(e) {
              const counter = document.getElementById("indexingCounter");
              if (counter) {
                  counter.textContent = "INDEXING_ARCHIVE: " + e.detail + " NODES";
                  counter.classList.add("is-updating");
                  setTimeout(() => counter.classList.remove("is-updating"), 200);
              }
              // If we are showing "All" games, we might want to update the view
              const state = getFilterState();
              if (!state.search && state.developers.length === 0) {
                  allGames = cachedGames;
                  // We don't force re-render here to avoid jumping, but next scroll will have it
              }
          });
      }

      const sentinel = document.getElementById("scrollSentinel");
      if ("IntersectionObserver" in window && sentinel) {
        const observer = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) {
            loadMoreItems();
          }
        }, { rootMargin: "600px" }); // Higher threshold for smoother bursts
        observer.observe(sentinel);
      }
      
      console.log("[UI] Rendering initial chunk...");
      applyFiltersAndRender(allGames);

      const applyBtn = document.getElementById("applyFiltersBtn");
      if (applyBtn) {
        applyBtn.addEventListener("click", function() { 
          console.log("[UI] Apply filters clicked");
          applyFiltersAndRender(allGames); 
        });
      }
      const resetBtn = document.getElementById("resetFilters");
      if (resetBtn) {
        resetBtn.addEventListener("click", function() {
          if (searchEl) searchEl.value = "";
          
          const hiddenSort = document.getElementById("filterSort");
          if (hiddenSort) {
              hiddenSort.value = "release";
              const sortTrigger = document.querySelector("#sortSelect .tech-select-trigger");
              if (sortTrigger) sortTrigger.textContent = "NEWEST_FIRST";
              document.querySelectorAll("#sortSelect .tech-select-item").forEach(i => {
                i.classList.toggle("is-selected", i.getAttribute("data-value") === "release");
              });
          }

          document.querySelectorAll('.filter-dev').forEach(function(cb) { cb.checked = false; });
          applyFiltersAndRender(allGames);
        });
      }

      initTechSelects(() => applyFiltersAndRender(allGames));

      if (searchEl) {
        searchEl.addEventListener("input", debounce(function () {
          applyFiltersAndRender(allGames);
        }, 400));
      }

      grid.addEventListener("click", function (event) {
        const btn = event.target.closest(".js-add-watch");
        if (!btn) return;
        const gameId = btn.getAttribute("data-game-id");
        if (isGameInWatchlist(gameId)) return;
        addWatchlistEntry({
          id: generateWatchlistItemId(),
          gameId: gameId,
          note: "",
          priority: "medium",
          paused: false,
          addedAt: new Date().toISOString(),
        });
        applyFiltersAndRender(allGames);
      });
    })
    .catch(function (err) {
      console.error("[UI] Critical catalog failure:", err);
      statusEl.textContent = ""; 
      grid.innerHTML = '<p class="empty-hint">ARCHIVE_ACCESS_DENIED. CHECK_NETWORK_PROTOCOL.</p>';
    });
}

document.addEventListener("DOMContentLoaded", initCatalogPage);
