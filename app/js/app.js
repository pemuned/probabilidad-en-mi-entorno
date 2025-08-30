/**
 * App.js - Aplicación principal de probabilidad
 * Versión modular y optimizada
 */

// ===== IMPORTS =====
import {
    retryFetch
} from './utils/fetch-utils.js';
import {
    getCurrentPage,
    debounce,
    throttle
} from './utils/general-utils.js';
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';

// ===== CONFIGURACIÓN GLOBAL =====
const CONFIG = {
    BREAKPOINTS: {
        MOBILE: 1024
    },
    SCROLL: {
        INERTIA_MULTIPLIER: 25,
        ARROW_SCROLL_RATIO: 0.8,
        TOLERANCE: 10,
        FOOTER_HEIGHT: 60
    },
    ANIMATION: {
        MODAL_DURATION: 300,
        PARALLAX_MOUNTAINS: 0.3,
        PARALLAX_CLOUDS_BASE: 0.5
    },
    PATHS: {
        META_CONFIG: 'components/meta-config.json'
    },
    FETCH: {
        TIMEOUT: 5000,
        RETRY_ATTEMPTS: 2,
        RETRY_DELAY: 1000
    }
};

// ===== GESTOR DE METADATOS =====
class MetaDataManager {
    constructor() {
        this.pageTitles = {
            'index': 'Inicio - Descubriendo la probabilidad en mi entorno',
            'bienvenida': 'Bienvenida - Descubriendo la probabilidad en mi entorno',
            'consideraciones': 'Consideraciones - Descubriendo la probabilidad en mi entorno',
            'importancia': 'Importancia - Descubriendo la probabilidad en mi entorno',
            'explicaciones': 'Explicaciones - Descubriendo la probabilidad en mi entorno',
            'ejercicios': 'Ejercicios - Descubriendo la probabilidad en mi entorno',
            'juego-1-dado': 'Juego con 1 dado - Descubriendo la probabilidad en mi entorno',
            'juego-2-dados': 'Juego con 2 dados - Descubriendo la probabilidad en mi entorno',
            'torneo-dados': 'Torneo de dados - Descubriendo la probabilidad en mi entorno',
            'juego-tres-vasos': 'Juego con tres vasos - Descubriendo la probabilidad en mi entorno',
            'referencias': 'Referencias - Descubriendo la probabilidad en mi entorno',
            'creditos': 'Créditos - Descubriendo la probabilidad en mi entorno'
        };
    }

    async loadMetaData() {
        try {
            const response = await retryFetch(CONFIG.PATHS.META_CONFIG);
            const metaConfig = await response.json();
            const defaultConfig = metaConfig.default;
            const pageTitle = this.getPageTitle();

            // Actualizar título
            document.title = pageTitle || defaultConfig.title;

            // Actualizar metadatos básicos
            this.updateMetaTags(defaultConfig, pageTitle);

            // Actualizar favicon
            this.updateFavicon(defaultConfig.favicon);

        } catch (error) {
            console.warn('Error cargando metadatos, usando configuración por defecto:', error);
            this.loadDefaultMetaData();
        }
    }

    loadDefaultMetaData() {
        const pageTitle = this.getPageTitle();
        document.title = pageTitle;

        // Metadatos por defecto
        const defaultMeta = {
            description: 'Aplicación educativa sobre probabilidad para estudiantes',
            keywords: 'probabilidad, matemáticas, educación, dados, juegos',
            author: 'Universidad Estatal a Distancia'
        };

        this.updateMetaTags(defaultMeta, pageTitle);
        this.updateFavicon('favicon.svg');
    }

    getPageTitle() {
        const currentPage = getCurrentPage();
        return this.pageTitles[currentPage] || null;
    }

