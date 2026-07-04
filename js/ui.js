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

const suggestionsContainer =
    document.getElementById("suggestions");

/* ==========================================
   Update Suggestions
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

        item.innerHTML = `
            <i class="fa-solid fa-location-dot"></i>

            <span>
                ${city.name}
                ${city.state ? `, ${city.state}` : ""}
                , ${city.country}
            </span>
        `;

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

export function updateCurrentWeather(data) {

    cityName.textContent = `${data.name}, ${data.sys.country}`;

    currentDate.textContent =
        `${formatDate(data.dt)} • ${formatTime(data.dt)}`;

    temperature.innerHTML =
        `${Math.round(data.main.temp)}<span>°C</span>`;

    feelsLike.textContent =
        `${Math.round(data.main.feels_like)}°C`;

    weatherCondition.textContent =
        capitalize(data.weather[0].description);

    humidity.textContent =
        `${data.main.humidity}%`;

    windSpeed.textContent =
        convertWind(data.wind.speed);

    pressure.textContent =
        `${data.main.pressure} hPa`;

    visibility.textContent =
        convertVisibility(data.visibility);

    sunrise.textContent =
        formatTime(data.sys.sunrise);

    sunset.textContent =
        formatTime(data.sys.sunset);

    weatherIcon.src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    weatherIcon.alt =
        data.weather[0].description;

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

export function updateForecast(forecastData) {

    forecastContainer.innerHTML = "";

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

    [...dailyForecast.values()]
        .slice(0, 5)
        .forEach(day => {

            const card = document.createElement("div");

            card.className = "forecast-card";

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
                    <h4>${Math.round(day.main.temp_max)}°C</h4>
                    <span>${Math.round(day.main.temp_min)}°C</span>
                </div>
            `;

            forecastContainer.appendChild(card);

        });

}

/* ==========================================
   Placeholder Functions
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

export function showLoading() {

    // Phase 6

}

export function hideLoading() {

    // Phase 6

}

export function showError(message) {

    alert(message);

}