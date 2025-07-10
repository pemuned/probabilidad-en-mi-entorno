document.addEventListener('DOMContentLoaded', () => {
    // Configuración de escenas
    const SCENE_CONFIG = {
        'scene-1': {
            id: 'scene-1',
            elements: {
                rollBtn: 'roll-dice-btn-esc1',
                simulateBtn: 'simulate-100-btn-esc1',
                resetBtn: 'reset-scene-btn',
                resultsTable: '#results-table tbody',
                feedback: 'feedback-message',
                continueBtn: 'continue-btn',
                progressBar: 'progress-bar',
                progressLabel: 'progress-label'
            },
            maxRolls: 10,
            resultGenerator: () => 0, // Siempre 0 para escena 1
            feedbackMessage: '<div class="feedback-avatar"><img src="app/img/avatar2.svg" alt="Avatar" /></div><div class="feedback-text"><p>Ahora que ha visto el resultado, ¿logró obtener un uno? Es imposible obtener un resultado diferente a 0, porque las 6 caras del dado tienen un 0. Note que este evento no podría ocurrir. A esto se le llama un <strong>evento imposible</strong>.</p></div>',
            feedbackCondition: (results) => results.every(r => r === 0)
        },
        'scene-2': {
            id: 'scene-2',
            elements: {
                rollBtn: 'roll-dice-btn-scene2',
                simulateBtn: 'simulate-100-btn-scene2',
                resetBtn: 'reset-scene-btn-scene2',
                resultsTable: '#results-table-scene2 tbody',
                feedback: 'feedback-message-scene2',
                continueBtn: 'continue-btn-scene2',
                progressBar: 'progress-bar-scene2',
                progressLabel: 'progress-label-scene2'
            },
            maxRolls: 10,
            resultGenerator: () => 1, // Siempre 1 para escena 2
            feedbackMessage: '<div class="feedback-avatar"><img src="app/img/avatar2.svg" alt="Avatar" /></div><div class="feedback-text"><p>¿Logró obtener un uno?, ¿en cuántas ocasiones? Es imposible obtener un resultado diferente a 1, porque las 6 caras del dado tienen un 1. Note que, en este caso, en cualquier cara que caiga el dado, se obtendrá como resultado un uno. A esto le denominamos <strong>evento seguro</strong>.</p></div>',
            feedbackCondition: (results) => results.every(r => r === 1)
        },
        'scene-3': {
            id: 'scene-3',
            elements: {
                rollBtn: 'roll-dice-btn-scene3',
                simulateBtn: 'simulate-100-btn-scene3',
                resetBtn: 'reset-scene-btn-scene3',
                resultsTable: '#results-table-scene3 tbody',
                feedback: 'feedback-message-scene3',
                continueBtn: 'continue-btn-scene3',
                progressBar: 'progress-bar-scene3',
                progressLabel: 'progress-label-scene3'
            },
            maxRolls: 10,
            resultGenerator: () => Math.floor(Math.random() * 6) + 1, // 1-6 aleatorio
            feedbackMessage: '<div class="feedback-avatar"><img src="app/img/avatar2.svg" alt="Avatar" /></div><div class="feedback-text"><p>Al conjunto de posibles resultados se le denomina <strong>espacio muestral</strong>, cada posibilidad en el espacio muestral es un elemento y se conoce como <strong>punto muestral</strong>.</p></div>',
            feedbackCondition: () => true // Siempre mostrar feedback
        }
    };

    // Estado global del juego
    const gameState = {
        currentActiveScene: 'scene-1',
        scenes: {},
        isAnimating: false
    };

    // Inicializar estado de cada escena
    Object.keys(SCENE_CONFIG).forEach(sceneId => {
        gameState.scenes[sceneId] = {
            rollCount: 0,
            results: [],
            isAnimating: false,
            isSimulating100: false
        };
    });

    // Configurar botón de materiales global
    const materialsBtnGlobal = document.getElementById('materials-btn-global');
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

            if (window.DiceThreeJS) {
                window.DiceThreeJS.rollDice(this.config.id);
            }
        }

        handleDiceRollResult(result) {
            this.state.rollCount++;

            // Para escenas 1 y 2, usar el resultado real del dado (que ya es fijo)
            // Para escena 3, usar el resultado real del dado
            const finalResult = result;
            this.state.results.push(finalResult);

            this.elements.rollBtn.disabled = false;

            setTimeout(() => {
                this.updateResultsTable(this.state.rollCount, finalResult);
            }, 100);

            this.updateProgressBar();

            if (this.state.rollCount >= this.config.maxRolls) {
                this.elements.rollBtn.style.display = 'none';
                this.elements.simulateBtn.style.display = 'none';
                this.showFeedback();
            }
        }

        simulate100Rolls() {
            if (this.state.isAnimating) return;

            this.state.isSimulating100 = true;
            this.state.rollCount = 0;
            this.elements.progressBar.style.width = '0%';
            this.elements.progressLabel.textContent = '0/100';
            this.elements.resultsTable.innerHTML = '';
            this.state.results.length = 0;

            // Deshabilitar botón durante la animación
            if (this.elements.simulateBtn) {
                this.elements.simulateBtn.disabled = true;
            }

            // Iniciar la simulación directamente sin ejecutar un lanzamiento adicional
            this.startSimulation();
        }

        startSimulation() {
            // Rehabilitar botón al comenzar la simulación
            if (this.elements.simulateBtn) {
                this.elements.simulateBtn.disabled = false;
            }

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

                // Usar el generador de resultados para las simulaciones
                const result = this.config.resultGenerator();
                this.state.results.push(result);
                this.updateResultsTable(currentRoll, result);

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

        updateResultsTable(launch, result) {
            // Validar que no excedamos 100 lanzamientos
            if (launch > 100) {
                console.warn(`Intento de agregar lanzamiento ${launch}, pero el máximo es 100`);
                return;
            }

            const newRow = this.elements.resultsTable.insertRow(0);
            const launchCell = newRow.insertCell(0);
            const resultCell = newRow.insertCell(1);

            launchCell.textContent = launch;

            // Resaltar el número 1 con color de fondo #d32272 para escena 3
            if (this.config.id === 'scene-3' && result === 1) {
                resultCell.innerHTML = `<span class='dice-sum-result' style='background-color: #d32272; color: white; padding: 2px 8px; border-radius: 8px;'>${result}</span>`;
            } else {
                resultCell.innerHTML = `<span class='dice-sum-result'>${result}</span>`;
            }

            newRow.classList.add('row-added-animate');
            setTimeout(() => newRow.classList.remove('row-added-animate'), 800);
        }



        showFeedback() {
            if (this.config.feedbackCondition(this.state.results)) {
                this.elements.feedback.innerHTML = this.config.feedbackMessage;
            }
            this.elements.feedback.classList.remove('feedback-hidden');
            this.elements.feedback.classList.add('show');
            this.elements.continueBtn.style.display = 'block';
            this.elements.simulateBtn.style.display = 'inline-block';
        }

        resetScene() {
            this.state.rollCount = 0;
            this.state.results.length = 0;
            this.elements.resultsTable.innerHTML = '';

            this.elements.rollBtn.disabled = false;
            this.elements.rollBtn.style.display = 'inline-block';
            this.elements.continueBtn.style.display = 'none';

            this.elements.feedback.classList.remove('show');
            this.elements.feedback.classList.add('feedback-hidden');
            this.elements.feedback.innerHTML = '';
            this.elements.feedback.className = 'feedback-hidden';

            if (window.DiceThreeJS) {
                window.DiceThreeJS.resetDice(this.config.id);
            }

            this.updateProgressBar();
            this.elements.simulateBtn.style.display = 'none';
            this.elements.simulateBtn.disabled = false;
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
            const sceneOrder = ['scene-1', 'scene-2', 'scene-3', 'scene-4'];
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

    function showWelcomeModal(modalId, buttonId) {
        const welcomeModal = document.getElementById(modalId);
        if (!welcomeModal) return;
        const startGameBtn = document.getElementById(buttonId);
        const closeBtn = welcomeModal.querySelector('.modal-close');

        welcomeModal.style.display = 'flex';
        welcomeModal.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        const dialog = welcomeModal.querySelector('.modal-dialog');
        if (dialog) {
            dialog.style.transform = 'scale(0.7) translateY(-50px)';
            dialog.style.opacity = '0';
        }

        setTimeout(() => {
            welcomeModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            if (dialog) {
                dialog.style.transform = 'scale(1) translateY(0)';
                dialog.style.opacity = '1';
            }
        }, 10);

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
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', hideWelcomeModal);
        }
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
            if (sceneType === 'scene-1') {
                loaderId = 'waiting-loader-esc1';
            } else if (sceneType === 'scene-2') {
                loaderId = 'waiting-loader-scene2';
            } else if (sceneType === 'scene-3') {
                loaderId = 'waiting-loader-scene3';
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
            if (sceneType === 'scene-1') {
                loaderId = 'waiting-loader-esc1';
            } else if (sceneType === 'scene-2') {
                loaderId = 'waiting-loader-scene2';
            } else if (sceneType === 'scene-3') {
                loaderId = 'waiting-loader-scene3';
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
            if (targetTabId === 'scene-4') {
                materialsContainer.style.display = 'none';
            } else {
                materialsContainer.style.display = 'flex';
            }
        }

        if (targetTabId !== 'scene-4' && window.DiceThreeJS) {
            gameState.currentActiveScene = targetTabId;
            const containerId = `threejs-container-${targetTabId.replace(/-/g, '')}`;
            window.DiceThreeJS.changeContainer(containerId);
            window.DiceThreeJS.changeScene(targetTabId);
        }
    }

    // Inicialización
    showWelcomeModal('welcome-modal', 'start-game-btn');

    // Configurar Three.js de forma asíncrona después de que la página esté cargada
    function initializeThreeJS() {
        if (window.DiceThreeJS) {
            window.DiceThreeJS.init('threejs-container-scene1');
            window.DiceThreeJS.init('threejs-container-scene2');
            window.DiceThreeJS.init('threejs-container-scene3');

            setTimeout(() => {
                window.DiceThreeJS.handleResize();

                // Ocultar loaders después de que Three.js esté completamente inicializado
                setTimeout(() => {
                    const loaders = [
                        'threejs-loader-scene1',
                        'threejs-loader-scene2',
                        'threejs-loader-scene3'
                    ];
                    loaders.forEach(loaderId => {
                        const loader = document.getElementById(loaderId);
                        if (loader) {
                            loader.style.display = 'none';
                        }
                    });
                }, 1000);
            }, 100);

            window.DiceThreeJS.changeContainer('threejs-container-scene1');
            window.DiceThreeJS.resetDice('scene-1');

            window.DiceThreeJS.setOnDiceResult((result) => {
                handleDiceResult(result, gameState.currentActiveScene);
            });

            window.DiceThreeJS.setOnDiceAnimationStart(() => {
                disableButtons(gameState.currentActiveScene);
            });

            window.DiceThreeJS.setOnDiceAnimationEnd(() => {
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
            const targetTab = tab.getAttribute('data-tab');
            switchTab(targetTab);
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
        if (window.DiceThreeJS) {
            window.DiceThreeJS.handleResize();
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