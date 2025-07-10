/**
 * Utilidades de Fetch
 * Manejo optimizado de requests HTTP con fallbacks
 */

// Configuración de fetch
const FETCH_CONFIG = {
    TIMEOUT: 5000,
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 1000
};

/**
 * Fetch con timeout
 */
export async function fetchWithTimeout(url, options = {}, timeout = FETCH_CONFIG.TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Fetch con reintentos automáticos
 */
export async function retryFetch(url, options = {}, maxAttempts = FETCH_CONFIG.RETRY_ATTEMPTS) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fetchWithTimeout(url, options);
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, FETCH_CONFIG.RETRY_DELAY));
        }
    }
}

