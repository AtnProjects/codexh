document.addEventListener('DOMContentLoaded', () => {
    const slider = document.querySelector('.portfolio-slider');
    const slidesContainer = document.querySelector('.slides-container');
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const dotsContainer = document.querySelector('.dots-container');

    let currentIndex = 0;
    let isAnimating = false; // Flag to prevent rapid clicks during transition
    const totalSlides = slides.length; // Automatically gets 10 now
    const transitionDuration = 900; // Match CSS transition duration in ms
    const animationFallbackTimeout = transitionDuration + 300; // Timeout slightly longer than CSS transition

    // --- Configuración Inicial ---
    // Widths are set in CSS, no need to set them dynamically here if CSS is correct.
    slides.forEach(slide => {
        // Set initial state for elements to be animated
        prepareSlideForAnimation(slide);
    });

    // Crear Puntos
    createDots();
    const dots = document.querySelectorAll('.dot');

    // --- Funciones ---
    function createDots() {
        dotsContainer.innerHTML = ''; // Limpiar por si acaso
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button'); // Usar button para accesibilidad
            dot.classList.add('dot');
            dot.setAttribute('aria-label', `Ir al slide ${i + 1}`);
            dot.dataset.index = i;
            if (i === 0) dot.classList.add('active');
            dotsContainer.appendChild(dot);
        }
    }

    function goToSlide(index) {
        if (isAnimating || index === currentIndex) return;

        // Validar índice y hacerlo cíclico
        const newIndex = (index + totalSlides) % totalSlides;

        isAnimating = true; // Bloquear clics rápidos

        const currentSlide = slides[currentIndex];
        const nextSlide = slides[newIndex];

        // 1. Preparar slide siguiente (ocultar elementos para animar entrada)
        // (El CSS ya oculta el contenido con opacidad 0 por defecto)
        // prepareSlideForAnimation(nextSlide); // Se puede omitir si el CSS lo maneja bien

        // 2. Mover el contenedor
        // El cálculo del offset usa totalSlides, por lo que se adapta a 10 slides
        const offset = -newIndex * (100 / totalSlides);
        slidesContainer.style.transform = `translateX(${offset}%)`;

        // 3. Actualizar clases y estados DESPUÉS de que la transición termine
        // Usar transitionend event para sincronizar
        let transitionEndFired = false;
        const transitionEndHandler = (event) => {
            // Asegurarse que el evento es del slidesContainer y no de un hijo
            if (event.target !== slidesContainer) return;

            if (transitionEndFired) return;
            transitionEndFired = true;
            slidesContainer.removeEventListener('transitionend', transitionEndHandler); // Limpiar listener

            // Quitar 'active' del slide viejo, ponerlo en el nuevo
            currentSlide.classList.remove('active');
            nextSlide.classList.add('active');

            // Animar elementos del slide nuevo
            triggerSlideAnimations(nextSlide);

             // Actualizar puntos y botones
            updateDots(newIndex);
            // updateButtonVisibility(newIndex); // Descomentar si NO quieres slider cíclico

            currentIndex = newIndex;
            isAnimating = false; // Desbloquear
        };

        slidesContainer.addEventListener('transitionend', transitionEndHandler);

         // Fallback por si transitionend no se dispara (ej. tab inactivo, transición interrumpida)
        setTimeout(() => {
            if (!transitionEndFired && isAnimating) { // Si aún está bloqueado y el evento no saltó
                console.warn("TransitionEnd event fallback triggered for slide", newIndex);
                // Limpiar listener por si acaso
                slidesContainer.removeEventListener('transitionend', transitionEndHandler);
                // Forzar actualización de estado
                currentSlide.classList.remove('active');
                nextSlide.classList.add('active');
                triggerSlideAnimations(nextSlide);
                updateDots(newIndex);
                // updateButtonVisibility(newIndex);
                currentIndex = newIndex;
                isAnimating = false;
            }
        }, animationFallbackTimeout);
    }

    function prepareSlideForAnimation(slide) {
        const animatedElements = slide.querySelectorAll('.animated');
        animatedElements.forEach(el => {
            // Resetear clases de animación específicas
            const animationClasses = ['fadeInUp', 'fadeInDown', 'fadeIn', 'scale-in'];
            el.classList.remove(...animationClasses);
            // Forzar reflow para asegurar que la animación reinicie al re-aplicar la clase
            void el.offsetWidth;
        });
        // Opcional: Asegurar opacidad 0 si no es el activo inicial
         const content = slide.querySelector('.slide-content');
         if (content && !slide.classList.contains('active')) {
              content.style.opacity = '0';
         }
    }

    function triggerSlideAnimations(slide) {
         // Asegurar visibilidad del contenido principal (CSS debe manejar la transición de opacidad)
         const content = slide.querySelector('.slide-content');
         if (content) content.style.opacity = '1';

        const animatedElements = slide.querySelectorAll('.animated');
        animatedElements.forEach((el) => {
            // Re-aplicar las clases de animación para iniciarlas
            const animationClasses = ['fadeInUp', 'fadeInDown', 'fadeIn', 'scale-in'];
            // Limpiar primero por si acaso
            el.classList.remove(...animationClasses);
            void el.offsetWidth; // Reflow

            // Re-aplicar la clase específica definida en el HTML (o una por defecto)
            if (el.classList.contains('fadeInUp')) el.classList.add('fadeInUp');
            else if (el.classList.contains('fadeInDown')) el.classList.add('fadeInDown');
            else if (el.classList.contains('scale-in')) el.classList.add('scale-in');
            else el.classList.add('fadeIn'); // Default si no tiene una específica

             // Asegurar que la clase 'animated' esté presente
            if (!el.classList.contains('animated')) {
                 el.classList.add('animated');
            }
        });
    }

    function updateDots(activeIndex) {
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === activeIndex);
            // Actualizar aria-current para accesibilidad
            if (i === activeIndex) {
                dot.setAttribute('aria-current', 'step');
            } else {
                dot.removeAttribute('aria-current');
            }
        });
    }

    function updateButtonVisibility(activeIndex) {
        // Descomentar si NO quieres slider cíclico
        // prevBtn.classList.toggle('hidden', activeIndex === 0);
        // nextBtn.classList.toggle('hidden', activeIndex === totalSlides - 1);
    }

    // --- Event Listeners ---
    nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
    prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));

    dotsContainer.addEventListener('click', (e) => {
        // Asegurarse de que el click fue en un botón .dot y no en el contenedor
        const targetDot = e.target.closest('.dot');
        if (targetDot && !targetDot.classList.contains('active')) {
            const index = parseInt(targetDot.dataset.index, 10);
            goToSlide(index);
        }
    });

    // Navegación con Teclado
    document.addEventListener('keydown', (e) => {
        if (isAnimating) return; // No navegar si ya está animando
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
             return; // No interferir si el usuario está escribiendo en un futuro campo de formulario
        }

        if (e.key === 'ArrowRight') {
            e.preventDefault(); // Prevenir scroll horizontal de la página
            goToSlide(currentIndex + 1);
        } else if (e.key === 'ArrowLeft') {
             e.preventDefault(); // Prevenir scroll horizontal de la página
            goToSlide(currentIndex - 1);
        }
    });

    // --- Inicialización ---
    // El primer slide ya tiene la clase 'active' desde el HTML
    const firstSlide = slides[0];
    if (firstSlide) {
        // Asegurar que el contenido del primer slide sea visible al inicio
        const firstSlideContent = firstSlide.querySelector('.slide-content');
        if (firstSlideContent) firstSlideContent.style.opacity = '1';
        // Activar animaciones del primer slide manualmente al cargar
        triggerSlideAnimations(firstSlide);
    }
    updateDots(0);
    // updateButtonVisibility(0); // Descomentar si NO es cíclico

});