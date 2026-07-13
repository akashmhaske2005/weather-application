/* ==========================================
   Storage Configuration
========================================== */

const STORAGE_KEY = "recentSearches";
const MAX_SEARCHES = 5;

/* ==========================================
   Get Recent Searches
========================================== */

export function getRecentSearches() {

    try {
        return JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        ) || [];
    } catch {
        // Corrupted storage — reset gracefully
        localStorage.removeItem(STORAGE_KEY);
        return [];
    }

}

/* ==========================================
   Save Recent Search
========================================== */

export function saveRecentSearch(city) {

    let searches = getRecentSearches();

    city = city.trim();

    searches = searches.filter(
        item => item.toLowerCase() !== city.toLowerCase()
    );

    searches.unshift(city);

    searches = searches.slice(0, MAX_SEARCHES);

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(searches)
    );

    return searches;

}

/* ==========================================
   Clear Recent Searches
========================================== */

export function clearRecentSearches() {

    localStorage.removeItem(STORAGE_KEY);

    return [];

}

/* ==========================================
   Save / Load Unit Preference (°C or °F)
========================================== */

const UNIT_KEY = "wx_unit";

export function saveUnit(unit) {
    localStorage.setItem(UNIT_KEY, unit);
}

export function loadUnit() {
    const saved = localStorage.getItem(UNIT_KEY);
    return saved === "imperial" ? "imperial" : "metric"; // default metric
}