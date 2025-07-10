document.addEventListener('DOMContentLoaded', () => {
    // Modal de bienvenida para el torneo
    const welcomeModal = document.getElementById('welcome-modal-tournament');
    const startTournamentBtn = document.getElementById('start-tournament-btn');
    const closeBtn = welcomeModal.querySelector('.modal-close');

    // Mostrar el modal al cargar la página
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

    function hideModal() {
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

    if (startTournamentBtn) {
        startTournamentBtn.addEventListener('click', hideModal);
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', hideModal);
    }

    // Lógica del slider del torneo
    const slides = document.querySelectorAll('.slider-slide');
    const leftArrow = document.getElementById('slider-left');
    const rightArrow = document.getElementById('slider-right');
    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');

        // Actualizar estado de las flechas
        leftArrow.disabled = index === 0;
        rightArrow.disabled = index === slides.length - 1;
    }

    function nextSlide() {
        if (currentSlide < slides.length - 1) {
            currentSlide++;
            showSlide(currentSlide);
        }
    }

    function prevSlide() {
        if (currentSlide > 0) {
            currentSlide--;
            showSlide(currentSlide);
        }
    }

    if (leftArrow) leftArrow.addEventListener('click', prevSlide);
    if (rightArrow) rightArrow.addEventListener('click', nextSlide);

    // Inicializar estado de las flechas
    showSlide(0);

    // Lógica del botón de empezar
    const startQuestionsBtn = document.getElementById('start-questions-btn');
    const questionsSlider = document.getElementById('questions-slider');
    const tournamentSliderContainer = document.querySelector('.tournament-slider-container');
    const contextBanner = document.getElementById('context-banner');

    if (startQuestionsBtn) {
        startQuestionsBtn.addEventListener('click', function () {
            // Ocultar el botón de empezar
            this.style.display = 'none';

            // Mover el banner hacia abajo suavemente
            if (contextBanner) {
                contextBanner.classList.add('slide-down');
            }

            // Mostrar el slider de preguntas con animación
            questionsSlider.style.display = 'block';
            questionsSlider.classList.add('show');

            // Agregar animación de entrada
            setTimeout(() => {
                questionsSlider.classList.add('animate-in');
            }, 50);

            // Remover la clase de animación después de que termine
            setTimeout(() => {
                questionsSlider.classList.remove('animate-in');
            }, 800);
        });
    }

    // Lógica del slider de preguntas
    const questionSlides = document.querySelectorAll('.question-slide');
    const questionLeftArrow = document.getElementById('question-left');
    const questionRightArrow = document.getElementById('question-right');
    let currentQuestion = 0;
    const answeredQuestions = new Set();
    const correctAnswers = new Set(); // Para rastrear respuestas correctas
    const questionAnswers = {
        1: { true: false, false: true },
        2: { true: true, false: false },
        3: { true: true, false: false },
        4: { true: true, false: false },
        5: { true: true, false: false },
        6: { true: false, false: true }
    };

    const feedbackMessages = {
        1: {
            true: "<h3>Incorrecto</h3> La posibilidad de obtener un número mayor que 5 es que salga el 6, mientras que las posibilidades de obtener un número primo son que salga el 2, 3 ó 5.",
            false: "<h3>¡Correcto!</h3> Es falso, porque la posibilidad de obtener un número mayor que 5 es que salga el 6, mientras que las posibilidades de obtener un número primo son que salga el 2, 3 ó 5."
        },
        2: {
            true: "<h3>¡Correcto!</h3> ¡Correcto! La posibilidad de que al lanzar el dado se obtenga como resultado el 1 o un número mayor es más probable a que se obtenga un número impar.",
            false: "<h3>Incorrecto</h3> La posibilidad de que al lanzar el dado se obtenga como resultado el 1 o un número mayor es más probable a que se obtenga un número impar."
        },
        3: {
            true: "<h3>¡Correcto!</h3> ¡Correcto! Es más probable obtener un número igual o mayor al 1 que obtener como resultado el 7, el cual es un que no está en ninguna de las caras del dado.",
            false: "<h3>Incorrecto</h3> Es más probable obtener un número igual o mayor al 1 que obtener como resultado el 7, el cual no está en ninguna de las caras del dado."
        },
        4: {
            true: "<h3>¡Correcto!</h3> ¡Muy bien! La probabilidad de obtener un número primo es de 3/6, misma que la de obtener un número impar.",
            false: "<h3>Incorrecto</h3> La probabilidad de obtener un número primo es de 3/6, misma que la de obtener un número impar."
        },
        5: {
            true: "<h3>¡Correcto!</h3> ¡Excelente! La probabilidad de obtener un número mayor que 5 es que salga un 6, por lo que sería un evento que puede suceder.",
            false: "<h3>Incorrecto</h3> La probabilidad de obtener un número mayor que 5 es que salga un 6, por lo que sería un evento que puede suceder."
        },
        6: {
            true: "<h3>Incorrecto</h3> Existe la probabilidad de obtener un número primo, ya sea 2, 3 ó 5.",
            false: "<h3>¡Correcto!</h3> ¡Muy bien hecho! Falso es la opción correcta porque sí existe la probabilidad de obtener un número primo, ya sea 2, 3 ó 5."
        }
    };

    function showQuestion(index) {
        questionSlides.forEach(slide => slide.classList.remove('active'));
        questionSlides[index].classList.add('active');

        // Actualizar estado de las flechas
        questionLeftArrow.disabled = index === 0;

        // La flecha derecha se deshabilita si la pregunta actual no está respondida
        // o si es la última pregunta
        const canGoNext = index < questionSlides.length - 1 && answeredQuestions.has(index + 1);
        questionRightArrow.disabled = index === questionSlides.length - 1 || !canGoNext;
    }

    function nextQuestion() {
        if (currentQuestion < questionSlides.length - 1 && answeredQuestions.has(currentQuestion + 1)) {
            currentQuestion++;
            showQuestion(currentQuestion);
        }
    }

    function prevQuestion() {
        if (currentQuestion > 0) {
            currentQuestion--;
            showQuestion(currentQuestion);
        }
    }

    // Event listeners para las flechas de preguntas
    if (questionLeftArrow) questionLeftArrow.addEventListener('click', prevQuestion);
    if (questionRightArrow) questionRightArrow.addEventListener('click', nextQuestion);

    // Event listeners para los botones de respuesta
    document.querySelectorAll('.question-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const questionSlide = this.closest('.question-slide');
            const questionNumber = parseInt(questionSlide.dataset.question);
            const isTrue = this.classList.contains('true-btn');
            const isCorrect = this.dataset.correct === 'true';

            // Marcar la pregunta como respondida
            answeredQuestions.add(questionNumber);

            // Rastrear respuestas correctas
            if (isCorrect) {
                correctAnswers.add(questionNumber);
            }

            // Deshabilitar todos los botones de la pregunta
            questionSlide.querySelectorAll('.question-btn').forEach(b => {
                b.disabled = true;
                if (b === this) {
                    b.classList.add(isCorrect ? 'correct' : 'incorrect');
                    b.classList.add('chosen'); // Marcar como elegido
                } else {
                    b.classList.add(isCorrect ? 'incorrect' : 'correct');
                }
            });

            // Mostrar feedback
            const feedbackArea = questionSlide.querySelector('.feedback-area');
            const feedbackMessage = questionSlide.querySelector('.feedback-message');
            const answer = isTrue ? 'true' : 'false';
            feedbackMessage.innerHTML = feedbackMessages[questionNumber][answer];
            feedbackArea.style.display = 'block';

            // Actualizar estado de las flechas después de responder
            showQuestion(currentQuestion);

            // Si es la última pregunta (pregunta 6), mostrar el resumen final
            if (questionNumber === 6) {
                showFinalScore();
            }
        });
    });

    // Event listeners para los botones de siguiente pregunta
    document.querySelectorAll('.next-question-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            nextQuestion();
        });
    });

    // Función para mostrar el resumen final de puntuación
    function showFinalScore() {
        const totalQuestions = 6;
        const correctCount = correctAnswers.size;
        const percentage = Math.round((correctCount / totalQuestions) * 100);

        const finalFeedbackArea = document.querySelector('.final-feedback-area');
        const finalFeedbackMessage = document.querySelector('.final-feedback-message');

        let message = '';
        let scoreClass = '';

        if (percentage === 100) {
            message = `¡Perfecto! Has acertado <span class="score-highlight">${correctCount} de ${totalQuestions}</span> preguntas (${percentage}%). ¡Excelente trabajo!`;
            scoreClass = 'perfect';
        } else if (percentage >= 80) {
            message = `¡Muy bien! Has acertado <span class="score-highlight">${correctCount} de ${totalQuestions}</span> preguntas (${percentage}%). ¡Buen trabajo!`;
            scoreClass = 'good';
        } else if (percentage >= 60) {
            message = `¡Bien! Has acertado <span class="score-highlight">${correctCount} de ${totalQuestions}</span> preguntas (${percentage}%). Puedes mejorar.`;
            scoreClass = 'average';
        } else {
            message = `Has acertado <span class="score-highlight">${correctCount} de ${totalQuestions}</span> preguntas (${percentage}%). Te recomiendo repasar los conceptos.`;
            scoreClass = 'needs-improvement';
        }

        finalFeedbackMessage.innerHTML = message;
        finalFeedbackArea.style.display = 'block';
    }

    // Event listeners para los botones finales
    document.getElementById('restart-tournament').addEventListener('click', function () {
        // Reiniciar el torneo
        currentQuestion = 0;
        answeredQuestions.clear();
        correctAnswers.clear(); // Limpiar respuestas correctas
        showQuestion(0);

        // Limpiar estados de preguntas
        document.querySelectorAll('.question-slide').forEach(slide => {
            slide.querySelectorAll('.question-btn').forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('correct', 'incorrect', 'chosen');
            });
            slide.querySelector('.feedback-area').style.display = 'none';
        });

        // Ocultar área de feedback final
        const finalFeedbackArea = document.querySelector('.final-feedback-area');
        if (finalFeedbackArea) {
            finalFeedbackArea.style.display = 'none';
        }

        // Ocultar slider de preguntas y mostrar botón de empezar
        questionsSlider.classList.remove('show');
        questionsSlider.style.display = 'none';

        // Mostrar el botón de empezar nuevamente
        startQuestionsBtn.style.display = 'block';
    });

    document.getElementById('go-to-three-cups').addEventListener('click', function () {
        // Redirigir al juego de tres vasos
        window.location.href = 'juego-tres-vasos.html';
    });

    // Inicializar estado de las flechas de preguntas
    showQuestion(0);

    // Modal de materiales torneo
    function initMaterialsModalTournament() {
        const modal = document.getElementById('materials-modal-tournament');
        const btn = document.getElementById('materials-btn-tournament');
        const closeBtn = modal.querySelector('.modal-close');

        btn.addEventListener('click', () => {
            modal.classList.add('show');
            setTimeout(() => {
                modal.classList.add('animate-in');
            }, 10);
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('animate-in');
            setTimeout(() => {
                modal.classList.remove('show');
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('animate-in');
                setTimeout(() => {
                    modal.classList.remove('show');
                }, 300);
            }
        });
    }

    if (document.getElementById('materials-modal-tournament')) {
        initMaterialsModalTournament();
    }
}); 