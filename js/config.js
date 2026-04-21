/**
 * RAWG API key required (https://rawg.io/apidocs).
 * Get your FREE key and paste it below.
 */
const RAWG_API_KEY = "6ef67e23a4b6480b85350965c40bc973"; // Replace with your personal key

const CONFIG = {
  rawgApiKey: "",
};

function initConfig() {
  CONFIG.rawgApiKey = typeof RAWG_API_KEY === "string" ? RAWG_API_KEY.trim() : "";
}
