document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');
    const modal = document.getElementById('card-modal');
    const modalContent = modal.querySelector('.card-modal-content');
    const modalBody = document.getElementById('modal-body');
    const closeButton = document.querySelector('.close-button');

    // Modal introductorio
    const introModal = document.getElementById('intro-modal');
    const introModalClose = introModal.querySelector('.modal-close');
    const startExplorationBtn = document.getElementById('start-exploration-btn');

    // Mostrar modal introductorio al cargar la página
    introModal.classList.add('show');
    setTimeout(() => {
        introModal.classList.add('animate-in');
    }, 10);

    // Cerrar modal introductorio
    function closeIntroModal() {
        introModal.classList.remove('animate-in');
        setTimeout(() => {
            introModal.classList.remove('show');
        }, 300);
    }

    introModalClose.addEventListener('click', closeIntroModal);
    startExplorationBtn.addEventListener('click', closeIntroModal);

    // Cerrar modal al hacer clic fuera
    introModal.addEventListener('click', (e) => {
        if (e.target === introModal) {
            closeIntroModal();
        }
    });

    // Función para determinar si estamos en un dispositivo táctil
    const isTouchDevice = () => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    };

    // Asignar color a los títulos de las tarjetas al cargar la página
    cards.forEach(card => {
        const cardBack = card.querySelector('.card-back');
        const cardTitle = cardBack.querySelector('p');
        const borderColor = cardBack.style.borderColor;
        if (cardTitle && borderColor) {
            cardTitle.style.color = borderColor;
        }
    });

    // Lógica unificada para el clic en las tarjetas
    cards.forEach(card => {
        card.addEventListener('click', function (e) {
            // Comprobar si estamos en la vista móvil (coincide con la media query de CSS)
            if (window.innerWidth <= 992) {
                // Comportamiento para móvil: un clic para voltear, otro para abrir el modal
                if (this.classList.contains('is-flipped')) {
                    openModal(this);
                } else {
                    cards.forEach(c => c.classList.remove('is-flipped'));
                    this.classList.add('is-flipped');
                    
                    // En móvil, abrir automáticamente el modal después de 1 segundo
                    setTimeout(() => {
                        if (this.classList.contains('is-flipped')) {
                            openModal(this);
                        }
                    }, 1000);
                }
            } else {
                // Comportamiento para escritorio: el hover voltea (vía CSS), el clic abre el modal
                openModal(this);
            }
            e.stopPropagation();
        });
    });

    // Función para abrir el modal
    function openModal(cardElement) {
        const title = cardElement.dataset.title;
        const description = cardElement.dataset.description;
        const iconSrc = cardElement.querySelector('.card-back img').src;
        const borderColor = cardElement.querySelector('.card-back').style.borderColor;

        modalContent.style.borderColor = borderColor;
        modalBody.innerHTML = `
            <img src="${iconSrc}" alt="${title}">
            <h2 style="color: ${borderColor};">${title}</h2>
            <p>${description}</p>
        `;

        modal.classList.remove('hide');
        modal.classList.add('show');
        modal.style.display = 'block';
    }

    // Función para cerrar el modal
    function closeModal() {
        modal.classList.remove('show');
        modal.classList.add('hide');
        modal.addEventListener('animationend', function handler() {
            if (modal.classList.contains('hide')) {
                modal.style.display = 'none';
            }
            modal.removeEventListener('animationend', handler);
        });
    }

    closeButton.addEventListener('click', closeModal);

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });

    // Al hacer clic fuera de una tarjeta en la vista móvil, se vuelven a ocultar
    document.addEventListener('click', function (e) {
        if (window.innerWidth <= 992) {
            if (!e.target.closest('.card')) {
                cards.forEach(c => c.classList.remove('is-flipped'));
            }
        }
    });
}); 