    updateMetaTags(config, pageTitle) {
        const metaUpdates = [
            ['description', config.description],
            ['keywords', config.keywords],
            ['author', config.author],
            ['og:title', pageTitle || config.og?.title],
            ['og:description', config.og?.description || config.description],
            ['og:image', config.og?.image],
            ['og:url', window.location.href],
            ['og:type', config.og?.type],
            ['og:locale', config.og?.locale],
            ['og:site_name', config.og?.site_name]
        ];

        metaUpdates.forEach(([property, content]) => {
            this.updateMetaTag(property, content);
        });
    }

    updateMetaTag(property, content) {
        let metaTag = document.querySelector(`meta[name="${property}"], meta[property="${property}"]`);

        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute(property.startsWith('og:') ? 'property' : 'name', property);
            document.head.appendChild(metaTag);
        }

        metaTag.setAttribute('content', content);
    }

    updateFavicon(faviconPath) {
        let favicon = document.querySelector('link[rel="icon"]');

        if (!favicon) {
            favicon = document.createElement('link');
            favicon.setAttribute('rel', 'icon');
            favicon.setAttribute('type', 'image/svg+xml');
            document.head.appendChild(favicon);
        }

        favicon.setAttribute('href', faviconPath);
    }
}

// ===== GESTOR DE COMPONENTES =====
class ComponentManager {
    constructor() {
        this.loadedComponents = new Set();
    }

    loadComponents() {
        const currentPage = getCurrentPage();

        // Renderizar header usando Preact
        renderHeader('header-component', currentPage);
        this.loadedComponents.add('header-component');

        // Renderizar footer usando Preact
        renderFooter('footer-component');
        this.loadedComponents.add('footer-component');

        // console.log('✅ Componentes renderizados con Preact');
    }

    isComponentLoaded(elementId) {
        return this.loadedComponents.has(elementId);
    }

    getLoadedComponents() {
        return Array.from(this.loadedComponents);
    }
}

// ===== GESTOR DE NAVEGACIÓN =====
class NavigationManager {
    static setupResponsiveMenu() {
        const hamburgerBtn = document.querySelector('.hamburger-menu');
        const navMenu = document.querySelector('.header-nav');
        const dropdowns = document.querySelectorAll('.dropdown > a');

        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', () => {
                hamburgerBtn.classList.toggle('is-active');
                if (navMenu) {
                    navMenu.classList.toggle('is-active');
                }
            });
        }

        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('click', (e) => {
                // Para index.html, siempre permitir acordeón
                const isIndexPage = document.body.classList.contains('index-page');
                if (window.innerWidth <= CONFIG.BREAKPOINTS.MOBILE || isIndexPage) {
                    e.preventDefault();
                    dropdown.parentElement.classList.toggle('is-open');
                }
            });
        });
    }

    static markActiveLink() {
        const currentPage = getCurrentPage();
        const navLinks = document.querySelectorAll('.nav-menu a');

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === 'index' && href === 'index')) {
                link.classList.add('active');
            }
        });

        // Resaltar menús principales según subpáginas
        this.highlightMainMenus(currentPage, navLinks);
    }

    static highlightMainMenus(currentPage, navLinks) {
        const menuMappings = {
            'juego-1-dado': 'Explicaciones',
            'juego-2-dados': 'Explicaciones',
            'torneo-dados': 'Ejercicios',
            'juego-tres-vasos': 'Ejercicios',
            'aplicaciones': 'Importancia'
        };

        const targetMenu = menuMappings[currentPage];
        if (targetMenu) {
            navLinks.forEach(link => {
                if (link.textContent.trim() === targetMenu &&
                    (link.classList.contains('no-link') || targetMenu === 'Importancia')) {
                    link.classList.add('active');
                }
            });
        }
    }
}

// ===== GESTOR DE SCROLL HORIZONTAL =====
class HorizontalScrollManager {
    constructor() {
        this.scrollContainer = document.getElementById('main-scroll-container');
        this.isDragging = false;
        this.startX = 0;
        this.startScrollLeft = 0;
        this.lastScrollLeft = 0;
        this.dragVelocity = 0;
        this.lastDragTime = 0;
        this.hasMoved = false;
        this.dragStartTime = 0;
        this.isTouchScrolling = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartScrollLeft = 0;

        this.init();
    }

