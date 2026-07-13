/* ==========================================
   Utility Functions
========================================== */

import {
    formatDate,
    formatTime,
    capitalize,
    convertVisibility,
    convertWind,
    formatForecastDay,
    formatForecastDate
} from "./utils.js";

/* ==========================================
   Cache DOM Elements
========================================== */

const cityName = document.getElementById("city-name");
const currentDate = document.getElementById("current-date");

const temperature = document.getElementById("temperature");
const feelsLike = document.getElementById("feels-like");

const weatherCondition = document.getElementById("weather-condition");
const weatherIcon = document.getElementById("weather-icon");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");
const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");

/* Forecast */
const forecastContainer = document.getElementById("forecast-container");
const forecastSection   = document.getElementById("forecast-section");  /* Tech debt fixed — using ID */

/* Hourly */
const hourlyContainer = document.getElementById("hourly-container");
const hourlySection = document.getElementById("hourly-section");

const suggestionsContainer = document.getElementById("suggestions");

/* Permission Card */
const permissionCard = document.getElementById("permission-card");

/* Sections that are hidden until first data load */
const weatherInfoEl    = document.querySelector(".weather-info");
const weatherDetailsEl = document.querySelector(".weather-details");
const temperatureWrap  = document.getElementById("temperature-wrap"); /* For rain reflection */

/* ==========================================
   Update Suggestions
   Fix: build display text without template-literal whitespace
========================================== */

export function updateSuggestions(cities) {

    suggestionsContainer.innerHTML = "";

    if (!cities.length) {
        suggestionsContainer.style.display = "none";
        return;
    }

    cities.forEach(city => {

        const item = document.createElement("div");
        item.className = "suggestion-item";
        item.dataset.lat = city.lat;
        item.dataset.lon = city.lon;

        // Build clean display text — no extra whitespace
        const parts = [city.name];
        if (city.state) parts.push(city.state);
        parts.push(city.country);
        const displayText = parts.join(", ");

        // Store just the city name for setting the input value on click
        item.dataset.cityName = city.name;

        // Inline span so textContent has zero leading/trailing whitespace
        item.innerHTML = `<i class="fa-solid fa-location-dot"></i><span>${displayText}</span>`;

        suggestionsContainer.appendChild(item);

    });

    suggestionsContainer.style.display = "block";

}

/* ==========================================
   Clear Suggestions
========================================== */

export function clearSuggestions() {

    suggestionsContainer.innerHTML = "";
    suggestionsContainer.style.display = "none";

}

/* ==========================================
   Update Current Weather
========================================== */

export function updateCurrentWeather(data, unit = "metric") {

    // Make weather sections visible on first data load
    weatherInfoEl.style.visibility    = "visible";
    weatherDetailsEl.style.visibility = "visible";

    cityName.textContent = `${data.name}, ${data.sys.country}`;

    // Use the city's own UTC offset so times are correct worldwide
    const tz = data.timezone;

    currentDate.textContent =
        `${formatDate(data.dt, tz)} \u2022 ${formatTime(data.dt, tz)}`;

    const unitLabel = unit === "metric" ? "\u00b0C" : "\u00b0F";
    const tempVal   = Math.round(data.main.temp);

    temperature.innerHTML = `${tempVal}<span>${unitLabel}</span>`;

    // Set data-temp on the .temperature wrapper for the rain reflection ::after
    if (temperatureWrap) temperatureWrap.dataset.temp = tempVal;

    feelsLike.textContent =
        `${Math.round(data.main.feels_like)}${unitLabel}`;

    weatherCondition.textContent =
        capitalize(data.weather[0].description);

    humidity.textContent   = `${data.main.humidity}%`;
    windSpeed.textContent  = convertWind(data.wind.speed, unit);
    pressure.textContent   = `${data.main.pressure} hPa`;
    visibility.textContent = convertVisibility(data.visibility);
    sunrise.textContent    = formatTime(data.sys.sunrise, tz);
    sunset.textContent     = formatTime(data.sys.sunset, tz);

    // Reset icon before loading new one
    weatherIcon.style.opacity = "0";
    weatherIcon.style.display = "none";
    weatherIcon.src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    weatherIcon.onload = () => {
        weatherIcon.style.display = "block";
        requestAnimationFrame(() => { weatherIcon.style.opacity = "1"; });
    };

    weatherIcon.alt = data.weather[0].description;

    // Trigger page-in reveal animations
    weatherInfoEl.classList.remove("data-loaded");
    weatherDetailsEl.classList.remove("data-loaded");
    void weatherInfoEl.offsetWidth; // force reflow so animation restarts
    weatherInfoEl.classList.add("data-loaded");
    weatherDetailsEl.classList.add("data-loaded");

}

