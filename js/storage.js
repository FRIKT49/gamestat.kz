// Watchlist: массив объектов в localStorage; id записи — UUID/Date.now (см. generateWatchlistItemId).
const WATCHLIST_STORAGE_KEY = "gamestat_watchlist_v1";

function getWatchlist() {
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveWatchlist(items) {
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
}

function generateWatchlistItemId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

function isGameInWatchlist(gameId) {
  return getWatchlist().some(function (item) {
    return item.gameId === gameId;
  });
}

function addWatchlistEntry(entry) {
  const list = getWatchlist();
  list.push(entry);
  saveWatchlist(list);
}

function removeWatchlistById(id) {
  const list = getWatchlist().filter(function (item) {
    return item.id !== id;
  });
  saveWatchlist(list);
}

function updateWatchlistItem(id, patch) {
  const list = getWatchlist();
  const next = list.map(function (item) {
    if (item.id !== id) {
      return item;
    }
    return Object.assign({}, item, patch);
  });
  saveWatchlist(next);
}
