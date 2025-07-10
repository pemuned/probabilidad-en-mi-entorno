/**
 * Componente Footer usando Preact
 */

const { h, render } = window.preact;

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return h('div', { class: 'footer-content' }, [
        h('span', null, [
            '© Universidad Estatal a Distancia, ',
            h('span', { id: 'current-year' }, currentYear),
            ' | '
        ]),
        h('a', { href: 'referencias' }, 'Referencias'),
        ' | ',
        h('a', { href: 'creditos' }, 'Créditos')
    ]);
};

// Función para renderizar el footer
export const renderFooter = (containerId) => {
    const container = document.getElementById(containerId);
    if (container) {
        render(h(Footer), container);
    }
}; 