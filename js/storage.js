/* ==========================================
   Storage Configuration
========================================== */

const STORAGE_KEY = "recentSearches";
const MAX_SEARCHES = 5;

/* ==========================================
   Get Recent Searches
========================================== */

export function getRecentSearches() {

    return JSON.parse(
        localStorage.getItem(STORAGE_KEY)
    ) || [];

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