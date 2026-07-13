/* ==========================================
   Import Modules
========================================== */

import {
    getCurrentWeather,
    getWeatherByCoords,
    getForecastByCoords,
    getCitySuggestions
} from "./api.js";

import {
    updateCurrentWeather,
    updateForecast,
    updateHourlyForecast,
    updateRecentSearches,
    updateSuggestions,
    clearSuggestions,
    updateBackground,
    showLoading,
    hideLoading,
    showError,
    showPermissionDeniedToast,
    hidePermissionCard,
    showPermissionDenied,
    showPermissionWaiting,
    setWeatherBodyClass
} from "./ui.js";

import {
    saveRecentSearch,
    getRecentSearches,
    clearRecentSearches,
    saveUnit,
    loadUnit
} from "./storage.js";

import { getCityBackground } from "./image.js";

import { setWeatherAnimation } from "./weather-animation.js";

/* ==========================================
   Cache DOM Elements
========================================== */

const searchInput     = document.getElementById("search-input");
const searchButton    = document.getElementById("search-btn");
const locationButton  = document.querySelector(".location-btn");
const unitToggle      = document.getElementById("unit-toggle");
const clearHistoryBtn = document.getElementById("clear-history-btn");

const searchHistory = document.getElementById("search-history");
const suggestions   = document.getElementById("suggestions");

/* ==========================================
   Default City, Unit State & Flags
========================================== */

const DEFAULT_CITY = "Pune";

let isLoading = false;
let debounceTimer;

// Persisted unit preference ("metric" = °C, "imperial" = °F)
let currentUnit = loadUnit();

// Last fetched coords for unit-toggle re-fetch
let lastCoords = null;

// True once weather has loaded successfully for the first time
let hasWeatherData = false;

// Suggestion keyboard nav state
let activeSuggestionIndex = -1;

/* ---- Sync toggle label with persisted unit ---- */
unitToggle.textContent = currentUnit === "metric" ? "\u00b0F" : "\u00b0C";

/* ==========================================
   Process Weather Request
========================================== */

async function handleWeatherRequest(weatherPromise, forecastPromise, errorMessage) {

    if (isLoading) return;

    isLoading = true;
    showLoading();

    let loadDefaultAfter = false;

    try {

        const weatherData = await weatherPromise;

        updateCurrentWeather(weatherData, currentUnit);

        hasWeatherData = true;

        lastCoords = {
            lat: weatherData.coord.lat,
            lon: weatherData.coord.lon
        };

        // Set weather condition body class + canvas animation
        const weatherCode = weatherData.weather[0].id;
        setWeatherBodyClass(weatherCode);
        setWeatherAnimation(weatherCode);

        const resolvedForecastPromise = forecastPromise ||
            getForecastByCoords(lastCoords.lat, lastCoords.lon, currentUnit);

        const imagePromise = getCityBackground(
            weatherData.name,
            weatherData.sys.country
        );

        const forecastData = await resolvedForecastPromise;

        updateForecast(forecastData, currentUnit);

        // Hourly forecast (uses city timezone for correct local times)
        updateHourlyForecast(forecastData, currentUnit, weatherData.timezone);

        imagePromise
            .then(updateBackground)
            .catch(() => { });

        const searches = saveRecentSearch(weatherData.name);
        updateRecentSearches(searches);

        clearSuggestions();
        activeSuggestionIndex = -1;
        searchInput.value = "";

    } catch (error) {

        console.error(error);

        if (!hasWeatherData) {
            loadDefaultAfter = true;
        } else {
            showError(errorMessage);
        }

    } finally {

        hideLoading();
        isLoading = false;

    }

    // Run AFTER isLoading = false so handleWeatherRequest can re-enter
    if (loadDefaultAfter) {
        loadWeather(DEFAULT_CITY);
    }

}

/* ==========================================
   Load Weather By City
========================================== */

async function loadWeather(city) {

    if (!city.trim()) return;

    await handleWeatherRequest(
        getCurrentWeather(city, currentUnit),
        null,
        "City not found. Please try another city."
    );

}

/* ==========================================
   Load Weather By Coordinates
========================================== */

async function loadWeatherByLocation(lat, lon) {

    await handleWeatherRequest(
        getWeatherByCoords(lat, lon, currentUnit),
        getForecastByCoords(lat, lon, currentUnit),
        "Unable to fetch weather for your location."
    );

}

/* ==========================================
   Load City Suggestions
========================================== */

async function loadSuggestions(query) {

    if (query.length < 2) {
        clearSuggestions();
        activeSuggestionIndex = -1;
        return;
    }

    try {

        const cities = await getCitySuggestions(query);
        updateSuggestions(cities);
        activeSuggestionIndex = -1;

    } catch (error) {

        console.error(error);

    }

}

/* ==========================================
   Request User Location
========================================== */

