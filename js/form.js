/**
 * Form page: add watchlist entry by game ID (from API) + note + priority.
 * Validation via JS (no HTML required attributes per coursework).
 */

function validateWatchlistForm(fields) {
  const gameIdRaw = fields.gameId.trim();
  const note = fields.note.trim();
  const priority = fields.priority.trim().toLowerCase();

  if (!gameIdRaw) {
    window.alert("INVALID_INPUT: System_ID required. Reference Catalog for node IDs.");
    return null;
  }

  if (!note) {
    window.alert("LOG_ERROR: Technical_Note required for manual injection.");
    return null;
  }

  if (!priority) {
    window.alert("LEVEL_ERROR: Select Priority_Level.");
    return null;
  }

  if (priority !== "low" && priority !== "medium" && priority !== "high") {
    window.alert("INVALID_LEVEL: Protocol requires LOW, MEDIUM, or HIGH.");
    return null;
  }

  return { gameId: gameIdRaw, note: note, priority: priority };
}

function initFormPage() {
  const form = document.getElementById("watchlistForm");
  if (!form) {
    return;
  }

  initConfig();

  const params = new URLSearchParams(window.location.search);
  const presetId = params.get("gameId");
  const gameIdInput = document.getElementById("fieldGameId");
  if (presetId && gameIdInput) {
    gameIdInput.value = presetId;
  }

  initTechSelects();

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const gameIdInputEl = document.getElementById("fieldGameId");
    const noteEl = document.getElementById("fieldNote");
    const priorityEl = document.getElementById("fieldPriority");

    const payload = validateWatchlistForm({
      gameId: gameIdInputEl ? gameIdInputEl.value : "",
      note: noteEl ? noteEl.value : "",
      priority: priorityEl ? priorityEl.value : "",
    });

    if (!payload) {
      return;
    }

    if (isGameInWatchlist(payload.gameId)) {
      window.alert("DUPLICATE_NODE: Asset already synchronized in local archive.");
      return;
    }

    fetchGameById(payload.gameId)
      .then(function () {
        addWatchlistEntry({
          id: generateWatchlistItemId(),
          gameId: payload.gameId,
          note: payload.note,
          priority: payload.priority,
          paused: false,
          addedAt: new Date().toISOString(),
        });
        window.location.href = "cabinet.html";
      })
      .catch(function () {
        window.alert(
          "NODE_NOT_FOUND: Handshake failed with RAWG archive. Verify System_ID."
        );
      });
  });
}

document.addEventListener("DOMContentLoaded", initFormPage);
