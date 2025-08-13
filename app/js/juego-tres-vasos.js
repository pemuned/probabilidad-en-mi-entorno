// Funcionalidad de pestañas con Fade
let switchTab; // Declarar la función globalmente

function initTabs() {
    const tabItems = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');

    switchTab = function (targetTabId) {
        // Obtener la pestaña y contenido objetivo
        const targetTab = document.querySelector(`[data-tab="${targetTabId}"]`);
        const targetContent = document.getElementById(targetTabId);

        if (!targetTab || !targetContent) return;

        // Fade out del contenido actual
        const currentActiveContent = document.querySelector('.tab-content.active');
        if (currentActiveContent) {
            currentActiveContent.style.opacity = '0';
            currentActiveContent.style.transform = 'translateY(20px)';

            setTimeout(() => {
                currentActiveContent.classList.remove('active');

                // Fade in del nuevo contenido
                targetContent.classList.add('active');
                setTimeout(() => {
                    targetContent.style.opacity = '1';
                    targetContent.style.transform = 'translateY(0)';
                }, 50);
            }, 200);
        } else {
            // Si no hay contenido activo, mostrar directamente
            targetContent.classList.add('active');
            setTimeout(() => {
                targetContent.style.opacity = '1';
                targetContent.style.transform = 'translateY(0)';
            }, 50);
        }

        // Actualizar pestañas activas
        tabItems.forEach(t => t.classList.remove('active'));
        targetTab.classList.add('active');

        // Ocultar/mostrar botones de materiales según la pestaña
        const materialsContainer = document.querySelector('.materials-button-container');
        if (materialsContainer) {
            if (targetTabId === 'analysis') {
                materialsContainer.style.display = 'none';
            } else {
                materialsContainer.style.display = 'flex';
            }
        }
    };

    tabItems.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

// Funcionalidad del modal de materiales
function initMaterialsModal() {
    const materialsModal = document.getElementById('materials-modal');
    const materialsBtnIntro = document.getElementById('materials-btn-intro');
    const modalClose = materialsModal.querySelector('.modal-close');

    // Abrir modal
    materialsBtnIntro.addEventListener('click', () => {
        materialsModal.classList.add('show');
        setTimeout(() => {
            materialsModal.classList.add('animate-in');
        }, 10);
    });

    // Cerrar modal
    modalClose.addEventListener('click', () => {
        materialsModal.classList.remove('animate-in');
        setTimeout(() => {
            materialsModal.classList.remove('show');
        }, 300);
    });

    // Cerrar modal al hacer clic fuera
    materialsModal.addEventListener('click', (e) => {
        if (e.target === materialsModal) {
            materialsModal.classList.remove('animate-in');
            setTimeout(() => {
                materialsModal.classList.remove('show');
            }, 300);
        }
    });
}

// Funcionalidad del modal de instrucciones
function initInstructionsModal() {
    const instructionsModal = document.getElementById('instructions-modal');
    const instructionsBtn = document.getElementById('instructions-btn');
    const startGameBtn = document.getElementById('start-game-btn');
    const modalClose = instructionsModal.querySelector('.modal-close');

    // Abrir modal manualmente
    instructionsBtn.addEventListener('click', () => {
        openInstructionsModal();
    });

    // Cerrar modal
    modalClose.addEventListener('click', () => {
        closeInstructionsModal();
    });

    // Cerrar modal al hacer clic fuera
    instructionsModal.addEventListener('click', (e) => {
        if (e.target === instructionsModal) {
            closeInstructionsModal();
        }
    });

    // Botón empezar
    startGameBtn.addEventListener('click', () => {
        closeInstructionsModal();
    });

    function openInstructionsModal() {
        instructionsModal.classList.add('show');
        setTimeout(() => {
            instructionsModal.classList.add('animate-in');
        }, 10);
    }

    function closeInstructionsModal() {
        instructionsModal.classList.remove('animate-in');
        setTimeout(() => {
            instructionsModal.classList.remove('show');
        }, 300);
    }

    // Exponer la función para uso externo
    window.openInstructionsModal = openInstructionsModal;
}

// Funcionalidad del botón continuar
function initContinueButton() {
    const continueBtn = document.getElementById('continue-to-game-btn');

    continueBtn.addEventListener('click', () => {
        // Cambiar a la pestaña del juego con fade
        setTimeout(() => {
            if (typeof switchTab === 'function') {
                switchTab('game');
            } else {
                // Fallback al método original
                const gameTab = document.querySelector('[data-tab="game"]');
                const gameContent = document.getElementById('game');
                const introTab = document.querySelector('[data-tab="intro"]');
                const introContent = document.getElementById('intro');

                if (gameTab && gameContent && introTab && introContent) {
                    introTab.classList.remove('active');
                    gameTab.classList.add('active');
                    introContent.classList.remove('active');
                    gameContent.classList.add('active');
                }
            }

            // Mostrar modal de instrucciones automáticamente
            setTimeout(() => {
                if (window.openInstructionsModal) {
                    window.openInstructionsModal();
                }
            }, 500);
        }, 300);
    });
}

// Estado de los vasos y pelota
let cupOrder = [0, 1, 2]; // Qué vaso está en cada posición (0=izquierda, 1=centro, 2=derecha)
let ballUnder = Math.floor(Math.random() * 3); // Qué vaso contiene la pelota (0, 1, 2)
let canSelect = false; // Ahora inicia deshabilitado
let isShuffling = false;
let hasShuffled = false; // Nuevo: para saber si ya se mezcló al menos una vez
const grid = document.getElementById('cups-numbers-grid');
const cupDivs = Array.from(grid.querySelectorAll('.cup-3d'));
const shuffleBtn = document.getElementById('shuffle-btn');
const debugElement = document.getElementById('ball-cup-number');

// Crear elemento de pelota
let ballElement = null;

function createBallElement() {
    if (ballElement) {
        ballElement.remove();
    }
    ballElement = document.createElement('img');
    ballElement.src = 'assets/images/ball.svg';
    ballElement.alt = 'Pelota';
    ballElement.className = 'ball-svg';
    return ballElement;
}

function updateDebugInfo() {
    // Encontrar en qué posición está el vaso que contiene la pelota
    const ballPosition = cupOrder.indexOf(ballUnder);
    console.log('Debug: La pelota está en el vaso número', ballPosition + 1);
}

function updateCupsGrid() {
    cupDivs.forEach((cup, i) => {
        // Mover el vaso a su nueva posición según cupOrder
        cup.style.gridColumn = (i + 1);
        cup.classList.remove('selected', 'revealed', 'revealed-empty');

        // Remover pelota de todos los vasos
        const existingBall = cup.querySelector('.ball-svg');
        if (existingBall) {
            existingBall.remove();
        }
    });

    // Ocultar pelota
    if (ballElement) {
        ballElement.classList.remove('visible');
    }

    // Limpiar tooltip del vaso vacío
    updateEmptyCupTooltip(null);

    // Actualizar información de debug
    updateDebugInfo();
}

function shuffleCups() {
    if (isShuffling || !canSelect && hasShuffled) return;

    isShuffling = true;
    canSelect = false;
    shuffleBtn.disabled = true;
    setInteractionDisabled(true);
    shuffleBtn.classList.remove('attention-bounce');

    // Mostrar mensaje de mezclando
    setGameMessage('Mezclando...');

    // Ocultar la pelota y resetear estados
    cupDivs.forEach(cup => {
        cup.classList.remove('selected', 'revealed', 'revealed-empty');
        const existingBall = cup.querySelector('.ball-svg');
        if (existingBall) {
            existingBall.remove();
        }
    });

    // Limpiar tooltip del vaso vacío
    updateEmptyCupTooltip(null);

    // Obtener referencias a los contenedores
    const animationContainer = document.querySelector('.montyhall-container-animation');
    const cupsGrid = document.getElementById('cups-numbers-grid');

    // Mostrar animación con fade in
    animationContainer.classList.add('show');

    // Ocultar solo la cuadrícula de vasos, manteniendo visible la mesa
    cupsGrid.classList.add('hidden');

    // Ejecutar la animación de mezcla
    shuffleMultipleTimes();

    // Generar nuevo orden aleatorio para los vasos
    let newOrder;
    do {
        newOrder = [0, 1, 2];
        for (let i = newOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
        }
    } while (newOrder.join() === cupOrder.join());

    // Aplicar el nuevo orden
    cupOrder = newOrder;

    // Reasignar la pelota a un vaso aleatorio
    ballUnder = Math.floor(Math.random() * 3);

    // Actualizar la cuadrícula
    updateCupsGrid();

    // Después de que termine la animación (28 mezclas * 100ms + margen)
    setTimeout(() => {
        // Ocultar animación con fade out
        animationContainer.classList.remove('show');

        // Mostrar la cuadrícula de vasos de nuevo
        cupsGrid.classList.remove('hidden');

        // Finalizar la mezcla
        setTimeout(() => {
            isShuffling = false;
            canSelect = true;
            hasShuffled = true;
            // El botón shuffle permanece deshabilitado hasta que se complete la ronda
            // Solo se habilita en afterMix() cuando el juego está listo para la siguiente fase
            setInteractionDisabled(false);

            // Asegurar que el tooltip esté disponible para la siguiente ronda
            const emptyTooltip = document.getElementById('empty-cup-tooltip');
            if (emptyTooltip && !emptyTooltip.parentNode) {
                // Si el tooltip no tiene padre, agregarlo al body temporalmente
                document.body.appendChild(emptyTooltip);
                emptyTooltip.style.display = 'none';
            }

            // Llamar a afterMix() después de que termine completamente la animación
            afterMix();
        }, 300); // Tiempo para que termine el fade out
    }, 3000); // Tiempo total de la animación (28 * 100ms + margen)
}

function setInteractionDisabled(disabled, disableShuffleBtn = true) {
    const grid = document.getElementById('cups-numbers-grid');
    const shuffleBtn = document.getElementById('shuffle-btn');
    if (disabled) {
        grid.classList.add('disabled-interaction');
        if (disableShuffleBtn && shuffleBtn) {
            shuffleBtn.disabled = true;
            shuffleBtn.classList.add('disabled-interaction');
        } else if (shuffleBtn) {
            shuffleBtn.classList.remove('disabled-interaction');
        }
    } else {
        grid.classList.remove('disabled-interaction');
        if (shuffleBtn) {
            shuffleBtn.classList.remove('disabled-interaction');
        }
    }
}

function revealCup(idx) {
    if (!canSelect || isShuffling) return;

    canSelect = false;
    setInteractionDisabled(true);

    // Aplicar efecto de selección con animación
    cupDivs.forEach((cup, i) => {
        cup.classList.remove('selected', 'revealed');
        if (i === idx) {
            cup.classList.add('selected');
        }
    });

    // Pequeña pausa para que se vea la selección y se posicione correctamente
    setTimeout(() => {
        // Verificar si la pelota está bajo el vaso seleccionado
        const cupInPosition = cupOrder[idx];
        const ballIsUnderSelectedCup = (cupInPosition === ballUnder);

        if (ballIsUnderSelectedCup) {
            const selectedCup = cupDivs[idx];
            const ball = createBallElement();
            selectedCup.appendChild(ball);
            setTimeout(() => {
                ball.classList.add('visible');
            }, 50);
            selectedCup.classList.add('revealed');
        } else {
            cupDivs[idx].classList.add('revealed');
        }

        setTimeout(() => {
            canSelect = true;
            setInteractionDisabled(false);
        }, 2000);
    }, 300);
}

// --- Monty Hall Game States ---
const GAME_STATE = {
    WAITING_MIX: 'esperando-mezclar',
    WAITING_SELECTION: 'esperando-seleccion',
    WAITING_DECISION: 'esperando-decision',
    READY_TO_REVEAL: 'revelar',
    FINAL: 'final',
};
let gameState = null;
let selectedCup = null;
let revealedEmptyCup = null;
let remainingCup = null;
let userChanged = false;

const gameMessage = document.getElementById('game-message');
const selectedCupNumber = document.getElementById('selected-cup-number');
const revealBtn = document.getElementById('reveal-btn');

// --- Rondas y progreso ---
const MAX_ROUNDS = 10;
let roundCount = 0;
let results = []; // { changed: bool, win: bool }

const progressBar = document.getElementById('progress-bar-vasos');
const progressLabel = document.getElementById('progress-label-vasos');
const feedbackMessage = document.getElementById('feedback-message-vasos');

const restartBtn = document.getElementById('restart-btn-vasos');
const analysisBtn = document.getElementById('analysis-btn');
const restartBtnHeader = document.getElementById('restart-btn-header');

// Variables globales para referencias DOM
let resultsTableBody;
let resultsTableContainer;
let dynamicInitialCup;
let progressContainer;

function updateProgressBar() {
    const percent = (roundCount / MAX_ROUNDS) * 100;
    progressBar.style.width = percent + '%';
    progressLabel.textContent = `${roundCount}/${MAX_ROUNDS}`;
}

function resetRounds() {
    roundCount = 0;
    results = [];
    updateProgressBar();
    feedbackMessage.classList.remove('show');
    feedbackMessage.classList.add('feedback-hidden');
    feedbackMessage.innerHTML = '';
    feedbackMessage.className = 'feedback-hidden'; // Reset CSS classes
    restartBtn.style.display = 'none';
    if (resultsTableBody) resultsTableBody.innerHTML = '';
    if (resultsTableContainer) resultsTableContainer.style.display = '';
    if (progressContainer) progressContainer.style.background = '';
    if (progressBar) progressBar.style.background = '';
    if (progressLabel) progressLabel.style.color = '';
    if (dynamicInitialCup) dynamicInitialCup.textContent = '1';

    // Actualizar la tabla para limpiarla completamente
    updateResultsTableVasos();
}

function showFinalFeedback() {
    let winCount = results.filter(r => r.win).length;
    let changedCount = results.filter(r => r.changed).length;
    let keptCount = results.filter(r => !r.changed).length;

    let msg = '';
    let feedbackClass = '';

    // Análisis más educativo sin restricciones de patrón
    if (changedCount === 0) {
        msg = `En las ${MAX_ROUNDS} ocasiones sin cambiar de elección, ha acertado la posición de la bolita en <strong>${winCount}</strong> ocasiones.`;
        feedbackClass = 'feedback-message feedback-message-success';
    } else if (keptCount === 0) {
        msg = `¡Felicidades por completar el juego! Cambiando cada vez su elección ha acertado la posición de la bolita en <strong>${winCount}</strong> ocasiones.`;
        feedbackClass = 'feedback-message feedback-message-success';
    } else {
        // Caso mixto - más educativo
        let changedWins = results.filter(r => r.changed && r.win).length;
        let keptWins = results.filter(r => !r.changed && r.win).length;

        msg = `Ha jugado ${MAX_ROUNDS} rondas con una estrategia mixta. Al mantener su elección (${keptCount == 1 ? 'una vez' : `${keptCount} veces`}) acertó ${keptWins == 1 ? 'una vez' : `${keptWins} veces`}, y al cambiar (${changedCount == 1 ? 'una vez' : `${changedCount} veces`}) acertó ${changedWins == 1 ? 'una vez' : `${changedWins} veces`}. Total de aciertos: <strong>${winCount}</strong>.`;
        feedbackClass = 'feedback-message feedback-message-info';
    }

    feedbackMessage.innerHTML = `<div class="feedback-avatar"><img src="app/img/avatar2.svg" alt="Avatar" /></div><div class="feedback-text"><p>${msg}</p></div>`;
    feedbackMessage.className = feedbackClass;
    feedbackMessage.classList.add('show');
    feedbackMessage.classList.remove('feedback-hidden');
    restartBtn.style.display = 'block';
    if (analysisBtn) analysisBtn.style.display = 'block';

    // Deshabilitar el botón de mezclar y la interacción
    setInteractionDisabled(true, true);
}

function resetGameUI() {
    selectedCup = null;
    revealedEmptyCup = null;
    remainingCup = null;
    userChanged = false;
    selectedCupNumber.textContent = '';
    selectedCupNumber.style.display = 'none';
    revealBtn.style.display = 'none';
    // Limpiar tooltip del vaso vacío
    updateEmptyCupTooltip(null);
    cupDivs.forEach(cup => {
        cup.classList.remove('selected', 'revealed', 'revealed-empty');
        // Eliminar la bolita si existe
        const ball = cup.querySelector('.ball-svg');
        if (ball) ball.remove();
    });
}

function setGameMessage(text) {
    gameMessage.innerHTML = text;
    gameMessage.classList.remove('message-flash');
    // Forzar reflow para reiniciar la animación
    void gameMessage.offsetWidth;
    gameMessage.classList.add('message-flash');
}

function updateResultsTableVasos() {
    if (!resultsTableBody) return;

    // Limpiar la tabla para reconstruirla completamente
    resultsTableBody.innerHTML = '';

    // Agregar todas las filas de resultados
    results.forEach((r, i) => {
        const roundNumber = i + 1;
        const cupOrder = r.cupOrder;
        const ballUnder = r.ballUnder;
        const bolitaPos = cupOrder.indexOf(ballUnder);
        let cols = ["Vacío", "Vacío", "Vacío"];
        cols[bolitaPos] = "Bolita";

        // Determinar resultado real y opuesto
        let mantener, cambiar;
        if (r.changed) {
            // Usuario cambió de vaso
            if (r.win) {
                cambiar = "Encuentra la bolita";
                mantener = "Pierde";
            } else {
                cambiar = "Pierde";
                mantener = "Encuentra la bolita";
            }
        } else {
            // Usuario mantuvo su elección
            if (r.win) {
                mantener = "Encuentra la bolita";
                cambiar = "Pierde";
            } else {
                mantener = "Pierde";
                cambiar = "Encuentra la bolita";
            }
        }

        const row = document.createElement('tr');
        // Número de ronda
        const tdNum = document.createElement('td');
        tdNum.textContent = roundNumber;
        row.appendChild(tdNum);
        // Vasos
        cols.forEach(txt => {
            const td = document.createElement('td');
            td.textContent = txt;
            row.appendChild(td);
        });
        // Mantener
        const tdMantener = document.createElement('td');
        tdMantener.textContent = mantener;
        tdMantener.className = mantener === "Encuentra la bolita" ? "result-success" : "result-fail";
        row.appendChild(tdMantener);
        // Cambiar
        const tdCambiar = document.createElement('td');
        tdCambiar.textContent = cambiar;
        tdCambiar.className = cambiar === "Encuentra la bolita" ? "result-success" : "result-fail";
        row.appendChild(tdCambiar);
        // Resultado con emoji
        const tdResultado = document.createElement('td');
        const emoji = r.win ? '✅' : '❌';
        tdResultado.textContent = emoji;
        tdResultado.className = r.win ? "result-success" : "result-fail";
        tdResultado.style.fontSize = '1.2em';
        row.appendChild(tdResultado);

        resultsTableBody.appendChild(row);
    });

    // Agregar fila de totales si hay resultados
    if (results.length > 0) {
        const totalRow = document.createElement('tr');
        totalRow.className = 'totals-row';

        // Celda "Total" con colspan para las primeras 6 columnas
        const tdTotal = document.createElement('td');
        tdTotal.textContent = 'Total';
        tdTotal.colSpan = 6;
        tdTotal.style.fontWeight = 'bold';
        tdTotal.style.backgroundColor = '#f8f9fa';
        tdTotal.style.textAlign = 'center';
        totalRow.appendChild(tdTotal);

        // Total general (solo la última columna)
        const tdTotalGeneral = document.createElement('td');
        const totalWins = results.filter(r => r.win).length;
        const totalLosses = results.filter(r => !r.win).length;
        tdTotalGeneral.textContent = `${totalWins} ✅ / ${totalLosses} ❌`;
        tdTotalGeneral.style.fontWeight = 'bold';
        tdTotalGeneral.style.backgroundColor = '#f8f9fa';
        tdTotalGeneral.style.textAlign = 'center';
        totalRow.appendChild(tdTotalGeneral);

        resultsTableBody.appendChild(totalRow);
    }

    // Actualizar encabezado dinámico - siempre mostrar vaso 1
    if (dynamicInitialCup) {
        dynamicInitialCup.textContent = '1';
    }
}

function updateSelectedCupNumber(idx, changed = false) {
    const tooltip = document.getElementById('selected-cup-number');
    // Remover el tooltip de cualquier vaso
    document.querySelectorAll('.cup-3d').forEach(cup => {
        if (cup.contains(tooltip)) cup.removeChild(tooltip);
    });
    if (typeof idx === 'number' && idx >= 0 && idx <= 2) {
        const cup = cupDivs[idx];
        cup.appendChild(tooltip);
        tooltip.textContent = changed
            ? `Se ha cambiado al vaso ${idx + 1}`
            : `Selección inicial: vaso ${idx + 1}`;

        // Cambiar el color del tooltip según si cambió o no
        if (changed) {
            tooltip.style.background = '#24474b'; // Verde para cambio
            tooltip.style.setProperty('--tooltip-arrow-color', '#24474b');
        } else {
            tooltip.style.background = '#a02a5a'; // Rosa/morado para selección inicial
            tooltip.style.setProperty('--tooltip-arrow-color', '#a02a5a');
        }

        tooltip.style.display = '';
        tooltip.style.fontSize = '0.8em';
        tooltip.style.fontWeight = 'normal';
    } else {
        tooltip.style.display = 'none';
    }
}

function updateEmptyCupTooltip(idx) {
    const emptyTooltip = document.getElementById('empty-cup-tooltip');
    if (!emptyTooltip) return;

    // Remover el tooltip de cualquier vaso de manera segura
    document.querySelectorAll('.cup-3d').forEach(cup => {
        if (cup && cup.contains && cup.contains(emptyTooltip)) {
            try {
                cup.removeChild(emptyTooltip);
            } catch (e) {
                // Si hay algún error, continuar
            }
        }
    });

    // Si el tooltip no tiene padre, agregarlo al body temporalmente
    if (!emptyTooltip.parentNode) {
        document.body.appendChild(emptyTooltip);
    }

    // Ocultar el tooltip por defecto
    emptyTooltip.style.display = 'none';

    if (typeof idx === 'number' && idx >= 0 && idx <= 2) {
        const cup = cupDivs[idx];
        if (cup && cup.classList && cup.classList.contains('revealed-empty')) {
            // Agregar el tooltip como hijo del vaso de manera segura
            try {
                cup.appendChild(emptyTooltip);
                emptyTooltip.style.display = 'block';
            } catch (e) {
                // Si hay algún error, solo ocultar el tooltip
                emptyTooltip.style.display = 'none';
            }
        }
    }
}

function handleCupClick(idx) {
    if (roundCount >= MAX_ROUNDS) return;
    if (gameState === GAME_STATE.WAITING_SELECTION) {
        selectedCup = idx;
        cupDivs.forEach((cup, i) => {
            cup.classList.toggle('selected', i === idx);
            cup.classList.remove('revealed-empty');
        });
        updateSelectedCupNumber(idx, false);
        const emptyCups = [0, 1, 2].filter(i => i !== selectedCup && cupOrder[i] !== ballUnder);
        revealedEmptyCup = emptyCups[Math.floor(Math.random() * emptyCups.length)];
        cupDivs[revealedEmptyCup].classList.add('revealed-empty');
        updateEmptyCupTooltip(revealedEmptyCup);
        remainingCup = [0, 1, 2].find(i => i !== selectedCup && i !== revealedEmptyCup);
        gameState = GAME_STATE.WAITING_DECISION;
        setGameMessage(`Se ha revelado el vaso ${revealedEmptyCup + 1} que está vacío. Ahora, debe tomar una decisión: <br><br>Mantener la elección del <b>vaso ${selectedCup + 1}</b> seleccionándolo de nuevo o cambiar por el <b>vaso ${remainingCup + 1}</b> restante.`);

    } else if (gameState === GAME_STATE.WAITING_DECISION) {
        if (idx === selectedCup) {
            userChanged = false;
            cupDivs[idx].classList.remove('cup-feedback-bounce');
            void cupDivs[idx].offsetWidth;
            cupDivs[idx].classList.add('cup-feedback-bounce');
            updateSelectedCupNumber(idx, false);
        } else if (idx === remainingCup) {
            userChanged = true;
            cupDivs[idx].classList.remove('cup-feedback-bounce');
            void cupDivs[idx].offsetWidth;
            cupDivs[idx].classList.add('cup-feedback-bounce');
            selectedCup = remainingCup;
            updateSelectedCupNumber(selectedCup, true);
        } else {
            return;
        }
        cupDivs.forEach((cup, i) => {
            cup.classList.toggle('selected', i === selectedCup);
        });
        revealBtn.style.display = 'block';
        revealBtn.classList.add('attention-bounce');
        shuffleBtn.style.display = 'none';
        gameState = GAME_STATE.READY_TO_REVEAL;
        setGameMessage('Presione <b>"Revelar"</b> para ver el resultado.');
    }
}

function startMontyHallRound() {
    if (roundCount === 0) resetRounds();
    resetGameUI();
    gameState = GAME_STATE.WAITING_MIX;
    setInteractionDisabled(true, false); // Solo el botón mezclar habilitado
    shuffleBtn.disabled = false;
    shuffleBtn.style.display = 'block';
    revealBtn.style.display = 'none';
    shuffleBtn.classList.add('attention-bounce');
    setGameMessage('Presione <b>"Mezclar"</b> para iniciar una nueva ronda.');
}

function afterMix() {
    resetGameUI();
    gameState = GAME_STATE.WAITING_SELECTION;
    setInteractionDisabled(false, false);
    shuffleBtn.disabled = true;
    shuffleBtn.classList.remove('attention-bounce');
    setGameMessage('Elija uno de los vasos (haga clic o presione sobre este).');
}

function handleReveal() {
    if (gameState !== GAME_STATE.READY_TO_REVEAL) return;
    // Limpiar tooltip del vaso vacío
    updateEmptyCupTooltip(null);
    // Revelar todos los vasos
    cupDivs.forEach((cup, i) => {
        cup.classList.remove('revealed-empty');
        cup.classList.add('revealed');
        // Mostrar la bola solo bajo el vaso correcto mientras se eleva
        const existingBall = cup.querySelector('.ball-svg');
        if (existingBall) existingBall.remove();
        if (cupOrder[i] === ballUnder) {
            const ball = createBallElement();
            cup.appendChild(ball);
            // Mostrar la bola después de un breve delay mientras el vaso se eleva
            setTimeout(() => {
                ball.classList.add('visible');
            }, 300);
        }
    });
    // Guardar resultado de la ronda
    const selectedCupInOrder = cupOrder[selectedCup];
    const win = selectedCupInOrder === ballUnder;
    results.push({ changed: userChanged, win, cupOrder: [...cupOrder], ballUnder });
    roundCount++;
    updateProgressBar();
    updateResultsTableVasos();
    // Mensaje final de la ronda
    if (roundCount >= MAX_ROUNDS) {
        setGameMessage(`La bolita estaba en el <strong>vaso ${cupOrder.indexOf(ballUnder) + 1}</strong>. Busque la resolución en la tabla de resultados. Ha completado las ${MAX_ROUNDS} rondas. Puede continuar analizando los resultados o reiniciar el juego.`);
    } else {
        setGameMessage(`La bolita estaba en el <strong>vaso ${cupOrder.indexOf(ballUnder) + 1}</strong>. Busque la resolución en la tabla de resultados y para continuar, presione el botón "Mezclar" y así iniciar una nueva ronda.`);
    }
    revealBtn.style.display = 'none';
    revealBtn.classList.remove('attention-bounce');

    // Solo mostrar el botón mezclar si NO es la última ronda
    if (roundCount < MAX_ROUNDS) {
        shuffleBtn.style.display = 'block';
        shuffleBtn.disabled = false;
    } else {
        // En la última ronda, mantener el botón mezclar oculto
        shuffleBtn.style.display = 'none';
        shuffleBtn.disabled = true;
    }

    setInteractionDisabled(true, false); // Deshabilitar vasos hasta que se mezcle de nuevo
    gameState = GAME_STATE.FINAL;
    // Si se completaron 10 rondas, mostrar feedback
    if (roundCount >= MAX_ROUNDS) {
        setTimeout(showFinalFeedback, 1200);
    }
}

// --- Integración con UI ---
cupDivs.forEach((cup, idx) => {
    cup.addEventListener('click', () => {
        if (gameState === GAME_STATE.WAITING_SELECTION || gameState === GAME_STATE.WAITING_DECISION) {
            handleCupClick(idx);
        }
    });
});

revealBtn.addEventListener('click', handleReveal);

shuffleBtn.addEventListener('click', () => {
    if (gameState === GAME_STATE.WAITING_MIX || gameState === GAME_STATE.FINAL || hasShuffled === false) {
        shuffleCups();
    }
});

restartBtn.addEventListener('click', () => {
    resetRounds();
    startMontyHallRound();
    restartBtn.style.display = 'none';
    if (analysisBtn) analysisBtn.style.display = 'none';
});

if (restartBtnHeader) {
    restartBtnHeader.addEventListener('click', () => {
        resetRounds();
        startMontyHallRound();
        restartBtn.style.display = 'none';
        if (analysisBtn) analysisBtn.style.display = 'none';
    });
}

if (analysisBtn) {
    analysisBtn.addEventListener('click', () => {
        // Cambiar a la pestaña de análisis
        const analysisTab = document.querySelector('[data-tab="analysis"]');
        const allTabs = document.querySelectorAll('.tab-item');
        const allContents = document.querySelectorAll('.tab-content');
        allTabs.forEach(t => t.classList.remove('active'));
        allContents.forEach(c => c.classList.remove('active'));
        analysisTab.classList.add('active');
        document.getElementById('analysis').classList.add('active');
    });
}

// Inicializar
window.addEventListener('DOMContentLoaded', () => {
    // Inicializar funcionalidades de pestañas y modal
    initTabs();
    initMaterialsModal();
    initInstructionsModal();
    initContinueButton();

    // Asegurar que el feedback esté oculto al inicio
    feedbackMessage.classList.add('feedback-hidden');
    feedbackMessage.innerHTML = '';
    feedbackMessage.className = 'feedback-hidden';

    // Inicializar el juego
    updateCupsGrid();
    setInteractionDisabled(false, false); // Habilitar todo
    setInteractionDisabled(true, false); // Solo los vasos deshabilitados, botón mezclar habilitado
    shuffleBtn.disabled = false; // Asegurar que Mezclar esté habilitado
    shuffleBtn.classList.add('attention-bounce'); // Efecto llamativo al inicio

    // Al mezclar por primera vez, iniciar el flujo Monty Hall
    startMontyHallRound();

    // Al iniciar, resetear progreso
    updateProgressBar();

    resultsTableBody = document.querySelector('#results-table-vasos tbody');
    resultsTableContainer = document.querySelector('.results-table-container');
    dynamicInitialCup = document.getElementById('dynamic-initial-cup');
    progressContainer = document.querySelector('.progress-container');
});

window.addEventListener('resize', () => {
    updateCupsGrid();
});

// Función para revolver los vasos varias veces
function shuffleMultipleTimes() {
    const totalShuffles = 28; // Número total de mezclas
    const shuffleInterval = 100; // Intervalo entre cada mezcla (100ms)
    let currentShuffle = 0;

    const shuffleTimer = setInterval(() => {
        if (currentShuffle < totalShuffles) {
            if (window.filterizr) {
                window.filterizr.shuffle();
            }
            currentShuffle++;
        } else {
            clearInterval(shuffleTimer);
        }
    }, shuffleInterval);
}
