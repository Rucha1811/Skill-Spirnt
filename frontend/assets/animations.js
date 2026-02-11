/* Global Animations */

// GSAP Animations
gsap.registerPlugin();

// Animate on scroll
function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');

                if (entry.target.classList.contains('stat-card')) {
                    const value = entry.target.querySelector('.stat-value');
                    if (value) {
                        const endValue = parseInt(value.textContent.replace(/[^0-9]/g, ''));
                        if (!isNaN(endValue)) {
                            animateCounter(value, 0, endValue);
                        }
                    }
                }
            }
        });
    }, {
        threshold: 0.3
    });

    document.querySelectorAll('.stat-card, .feature-card, .challenge-card').forEach(el => {
        observer.observe(el);
    });
}

// Ripple effect on buttons
function addRippleEffect(button) {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
}

// Add ripple effect to all buttons
function initializeRippleEffects() {
    document.querySelectorAll('.btn').forEach(button => {
        addRippleEffect(button);
    });
}

// Card tilt effect on hover
function addCardTilt(card) {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    });
}

// Initialize card tilts
function initializeCardTilts() {
    document.querySelectorAll('.glass-card').forEach(card => {
        addCardTilt(card);
    });
}

// Particle animation for success
function createSuccessParticles(element) {
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.innerHTML = '✨';
        particle.style.position = 'fixed';
        particle.style.pointerEvents = 'none';
        particle.style.fontSize = '1.5rem';

        const rect = element.getBoundingClientRect();
        particle.style.left = (rect.left + rect.width / 2) + 'px';
        particle.style.top = (rect.top + rect.height / 2) + 'px';

        document.body.appendChild(particle);

        const angle = (Math.PI * 2 * i) / 10;
        const velocity = {
            x: Math.cos(angle) * 5,
            y: Math.sin(angle) * 5
        };

        let x = rect.left + rect.width / 2;
        let y = rect.top + rect.height / 2;
        let life = 1;

        const animate = () => {
            x += velocity.x;
            y += velocity.y;
            velocity.y += 0.2; // gravity
            life -= 0.02;

            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.opacity = life;

            if (life > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };

        animate();
    }
}

// Screen shake effect
function shakeScreen(duration = 500, intensity = 10) {
    const originalTransform = document.body.style.transform;
    const shakes = Math.floor(duration / 50);

    for (let i = 0; i < shakes; i++) {
        setTimeout(() => {
            const x = (Math.random() - 0.5) * intensity;
            const y = (Math.random() - 0.5) * intensity;
            document.body.style.transform = `translate(${x}px, ${y}px)`;
        }, i * 50);
    }

    setTimeout(() => {
        document.body.style.transform = originalTransform;
    }, duration);
}

// Float animation (reusable)
function addFloatAnimation(element, duration = 3) {
    gsap.to(element, {
        y: -20,
        duration: duration / 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
    });
}

// Pulse animation
function addPulseAnimation(element) {
    gsap.to(element, {
        scale: 1.05,
        duration: 0.6,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
    });
}

// Glow effect
function addGlowEffect(element, color = '#8B5CF6') {
    gsap.to(element, {
        boxShadow: `0 0 20px ${color}, 0 0 40px ${color}`,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
    });
}

// Initialize all animations
function initializeAnimations() {
    observeElements();
    initializeRippleEffects();
    initializeCardTilts();
}

// Stagger animation for lists
function staggerAnimateIn(elements, delay = 0.1) {
    gsap.to(elements, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: delay,
        ease: 'back.out'
    });
}

// Number format animation
function animateNumberFormat(element, finalValue, duration = 1) {
    const startValue = parseInt(element.textContent) || 0;
    const startTime = Date.now();

    const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration / 1000, 1);
        const value = Math.floor(startValue + (finalValue - startValue) * progress);
        element.textContent = formatNumber(value);

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };

    animate();
}

// Export animations
window.createSuccessParticles = createSuccessParticles;
window.shakeScreen = shakeScreen;
window.addFloatAnimation = addFloatAnimation;
window.addPulseAnimation = addPulseAnimation;
window.addGlowEffect = addGlowEffect;
window.initializeAnimations = initializeAnimations;
window.staggerAnimateIn = staggerAnimateIn;
window.animateNumberFormat = animateNumberFormat;

// Initialize animations on page load
document.addEventListener('DOMContentLoaded', initializeAnimations);