async function requestLocation() {

    const permission = await navigator.permissions.query({
        name: "geolocation"
    });

    if (permission.state === "denied") {

        if (hasWeatherData) {
            showPermissionDeniedToast();
        } else {
            showPermissionDenied();
            loadWeather(DEFAULT_CITY);
        }
        return;

    }

    const showCard = permission.state === "prompt" && !hasWeatherData;
    if (showCard) showPermissionWaiting();

    navigator.geolocation.getCurrentPosition(

        position => {
            hidePermissionCard();
            loadWeatherByLocation(
                position.coords.latitude,
                position.coords.longitude
            );
        },

        error => {
            hidePermissionCard();
            if (error.code === error.PERMISSION_DENIED) {
                if (hasWeatherData) showPermissionDeniedToast();
                else { showPermissionDenied(); loadWeather(DEFAULT_CITY); }
            } else {
                if (!hasWeatherData) loadWeather(DEFAULT_CITY);
            }
        },

        { timeout: 10000 }

    );

}

/* ==========================================
   Check Location Permission on Page Load
========================================== */

async function checkLocationPermission() {

    if (!navigator.permissions) {
        loadWeather(DEFAULT_CITY);
        return;
    }

    const permission = await navigator.permissions.query({
        name: "geolocation"
    });

    if (permission.state === "granted") {
        hidePermissionCard();
        requestLocation();
    } else if (permission.state === "prompt") {
        requestLocation();
    } else {
        showPermissionDenied();
        loadWeather(DEFAULT_CITY);
    }

    permission.onchange = () => {

        if (permission.state === "granted") {
            hidePermissionCard();
            requestLocation();
        } else if (permission.state === "denied") {
            if (hasWeatherData) showPermissionDeniedToast();
            else { showPermissionDenied(); loadWeather(DEFAULT_CITY); }
        }
        // "prompt" (after settings reset) — wait for user to click location button

    };

}

/* ==========================================
   Helpers — Suggestion Keyboard Navigation
========================================== */

function getSuggestionItems() {
    return [...suggestions.querySelectorAll(".suggestion-item")];
}

function setActiveSuggestion(items, index) {
    items.forEach(item => item.classList.remove("keyboard-active"));
    if (index >= 0 && items[index]) {
        items[index].classList.add("keyboard-active");
        items[index].scrollIntoView({ block: "nearest" });
    }
}

/* ==========================================
   Unit Toggle (°C / °F)
========================================== */

unitToggle.addEventListener("click", async () => {

    if (isLoading) return;

    currentUnit = currentUnit === "metric" ? "imperial" : "metric";

    // Button shows what you'll switch TO next time
    unitToggle.textContent = currentUnit === "metric" ? "\u00b0F" : "\u00b0C";

    // Persist preference
    saveUnit(currentUnit);

    // Flip animation
    unitToggle.classList.remove("flipping");
    void unitToggle.offsetWidth;
    unitToggle.classList.add("flipping");

    if (lastCoords) {
        await loadWeatherByLocation(lastCoords.lat, lastCoords.lon);
    }

});

/* ==========================================
   Search Button
========================================== */

searchButton.addEventListener("click", () => {

    hidePermissionCard();
    clearSuggestions();
    activeSuggestionIndex = -1;
    loadWeather(searchInput.value.trim());

});

/* ==========================================
   Keyboard Handler — Search + Suggestion Nav
========================================== */

searchInput.addEventListener("keydown", (event) => {

    const items = getSuggestionItems();
    const hasSuggestions = items.length > 0;

    switch (event.key) {

        case "ArrowDown":
            if (!hasSuggestions) return;
            event.preventDefault();
            activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, items.length - 1);
            setActiveSuggestion(items, activeSuggestionIndex);
            break;

        case "ArrowUp":
            if (!hasSuggestions) return;
            event.preventDefault();
            activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, -1);
            setActiveSuggestion(items, activeSuggestionIndex);
            break;

        case "Escape":
            clearSuggestions();
            activeSuggestionIndex = -1;
            break;

        case "Enter": {
            // If a suggestion is keyboard-highlighted, select it
            if (activeSuggestionIndex >= 0 && items[activeSuggestionIndex]) {
                event.preventDefault();
                const item = items[activeSuggestionIndex];
                searchInput.value = item.dataset.cityName || "";
                clearSuggestions();
                activeSuggestionIndex = -1;
                hidePermissionCard();
                loadWeatherByLocation(Number(item.dataset.lat), Number(item.dataset.lon));
            } else {
                // Normal search
                hidePermissionCard();
                loadWeather(searchInput.value.trim());
            }
            break;
        }

    }

});

/* ==========================================
   Autocomplete Input
========================================== */

searchInput.addEventListener("input", () => {

    clearTimeout(debounceTimer);
    activeSuggestionIndex = -1;

    debounceTimer = setTimeout(() => {
        loadSuggestions(searchInput.value.trim());
    }, 300);

});

/* ==========================================
   Suggestion Click
========================================== */

