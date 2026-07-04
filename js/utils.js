/* ==========================================
   Format Date
========================================== */

export function formatDate(timestamp) {

    const date = new Date(timestamp * 1000);

    return date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

}

/* ==========================================
   Format Time
========================================== */

export function formatTime(timestamp) {

    const date = new Date(timestamp * 1000);

    return date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
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
========================================== */

export function convertWind(speed) {

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