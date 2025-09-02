/**
 * Componente Header usando Preact
 */

const { h, render } = window.preact;

// Importar funciones de analytics
import { initializeGoogleAnalytics, trackPageView } from './analytics.js';

export const Header = ({ currentPage = '' }) => {
    const setupNavigation = () => {
        // Marcar enlace activo
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === 'index' && href === 'index')) {
                link.classList.add('active');
            }
        });

        // Resaltar menús principales según subpáginas
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
    };

    const setupResponsiveMenu = () => {
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
                const isIndexPage = document.body.classList.contains('index-page');
                if (window.innerWidth <= 1024 || isIndexPage) {
                    e.preventDefault();
                    dropdown.parentElement.classList.toggle('is-open');
                }
            });
        });
    };

    // Ejecutar setup después del render
    setTimeout(() => {
        setupNavigation();
        setupResponsiveMenu();

        // Inicializar Google Analytics
        initializeGoogleAnalytics();

        // Rastrear la página actual
        const pageTitle = document.title;
        const pagePath = window.location.pathname;
        trackPageView(pageTitle, pagePath);
    }, 0);

    return h('div', null, [
        // Primera barra
        h('div', { class: 'header-bar header-bar-1' }),
        // Segunda barra
        h('div', { class: 'header-bar header-bar-2' }),
        // Logo centrado
        h('div', { class: 'header-logo' },
            h('a', { href: './' },
                h('img', { src: 'app/img/logo.svg', alt: 'Logo' })
            )
        ),
        // Botón de menú hamburguesa (para móvil)
        h('button', {
            class: 'hamburger-menu',
            'aria-label': 'Abrir menú',
            'aria-expanded': 'false'
        }, [
            h('span', { class: 'hamburger-box' },
                h('span', { class: 'hamburger-inner' })
            )
        ]),
        // Barra de navegación
        h('nav', { class: 'header-nav' },
            h('ul', { class: 'nav-menu' }, [
                h('li', { class: 'menu-inicio' }, h('a', { href: 'index' }, 'Inicio')),
                h('li', null, h('a', { href: 'bienvenida' }, 'Bienvenida')),
                h('li', null, h('a', { href: 'consideraciones' }, 'Consideraciones')),
                h('li', null, h('a', { href: 'importancia' }, 'Importancia')),
                h('li', { class: 'dropdown' }, [
                    h('a', { class: 'no-link' }, 'Explicaciones'),
                    h('ul', { class: 'dropdown-menu' }, [
                        h('li', null, h('a', { href: 'juego-1-dado' }, 'Juego con 1 dado')),
                        h('li', null, h('a', { href: 'juego-2-dados' }, 'Juego con 2 dados'))
                    ])
                ]),
                h('li', { class: 'dropdown' }, [
                    h('a', { class: 'no-link' }, 'Ejercicios'),
                    h('ul', { class: 'dropdown-menu' }, [
                        h('li', null, h('a', { href: 'torneo-dados' }, 'Torneo de dados')),
                        h('li', null, h('a', { href: 'juego-tres-vasos' }, 'Juego con tres vasos'))
                    ])
                ])
            ])
        )
    ]);
};

// Función para renderizar el header
export const renderHeader = (containerId, currentPage) => {
    const container = document.getElementById(containerId);
    if (container) {
        render(h(Header, { currentPage }), container);
    }
}; 