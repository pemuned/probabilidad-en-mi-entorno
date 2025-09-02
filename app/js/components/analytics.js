/**
 * Google Analytics simple para el proyecto
 */

// Configura aquí tu ID de Google Analytics
const GA_ID = ''; // Ejemplo: 'G-XXXXXXXXXX'

/**
 * Inicializar Google Analytics
 */
export const initializeGoogleAnalytics = () => {
    if (!GA_ID) {
        console.warn('GA: Configura tu ID en analytics.js');
        return;
    }

    // Cargar script de Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    // Configurar Google Analytics
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_ID);
};

/**
 * Rastrear eventos personalizados
 */
export const trackEvent = (eventName, parameters = {}) => {
    if (window.gtag) {
        window.gtag('event', eventName, parameters);
    }
};

/**
 * Rastrear vista de página
 */
export const trackPageView = (pageTitle, pagePath) => {
    if (window.gtag) {
        window.gtag('config', GA_ID, {
            page_title: pageTitle,
            page_path: pagePath
        });
    }
};