/* ==========================================
   Forecast Icon
========================================== */

function getForecastIcon(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

/* ==========================================
   Update Forecast
========================================== */

export function updateForecast(forecastData, unit = "metric") {

    forecastContainer.innerHTML = "";

    // Make forecast section visible
    if (forecastSection) forecastSection.style.visibility = "visible";

    const dailyForecast = new Map();

    for (const item of forecastData.list) {

        const [date, time] = item.dt_txt.split(" ");

        if (!dailyForecast.has(date)) {
            dailyForecast.set(date, item);
        }

        if (time === "12:00:00") {
            dailyForecast.set(date, item);
        }

    }

    const unitLabel = unit === "metric" ? "°C" : "°F";

    [...dailyForecast.values()]
        .slice(0, 5)
        .forEach((day, index) => {

            const card = document.createElement("div");
            card.className = "forecast-card fade-up";
            card.style.animationDelay = `${index * 0.07}s`;

            card.innerHTML = `
                <div class="forecast-date">
                    <h3>${formatForecastDay(day.dt_txt)}</h3>
                    <p>${formatForecastDate(day.dt_txt)}</p>
                </div>

                <img
                    src="${getForecastIcon(day.weather[0].icon)}"
                    alt="${day.weather[0].description}"
                >

                <div class="forecast-temp">
                    <h4>${Math.round(day.main.temp_max)}${unitLabel}</h4>
                    <span>${Math.round(day.main.temp_min)}${unitLabel}</span>
                </div>
            `;

            forecastContainer.appendChild(card);

        });

}

/* ==========================================
   Update Hourly Forecast (next 24 h)
   timezoneOffset: seconds east of UTC (from OpenWeather `timezone`)
========================================== */

export function updateHourlyForecast(forecastData, unit = "metric", timezoneOffset = 0) {

    if (!hourlyContainer || !hourlySection) return;

    hourlyContainer.innerHTML = "";
    hourlySection.style.visibility = "visible";

    const unitLabel = unit === "metric" ? "\u00b0C" : "\u00b0F";

    // Slice first 8 items = next 24 hours (3-hour intervals)
    forecastData.list.slice(0, 8).forEach((item, index) => {

        const card = document.createElement("div");
        card.className = "hourly-card fade-up" + (index === 0 ? " now" : "");
        card.style.animationDelay = `${index * 0.04}s`;
        card.setAttribute("role", "listitem");

        const timeLabel = index === 0
            ? "Now"
            : formatTime(item.dt, timezoneOffset);

        const desc = capitalize(item.weather[0].description);

        card.innerHTML = `
            <span class="hourly-time">${timeLabel}</span>
            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${desc}" loading="lazy">
            <span class="hourly-temp">${Math.round(item.main.temp)}${unitLabel}</span>
            <span class="hourly-desc">${desc}</span>
        `;

        hourlyContainer.appendChild(card);

    });

}

/* ==========================================
   Update Background Image
========================================== */

const app = document.querySelector(".app");

export function updateBackground(imageUrl) {
    const image = new Image();
    image.onload = () => {

        app.style.opacity = ".92";
        setTimeout(() => {

            app.style.background = `
                linear-gradient(
                    rgba(15,23,42,.55),
                    rgba(15,23,42,.55)
                ),
                url("${imageUrl}")
            `;

            app.style.backgroundSize = "cover";
            app.style.backgroundPosition = "center";
            app.style.backgroundRepeat = "no-repeat";

            app.style.opacity = "1";

        }, 200);

    };

    image.src = imageUrl;
}

/* ==========================================
   Update Recent Searches
========================================== */

const searchHistory = document.getElementById("search-history");

export function updateRecentSearches(searches) {

    searchHistory.innerHTML = "";

    searches.forEach(city => {

        const chip = document.createElement("span");
        chip.className = "history-item";
        chip.textContent = city;
        chip.dataset.city = city;
        searchHistory.appendChild(chip);

    });

}

/* ==========================================
   Show Loading
   - Makes sections visible so skeleton animation shows
   - Resets weather icon inline styles so CSS skeleton can override them
========================================== */

export function showLoading() {

    // Make all weather sections visible (skeleton needs them visible to animate)
    weatherInfoEl.style.visibility = "visible";
    weatherDetailsEl.style.visibility = "visible";
    if (forecastSection) forecastSection.style.visibility = "visible";
    if (hourlySection) hourlySection.style.visibility = "visible";

    // Insert skeleton cards into hourly strip
    if (hourlyContainer) {
        hourlyContainer.innerHTML = "";
        for (let i = 0; i < 8; i++) {
            const sk = document.createElement("div");
            sk.className = "hourly-card skeleton";
            sk.innerHTML = `
                <span class="hourly-time">--</span>
                <div class="hourly-skeleton-icon"></div>
                <span class="hourly-temp">--</span>
            `;
            hourlyContainer.appendChild(sk);
        }
    }

    // Reset icon inline styles — without this, old icon's opacity:1
    // overrides the .loading CSS and the icon stays visible during skeleton
    weatherIcon.style.opacity = "0";
    weatherIcon.style.display = "none";

    hidePermissionCard();

    document
        .querySelector(".weather-content")
        .classList.add("loading");

    document
        .querySelector(".weather-details")
        .classList.add("loading");

    document
        .querySelector(".forecast-container")
        .classList.add("loading");

    if (hourlyContainer) hourlyContainer.classList.add("loading");

}

/* ==========================================
   Hide Loading
========================================== */

export function hideLoading() {

    document.querySelector(".weather-content").classList.remove("loading");
    document.querySelector(".weather-details").classList.remove("loading");
    document.querySelector(".forecast-container").classList.remove("loading");

    if (hourlyContainer) hourlyContainer.classList.remove("loading");

}

/* ==========================================
   Error Toast (Red)
========================================== */

export function showError(message) {

    let toast = document.getElementById("toast-notification");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-notification";
        toast.setAttribute("role", "alert");
        toast.setAttribute("aria-live", "assertive");
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = "toast toast-error toast-visible";

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove("toast-visible");
    }, 4000);

}

