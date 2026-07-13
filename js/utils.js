/* ==========================================
   Format Date
   timezoneOffset: seconds east of UTC (from OpenWeather `timezone` field)
========================================== */

export function formatDate(timestamp, timezoneOffset = 0) {

    // Shift the UTC timestamp by the city's offset so toLocaleString
    // with timeZone:"UTC" renders the city's local date.
    const localMs = (timestamp + timezoneOffset) * 1000;

    return new Date(localMs).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC"
    });

}

/* ==========================================
   Format Time
   timezoneOffset: seconds east of UTC (from OpenWeather `timezone` field)
========================================== */

export function formatTime(timestamp, timezoneOffset = 0) {

    const localMs = (timestamp + timezoneOffset) * 1000;

    return new Date(localMs).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC"
    });

}

/* ==========================================
   Capitalize Weather Description
========================================== */

export function capitalize(text) {

    return text
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

}

/* ==========================================
   Convert Visibility
========================================== */

export function convertVisibility(visibility) {

    return `${(visibility / 1000).toFixed(1)} km`;

}

/* ==========================================
   Convert Wind Speed
   speed: m/s from OpenWeather (always m/s regardless of units param)
   For imperial we receive mph directly, so just format it.
========================================== */

export function convertWind(speed, unit = "metric") {

    if (unit === "imperial") {
        // OpenWeather returns mph when units=imperial
        return `${speed.toFixed(1)} mph`;
    }

    // OpenWeather returns m/s when units=metric — convert to km/h
    return `${(speed * 3.6).toFixed(1)} km/h`;

}

/* ==========================================
   Format Forecast Day
========================================== */

export function formatForecastDay(dateString) {

    return new Date(dateString).toLocaleDateString("en-IN", {
        weekday: "short"
    });

}

/* ==========================================
   Format Forecast Date
========================================== */

export function formatForecastDate(dateString) {

    return new Date(dateString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short"
    });

}