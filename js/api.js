/* ==========================================
   OpenWeather API Configuration
========================================== */

const API_KEY = "4a0355efea2367d4522f91a82466bac7";
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const GEO_URL = "https://api.openweathermap.org/geo/1.0";

/* ==========================================
   Generic Fetch Function
========================================== */

async function fetchWeather(url) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Failed to fetch weather data.");
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}

/* ==========================================
   Current Weather by City
========================================== */

export async function getCurrentWeather(city) {

    const url =
        `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    return await fetchWeather(url);
}

/* ==========================================
   5-Day Forecast by City
========================================== */

export async function getForecast(city) {

    const url =
        `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    return await fetchWeather(url);
}

/* ==========================================
   Current Weather by Coordinates
========================================== */

export async function getWeatherByCoords(lat, lon) {

    const url =
        `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    return await fetchWeather(url);
}

/* ==========================================
   City Suggestions
========================================== */

export async function getCitySuggestions(query) {

    const url =
        `${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;

    return await fetchWeather(url);

}