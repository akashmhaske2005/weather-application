/* ==========================================
   Import Modules
========================================== */

import {
    getCurrentWeather,
    getWeatherByCoords,
    getForecast,
    getCitySuggestions
} from "./api.js";

import {
    updateCurrentWeather,
    updateForecast,
    updateRecentSearches,
    updateSuggestions,
    clearSuggestions,
    updateBackground,
    showError
} from "./ui.js";

import {
    saveRecentSearch,
    getRecentSearches
} from "./storage.js";

import { getCityBackground } from "./image.js";

/* ==========================================
   Cache DOM Elements
========================================== */

const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-btn");
const locationButton = document.querySelector(".location-btn");

const searchHistory = document.getElementById("search-history");
const suggestions = document.getElementById("suggestions");

/* ==========================================
   Default City
========================================== */

const DEFAULT_CITY = "Pune";

let isLoading = false;
let debounceTimer;

/* ==========================================
   Process Weather Request
========================================== */

async function handleWeatherRequest(weatherPromise, errorMessage) {

    if (isLoading) return;

    isLoading = true;

    try {

        // Current Weather
        const weatherData = await weatherPromise;

        updateCurrentWeather(weatherData);

        //Background Image
        const imageUrl = await getCityBackground(

            weatherData.name,

            weatherData.sys.country

        );

        updateBackground(imageUrl);

        // Forecast
        const forecastData = await getForecast(weatherData.name);

        updateForecast(forecastData);

        // Recent Searches
        const searches = saveRecentSearch(weatherData.name);

        updateRecentSearches(searches);

        // Clear Search UI
        clearSuggestions();
        searchInput.value = "";

    } catch (error) {

        console.error(error);

        showError(errorMessage);

    } finally {

        isLoading = false;

    }

}

/* ==========================================
   Load Weather By City
========================================== */

async function loadWeather(city) {

    if (!city.trim()) return;

    await handleWeatherRequest(
        getCurrentWeather(city),
        "City not found. Please try another city."
    );

}

/* ==========================================
   Load Weather By Coordinates
========================================== */

async function loadWeatherByLocation(lat, lon) {

    await handleWeatherRequest(
        getWeatherByCoords(lat, lon),
        "Unable to fetch weather for your location."
    );

}

/* ==========================================
   Load City Suggestions
========================================== */

async function loadSuggestions(query) {

    if (query.length < 2) {

        clearSuggestions();
        return;

    }

    try {

        const cities = await getCitySuggestions(query);

        updateSuggestions(cities);

    } catch (error) {

        console.error(error);

    }

}

/* ==========================================
   Get User Location
========================================== */

function requestLocation() {

    if (!navigator.geolocation) {

        loadWeather(DEFAULT_CITY);
        return;

    }

    navigator.geolocation.getCurrentPosition(

        (position) => {

            const { latitude, longitude } = position.coords;

            loadWeatherByLocation(latitude, longitude);

        },

        () => {

            loadWeather(DEFAULT_CITY);

        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }

    );

}

/* ==========================================
   Search Button
========================================== */

searchButton.addEventListener("click", () => {

    loadWeather(searchInput.value.trim());

});

/* ==========================================
   Enter Key Search
========================================== */

searchInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

        loadWeather(searchInput.value.trim());

    }

});

/* ==========================================
   Autocomplete
========================================== */

searchInput.addEventListener("input", () => {

    clearTimeout(debounceTimer);

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

    searchInput.value =
        item.querySelector("span").textContent;

    clearSuggestions();

    loadWeatherByLocation(lat, lon);

});

/* ==========================================
   Hide Suggestions
========================================== */

document.addEventListener("click", (event) => {

    if (!event.target.closest(".search-box")) {

        clearSuggestions();

    }

});

/* ==========================================
   Current Location
========================================== */

locationButton.addEventListener("click", requestLocation);

/* ==========================================
   Initial Load
========================================== */

window.addEventListener("DOMContentLoaded", () => {

    updateRecentSearches(getRecentSearches());

    requestLocation();

});

/* ==========================================
   Search History
========================================== */

searchHistory.addEventListener("click", (event) => {

    const city = event.target.dataset.city;

    if (!city) return;

    loadWeather(city);

});