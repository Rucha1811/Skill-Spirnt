/* Home Page JavaScript */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize animations
    initializeAnimations();

    // Add animation to hero elements
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        gsap.from(heroContent, {
            opacity: 0,
            y: 50,
            duration: 0.8,
            ease: 'back.out'
        });
    }

    // Animate stat cards on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                gsap.to(card, {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    ease: 'back.out'
                });

                // Animate stat numbers
                const numberElement = card.querySelector('.stat-number');
                if (numberElement) {
                    const finalValue = parseInt(numberElement.textContent.replace(/[^0-9]/g, ''));
                    if (!isNaN(finalValue)) {
                        let currentValue = 0;
                        const interval = setInterval(() => {
                            currentValue += Math.ceil(finalValue / 20);
                            if (currentValue >= finalValue) {
                                numberElement.textContent = formatNumber(finalValue);
                                clearInterval(interval);
                            } else {
                                numberElement.textContent = formatNumber(currentValue);
                            }
                        }, 30);
                    }
                }

                observer.unobserve(card);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-card').forEach(card => {
        gsap.set(card, { opacity: 0, y: 20 });
        observer.observe(card);
    });

    // Handle CTA buttons with ripple and animations
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            createSuccessParticles(this);
            triggerConfetti(50);
        });
    });

    // Add tilt effect to stat cards
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 15;
            const rotateY = (centerX - x) / 15;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
    });

    // Animate feature cards on scroll
    const featureObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                gsap.to(entry.target, {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    delay: index * 0.1,
                    ease: 'back.out'
                });
                featureObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.feature-card').forEach(card => {
        gsap.set(card, { opacity: 0, y: 30 });
        featureObserver.observe(card);
    });
});
