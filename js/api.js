/**
 * Game Data Engine V4: Hybrid Resilience
 * Sources: FreeToGame (Base) + Steam Store Search (Discovery)
 * No Key Required // High Compatibility
 */

let cachedGames = [];
let allGamesLoaded = false;
let isFetchingList = false;
let currentSource = "ftg"; 
let steamPage = 0;

const MOCK_GAMES = [
  { id: "101", title: "Counter-Strike 2", thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg", rating: 88, genre: "Action, FPS", developer: "Valve" },
  { id: "102", title: "Dota 2", thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/570/header.jpg", rating: 82, genre: "MOBA", developer: "Valve" },
  { id: "103", title: "PUBG: BATTLEGROUNDS", thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/578080/header.jpg", rating: 75, genre: "Battle Royale", developer: "KRAFTON" },
  { id: "104", title: "Apex Legends", thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/1172470/header.jpg", rating: 85, genre: "Action, FPS", developer: "Respawn" },
  { id: "105", title: "ELDEN RING", thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg", rating: 96, genre: "RPG, Soulslike", developer: "FromSoftware" },
  { id: "106", title: "Cyberpunk 2077", thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg", rating: 86, genre: "RPG, Sci-Fi", developer: "CD PROJEKT RED" }
];

function normalizeGame(g) {
  const strId = String(g.id || g.appid);
  const rating = g.metacritic || g.rating || (75 + (Number(strId) % 20));
  
  return {
    id: strId,
    gameIdStr: strId,
    title: g.title || g.name || "Unknown Asset",
    thumbnail: g.thumbnail || g.background_image || g.tiny_image || `https://cdn.akamai.steamstatic.com/steam/apps/${strId}/header.jpg`,
    shortDescription: "Status: SYNCHRONIZED // Node_Index: " + strId,
    genre: g.genre || "General",
    developer: g.developer || "System_Provider",
    platform: "PC / HUD",
    releaseDate: g.release_date || "2024-01-01",
    raw: g,
    price: rating > 90 ? "PREMIUM_TIER" : "STANDARD_ENTRY",
    priceNum: rating > 90 ? 1999 : 0,
    ccu: Math.floor(Math.random() * 50000),
    owners: "1.2M+",
    rating: rating
  };
}

/**
 * AllOrigins JSONP Fallback (Bypasses CORS/DNS issues for Steam)
 */
function fetchJsonp(targetUrl) {
    return new Promise((resolve, reject) => {
        const callbackName = 'gs_cb_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const script = document.createElement('script');
        const timeout = setTimeout(() => {
            delete window[callbackName];
            if (script.parentNode) script.parentNode.removeChild(script);
            reject(new Error("HANDSHAKE_TIMEOUT"));
        }, 15000);

        window[callbackName] = function(data) {
            clearTimeout(timeout);
            delete window[callbackName];
            if (script.parentNode) script.parentNode.removeChild(script);
            resolve(data.contents ? JSON.parse(data.contents) : data);
        };

        const finalUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&callback=${callbackName}`;
        script.src = finalUrl;
        script.onerror = () => {
            clearTimeout(timeout);
            delete window[callbackName];
            if (script.parentNode) script.parentNode.removeChild(script);
            reject(new Error("NETWORK_FAILURE"));
        };
        document.body.appendChild(script);
    });
}

async function fetchNextGamesPage() {
  if (allGamesLoaded || isFetchingList) return cachedGames;
  isFetchingList = true;

  if (cachedGames.length === 0) {
      cachedGames = MOCK_GAMES.map(normalizeGame);
  }

  try {
    if (currentSource === "ftg") {
        const ftgUrl = "https://www.freetogame.com/api/games";
        // FreeToGame is usually fine, but we'll use a direct fetch with proxy backup
        try {
            const resp = await fetch(`https://corsproxy.io/?${encodeURIComponent(ftgUrl)}`);
            if (resp.ok) {
                const data = await resp.json();
                if (Array.isArray(data)) {
                    cachedGames = cachedGames.concat(data.map(normalizeGame));
                    currentSource = "steam";
                }
            } else {
                throw new Error("FTG_PROXY_FAIL");
            }
        } catch (e) {
            currentSource = "steam";
        }
    }

    if (currentSource === "steam") {
        // Use Steam Store Search for infinite discovery
        const term = ["action", "rpg", "strategy", "mmo", "puzzle"][steamPage % 5];
        const steamUrl = `https://store.steampowered.com/api/storesearch/?term=${term}&l=english&cc=US&start=${steamPage * 20}`;
        const data = await fetchJsonp(steamUrl);
        
        if (data && data.items) {
           const existingIds = new Set(cachedGames.map(cg => cg.id));
           const list = data.items.map(normalizeGame).filter(ng => !existingIds.has(ng.id));
           cachedGames = cachedGames.concat(list);
           steamPage++;
           if (steamPage > 50) allGamesLoaded = true;
        }
    }
  } catch (err) {
    console.warn("[API] Data stream interruption. Resuming from cache.", err.message);
  } finally {
    isFetchingList = false;
  }
  
  return cachedGames;
}

function startBackgroundHydration(targetLimit = 5000) {
    const hydrateInterval = setInterval(async () => {
        if (cachedGames.length >= targetLimit || allGamesLoaded) {
            clearInterval(hydrateInterval);
            return;
        }
        if (!isFetchingList) {
            await fetchNextGamesPage();
            window.dispatchEvent(new CustomEvent("archive_updated", { detail: cachedGames.length }));
        }
    }, 4000);
}

async function searchGamesOnline(term) {
    if (!term || term.length < 2) return [];
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US`;
    try {
        const data = await fetchJsonp(url);
        if (data && data.items) return data.items.map(normalizeGame);
    } catch (e) {
        console.warn("[API] Discovery search failed.");
    }
    return [];
}

let hydrationPromise = null;

async function fetchGameById(id) {
    const strId = String(id);
    
    // 1. Try immediate cache
    let cached = cachedGames.find(g => String(g.id) === strId);
    if (cached) return cached;
    
    // 2. If cache is empty or item missing, try one hydration cycle
    if (cachedGames.length === 0) {
        if (!hydrationPromise) {
            console.log("[API] Cache empty. Triggering background hydration...");
            hydrationPromise = fetchNextGamesPage();
        }
        await hydrationPromise;
        cached = cachedGames.find(g => String(g.id) === strId);
        if (cached) return cached;
    }
    
    // 3. Fallback to basic placeholder
    return normalizeGame({ id: id, title: "Node_Ref_" + id, developer: "System_Provider", genre: "General" });
}

async function loadCatalogGames() {
  return fetchNextGamesPage();
}

function filterCatalogGames(games, filters) {
  const search = (filters.search || "").trim().toLowerCase();
  const sort = filters.sort || "title";
  let list = games.slice();

  if (search) {
    list = list.filter(g => (g.title || "").toLowerCase().includes(search));
  }

  if (sort === "release") {
    list.sort((a, b) => b.id - a.id); // Mock release sort via ID
  } else {
    list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  }
  return list;
}

function collectUniqueMetadata(games, field) {
  const set = {};
  games.forEach(g => { if (g[field]) set[g[field]] = true; });
  return Object.keys(set).sort();
}

function collectUniqueDevelopers(games) {
  return collectUniqueMetadata(games, 'developer');
}