suggestions.addEventListener("click", (event) => {

    const item = event.target.closest(".suggestion-item");
    if (!item) return;

    const lat = Number(item.dataset.lat);
    const lon = Number(item.dataset.lon);

    searchInput.value = item.dataset.cityName || "";

    clearSuggestions();
    activeSuggestionIndex = -1;
    hidePermissionCard();
    loadWeatherByLocation(lat, lon);

});

/* ==========================================
   Hide Suggestions on Outside Click
========================================== */

document.addEventListener("click", (event) => {

    if (!event.target.closest(".search-box")) {
        clearSuggestions();
        activeSuggestionIndex = -1;
    }

});

/* ==========================================
   Current Location Button
========================================== */

locationButton.addEventListener("click", requestLocation);

/* ==========================================
   Clear History Button
========================================== */

clearHistoryBtn.addEventListener("click", () => {

    const searches = clearRecentSearches();
    updateRecentSearches(searches);

});

/* ==========================================
   Initial Load
========================================== */

window.addEventListener("DOMContentLoaded", () => {

    updateRecentSearches(getRecentSearches());
    checkLocationPermission();

    /* Append 🎨 trigger button — panel is lazy-built on first click */
    demoTrigger = document.createElement("button");
    demoTrigger.id = "anim-demo-trigger";
    demoTrigger.title = "Animation Preview (Ctrl+Shift+W)";
    demoTrigger.textContent = "🎨";
    demoTrigger.addEventListener("click", toggleDemoPanel);
    document.body.appendChild(demoTrigger);

});

/* ==========================================
   Search History Click
========================================== */

searchHistory.addEventListener("click", (event) => {

    const city = event.target.dataset.city;
    if (!city) return;

    hidePermissionCard();
    loadWeather(city);

});

/* ==========================================
   Animation Demo Panel
   Preview any weather animation live.
   Open: click 🎨 button (bottom-right) or Ctrl+Shift+W
========================================== */

const DEMO_CONDITIONS = [
    { code: 800,  emoji: "☀️",  label: "Clear"       },
    { code: 801,  emoji: "⛅",  label: "P. Cloudy"   },
    { code: 804,  emoji: "☁️",  label: "Cloudy"      },
    { code: 500,  emoji: "🌧️", label: "Rain"        },
    { code: 300,  emoji: "🌦️", label: "Drizzle"     },
    { code: 200,  emoji: "⛈️", label: "Thunder"     },
    { code: 601,  emoji: "❄️",  label: "Snow"        },
    { code: 741,  emoji: "🌫️", label: "Fog"         },
    { code: 721,  emoji: "🌁",  label: "Haze"        },
];

let demoPanel     = null;
let demoTrigger   = null;
let activeDemoBtn = null;

function buildDemoPanel() {

    /* ---- Panel ---- */
    demoPanel = document.createElement("div");
    demoPanel.id = "anim-demo-panel";
    demoPanel.className = "hidden";

    /* Header row */
    const header = document.createElement("div");
    header.className = "anim-demo-header";

    const title = document.createElement("span");
    title.className = "anim-demo-title";
    title.textContent = "🎨 Animation Preview";

    const closeBtn = document.createElement("button");
    closeBtn.className = "anim-demo-close-btn";
    closeBtn.textContent = "✕";
    closeBtn.title = "Close";
    closeBtn.addEventListener("click", () => demoPanel.classList.add("hidden"));

    header.appendChild(title);
    header.appendChild(closeBtn);
    demoPanel.appendChild(header);

    /* Hint */
    const hint = document.createElement("p");
    hint.className = "anim-demo-hint";
    hint.textContent = "Ctrl+Shift+W to toggle · click a card to preview";
    demoPanel.appendChild(hint);

    /* Grid of condition buttons */
    const grid = document.createElement("div");
    grid.className = "anim-demo-grid";

    DEMO_CONDITIONS.forEach(({ code, emoji, label }) => {
        const btn = document.createElement("button");
        btn.className = "anim-demo-btn";
        btn.dataset.code = code;
        btn.innerHTML = `<span class="demo-emoji">${emoji}</span>${label}`;

        btn.addEventListener("click", () => {
            /* Apply animation + body class */
            setWeatherAnimation(code);
            setWeatherBodyClass(code);

            /* Update active highlight */
            if (activeDemoBtn) activeDemoBtn.classList.remove("active");
            btn.classList.add("active");
            activeDemoBtn = btn;

            /* Update footer label */
            activeLabel.innerHTML = `Previewing: <span>${emoji} ${label}</span>`;
        });

        grid.appendChild(btn);
    });

    demoPanel.appendChild(grid);

    /* Active condition label */
    const activeLabel = document.createElement("div");
    activeLabel.className = "anim-demo-active-label";
    activeLabel.textContent = "Click a card to preview";
    demoPanel.appendChild(activeLabel);

    document.body.appendChild(demoPanel);
}

function toggleDemoPanel() {
    if (!demoPanel) buildDemoPanel();
    demoPanel.classList.toggle("hidden");
}

/* Keyboard shortcut: Ctrl+Shift+W */
document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === "W") {
        event.preventDefault();
        toggleDemoPanel();
    }
});