    init() {
        if (!this.scrollContainer) return;

        this.setupWheelScroll();
        this.setupDragAndDrop();
        this.setupTouchScroll();
        this.setupScrollbarClick();
        this.setupParallax();
        this.setupArrows();
        this.adjustScrollAndMountains();
    }

    setupWheelScroll() {
        this.scrollContainer.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                this.scrollContainer.scrollLeft += e.deltaY;
                e.preventDefault();
            }
        }, { passive: false });
    }

    setupDragAndDrop() {
        this.scrollContainer.addEventListener('mousedown', this.startDrag.bind(this), { passive: false });
        document.addEventListener('mousemove', throttle(this.dragMove.bind(this), 16), { passive: false });
        document.addEventListener('mouseup', this.endDrag.bind(this), { passive: false });
        document.addEventListener('mouseleave', this.endDrag.bind(this), { passive: false });
    }

    setupTouchScroll() {
        this.scrollContainer.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', throttle(this.handleTouchMove.bind(this), 16), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    }

    startDrag(e) {
        if (e.target.closest('.menu-link') || e.target.closest('.scroll-arrow') || e.target.closest('button')) {
            return;
        }

        this.isDragging = true;
        this.hasMoved = false;
        this.startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        this.startScrollLeft = this.scrollContainer.scrollLeft;
        this.lastScrollLeft = this.scrollContainer.scrollLeft;
        this.dragVelocity = 0;
        this.lastDragTime = Date.now();
        this.dragStartTime = Date.now();

        document.body.classList.add('dragging');
        this.scrollContainer.classList.add('dragging');
        e.preventDefault();
    }

    dragMove(e) {
        if (!this.isDragging) return;

        const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const deltaX = this.startX - currentX;
        const currentTime = Date.now();

        this.hasMoved = true;
        const newScrollLeft = this.startScrollLeft + deltaX;
        const maxScroll = this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth;
        const clampedScrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));

        if (currentTime - this.lastDragTime > 0) {
            this.dragVelocity = (clampedScrollLeft - this.lastScrollLeft) / (currentTime - this.lastDragTime);
        }
        this.lastScrollLeft = clampedScrollLeft;
        this.lastDragTime = currentTime;

        this.scrollContainer.scrollLeft = clampedScrollLeft;
        e.preventDefault();
        e.stopPropagation();
    }

    endDrag(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        document.body.classList.remove('dragging');
        this.scrollContainer.classList.remove('dragging');

        if (!this.hasMoved) return;

        const dragDuration = Date.now() - this.dragStartTime;

        if (Math.abs(this.dragVelocity) > 0.3 && dragDuration > 30) {
            const inertiaDistance = this.dragVelocity * CONFIG.SCROLL.INERTIA_MULTIPLIER;
            const finalScrollLeft = this.scrollContainer.scrollLeft;
            const targetScrollLeft = finalScrollLeft + inertiaDistance;
            const maxScroll = this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth;
            const clampedTarget = Math.max(0, Math.min(targetScrollLeft, maxScroll));

            this.scrollContainer.scrollTo({
                left: clampedTarget,
                behavior: 'smooth'
            });
        }

        this.handleScrollArrows();
    }

    handleTouchStart(e) {
        if (e.touches.length === 1 && !this.isDragging) {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.touchStartScrollLeft = this.scrollContainer.scrollLeft;
            this.isTouchScrolling = false;
        }
    }

    handleTouchMove(e) {
        if (e.touches.length === 1 && !this.isDragging) {
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = this.touchStartX - touchX;
            const deltaY = this.touchStartY - touchY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                this.isTouchScrolling = true;
                const newScrollLeft = this.touchStartScrollLeft + deltaX;
                const maxScroll = this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth;
                const clampedScrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));

                this.scrollContainer.scrollLeft = clampedScrollLeft;
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }

    handleTouchEnd(e) {
        this.isTouchScrolling = false;
    }

    setupScrollbarClick() {
        this.scrollContainer.addEventListener('click', (e) => {
            const rect = this.scrollContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const containerWidth = rect.width;

            if (clickX >= containerWidth - 20) {
                const scrollbarWidth = 20;
                const scrollbarClickX = clickX - (containerWidth - scrollbarWidth);
                const scrollRatio = scrollbarClickX / scrollbarWidth;
                const maxScroll = this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth;
                const newScrollLeft = scrollRatio * maxScroll;

                this.scrollContainer.scrollTo({
                    left: newScrollLeft,
                    behavior: 'smooth'
                });

                e.preventDefault();
                e.stopPropagation();
            }
        });
    }

    setupArrows() {
        const arrowLeft = document.getElementById('arrow-left');
        const arrowRight = document.getElementById('arrow-right');

        if (arrowLeft && arrowRight) {
            arrowLeft.addEventListener('click', () => {
                this.scrollContainer.scrollBy({
                    left: -this.scrollContainer.clientWidth * CONFIG.SCROLL.ARROW_SCROLL_RATIO,
                    behavior: 'smooth'
                });
            });

            arrowRight.addEventListener('click', () => {
                this.scrollContainer.scrollBy({
                    left: this.scrollContainer.clientWidth * CONFIG.SCROLL.ARROW_SCROLL_RATIO,
                    behavior: 'smooth'
                });
            });

            this.scrollContainer.addEventListener('scroll', throttle(this.handleScrollArrows.bind(this), 16));
            window.addEventListener('resize', debounce(this.handleScrollArrows.bind(this), 100));
        }
    }

    handleScrollArrows() {
        const arrowLeft = document.getElementById('arrow-left');
        const arrowRight = document.getElementById('arrow-right');

        if (!arrowLeft || !arrowRight) return;

        const scrollLeft = this.scrollContainer.scrollLeft;
        const maxScroll = this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth;

        // Flecha izquierda
        if (scrollLeft <= CONFIG.SCROLL.TOLERANCE) {
            arrowLeft.classList.remove('visible');
            arrowLeft.classList.add('hidden');
        } else {
            arrowLeft.classList.add('visible');
            arrowLeft.classList.remove('hidden');
        }

        // Flecha derecha
        if (scrollLeft >= maxScroll - CONFIG.SCROLL.TOLERANCE) {
            arrowRight.classList.remove('visible');
            arrowRight.classList.add('hidden');
        } else {
            arrowRight.classList.add('visible');
            arrowRight.classList.remove('hidden');
        }
    }

    setupParallax() {
        this.scrollContainer.addEventListener('scroll', throttle(this.applyParallaxEffect.bind(this), 16));
        window.addEventListener('resize', debounce(this.applyParallaxEffect.bind(this), 100));
    }

    applyParallaxEffect() {
        const scrollLeft = this.scrollContainer.scrollLeft;
        const maxScroll = this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth;
        const scrollProgress = maxScroll > 0 ? scrollLeft / maxScroll : 0;

        // Montañas
        const mountainsBg = document.getElementById('mountains-bg');
        if (mountainsBg) {
            const mountainsOffset = scrollLeft * CONFIG.ANIMATION.PARALLAX_MOUNTAINS;
            mountainsBg.style.transform = `translateX(${mountainsOffset}px)`;
        }

        // Nubes
        const clouds = document.querySelectorAll('.clouds');
        clouds.forEach((cloud, index) => {
            const cloudOffset = scrollLeft * (CONFIG.ANIMATION.PARALLAX_CLOUDS_BASE + index * 0.1);
            cloud.style.transform = `translateX(${cloudOffset}px)`;
        });
    }

    adjustScrollAndMountains() {
        const schoolImg = document.getElementById('school-img');
        const horizontalScroll = document.getElementById('horizontal-scroll');
        const mountainsBg = document.getElementById('mountains-bg');

        if (!schoolImg || !horizontalScroll || !mountainsBg) return;

        if (!schoolImg.complete) {
            schoolImg.onload = this.adjustScrollAndMountains.bind(this);
            return;
        }

        const schoolHeight = window.innerHeight - CONFIG.SCROLL.FOOTER_HEIGHT;
        const aspectRatio = schoolImg.naturalWidth / schoolImg.naturalHeight;
        const schoolWidth = schoolHeight * aspectRatio;

        horizontalScroll.style.width = schoolWidth + 'px';
        mountainsBg.style.width = schoolWidth + 'px';
        this.scrollContainer.scrollTo({ left: 0 });

        setTimeout(() => this.handleScrollArrows(), 100);
    }
}

