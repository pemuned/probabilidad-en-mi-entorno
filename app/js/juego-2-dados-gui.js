// Lógica del modal de bienvenida para el juego de 2 dados

document.addEventListener('DOMContentLoaded', () => {
    // --- Modal de bienvenida ---
    const welcomeModal = document.getElementById('welcome-modal-2dados');
    const startGameBtn = document.getElementById('start-game-btn-2dados');
    const closeBtn = welcomeModal.querySelector('.modal-close');

    if (welcomeModal) {
        // Configurar estado inicial del modal
        welcomeModal.style.display = 'flex';
        welcomeModal.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        const dialog = welcomeModal.querySelector('.modal-dialog');
        if (dialog) {
            dialog.style.transform = 'scale(0.7) translateY(-50px)';
            dialog.style.opacity = '0';
        }

        // Animación suave de entrada
        setTimeout(() => {
            welcomeModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            if (dialog) {
                dialog.style.transform = 'scale(1) translateY(0)';
                dialog.style.opacity = '1';
            }
        }, 10);
    } else {
        console.warn('Modal de bienvenida no encontrado');
    }
    function hideWelcomeModal() {
        welcomeModal.classList.remove('show');
        const dialog = welcomeModal.querySelector('.modal-dialog');
        if (dialog) {
            dialog.style.transform = 'scale(0.7) translateY(50px)';
            dialog.style.opacity = '0';
        }
        setTimeout(() => {
            welcomeModal.style.display = 'none';
            welcomeModal.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        }, 300);
    }
    if (startGameBtn) {
        startGameBtn.addEventListener('click', hideWelcomeModal);
    } else {
        console.warn('Botón de iniciar juego no encontrado');
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', hideWelcomeModal);
    } else {
        console.warn('Botón de cerrar modal no encontrado');
    }

    // Configuración de escenas
    const SCENE_CONFIG = {
        'scene-2d-1': {
            id: 'scene-2d-1',
            elements: {
                rollBtn: 'roll-dice-btn-2d-1',
                simulateBtn: 'simulate-100-btn-2d-1',
                resetBtn: 'reset-scene-btn-2d-1',
                resultsTable: '#results-table tbody',
                feedback: 'feedback-message',
                continueBtn: 'continue-btn-2d-1',
                progressBar: 'progress-bar-2d-1',
                progressLabel: 'progress-label-2d-1'
            },
            maxRolls: 10,
            resultGenerator: () => ({
                d1: Math.floor(Math.random() * 6) + 1,
                d2: Math.floor(Math.random() * 6) + 1
            }),
            feedbackMessage: (results) => {
                const countSix = results.filter(r => r.d1 + r.d2 === 6).length;
                return `<div class="feedback-avatar"><img src="app/img/avatar2.svg" alt="Avatar" /></div><div class="feedback-text"><p>Note que en este experimento hay <strong>${countSix}</strong> posibilidades de obtener seis puntos en total en diez lanzamientos. En este caso estamos ante un <strong>evento compuesto</strong>, porque esta situación considera la unión de los resultados de dos eventos simples.</p></div>`;
            },
            feedbackCondition: () => true,
            highlightSum: 6
        },
        'scene-2d-2': {
            id: 'scene-2d-2',
            elements: {
                rollBtn: 'roll-dice-btn-2d-2',
                simulateBtn: 'simulate-100-btn-2d-2',
                resetBtn: 'reset-scene-btn-2d-2',
                resultsTable: '#results-table-scene2 tbody',
                feedback: 'feedback-message-scene2',
                continueBtn: 'continue-btn-scene2',
                progressBar: 'progress-bar-2d-2',
                progressLabel: 'progress-label-2d-2'
            },
            maxRolls: 10,
            resultGenerator: () => ({
                d1: Math.floor(Math.random() * 6) + 1,
                d2: Math.floor(Math.random() * 6) + 1
            }),
            feedbackMessage: (results) => {
                const hasZero = results.some(r => r.d1 + r.d2 === 0);
                const hasOne = results.some(r => r.d1 + r.d2 === 1);
                let msg = '¿Obtuvo un cero o un uno? En este caso la situación es similar a la de lanzar un dado de seis caras en blanco y la posibilidad de obtener un uno, es decir, estamos ante un <strong>evento imposible</strong>.';
                if (hasZero || hasOne) {
                    msg = '<strong>¡Atención!</strong> Se obtuvo un 0 o un 1, lo cual no es posible con dos dados numerados del 1 al 6.';
                }
                return `<div class="feedback-avatar"><img src="app/img/avatar2.svg" alt="Avatar" /></div><div class="feedback-text"><p>${msg}</p></div>`;
            },
            feedbackCondition: () => true,
            highlightSum: null
        }
    };

    // Estado global del juego
    const gameState = {
        currentActiveScene: 'scene-2d-1',
        scenes: {},
        isAnimating: false
    };

    // Inicializar estado de cada escena
    Object.keys(SCENE_CONFIG).forEach(sceneId => {
        gameState.scenes[sceneId] = {
            rollCount: 0,
            results: [],
            isAnimating: false,
            isSimulating100: false,
            hasSimulated100: false // Nuevo flag para controlar si ya se usó la simulación
        };
    });

    // Configurar botón de materiales global
    const materialsBtnGlobal = document.getElementById('materials-btn-global-2dados');
    if (materialsBtnGlobal) {
        materialsBtnGlobal.addEventListener('click', () => {
            const materialsModal = document.getElementById('materials-modal');
            if (materialsModal) {
                showModal(materialsModal);
            }
        });
    }

    // Clase para gestionar una escena individual
    class SceneManager {
        constructor(config) {
            this.config = config;
            this.elements = this.getElements();
            this.state = gameState.scenes[config.id];
            this.initializeElements();
            this.bindEvents();
        }

        getElements() {
            const elements = {};
            Object.keys(this.config.elements).forEach(key => {
                const selector = this.config.elements[key];
                if (selector.startsWith('#')) {
                    elements[key] = document.querySelector(selector);
                } else {
                    elements[key] = document.getElementById(selector);
                }
            });
            return elements;
        }

        initializeElements() {
            // Ocultar feedback inicialmente
            if (this.elements.feedback) {
                this.elements.feedback.classList.add('feedback-hidden');
                this.elements.feedback.innerHTML = '';
                this.elements.feedback.className = 'feedback-hidden';
            }

            // Ocultar botón de simular 100 inicialmente
            if (this.elements.simulateBtn) {
                this.elements.simulateBtn.style.display = 'none';
            }
        }

        bindEvents() {
            if (this.elements.rollBtn) {
                this.elements.rollBtn.addEventListener('click', () => this.handleDiceRoll());
            }
            if (this.elements.simulateBtn) {
                this.elements.simulateBtn.addEventListener('click', () => this.simulate100Rolls());
            }
            if (this.elements.resetBtn) {
                this.elements.resetBtn.addEventListener('click', () => this.resetScene());
            }
            if (this.elements.continueBtn) {
                this.elements.continueBtn.addEventListener('click', () => this.handleContinue());
            }
        }

        handleDiceRoll() {
            if (this.state.isAnimating) return;
            if (this.state.rollCount >= this.config.maxRolls) return;

            gameState.currentActiveScene = this.config.id;
            this.elements.rollBtn.disabled = true;

            if (window.DiceTwoThreeJS) {
                window.DiceTwoThreeJS.rollDice(this.config.id);
            }
        }

        handleDiceRollResult(result) {
            this.state.rollCount++;
            this.state.results.push(result);

            this.elements.rollBtn.disabled = false;

            setTimeout(() => {
                this.updateResultsTable(this.state.rollCount, result.d1, result.d2);
            }, 50);

            this.updateProgressBar();

            if (this.state.rollCount >= this.config.maxRolls) {
                this.elements.rollBtn.style.display = 'none';
                this.elements.simulateBtn.style.display = 'none';
                this.showFeedback();
            }
        }

        simulate100Rolls() {
            if (this.state.isAnimating) return;
            if (this.state.hasSimulated100) return; // Evitar múltiples simulaciones

            this.state.isSimulating100 = true;
            this.state.hasSimulated100 = true; // Marcar como ya simulado
            this.state.rollCount = 0;
            this.elements.progressBar.style.width = '0%';
            this.elements.progressLabel.textContent = '0/100';
            this.elements.resultsTable.innerHTML = '';
            this.state.results.length = 0;

            // Deshabilitar botón durante y después de la animación
            if (this.elements.simulateBtn) {
                this.elements.simulateBtn.disabled = true;
                this.elements.simulateBtn.textContent = 'Simulación completada';
            }

            // Iniciar la simulación directamente sin ejecutar un lanzamiento adicional
            this.startSimulation();
        }

        startSimulation() {
            // NO rehabilitar botón - ya está marcado como usado

            const totalRolls = 100;
            let currentRoll = 0;

            const simulateNextRoll = () => {
                // Verificar primero si ya llegamos al límite
                if (currentRoll >= totalRolls) {
                    this.state.rollCount = totalRolls;
                    this.state.isSimulating100 = false;
                    this.elements.rollBtn.style.display = 'none';
                    this.elements.simulateBtn.style.display = 'none';
                    this.showFeedback();
                    return;
                }

                // Incrementar después de verificar
                currentRoll++;

                // Verificación adicional de seguridad
                if (currentRoll > totalRolls) {
                    console.warn(`Simulación excedió el límite: ${currentRoll} > ${totalRolls}`);
                    this.state.rollCount = totalRolls;
                    this.state.isSimulating100 = false;
                    this.elements.rollBtn.style.display = 'none';
                    this.elements.simulateBtn.style.display = 'none';
                    this.showFeedback();
                    return;
                }

                const result = this.config.resultGenerator();
                this.state.results.push(result);
                this.updateResultsTable(currentRoll, result.d1, result.d2);

                // Actualizar barra de progreso cada 20 lanzamientos
                if (currentRoll % 20 === 0 || currentRoll === totalRolls) {
                    const percentage = (currentRoll / totalRolls) * 100;
                    this.elements.progressBar.style.width = `${percentage}%`;
                    this.elements.progressLabel.textContent = `${currentRoll}/${totalRolls}`;
                }

                // Programar el siguiente lanzamiento solo si no hemos llegado al límite
                if (currentRoll < totalRolls) {
                    setTimeout(simulateNextRoll, 20);
                } else {
                    // Si llegamos exactamente a 100, finalizar
                    this.state.rollCount = totalRolls;
                    this.state.isSimulating100 = false;
                    this.elements.rollBtn.style.display = 'none';
                    this.elements.simulateBtn.style.display = 'none';
                    this.showFeedback();
                }
            };

            simulateNextRoll();
        }

        updateResultsTable(launch, d1, d2) {
            // Validar que no excedamos 100 lanzamientos
            if (launch > 100) {
                console.warn(`Intento de agregar lanzamiento ${launch}, pero el máximo es 100`);
                return;
            }

            const newRow = this.elements.resultsTable.insertRow(0);
            const launchCell = newRow.insertCell(0);
            const resultCell = newRow.insertCell(1);

            launchCell.textContent = launch;

            const sum = d1 + d2;

            // Resaltar el resultado específico si está configurado
            if (this.config.highlightSum && sum === this.config.highlightSum) {
                resultCell.innerHTML = `<span class='dice-sum-box'>${d1}</span> <span class='dice-sum-sign'>+</span> <span class='dice-sum-box'>${d2}</span> <span class='dice-sum-sign'>=</span> <span class='dice-sum-result' style='background-color: #d32272; color: white; padding: 2px 8px; border-radius: 8px;'>${sum}</span>`;
            } else {
                resultCell.innerHTML = `<span class='dice-sum-box'>${d1}</span> <span class='dice-sum-sign'>+</span> <span class='dice-sum-box'>${d2}</span> <span class='dice-sum-sign'>=</span> <span class='dice-sum-result'>${sum}</span>`;
            }

            newRow.classList.add('row-added-animate');
            setTimeout(() => newRow.classList.remove('row-added-animate'), 800);
        }



        showFeedback() {
            if (this.config.feedbackCondition(this.state.results)) {
                this.elements.feedback.innerHTML = this.config.feedbackMessage(this.state.results);
            }
            this.elements.feedback.classList.remove('feedback-hidden');
            this.elements.feedback.classList.add('show');
            this.elements.continueBtn.style.display = 'block';

            // Solo mostrar el botón si no se ha usado la simulación de 100
            if (!this.state.hasSimulated100) {
                this.elements.simulateBtn.style.display = 'inline-block';
            }
        }

        resetScene() {
            this.state.rollCount = 0;
            this.state.results.length = 0;
            this.state.hasSimulated100 = false; // Resetear el flag de simulación
            this.elements.resultsTable.innerHTML = '';

            this.elements.rollBtn.disabled = false;
            this.elements.rollBtn.style.display = 'inline-block';
            this.elements.simulateBtn.disabled = false;
            this.elements.simulateBtn.style.display = 'none';
            this.elements.simulateBtn.textContent = 'Simular 100 lanzamientos'; // Restaurar texto original

            this.elements.feedback.classList.remove('show');
            this.elements.feedback.classList.add('feedback-hidden');
            this.elements.feedback.innerHTML = '';
            this.elements.feedback.className = 'feedback-hidden';

            this.elements.continueBtn.style.display = 'none';
            this.elements.progressBar.style.width = '0%';
            this.elements.progressLabel.textContent = `0/${this.config.maxRolls}`;

            if (window.DiceTwoThreeJS) {
                window.DiceTwoThreeJS.resetDice(this.config.id);
            }

            this.state.isAnimating = false;
        }

        updateProgressBar(total = this.config.maxRolls) {
            const safeRollCount = Math.min(this.state.rollCount, total);
            const percentage = Math.min((safeRollCount / total) * 100, 100);
            this.elements.progressBar.style.width = `${percentage}%`;
            this.elements.progressLabel.textContent = `${safeRollCount}/${total}`;
        }

        handleContinue() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            this.resetScene();

            const nextScene = this.getNextScene();
            if (nextScene) {
                setTimeout(() => {
                    switchTab(nextScene);
                }, 300);
            }
        }

        getNextScene() {
            const sceneOrder = ['scene-2d-1', 'scene-2d-2', 'scene-2d-3'];
            const currentIndex = sceneOrder.indexOf(this.config.id);
            return sceneOrder[currentIndex + 1] || null;
        }
    }

    // Inicializar gestores de escena
    const sceneManagers = {};
    Object.keys(SCENE_CONFIG).forEach(sceneId => {
        sceneManagers[sceneId] = new SceneManager(SCENE_CONFIG[sceneId]);
    });

    // Funciones de utilidad
    function showModal(modal) {
        if (!modal) return;

        // Configurar estado inicial para animación fade
        modal.style.display = 'flex';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        const dialog = modal.querySelector('.modal-dialog');
        if (dialog) {
            dialog.style.transform = 'scale(0.7) translateY(-50px)';
            dialog.style.opacity = '0';
        }

        // Animar el fade in
        setTimeout(() => {
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            if (dialog) {
                dialog.style.transform = 'scale(1) translateY(0)';
                dialog.style.opacity = '1';
            }
        }, 10);
    }

    function hideModal(modal) {
        if (!modal) return;
        const dialog = modal.querySelector('.modal-dialog');
        if (dialog) {
            dialog.style.transform = 'scale(0.7) translateY(50px)';
            dialog.style.opacity = '0';
        }
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        }, 300);
    }

    function handleDiceResult(result, sceneType) {
        const manager = sceneManagers[sceneType];
        if (manager) {
            manager.handleDiceRollResult(result);
        }
    }

    function disableButtons(sceneType) {
        const manager = sceneManagers[sceneType];
        if (manager) {
            manager.state.isAnimating = true;
            if (manager.elements.rollBtn) {
                manager.elements.rollBtn.disabled = true;
            }
            // Mostrar loader cuando se deshabilita el botón
            let loaderId;
            if (sceneType === 'scene-2d-1') {
                loaderId = 'waiting-loader-2d-1';
            } else if (sceneType === 'scene-2d-2') {
                loaderId = 'waiting-loader-2d-2';
            }
            if (loaderId) {
                showWaitingLoader(loaderId);
            }
        }
    }

    function enableButtons(sceneType) {
        const manager = sceneManagers[sceneType];
        if (manager) {
            manager.state.isAnimating = false;
            if (manager.elements.rollBtn) {
                manager.elements.rollBtn.disabled = false;
            }
            // Ocultar loader cuando se habilita el botón
            let loaderId;
            if (sceneType === 'scene-2d-1') {
                loaderId = 'waiting-loader-2d-1';
            } else if (sceneType === 'scene-2d-2') {
                loaderId = 'waiting-loader-2d-2';
            }
            if (loaderId) {
                hideWaitingLoader(loaderId);
            }
        }
    }

    function switchTab(targetTabId) {
        const targetTab = document.querySelector(`[data-tab="${targetTabId}"]`);
        const targetContent = document.getElementById(targetTabId);

        if (!targetTab || !targetContent) return;

        const currentActiveContent = document.querySelector('.tab-content.active');
        if (currentActiveContent) {
            currentActiveContent.style.opacity = '0';
            currentActiveContent.style.transform = 'translateY(20px)';

            setTimeout(() => {
                currentActiveContent.classList.remove('active');
                targetContent.classList.add('active');
                setTimeout(() => {
                    targetContent.style.opacity = '1';
                    targetContent.style.transform = 'translateY(0)';
                }, 50);
            }, 200);
        } else {
            targetContent.classList.add('active');
            setTimeout(() => {
                targetContent.style.opacity = '1';
                targetContent.style.transform = 'translateY(0)';
            }, 50);
        }

        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        targetTab.classList.add('active');

        // Ocultar/mostrar botones de materiales según la pestaña
        const materialsContainer = document.querySelector('.materials-button-container');
        if (materialsContainer) {
            if (targetTabId === 'scene-2d-3') {
                materialsContainer.style.display = 'none';
            } else {
                materialsContainer.style.display = 'flex';
            }
        }

        if (targetTabId !== 'scene-2d-3' && window.DiceTwoThreeJS) {
            gameState.currentActiveScene = targetTabId;
            const containerId = `threejs-container-${targetTabId.replace(/-/g, '')}`;
            window.DiceTwoThreeJS.changeContainer(containerId);
            window.DiceTwoThreeJS.changeScene(targetTabId);
        }
    }

    // Configurar Three.js de forma asíncrona después de que la página esté cargada
    function initializeThreeJS() {
        if (window.DiceTwoThreeJS) {
            window.DiceTwoThreeJS.init('threejs-container-scene2d1');
            window.DiceTwoThreeJS.init('threejs-container-scene2d2');

            setTimeout(() => {
                window.DiceTwoThreeJS.handleResize();

                // Ocultar loaders después de que Three.js esté completamente inicializado
                setTimeout(() => {
                    const loaders = [
                        'threejs-loader-scene2d1',
                        'threejs-loader-scene2d2'
                    ];
                    loaders.forEach(loaderId => {
                        const loader = document.getElementById(loaderId);
                        if (loader) {
                            loader.style.display = 'none';
                        }
                    });
                }, 1000);
            }, 100);

            window.DiceTwoThreeJS.changeContainer('threejs-container-scene2d1');
            window.DiceTwoThreeJS.resetDice('scene-2d-1');

            window.DiceTwoThreeJS.setOnDiceResult((result) => {
                handleDiceResult(result, gameState.currentActiveScene);
            });

            window.DiceTwoThreeJS.setOnDiceAnimationStart(() => {
                disableButtons(gameState.currentActiveScene);
            });

            window.DiceTwoThreeJS.setOnDiceAnimationEnd(() => {
                enableButtons(gameState.currentActiveScene);
            });
        }
    }

    // Inicializar Three.js después de que la página esté completamente cargada
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Esperar a que todos los recursos estén cargados
            window.addEventListener('load', () => {
                setTimeout(initializeThreeJS, 200);
            });
        });
    } else {
        // Si DOMContentLoaded ya ocurrió, esperar a window.onload
        window.addEventListener('load', () => {
            setTimeout(initializeThreeJS, 200);
        });
    }

    // Configurar eventos de pestañas
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            switchTab(target);
        });
    });

    // Configurar eventos de modales
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', () => {
            hideModal(button.closest('.modal-overlay'));
        });
    });

    // Configurar eventos de redimensionamiento
    window.addEventListener('resize', () => {
        if (window.DiceTwoThreeJS) {
            window.DiceTwoThreeJS.handleResize();
        }
    });

    // Configurar botón Go To Top
    const goToTopBtn = document.getElementById('go-to-top-btn');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 200) {
            goToTopBtn?.classList.add('visible');
        } else {
            goToTopBtn?.classList.remove('visible');
        }
    });

    if (goToTopBtn) {
        goToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Funciones para el loader de espera
    function showWaitingLoader(loaderId) {
        const loader = document.getElementById(loaderId);
        if (loader) {
            loader.style.display = 'flex';
        }
    }

    function hideWaitingLoader(loaderId) {
        const loader = document.getElementById(loaderId);
        if (loader) {
            loader.style.display = 'none';
        }
    }
}); 