/* ==========================================
   Permission Denied Toast (Amber)
   Shows actionable instructions to re-enable location in browser settings
========================================== */

export function showPermissionDeniedToast() {

    let toast = document.getElementById("toast-notification");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-notification";
        toast.setAttribute("role", "alert");
        toast.setAttribute("aria-live", "assertive");
        document.body.appendChild(toast);
    }

    toast.innerHTML = `<i class="fa-solid fa-location-slash" style="margin-right:8px"></i>Location denied. Click the 🔒 lock icon in the address bar and allow location access.`;
    toast.className = "toast toast-warning toast-visible";

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove("toast-visible");
    }, 6000);

}

/* ==========================================
   Permission Card — Hide
========================================== */

export function hidePermissionCard() {

    permissionCard.classList.add("hidden");

    // Remove the class that was hiding weather-details
    document.querySelector(".hero").classList.remove("permission-visible");

}

/* ==========================================
   Permission Card — Denied State
========================================== */

export function showPermissionDenied() {

    permissionCard.classList.remove("hidden");
    document.querySelector(".hero").classList.add("permission-visible");

    permissionCard.querySelector("h2").textContent =
        "Location Access Denied";

    permissionCard.querySelector("p").textContent =
        "Loading default weather. You can also search any city manually.";

    permissionCard.querySelector(".permission-status").textContent =
        "Loading...";

    // Auto-hide after 2 seconds so the loaded weather is visible
    setTimeout(() => hidePermissionCard(), 2000);

}

/* ==========================================
   Permission Card — Waiting State
========================================== */

export function showPermissionWaiting() {

    permissionCard.classList.remove("hidden");
    document.querySelector(".hero").classList.add("permission-visible");

    permissionCard.querySelector("h2").textContent =
        "Allow Location Access";

    permissionCard.querySelector("p").textContent =
        "Allow location access to instantly see weather for your area. You can also search any city.";

    permissionCard.querySelector(".permission-status").textContent =
        "Waiting for browser permission...";

}

/* ==========================================
   Set Weather Body Class
   Adds a class to <body> based on weather code.
   Used for condition tints and rain reflection.
========================================== */

export function setWeatherBodyClass(code) {

    const PREFIX = "weather-";

    // Remove any existing weather condition class
    [...document.body.classList]
        .filter(c => c.startsWith(PREFIX))
        .forEach(c => document.body.classList.remove(c));

    let condition = "";
    if      (code >= 200 && code < 300)                    condition = "thunderstorm";
    else if (code >= 300 && code < 400)                    condition = "drizzle";
    else if (code >= 500 && code < 600)                    condition = code === 511 ? "sleet" : "rain";
    else if (code >= 600 && code < 700)                    condition = "snow";
    else if (code === 701 || code === 721 || code === 741) condition = "fog";
    else if (code >= 700 && code < 800)                    condition = "haze";
    else if (code === 800)                                 condition = "clear";
    else if (code <= 802)                                  condition = "partly-cloudy";
    else                                                   condition = "cloudy";

    if (condition) document.body.classList.add(PREFIX + condition);

}