// ===== GESTOR DE MODALES =====
class ModalManager {
    constructor() {
        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalClose = document.getElementById('modal-close');
        this.modalSections = document.querySelectorAll('.modal-section');
        this.modalButtons = document.querySelectorAll('.modal-button');
        this.submenuButtons = document.querySelectorAll('.submenu-button');
        this.menuLinks = document.querySelectorAll('.menu-link');

        this.pageNavigation = {
            'bienvenida': 'bienvenida',
            'consideraciones': 'consideraciones',
            'importancia': 'importancia',
            'explicaciones': 'explicaciones',
            'ejercicios': 'ejercicios',
            'juego-1-dado': 'juego-1-dado',
            'juego-2-dados': 'juego-2-dados',
            'torneo-dados': 'torneo-dados',
            'juego-tres-vasos': 'juego-tres-vasos'
        };

        this.init();
    }

    init() {
        if (this.menuLinks.length > 0) {
            this.menuLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const sectionId = link.getAttribute('href').substring(1);
                    this.openModal(sectionId);
                });
            });
        }

        if (this.modalButtons.length > 0) {
            this.modalButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const activeSection = document.querySelector('.modal-section[style*="display: block"]');
                    if (activeSection) {
                        const sectionId = activeSection.getAttribute('data-section');
                        this.navigateToPage(sectionId);
                    }
                });
            });
        }

        if (this.submenuButtons.length > 0) {
            this.submenuButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const submenuId = button.getAttribute('data-submenu');
                    this.navigateToPage(submenuId);
                });
            });
        }

        if (this.modalClose) {
            this.modalClose.addEventListener('click', this.closeModal.bind(this));
        }

        if (this.modalOverlay) {
            this.modalOverlay.addEventListener('click', (e) => {
                if (e.target === this.modalOverlay) {
                    this.closeModal();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalOverlay && this.modalOverlay.classList.contains('show')) {
                this.closeModal();
            }
        });
    }

    openModal(sectionId) {
        this.modalSections.forEach(section => {
            section.style.display = 'none';
        });

        const targetSection = document.querySelector(`[data-section="${sectionId}"]`);
        if (targetSection) {
            targetSection.style.display = 'block';
            this.modalOverlay.classList.add('show');

            this.updateContinueButton(sectionId);

            setTimeout(() => {
                this.modalOverlay.classList.add('animate-in');
            }, 10);
        }
    }

    updateContinueButton(sectionId) {
        const continueButton = document.querySelector('.modal-button:not(.submenu-button)');
        if (!continueButton) return;

        if (sectionId === 'explicaciones' || sectionId === 'ejercicios') {
            continueButton.style.display = 'none';
        } else {
            continueButton.style.display = 'block';
            const buttonTexts = {
                'bienvenida': 'Ir a la bienvenida',
                'consideraciones': 'Ir a consideraciones',
                'importancia': 'Conocer más'
            };
            continueButton.textContent = buttonTexts[sectionId] || 'Continuar';
        }
    }

    closeModal() {
        this.modalOverlay.classList.remove('animate-in');
        this.modalOverlay.classList.add('animate-out');

        setTimeout(() => {
            this.modalOverlay.classList.remove('show', 'animate-out');
        }, CONFIG.ANIMATION.MODAL_DURATION);
    }

    navigateToPage(sectionId) {
        const targetPage = this.pageNavigation[sectionId];
        if (targetPage) {
            window.location.href = targetPage;
        }
    }
}

