/* ==========================================
   Unsplash Configuration
========================================== */

const ACCESS_KEY = "xI7Oxt4Iym0Xr02E4-eszlefpcQZiCBYgAjhLZ2O4kU";

const BASE_URL =
    "https://api.unsplash.com/search/photos";

const imageCache = new Map();

/* ==========================================
   Get City Background
========================================== */

export async function getCityBackground(city, country) {

    const cacheKey = `${city}-${country}`;

    if (imageCache.has(cacheKey)) {

        return imageCache.get(cacheKey);

    }

    try {

        const query =
            `${city} ${country} landmark`;

        const response = await fetch(

            `${BASE_URL}?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1&client_id=${ACCESS_KEY}`

        );

        const data = await response.json();

        const imageUrl =

            data.results?.[0]?.urls?.regular ||

            "/assets/images/default-bg.jpg";

        imageCache.set(cacheKey, imageUrl);

        return imageUrl;

    }

    catch {

        return "/assets/images/default-bg.jpg";

    }

}