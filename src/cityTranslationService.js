import { cityTranslations } from "./citytranslations";

const CACHE_KEY = "fids-city-translation-cache";

const pendingTranslations = new Map();

const readCache = () => {
    try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
        return cached && typeof cached === "object" ? cached : {};
    } catch {
        return {};
    }
};

const writeCache = (cache) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
        // Continue using the in-memory result when browser storage is unavailable.
    }
};

const cacheId = (cityName, language) => `${language}:${cityName}`;

export const getStaticCityTranslation = (cityName, language) => {
    if (!cityName) return "-";
    return cityTranslations[language]?.[cityName] ?? null;
};

export const getCachedCityTranslation = (cityName, language) => {
    if (!cityName) return null;
    return readCache()[cacheId(cityName, language)] ?? null;
};

export const translateCityWithCache = async (cityName, language) => {
    if (!cityName) return "-";

    const staticTranslation = getStaticCityTranslation(cityName, language);
    if (staticTranslation) return staticTranslation;

    const cachedTranslation = getCachedCityTranslation(cityName, language);
    if (cachedTranslation) return cachedTranslation;

    const requestId = cacheId(cityName, language);
    if (pendingTranslations.has(requestId)) {
        return pendingTranslations.get(requestId);
    }

    const translationRequest = fetchTranslation(cityName, language)
        .then((translation) => {
            if (!translation) return cityName;

            const cache = readCache();
            cache[requestId] = translation;
            writeCache(cache);
            return translation;
        })
        .catch(() => cityName)
        .finally(() => {
            pendingTranslations.delete(requestId);
        });

    pendingTranslations.set(requestId, translationRequest);
    return translationRequest;
};

const fetchTranslation = async (cityName, language) => {
    if (language === "en") return cityName;

    const apiUrl = import.meta.env.VITE_TRANSLATION_API_URL || DEFAULT_TRANSLATION_API;
    const url = new URL(apiUrl);
    url.searchParams.set("q", cityName);
    url.searchParams.set("langpair", `en|${language}`);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);

    const data = await response.json();
    const translation = data?.responseData?.translatedText?.trim();
    return translation && translation.toLowerCase() !== cityName.toLowerCase()
        ? translation
        : cityName;
};