// ===== GESTOR DE BOTÓN GO TO TOP =====
class GoToTopManager {
    constructor() {
        this.goToTopBtn = document.getElementById('go-to-top-btn');
        this.init();
    }

    init() {
        if (!this.goToTopBtn) return;

        window.addEventListener('scroll', throttle(() => {
            if (window.scrollY > 200) {
                this.goToTopBtn.classList.add('visible');
            } else {
                this.goToTopBtn.classList.remove('visible');
            }
        }, 16));

        this.goToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// ===== INICIALIZACIÓN DE LA APLICACIÓN =====
class App {
    constructor() {
        this.isIndexPage = document.body.classList.contains('index-page');
        this.metaManager = new MetaDataManager();
        this.componentManager = new ComponentManager();
        this.modalManager = new ModalManager();
        this.goToTopManager = new GoToTopManager();

        this.init();
    }

    async init() {
        try {
            // console.log('🚀 Iniciando aplicación...');
            // console.log(`🔒 Protocolo: ${window.location.protocol}`);
            // console.log(`📄 Página: ${getCurrentPage()}`);

            // Cargar metadatos
            await this.metaManager.loadMetaData();
            // console.log('✅ Metadatos cargados');

            // Cargar componentes usando Preact
            this.componentManager.loadComponents();
            // console.log('✅ Componentes cargados');

            // Inicializar funcionalidades específicas
            if (this.isIndexPage) {
                new HorizontalScrollManager();
                // console.log('✅ Scroll horizontal inicializado');
            }

            // console.log('🎉 Aplicación inicializada correctamente');

            // Ocultar loader después de que todo esté cargado
            this.hideLoader();

        } catch (error) {
            console.error('❌ Error durante la inicialización:', error);
            this.handleInitializationError(error);
            // Ocultar loader incluso si hay error
            this.hideLoader();
        }
    }

    hideLoader() {
        const loader = document.getElementById('page-loader');
        if (loader) {
            // Pequeño delay para asegurar que las animaciones se vean
            setTimeout(() => {
                loader.classList.add('hidden');
                // Remover completamente después de la transición
                setTimeout(() => {
                    if (loader.parentNode) {
                        loader.parentNode.removeChild(loader);
                    }
                }, 800);
            }, 500);
        }
    }

    handleInitializationError(error) {
        // Mostrar mensaje de error amigable al usuario
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: Arial, sans-serif;
            max-width: 300px;
        `;
        errorMessage.innerHTML = `
            <strong>⚠️ Error de carga</strong><br>
            Algunos elementos no se cargaron correctamente.<br>
            <small>Recarga la página para intentar de nuevo.</small>
        `;

        document.body.appendChild(errorMessage);

        // Remover mensaje después de 5 segundos
        setTimeout(() => {
            if (errorMessage.parentNode) {
                errorMessage.parentNode.removeChild(errorMessage);
            }
        }, 5000);
    }
}

// ===== INICIALIZACIÓN CUANDO EL DOM ESTÉ LISTO =====
document.addEventListener('DOMContentLoaded', () => {
    // Pequeño delay para asegurar que todo esté listo
    setTimeout(() => {
        new App();
    }, 10);
});

// ===== UTILIDADES DE DEBUGGING =====
if (window.location.hostname === 'localhost') {
    window.debugApp = {
        getConfig: () => CONFIG,
        getLoadedComponents: () => document.querySelectorAll('[id*="component"]'),
        reloadComponents: () => {
            const app = new App();
            return app;
        }
    };
    // console.log('🔧 Modo debug activado. Usa window.debugApp para debugging.');
} 