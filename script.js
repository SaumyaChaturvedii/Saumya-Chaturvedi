/* ═══════════════════════════════
   RESPONSIVE UTILITIES
═══════════════════════════════ */
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js-ready');

// Debounce helper
function debounce(fn, ms) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), ms);
    };
}

/* ═══════════════════════════════
   TECH CARD GLOW — inject per-logo CSS var
═══════════════════════════════ */
document.querySelectorAll('.tech-card[data-glow]').forEach(card => {
    const hex = card.getAttribute('data-glow');
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    card.style.setProperty('--glow', `rgba(${r},${g},${b},0.35)`);
});

/* ═══════════════════════════════
   CREATIVE CARDS — interactive JS
═══════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const creativeCards = Array.from(document.querySelectorAll('.creative-card'));
    const mobileCreativeMQ = window.matchMedia('(max-width: 768px)');
    let creativeLiveObserver = null;
    let triggerPhotoFlash = () => {};

    creativeCards.forEach(card => {
        card.setAttribute('tabindex', '0');

        card.addEventListener('pointerleave', () => {
            card.style.removeProperty('--needle-turn');
            card.style.removeProperty('--paint-lane');
        }, { passive: true });

        card.addEventListener('blur', () => {
            card.style.removeProperty('--needle-turn');
            card.style.removeProperty('--paint-lane');
        });
    });

    const exploringCard = document.querySelector('.cc-exploring');
    if (exploringCard && !isTouchDevice) {
        exploringCard.addEventListener('pointermove', event => {
            const rect = exploringCard.getBoundingClientRect();
            if (!rect.width) return;
            const progress = (event.clientX - rect.left) / rect.width;
            const angle = ((progress - 0.5) * 34).toFixed(2);
            exploringCard.style.setProperty('--needle-turn', `${angle}deg`);
        }, { passive: true });
    }

    const paintingCard = document.querySelector('.cc-painting');
    if (paintingCard && !isTouchDevice) {
        paintingCard.addEventListener('pointermove', event => {
            const rect = paintingCard.getBoundingClientRect();
            if (!rect.width) return;
            const progress = (event.clientX - rect.left) / rect.width;
            const lane = (-18 + (progress * 42)).toFixed(2);
            paintingCard.style.setProperty('--paint-lane', `${lane}%`);
        }, { passive: true });
    }

    const photoCard = document.getElementById('ccPhotoCard');
    if (photoCard) {
        triggerPhotoFlash = () => {
            const shutter = document.getElementById('ccShutter');
            if (!shutter) return;
            shutter.classList.remove('flash');
            void shutter.offsetWidth;
            shutter.classList.add('flash');
            const icon = photoCard.querySelector('.cc-icon');
            if (icon) {
                const orig = icon.textContent;
                icon.textContent = '✨';
                setTimeout(() => { icon.textContent = orig; }, 350);
            }
        };

        photoCard.addEventListener('click', triggerPhotoFlash);
        photoCard.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            triggerPhotoFlash();
        });
    }

    const syncCreativeLiveCards = () => {
        if (creativeLiveObserver) {
            creativeLiveObserver.disconnect();
            creativeLiveObserver = null;
        }

        creativeCards.forEach(card => {
            card.classList.remove('is-live');
            if (card === photoCard) {
                card.dataset.flashReady = '1';
            }
        });

        if (!mobileCreativeMQ.matches || prefersReducedMotion || typeof IntersectionObserver === 'undefined') return;

        creativeLiveObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const card = entry.target;
                const isLive = entry.isIntersecting && entry.intersectionRatio >= 0.52;

                card.classList.toggle('is-live', isLive);

                if (!isLive) {
                    if (card.classList.contains('cc-exploring')) {
                        card.style.removeProperty('--needle-turn');
                    }
                    if (card.classList.contains('cc-painting')) {
                        card.style.removeProperty('--paint-lane');
                    }
                    if (card === photoCard) {
                        card.dataset.flashReady = '1';
                    }
                    return;
                }

                if (card.classList.contains('cc-exploring')) {
                    const angle = card === creativeCards[creativeCards.length - 1] ? '-16deg' : '16deg';
                    card.style.setProperty('--needle-turn', angle);
                }

                if (card.classList.contains('cc-painting')) {
                    const index = creativeCards.indexOf(card);
                    card.style.setProperty('--paint-lane', `${-12 + (index * 4)}%`);
                }

                if (card === photoCard && card.dataset.flashReady !== '0') {
                    triggerPhotoFlash();
                    card.dataset.flashReady = '0';
                }
            });
        }, {
            threshold: [0.2, 0.52, 0.72],
            rootMargin: '-10% 0px -10% 0px'
        });

        creativeCards.forEach(card => creativeLiveObserver.observe(card));
    };

    syncCreativeLiveCards();
    window.addEventListener('resize', debounce(syncCreativeLiveCards, 150), { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(syncCreativeLiveCards, 180), { passive: true });

    if (mobileCreativeMQ.addEventListener) {
        mobileCreativeMQ.addEventListener('change', syncCreativeLiveCards);
    } else {
        mobileCreativeMQ.addListener(syncCreativeLiveCards);
    }
});

/* ═══════════════════════════════
   LOADER
═══════════════════════════════ */
let initialLoadFinished = false;
let revealBindingsReady = false;

function finishInitialLoad() {
    if (initialLoadFinished) return;
    initialLoadFinished = true;

    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
    document.body.classList.add('page-ready');

    revealElements();
    cacheSectionFlowPositions();
}

window.addEventListener('load', () => {
    setTimeout(finishInitialLoad, 1800);
});
document.addEventListener('DOMContentLoaded', () => setTimeout(finishInitialLoad, 2400));
setTimeout(finishInitialLoad, 3600);

/* ═══════════════════════════════
   NAVBAR — Position-Based Scroll Spy
   (Replaces IntersectionObserver for reliable sync)
═══════════════════════════════ */
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.navbar .nav-link');
const mobileNavLinks = document.querySelectorAll('.mobile-nav .nav-link');
const navIndicator = document.getElementById('navIndicator');
const mobileNavCurrent = document.getElementById('mobileNavCurrent');
const sections = document.querySelectorAll('section[id]');
const mobileNavBarMQ = window.matchMedia('(max-width: 768px)');
const mobileNav = document.getElementById('mobileNav');
const mobileNavClose = document.getElementById('mobileNavClose');
const navLabelMap = new Map(Array.from(navLinks).map(link => [
    link.getAttribute('href').replace('#', ''),
    link.textContent.trim()
]));

// Helper: get an element's absolute document-flow position (sticky-safe)
function getFlowTop(el) {
    let top = 0;
    while (el) {
        top += el.offsetTop;
        el = el.offsetParent;
    }
    return top;
}

function moveNavIndicator(activeEl) {
    if (!activeEl || !navIndicator || mobileNavBarMQ.matches) return;
    const containerRect = navIndicator.parentElement.getBoundingClientRect();
    const linkRect = activeEl.getBoundingClientRect();
    navIndicator.style.width = `${activeEl.offsetWidth}px`;
    navIndicator.style.transform = `translateX(${(linkRect.left - containerRect.left).toFixed(2)}px)`;
}

function getSectionLabel(activeId) {
    if (!activeId) return 'Home';
    return navLabelMap.get(activeId) || activeId.charAt(0).toUpperCase() + activeId.slice(1);
}

function getNavbarOffset() {
    if (!navbar) return 0;
    const rect = navbar.getBoundingClientRect();
    return Math.ceil(rect.height + (mobileNavBarMQ.matches ? 18 : 24));
}

function scrollToSection(target, behavior = 'smooth') {
    if (!target) return;
    const targetTop = Math.max(0, getFlowTop(target) - getNavbarOffset());
    window.scrollTo({ top: targetTop, behavior });
}

/* ── Sticky-compatible scroll spy ──
   Flow positions are cached at load+idle so sticky layout is settled. */
let sectionFlowPositions = [];

function cacheSectionFlowPositions() {
    sectionFlowPositions = Array.from(sections).map(section => ({
        id: section.getAttribute('id'),
        top: getFlowTop(section),
        height: section.offsetHeight
    }));
}

// Only run after layout is fully settled
window.addEventListener('load', () => {
    if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(cacheSectionFlowPositions);
    } else {
        setTimeout(cacheSectionFlowPositions, 400);
    }
});
window.addEventListener('resize', debounce(cacheSectionFlowPositions, 300));

function updateScrollSpy() {
    const scrollY = window.scrollY;
    const windowH = window.innerHeight;
    const triggerPoint = scrollY + windowH * 0.35;

    let activeId = null;

    if (scrollY < 100) {
        activeId = null;
    } else {
        for (const sp of sectionFlowPositions) {
            if (triggerPoint >= sp.top && triggerPoint < sp.top + sp.height) {
                activeId = sp.id;
            }
        }
        if (scrollY + windowH >= document.documentElement.scrollHeight - 50) {
            activeId = sectionFlowPositions[sectionFlowPositions.length - 1]?.id;
        }
    }

    let movedIndicator = false;
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const isActive = href === `#${activeId}`;
        link.classList.toggle('active', isActive);
        if (isActive && !movedIndicator) {
            moveNavIndicator(link);
            movedIndicator = true;
        }
    });

    if (!movedIndicator && navIndicator && !mobileNavBarMQ.matches) {
        navIndicator.style.width = '0px';
        navIndicator.style.transform = 'translateX(0px)';
    }

    mobileNavLinks.forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('active', href === `#${activeId}`);
    });

    if (mobileNavCurrent) {
        mobileNavCurrent.textContent = getSectionLabel(activeId);
    }

    if (navbar) {
        const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress = Math.max(0, Math.min(1, scrollY / scrollable));
        navbar.style.setProperty('--scroll-progress', progress.toFixed(4));
    }
}

/* ═══════════════════════════════
   NAVBAR — Auto-hide after 3s inactivity
═══════════════════════════════ */
let navHideTimer = null;
const NAV_HIDE_DELAY = 3000;
const NAV_SCROLL_THRESHOLD = 72;
function getMobileNavRevealThreshold() {
    const vh = window.innerHeight || 0;
    return Math.max(88, Math.min(148, Math.round(vh * 0.14)));
}
let mobileNavRevealThreshold = getMobileNavRevealThreshold();

function isMobileNavReady() {
    return mobileNavBarMQ.matches && window.scrollY >= mobileNavRevealThreshold;
}

function isDesktopNavReady() {
    return !mobileNavBarMQ.matches && window.scrollY >= NAV_SCROLL_THRESHOLD;
}

function clearNavbarHideTimer() {
    if (!navHideTimer) return;
    clearTimeout(navHideTimer);
    navHideTimer = null;
}

function scheduleNavbarHide() {
    clearNavbarHideTimer();
    if (!navbar || mobileNavBarMQ.matches || !isDesktopNavReady()) return;
    if (mobileNav && mobileNav.classList.contains('open')) return;

    navHideTimer = setTimeout(() => {
        if (!navbar || mobileNavBarMQ.matches || !isDesktopNavReady()) return;
        if (mobileNav && mobileNav.classList.contains('open')) return;
        navbar.classList.add('nav-hidden');
    }, NAV_HIDE_DELAY);
}

function showNavbar() {
    if (!navbar) return;
    if (mobileNavBarMQ.matches) {
        const shouldShow = (mobileNav && mobileNav.classList.contains('open')) || isMobileNavReady();
        navbar.classList.toggle('scrolled', shouldShow);
        navbar.classList.toggle('nav-hidden', !shouldShow);
        return;
    }

    if (!isDesktopNavReady()) {
        navbar.classList.remove('scrolled');
        navbar.classList.add('nav-hidden');
        clearNavbarHideTimer();
        return;
    }

    navbar.classList.add('scrolled');
    navbar.classList.remove('nav-hidden');
    scheduleNavbarHide();
}

function hideNavbar() {
    if (!navbar) return;
    if (mobileNavBarMQ.matches) return;
    clearNavbarHideTimer();
    navbar.classList.add('nav-hidden');
}

function syncNavbarMode() {
    if (!navbar) return;
    clearNavbarHideTimer();

    if (mobileNavBarMQ.matches) {
        const shouldShow = (mobileNav && mobileNav.classList.contains('open')) || isMobileNavReady();
        navbar.classList.toggle('scrolled', shouldShow);
        navbar.classList.toggle('nav-hidden', !shouldShow);
        updateScrollSpy();
        return;
    }

    navbar.classList.toggle('scrolled', isDesktopNavReady());
    navbar.classList.toggle('nav-hidden', !isDesktopNavReady());
    updateScrollSpy();
    if (isDesktopNavReady()) scheduleNavbarHide();
}

syncNavbarMode();

if (mobileNavBarMQ.addEventListener) {
    mobileNavBarMQ.addEventListener('change', syncNavbarMode);
} else {
    mobileNavBarMQ.addListener(syncNavbarMode);
}

/* ═══════════════════════════════
   SCROLL HANDLER — consolidated
═══════════════════════════════ */
let scrollTicking = false;
window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(() => {
            const sy = window.scrollY;

            if (navbar) {
                const isScrolled = mobileNavBarMQ.matches
                    ? ((mobileNav && mobileNav.classList.contains('open')) || sy >= mobileNavRevealThreshold)
                    : sy >= NAV_SCROLL_THRESHOLD;
                navbar.classList.toggle('scrolled', isScrolled);

                if (mobileNavBarMQ.matches) {
                    navbar.classList.toggle('nav-hidden', !isScrolled);
                } else if (isScrolled) {
                    navbar.classList.remove('nav-hidden');
                    scheduleNavbarHide();
                } else {
                    hideNavbar();
                }
            }

            updateScrollSpy();

            scrollTicking = false;
        });
    }
}, { passive: true });

// Show navbar on mouse movement too
document.addEventListener('mousemove', debounce(() => {
    showNavbar();
}, 120), { passive: true });

// Show navbar on touch  
document.addEventListener('touchstart', () => {
    showNavbar();
}, { passive: true });

// Handle window resize to keep indicator aligned
window.addEventListener('resize', debounce(() => {
    mobileNavRevealThreshold = getMobileNavRevealThreshold();
    const active = document.querySelector('.navbar .nav-link.active');
    if (active) moveNavIndicator(active);
    syncNavbarMode();
}, 150));

/* ═══════════════════════════════
   MOBILE MENU
═══════════════════════════════ */
const menuButtons = ['hamburger', 'hamburger2']
    .map(id => document.getElementById(id))
    .filter(Boolean);

function setMobileNav(open) {
    if (!mobileNav) return;
    clearNavbarHideTimer();
    mobileNav.classList.toggle('open', open);
    document.body.classList.toggle('mobile-menu-open', open);
    if (navbar) navbar.classList.toggle('menu-open', open);
    menuButtons.forEach(btn => {
        btn.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    if (open && navbar) {
        navbar.classList.add('scrolled');
        navbar.classList.remove('nav-hidden');
    } else {
        syncNavbarMode();
    }
}

menuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const nextState = !(mobileNav && mobileNav.classList.contains('open'));
        setMobileNav(nextState);
    });
});

if (mobileNavClose) {
    mobileNavClose.addEventListener('click', () => setMobileNav(false));
}

document.querySelectorAll('.mobile-nav .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        setMobileNav(false);
        const href = link.getAttribute('href');
        if (href === '#home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const target = document.querySelector(href);
            if (target) scrollToSection(target);
        }
    });
});

if (mobileNav) {
    mobileNav.addEventListener('click', event => {
        if (event.target === mobileNav) setMobileNav(false);
    });
}

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setMobileNav(false);
});

/* ═══════════════════════════════
   SCROLL REVEAL (IntersectionObserver)
   — Uses rootMargin that adapts to viewport
═══════════════════════════════ */
const revealMargin = window.innerHeight < 700 ? '0px 0px -30px 0px' : '0px 0px -50px 0px';

function makeContentVisible(scope) {
    if (!scope) return;

    const isSingleNode = scope instanceof Element;
    if (isSingleNode && scope.matches('.reveal, .section-header')) {
        scope.classList.add('visible');
    }

    const targets = typeof scope.querySelectorAll === 'function' ? scope : document;
    targets.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    targets.querySelectorAll('.section-header').forEach(el => el.classList.add('visible'));
    targets.querySelectorAll('.skill-fill').forEach(bar => bar.classList.add('animated'));
    targets.querySelectorAll('.tk-fill').forEach(bar => bar.classList.add('animated'));
    targets.querySelectorAll('.tk-ring-fill').forEach(ring => ring.classList.add('animated'));
}

const supportsIO = typeof IntersectionObserver !== 'undefined';

const revealObserver = supportsIO ? new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            makeContentVisible(entry.target);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.08, rootMargin: revealMargin }) : null;

const headerObserver = supportsIO ? new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            makeContentVisible(entry.target);
            headerObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 }) : null;

function revealElements() {
    if (revealBindingsReady) return;
    revealBindingsReady = true;

    document.querySelectorAll('.reveal').forEach(el => {
        if (revealObserver) revealObserver.observe(el);
        else makeContentVisible(el);
    });
    document.querySelectorAll('.section-header').forEach(el => {
        if (headerObserver) headerObserver.observe(el);
        else makeContentVisible(el);
    });

    // Force creative grid and about grid to be visible immediately on load
    // Sticky context is unreliable for intersection observers on large grids
    setTimeout(() => {
        document.querySelectorAll('.creative-grid, .about-cards').forEach(el => {
            el.classList.add('visible');
        });
    }, 800);

    // Fallback: make sure nothing stays blurred forever on slower devices.
    setTimeout(() => {
        document.querySelectorAll('.reveal:not(.visible), .section-header:not(.visible)').forEach(el => {
            makeContentVisible(el);
        });
    }, 2200);
}

/* ═══════════════════════════════
   CURSOR SPOTLIGHT — mouse-only (hidden via CSS on touch)
═══════════════════════════════ */
if (!prefersReducedMotion && !isTouchDevice) {
    const spotlight = document.createElement('div');
    spotlight.className = 'cursor-spotlight';
    document.body.appendChild(spotlight);

    let spotX = 0, spotY = 0, curX = 0, curY = 0;
    const SPOT_LERP = 0.08;

    document.addEventListener('mousemove', e => {
        spotX = e.clientX;
        spotY = e.clientY;
    }, { passive: true });

    (function moveSpotlight() {
        const dx = spotX - curX;
        const dy = spotY - curY;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
            curX += dx * SPOT_LERP;
            curY += dy * SPOT_LERP;
            spotlight.style.transform = `translate3d(${curX - 200}px, ${curY - 200}px, 0)`;
        }
        requestAnimationFrame(moveSpotlight);
    })();
}

/* ═══════════════════════════════
   GLITCH EFFECT ON HERO NAME
═══════════════════════════════ */
const heroName = document.querySelector('.hero-headline, .hero-name');
if (!prefersReducedMotion && heroName && !isTouchDevice) {
    heroName.setAttribute('data-text', heroName.innerText.trim());
    setInterval(() => {
        heroName.classList.add('glitch');
        setTimeout(() => heroName.classList.remove('glitch'), 380);
    }, 5000);
}

/* ═══════════════════════════════
   MAGNETIC CARD 3D TILT — desktop only
═══════════════════════════════ */
if (!isTouchDevice) {
    document.querySelectorAll('.about-card, .sk-category, .contact-item').forEach(card => {
        let tiltRAF;
        card.addEventListener('mousemove', e => {
            if (tiltRAF) return;
            tiltRAF = requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = (e.clientX - cx) / (rect.width / 2);
                const dy = (e.clientY - cy) / (rect.height / 2);
                const maxTilt = 5;
                card.style.transform = `perspective(800px) rotateY(${dx * maxTilt}deg) rotateX(${-dy * maxTilt}deg) translateY(-4px)`;
                tiltRAF = null;
            });
        }, { passive: true });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.7s cubic-bezier(0.16,1,0.3,1)';
            setTimeout(() => card.style.transition = '', 700);
        });
    });
}

/* ═══════════════════════════════
   MONOCHROME VIBE FIELD
   local light + tap energy without changing theme
═══════════════════════════════ */
(() => {
    if (prefersReducedMotion) return;

    const pointerTrackedSelector = [
        '.about-card',
        '.project-card',
        '.timeline-content',
        '.creative-card',
        '.contact-item',
        '.contact-form'
    ].join(', ');

    const selector = [
        '.about-card',
        '.sk-category',
        '.sk-tag',
        '.project-card',
        '.project-link',
        '.timeline-content',
        '.creative-card',
        '.contact-item',
        '.contact-form',
        '.tech-card',
        '.hero-pill-btn',
        '.hero-cta-circle',
        '.social-icon-link',
        '.btn',
        '.back-top'
    ].join(', ');

    const surfaces = Array.from(document.querySelectorAll(selector));
    surfaces.forEach((surface, index) => {
        const canTrackPointer = !isTouchDevice && surface.matches(pointerTrackedSelector);
        surface.classList.add('vibe-surface');
        surface.style.setProperty('--mx', '50%');
        surface.style.setProperty('--my', '42%');
        surface.style.setProperty('--vibe-delay', `${(index % 6) * 0.08}s`);

        let clearTimer;

        const updatePointer = (clientX, clientY) => {
            const rect = surface.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const x = ((clientX - rect.left) / rect.width) * 100;
            const y = ((clientY - rect.top) / rect.height) * 100;
            surface.style.setProperty('--mx', `${Math.max(0, Math.min(100, x)).toFixed(2)}%`);
            surface.style.setProperty('--my', `${Math.max(0, Math.min(100, y)).toFixed(2)}%`);
            surface.classList.add('vibe-live');
            clearTimeout(clearTimer);
            clearTimer = setTimeout(() => surface.classList.remove('vibe-live'), 180);
        };

        if (canTrackPointer) {
            surface.addEventListener('pointermove', event => {
                updatePointer(event.clientX, event.clientY);
            }, { passive: true });
        }

        surface.addEventListener('pointerdown', event => {
            if (canTrackPointer) updatePointer(event.clientX, event.clientY);
            surface.classList.add('vibe-pop');
            clearTimeout(surface._vibePopTimer);
            surface._vibePopTimer = setTimeout(() => surface.classList.remove('vibe-pop'), 240);
        }, { passive: true });

        ['pointerleave', 'pointercancel', 'pointerup'].forEach(type => {
            surface.addEventListener(type, () => surface.classList.remove('vibe-live'), { passive: true });
        });
    });
})();

/* ═══════════════════════════════
   TYPING EFFECT
═══════════════════════════════ */
const roles = [
    'an AI/ML Enthusiast',
    'a Computer Vision Dev',
    'a B.Tech CSE Student',
    'a Problem Solver',
    'a Creative Mind'
];

let roleIndex = 0, charIndex = 0, deleting = false;
const typingEl = document.getElementById('typing-text');

function type() {
    if (!typingEl) return;
    const current = roles[roleIndex];
    if (deleting) {
        typingEl.textContent = current.substring(0, charIndex--);
        if (charIndex < 0) {
            deleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            setTimeout(type, 500);
            return;
        }
        setTimeout(type, 30);
    } else {
        typingEl.textContent = current.substring(0, charIndex++);
        if (charIndex > current.length) {
            deleting = true;
            setTimeout(type, 2000);
            return;
        }
        setTimeout(type, 50 + Math.random() * 40);
    }
}
setTimeout(type, 2200);

/* ═══════════════════════════════
   STAT COUNTER ANIMATION
═══════════════════════════════ */
const statNums = document.querySelectorAll('.stat-num');
let statsStarted = false;

const statsObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !statsStarted) {
        statsStarted = true;
        statNums.forEach(el => {
            const target = +el.dataset.target;
            let current = 0;
            const step = Math.max(1, Math.ceil(target / 60));
            const tick = () => {
                current = Math.min(current + step, target);
                el.textContent = current;
                if (current < target) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    }
}, { threshold: 0.8 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

/* ═══════════════════════════════
   PARTICLE SYSTEM — optimized, fewer particles
═══════════════════════════════ */
(function () {
    if (prefersReducedMotion) return;

    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const lowPowerMobile = isTouchDevice && (((navigator.hardwareConcurrency || 4) <= 4) || window.innerWidth < 420);

    const resize = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener('resize', debounce(resize, 200), { passive: true });
    resize();

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.r = Math.random() * 1.0 + 0.3;
            this.vx = (Math.random() - 0.5) * 0.12;
            this.vy = (Math.random() - 0.5) * 0.12;
            this.alpha = Math.random() * 0.3 + 0.05;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${this.alpha})`;
            ctx.fill();
        }
    }

    function getParticleCount() {
        if (lowPowerMobile) {
            if (W < 480) return 2;
            if (W < 768) return 4;
        }
        if (W < 480) return 3;
        if (W < 768) return 5;
        return Math.min(14, Math.floor((W * H) / 72000));
    }

    let COUNT = getParticleCount();
    for (let i = 0; i < COUNT; i++) particles.push(new Particle());

    // Rebuild particles on resize
    window.addEventListener('resize', debounce(() => {
        const newCount = getParticleCount();
        if (Math.abs(newCount - particles.length) > 3) {
            particles = [];
            for (let i = 0; i < newCount; i++) particles.push(new Particle());
        }
    }, 300), { passive: true });

    let particleRAF;
    let lastFrameTime = 0;
    const minFrameDelta = isTouchDevice ? 1000 / 24 : 1000 / 50;

    function loop(now = 0) {
        if (now - lastFrameTime < minFrameDelta) {
            particleRAF = requestAnimationFrame(loop);
            return;
        }
        lastFrameTime = now;
        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        particleRAF = requestAnimationFrame(loop);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(particleRAF);
        } else {
            particleRAF = requestAnimationFrame(loop);
        }
    });

    particleRAF = requestAnimationFrame(loop);
})();

/* ═══════════════════════════════
   PROFILE IMAGE FALLBACK
═══════════════════════════════ */
const profileImg = document.getElementById('profileImg');
if (profileImg) {
    profileImg.onerror = function () {
        const c = document.createElement('canvas');
        c.width = 280; c.height = 280;
        const cx = c.getContext('2d');
        cx.fillStyle = '#1a1a1a';
        cx.fillRect(0, 0, 280, 280);
        cx.fillStyle = '#333';
        cx.font = 'bold 72px Inter, sans-serif';
        cx.textAlign = 'center';
        cx.textBaseline = 'middle';
        cx.fillText('SC', 140, 140);
        this.src = c.toDataURL();
        this.onerror = null;
    };
}

/* ═══════════════════════════════════════════════════════
   HOLOGRAM ENGINE — Responsive + optimised
═══════════════════════════════════════════════════════ */
(function initHologram() {
    if (prefersReducedMotion) return;

    const holograms = Array.from(document.querySelectorAll('.section-hologram'));
    if (!holograms.length) return;

    const ARC_WORDS = ['ABOUT', 'SKILLS', 'PROJECTS', 'JOURNEY', 'CONTACT'];
    const hologramMQ = window.matchMedia('(max-width: 1024px)');

    holograms.forEach(el => {
        const word = el.dataset.word || '';
        el.textContent = word;

        if (ARC_WORDS.includes(word)) {
            el.classList.add('holo-has-arc');
            const arcWrap = document.createElement('div');
            arcWrap.className = 'holo-arc-wrap';
            if (isTouchDevice) arcWrap.classList.add('holo-arc-touch');
            arcWrap.innerHTML = `
                <svg class="holo-arc holo-arc-1" viewBox="0 0 200 200" fill="none">
                    <path d="M 100 10 A 90 90 0 0 1 190 100" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" stroke-linecap="round" fill="none"/>
                </svg>
                <svg class="holo-arc holo-arc-2" viewBox="0 0 200 200" fill="none">
                    <path d="M 10 100 A 90 90 0 0 1 100 190" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-linecap="round" stroke-dasharray="8 6" fill="none"/>
                </svg>
                <svg class="holo-arc holo-arc-3" viewBox="0 0 240 240" fill="none">
                    <path d="M 120 15 A 105 105 0 0 1 225 120" stroke="rgba(255,255,255,0.06)" stroke-width="0.8" stroke-linecap="round" fill="none"/>
                </svg>
            `;
            el.parentElement.appendChild(arcWrap);
        }
    });

    const sectionEls = holograms.map(el => el.parentElement);

    let midpoints = [];
    /* ── Hologram midpoints — calculated live at cache time using
       getBoundingClientRect+scrollY so sticky sections are handled correctly. */
    function cachePositions() {
        midpoints = sectionEls.map(sec => {
            const rect = sec.getBoundingClientRect();
            const stickyViewportAnchor = sec.id === 'journey' && window.innerWidth > 1024
                ? Math.min(window.innerHeight * 0.5, sec.offsetHeight * 0.5)
                : sec.offsetHeight * 0.5;
            return window.scrollY + rect.top + stickyViewportAnchor;
        });
    }
    cachePositions();
    window.addEventListener('load', () => setTimeout(cachePositions, 200));
    window.addEventListener('resize', debounce(cachePositions, 200), { passive: true });

    const state = holograms.map(() => ({
        rotX: 5, rotZ: -2, transY: 10, scale: 0.97, opac: 0.42
    }));

    const PERSP = 1200;
    function lerp(a, b, t) { return a + (b - a) * t; }

    // Skip more frames on mobile for performance
    const FRAME_SKIP = isTouchDevice ? 3 : 2;

    let rafId;
    let frameCount = 0;
    let lastScrollY = -1;

    function loop() {
        frameCount++;

        const sy = window.scrollY;

        if (frameCount % FRAME_SKIP !== 0 || (FRAME_SKIP > 1 && sy === lastScrollY)) {
            rafId = requestAnimationFrame(loop);
            return;
        }
        lastScrollY = sy;

        const winH = window.innerHeight;
        const vcY = sy + winH * 0.5;
        const compactView = hologramMQ.matches;
        const lerpAmount = compactView ? 0.14 : (isTouchDevice ? 0.12 : 0.08);
        const range = winH * (compactView ? 0.68 : 0.72);
        const baseTranslateY = '-50%';

        for (let i = 0; i < holograms.length; i++) {
            const el = holograms[i];

            let prog = (vcY - midpoints[i]) / range;

            // Fix for the final section (Contact): don't let it fade out if scrolled into footer
            if (i === holograms.length - 1 && prog > 0) {
                prog = 0;
            }

            const clamped = Math.max(-1.4, Math.min(1.4, prog));

            const tRotX = clamped * (compactView ? -7 : -10);
            const tRotZ = clamped * (compactView ? 2.2 : 3);
            const tTransY = clamped * (compactView ? -16 : -25);
            const tScale = 1 + (1 - Math.min(1, Math.abs(clamped))) * (compactView ? 0.035 : 0.06);
            const tOpac = compactView
                ? Math.max(0.22, 1 - Math.abs(clamped) * 0.42)
                : Math.max(0.16, 1 - Math.abs(clamped) * 0.46);

            const s = state[i];
            s.rotX = lerp(s.rotX, tRotX, lerpAmount);
            s.rotZ = lerp(s.rotZ, tRotZ, lerpAmount);
            s.transY = lerp(s.transY, tTransY, lerpAmount);
            s.scale = lerp(s.scale, tScale, lerpAmount);
            s.opac = lerp(s.opac, tOpac, lerpAmount);

            el.style.opacity = s.opac.toFixed(3);
            el.style.transform = `translate3d(-50%, calc(${baseTranslateY} + ${s.transY.toFixed(1)}px), 0) perspective(${PERSP}px) rotateX(${s.rotX.toFixed(1)}deg) rotateZ(${s.rotZ.toFixed(1)}deg) scale(${s.scale.toFixed(3)})`;
        }

        rafId = requestAnimationFrame(loop);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(rafId);
        } else {
            cachePositions();
            rafId = requestAnimationFrame(loop);
        }
    });

    rafId = requestAnimationFrame(loop);
})();

/* ═══════════════════════════════
   SMOOTH SCROLLING
═══════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            scrollToSection(target, 'smooth');
        }
    });
});

window.addEventListener('load', () => {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (!target) return;
    setTimeout(() => scrollToSection(target, 'auto'), 80);
});

/* ═══════════════════════════════════════════════════
   CONTACT FORM — FormSubmit via AJAX
═══════════════════════════════════════════════════ */
function setFormState(state, msg = '') {
    const form = document.getElementById('contactForm');
    const btn = document.getElementById('submitBtn');
    const btnText = btn ? btn.querySelector('.btn-text') : null;
    const btnLoader = btn ? btn.querySelector('.btn-loader') : null;
    const status = document.getElementById('formStatus');

    if (!form || !btn) return;
    if (status) status.className = 'form-status';

    switch (state) {
        case 'loading':
            btn.disabled = true;
            if (btnText) btnText.style.opacity = '0';
            if (btnLoader) btnLoader.style.display = 'inline-block';
            if (status) status.textContent = '';
            break;
        case 'success':
            btn.disabled = false;
            if (btnText) { btnText.style.opacity = '1'; btnText.textContent = '✓ Message Sent!'; }
            if (btnLoader) btnLoader.style.display = 'none';
            if (status) { status.textContent = msg || "Thanks! I'll get back to you soon."; status.classList.add('form-status--success'); }
            form.reset();
            setTimeout(() => { if (btnText) btnText.textContent = 'Send Message'; }, 4000);
            break;
        case 'error':
            btn.disabled = false;
            if (btnText) btnText.style.opacity = '1';
            if (btnLoader) btnLoader.style.display = 'none';
            if (status) { status.textContent = msg || 'Something went wrong. Please try again.'; status.classList.add('form-status--error'); }
            break;
        default:
            btn.disabled = false;
            if (btnText) { btnText.style.opacity = '1'; btnText.textContent = 'Send Message'; }
            if (btnLoader) btnLoader.style.display = 'none';
            if (status) status.textContent = '';
    }
}

const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setFormState('loading');

        try {
            const formData = new FormData(contactForm);
            const response = await fetch('https://formsubmit.co/ajax/saumya.chaturvedii01@gmail.com', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                setFormState('success', "Message received! I'll get back to you soon.");
            } else {
                throw new Error('Network response was not ok');
            }
        } catch (err) {
            console.error('Contact Form error:', err);
            setFormState('error', 'Failed to send. Please email me directly: saumya.chaturvedii01@gmail.com');
        }
    });
}

/* ───────────────────────────────────────────────────
   TIMELINE SCROLL ANIMATION
   ── Smooth scroll-driven progressive reveal:
   Items fade in one-by-one as you scroll through the
   journey section. Progress bar + glow track scroll.
─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const journeySection = document.getElementById('journey');
    const timelineProgress = document.getElementById('timelineProgress');
    const timelineGlow    = document.getElementById('timelineGlow');
    const timelineItems   = Array.from(document.querySelectorAll('.timeline-item'));
    const timelineDots    = Array.from(document.querySelectorAll('.timeline-dot'));
    const mobileJourneyMQ = window.matchMedia('(max-width: 768px)');

    if (!journeySection || !timelineProgress || timelineItems.length === 0) return;

    const setProgress = (progress) => {
        const clamped = Math.max(0, Math.min(1, progress));
        timelineProgress.style.transform = `scaleY(${clamped.toFixed(4)})`;

        if (!timelineGlow) return;

        if (clamped > 0.01 && clamped < 0.99) {
            timelineGlow.style.top = `${clamped * 100}%`;
            timelineGlow.style.opacity = '1';
        } else {
            timelineGlow.style.opacity = '0';
        }
    };

    const resetTimeline = () => {
        timelineItems.forEach(item => item.classList.remove('timeline-popped'));
        timelineDots.forEach(dot => dot.classList.remove('filled'));
        setProgress(0);
    };

    const showFullTimeline = () => {
        timelineItems.forEach(item => item.classList.add('timeline-popped'));
        timelineDots.forEach(dot => dot.classList.add('filled'));
        setProgress(1);
        if (timelineGlow) timelineGlow.style.opacity = '0';
    };

    if (prefersReducedMotion) {
        showFullTimeline();
        return;
    }

    let sectionFlowTop = 0;
    let sectionHeight  = 0;
    let currentProgress = 0;
    let targetProgress = 0;
    let tlRAF = 0;
    let mobileObserver = null;

    function cacheTLPositions() {
        sectionFlowTop = getFlowTop(journeySection);
        sectionHeight  = journeySection.offsetHeight;
    }

    function updateDesktopTimeline() {
        if (mobileJourneyMQ.matches) return;

        const sy = window.scrollY;
        const winH = window.innerHeight;

        const enterPoint = sectionFlowTop;
        const exitPoint  = sectionFlowTop + sectionHeight * 0.45;
        const scrollRange = exitPoint - enterPoint;

        const raw = scrollRange <= 0 ? 1 : (sy - enterPoint) / scrollRange;
        targetProgress = Math.max(0, Math.min(1, raw));

        currentProgress += (targetProgress - currentProgress) * 0.12;
        if (Math.abs(currentProgress - targetProgress) < 0.001) {
            currentProgress = targetProgress;
        }

        setProgress(currentProgress);

        const itemCount = timelineItems.length;
        const revealOffset = 0.1;
        for (let i = 0; i < itemCount; i++) {
            const threshold = Math.max(0.04, (i + revealOffset) / itemCount);

            if (currentProgress >= threshold) {
                timelineItems[i].classList.add('timeline-popped');
                if (timelineDots[i]) timelineDots[i].classList.add('filled');
            } else {
                timelineItems[i].classList.remove('timeline-popped');
                if (timelineDots[i]) timelineDots[i].classList.remove('filled');
            }
        }

        if (Math.abs(currentProgress - targetProgress) > 0.0005) {
            tlRAF = requestAnimationFrame(updateDesktopTimeline);
        }
    }

    function requestDesktopTimeline() {
        if (mobileJourneyMQ.matches) return;
        cancelAnimationFrame(tlRAF);
        tlRAF = requestAnimationFrame(updateDesktopTimeline);
    }

    function setupMobileTimeline() {
        if (mobileObserver) {
            mobileObserver.disconnect();
            mobileObserver = null;
        }

        resetTimeline();

        let revealedCount = 0;
        const revealed = new Set();

        mobileObserver = new IntersectionObserver((entries) => {
            let changed = false;

            entries.forEach(entry => {
                if (!entry.isIntersecting || entry.intersectionRatio < 0.42) return;

                const itemIndex = timelineItems.indexOf(entry.target);
                if (itemIndex < 0 || revealed.has(itemIndex)) return;

                revealed.add(itemIndex);
                revealedCount = Math.max(revealedCount, revealed.size);
                timelineItems[itemIndex].classList.add('timeline-popped');
                if (timelineDots[itemIndex]) timelineDots[itemIndex].classList.add('filled');
                changed = true;
                mobileObserver.unobserve(entry.target);
            });

            if (!changed) return;
            const progress = Math.min(1, (revealedCount - 0.08) / timelineItems.length);
            setProgress(progress);
        }, {
            threshold: [0.24, 0.42, 0.62],
            rootMargin: '0px 0px -14% 0px'
        });

        timelineItems.forEach(item => mobileObserver.observe(item));
    }

    function syncTimelineMode() {
        cancelAnimationFrame(tlRAF);
        cacheTLPositions();

        if (mobileJourneyMQ.matches) {
            setupMobileTimeline();
            return;
        }

        if (mobileObserver) {
            mobileObserver.disconnect();
            mobileObserver = null;
        }

        resetTimeline();
        currentProgress = 0;
        targetProgress = 0;
        requestDesktopTimeline();
    }

    window.addEventListener('load', () => setTimeout(syncTimelineMode, 280));
    window.addEventListener('resize', debounce(syncTimelineMode, 220), { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(syncTimelineMode, 240), { passive: true });
    window.addEventListener('scroll', requestDesktopTimeline, { passive: true });

    if (mobileJourneyMQ.addEventListener) {
        mobileJourneyMQ.addEventListener('change', syncTimelineMode);
    } else {
        mobileJourneyMQ.addListener(syncTimelineMode);
    }

    syncTimelineMode();
});

/* ═══════════════════════════════════════════════════
   PROJECTS SCROLL & INTERACTION
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const projectGrid = document.getElementById('projectGrid');
    const projectCards = Array.from(document.querySelectorAll('.project-card'));
    if (!projectGrid || projectCards.length === 0) return;

    const projectObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('project-popped');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    projectCards.forEach(card => projectObserver.observe(card));

    const hoverDrivenDeck = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    let orderedCards = [...projectCards];
    let advanceInProgress = false;

    const syncDeckState = () => {
        orderedCards.forEach((card, index) => {
            const frontLink = card.querySelector('.project-link--front');

            card.dataset.stack = `${index}`;
            card.classList.toggle('is-active', index === 0);
            card.tabIndex = index === 0 ? 0 : -1;

            if (frontLink) {
                frontLink.tabIndex = index === 0 ? 0 : -1;
            }

            if (index !== 0) {
                card.classList.remove('is-revealed');
            }
        });
    };

    const syncProjectDeckHeight = () => {
        // On mobile, let CSS handle the deck height — don't override with JS
        if (window.innerWidth <= 768) {
            projectGrid.style.removeProperty('--project-deck-height');
            return;
        }

        let tallestFace = 0;

        projectCards.forEach(card => {
            card.querySelectorAll('.project-face').forEach(face => {
                tallestFace = Math.max(
                    tallestFace,
                    face.scrollHeight,
                    Math.ceil(face.getBoundingClientRect().height)
                );
            });
        });

        const stackAllowance = 96;
        projectGrid.style.setProperty('--project-deck-height', `${Math.ceil(tallestFace + stackAllowance)}px`);
    };

    const advanceDeck = async () => {
        if (advanceInProgress) return;
        const activeCard = orderedCards[0];
        if (!activeCard) return;

        advanceInProgress = true;

        activeCard.classList.remove('is-revealed');
        await wait(380);

        orderedCards.push(orderedCards.shift());
        syncDeckState();
        syncProjectDeckHeight();
        await wait(120);
        advanceInProgress = false;
    };

    const handleDeckTrigger = (triggerTarget) => {
        if (advanceInProgress) return;

        const activeCard = orderedCards[0];
        const clickedCard = triggerTarget.closest('.project-card');

        if (!activeCard || clickedCard !== activeCard) return;

        if (!activeCard.classList.contains('is-revealed')) {
            activeCard.classList.add('is-revealed');
            return;
        }

        advanceDeck();
    };

    syncDeckState();
    requestAnimationFrame(syncProjectDeckHeight);

    projectCards.forEach(card => {
        card.querySelectorAll('img').forEach(img => {
            if (img.complete) return;
            img.addEventListener('load', syncProjectDeckHeight, { once: true });
        });
    });

    window.addEventListener('load', syncProjectDeckHeight);
    window.addEventListener('resize', debounce(syncProjectDeckHeight, 120), { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(syncProjectDeckHeight, 180), { passive: true });

    projectCards.forEach(card => {
        card.addEventListener('pointerenter', () => {
            if (!hoverDrivenDeck || advanceInProgress) return;
            if (card !== orderedCards[0]) return;
            card.classList.add('is-revealed');
        });

        card.addEventListener('pointerleave', () => {
            if (!hoverDrivenDeck || advanceInProgress) return;
            if (card !== orderedCards[0]) return;
            card.classList.remove('is-revealed');
        });
    });

    projectGrid.addEventListener('click', event => {
        if (event.target.closest('.project-link--front')) return;
        handleDeckTrigger(event.target);
    });

    projectGrid.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const activeCard = orderedCards[0];
        if (!activeCard || event.target !== activeCard) return;

        event.preventDefault();
        handleDeckTrigger(activeCard);
    });

    // Mouse glow — desktop only
    if (!isTouchDevice) {
        projectCards.forEach(card => {
            card.addEventListener('pointermove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            }, { passive: true });
        });
    }
});

/* ═══════════════════════════════════════════════════
   MOBILE CARD AWAKE STATES
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const mobileAliveMQ = window.matchMedia('(max-width: 768px)');
    const aliveCards = Array.from(document.querySelectorAll(
        '.about-card, .sk-category, .timeline-content, .contact-item, .contact-form'
    ));
    let aliveObserver = null;

    if (!aliveCards.length) return;

    const syncAliveCards = () => {
        if (aliveObserver) {
            aliveObserver.disconnect();
            aliveObserver = null;
        }

        aliveCards.forEach(card => card.classList.remove('mobile-awake'));

        if (!mobileAliveMQ.matches || prefersReducedMotion || typeof IntersectionObserver === 'undefined') return;

        aliveObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const isAwake = entry.isIntersecting && entry.intersectionRatio >= 0.25;
                entry.target.classList.toggle('mobile-awake', isAwake);
            });
        }, {
            threshold: [0.15, 0.25, 0.5],
            rootMargin: '-5% 0px -5% 0px'
        });

        aliveCards.forEach(card => aliveObserver.observe(card));
    };

    syncAliveCards();
    window.addEventListener('resize', debounce(syncAliveCards, 150), { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(syncAliveCards, 180), { passive: true });

    if (mobileAliveMQ.addEventListener) {
        mobileAliveMQ.addEventListener('change', syncAliveCards);
    } else {
        mobileAliveMQ.addListener(syncAliveCards);
    }
});

/* ═══════════════════════════════════════════════════
   TOOLKIT INTERACTION ENGINE
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const toolkitGrid = document.getElementById('toolkitGrid');
    const categories = document.querySelectorAll('.sk-category');

    if (!toolkitGrid || categories.length === 0) return;

    const toolkitObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                categories.forEach((cat, index) => {
                    setTimeout(() => {
                        cat.style.opacity = '1';
                        cat.style.transform = 'translateY(0) scale(1)';
                    }, index * 100);
                });
                toolkitObserver.unobserve(toolkitGrid);
            }
        });
    }, { threshold: 0.08 });

    categories.forEach(cat => {
        cat.style.opacity = '0';
        cat.style.transform = 'translateY(30px) scale(0.95)';
        cat.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    toolkitObserver.observe(toolkitGrid);
});

/* ═══════════════════════════════════════════════════
   TECH STACK — POP EFFECT ON SCROLL
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const techCards = document.querySelectorAll('.tech-card');
    if (!techCards.length) return;

    // Add initial hidden state
    techCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.7) translateY(20px)';
        card.style.transition = 'none';
    });

    const techObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const cards = entry.target.querySelectorAll('.tech-card');
                cards.forEach((card, i) => {
                    // Stagger the pop: each card pops slightly after the previous
                    const delay = Math.min(i, 12) * 60;
                    setTimeout(() => {
                        card.style.transition = 'opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1) translateY(0)';
                    }, delay);
                });
                techObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    const carouselSection = document.querySelector('.tech-carousel-section');
    if (carouselSection) techObserver.observe(carouselSection);
});

/* ═══════════════════════════════════════════════════
   STICKY STACK — PARALLAX DEPTH EFFECT
   As each section slides up, the section beneath
   dims via brightness filter (no opacity/scale to
   avoid transparency & side-gap ghosting). Fully
   covered sections are hidden with visibility:hidden.
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.hero');
    const stackSections = Array.from(
        document.querySelectorAll('.tech-carousel-section, main .section')
    );

    if (!hero && stackSections.length < 1) return;

    // All panels: hero is the base layer, sections stack on top
    const allPanels = hero ? [hero, ...stackSections] : [...stackSections];
    const desktopStackMQ = window.matchMedia('(min-width: 769px) and (min-height: 801px)');

    let stackTicking = false;

    function resetDesktopStack() {
        allPanels.forEach(panel => {
            panel.style.removeProperty('--stack-brightness');
            panel.style.removeProperty('--stack-scale');
            panel.style.removeProperty('--stack-y');
            panel.style.removeProperty('--stack-progress');
            panel.style.visibility = '';
            panel.style.pointerEvents = '';
        });
    }

    function updateStack() {
        if (prefersReducedMotion || !desktopStackMQ.matches) {
            resetDesktopStack();
            stackTicking = false;
            return;
        }

        const windowH = window.innerHeight;

        for (let i = 0; i < allPanels.length; i++) {
            const panel = allPanels[i];
            const nextPanel = allPanels[i + 1];

            if (!nextPanel) {
                // Last panel — ensure clean state
                panel.style.filter = '';
                panel.style.visibility = '';
                panel.style.pointerEvents = '';
                continue;
            }

            const nextRect = nextPanel.getBoundingClientRect();

            if (nextRect.top > 2 && nextRect.top < windowH) {
                // Next panel is sliding up — dim the current panel
                const progress = 1 - (nextRect.top / windowH);
                const clamped = Math.min(1, Math.max(0, progress));
                const brightness = 1 - (clamped * 0.18);
                const scale = 1 - (clamped * 0.022);
                const shiftY = Math.round(clamped * -18);

                panel.style.visibility = 'visible';
                panel.style.pointerEvents = 'auto';
                panel.style.setProperty('--stack-progress', clamped.toFixed(3));
                panel.style.setProperty('--stack-brightness', brightness.toFixed(3));
                panel.style.setProperty('--stack-scale', scale.toFixed(4));
                panel.style.setProperty('--stack-y', `${shiftY}px`);
            } else if (nextRect.top >= windowH) {
                // Next panel hasn't arrived — fully visible
                panel.style.removeProperty('--stack-brightness');
                panel.style.removeProperty('--stack-scale');
                panel.style.removeProperty('--stack-y');
                panel.style.removeProperty('--stack-progress');
                panel.style.visibility = '';
                panel.style.pointerEvents = '';
            } else {
                // Fully covered (nextRect.top <= 2) — completely hidden
                panel.style.visibility = 'hidden';
                panel.style.pointerEvents = 'none';
                panel.style.setProperty('--stack-progress', '1');
                panel.style.setProperty('--stack-brightness', '0.82');
                panel.style.setProperty('--stack-scale', '0.978');
                panel.style.setProperty('--stack-y', '-18px');
            }
        }

        stackTicking = false;
    }

    function requestDesktopStack() {
        if (!stackTicking) {
            requestAnimationFrame(updateStack);
            stackTicking = true;
        }
    }

    window.addEventListener('scroll', requestDesktopStack, { passive: true });
    window.addEventListener('resize', requestDesktopStack, { passive: true });
    if (desktopStackMQ.addEventListener) {
        desktopStackMQ.addEventListener('change', requestDesktopStack);
    } else {
        desktopStackMQ.addListener(requestDesktopStack);
    }

    requestDesktopStack();
});

/* ═══════════════════════════════════════════════════
   SMALL-SCREEN LAYOUT CLEANUP
   disables the stacked-mobile experiment and keeps
   sections readable on phones/tablets.
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const smallScreenMQ = window.matchMedia('(max-width: 1024px)');
    const panels = Array.from(document.querySelectorAll('.hero, .tech-carousel-section, main .section'));

    if (!panels.length) return;

    function clearMobileStack() {
        document.body.classList.remove('mobile-stack-ready');
        panels.forEach(panel => {
            panel.style.removeProperty('--stack-top');
            panel.style.removeProperty('--stack-min-height');
            panel.style.removeProperty('--mobile-stack-y');
            panel.style.removeProperty('--mobile-stack-scale');
            panel.style.removeProperty('--mobile-stack-brightness');
            panel.style.removeProperty('--mobile-stack-shadow');
            panel.style.removeProperty('--mobile-panel-focus');
            panel.style.removeProperty('--mobile-panel-shift');
            panel.style.removeProperty('--mobile-panel-opacity');
        });
    }

    function syncSmallScreenLayout() {
        clearMobileStack();
        if (smallScreenMQ.matches) {
            panels.forEach(panel => makeContentVisible(panel));
        }
        cacheSectionFlowPositions();
    }

    syncSmallScreenLayout();
    window.addEventListener('resize', debounce(syncSmallScreenLayout, 200), { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(syncSmallScreenLayout, 200), { passive: true });

    if (smallScreenMQ.addEventListener) {
        smallScreenMQ.addEventListener('change', syncSmallScreenLayout);
    } else {
        smallScreenMQ.addListener(syncSmallScreenLayout);
    }
});

/* ═══════════════════════════════════════════════════
   SMALL-SCREEN ABOUT MERGE
   fold the Tech Stack strip into About on phones only.
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const main = document.querySelector('main');
    const techSection = document.querySelector('main > .tech-carousel-section') || document.querySelector('.tech-carousel-section');
    const aboutSection = document.getElementById('about');
    const aboutContainer = aboutSection?.querySelector('.container');
    const aboutGrid = aboutSection?.querySelector('.about-grid');
    const aboutMergeMQ = window.matchMedia('(max-width: 768px)');

    if (!main || !techSection || !aboutSection || !aboutContainer || !aboutGrid) return;

    function syncAboutMerge() {
        if (aboutMergeMQ.matches) {
            if (techSection.parentElement !== aboutContainer) {
                aboutContainer.insertBefore(techSection, aboutGrid);
            }
            techSection.classList.add('mobile-merged-into-about');
            aboutSection.classList.add('mobile-about-merged');
        } else {
            if (techSection.parentElement !== main || techSection.nextElementSibling !== aboutSection) {
                main.insertBefore(techSection, aboutSection);
            }
            techSection.classList.remove('mobile-merged-into-about');
            aboutSection.classList.remove('mobile-about-merged');
        }

        makeContentVisible(techSection);
        makeContentVisible(aboutSection);
        cacheSectionFlowPositions();
    }

    syncAboutMerge();
    window.addEventListener('resize', debounce(syncAboutMerge, 200), { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(syncAboutMerge, 200), { passive: true });
});


/* -----------------------------------------------------------
   MOBILE SCROLL SLIDE-UP ANIMATIONS
   Runs only on touch/mobile (=768px). Each section's content
   cards slide up gracefully as the user scrolls into view.
   Uses .mob-reveal / .mob-visible class pair (defined in mobile-final.css).
----------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    const mobAnimMQ = window.matchMedia('(max-width: 768px)');
    const MOB_ANIM_SELECTORS = ['#about .about-text', '#about .about-card', '#skills .sk-category', '#projects .project-card', '#creative .creative-card', '#contact .contact-item', '#contact .contact-form', '.tech-carousel-section', '.section-label', '.section-title'].join(', ');
    let mobObserver = null;
    function setupMobAnimations() {
        if (mobObserver) { mobObserver.disconnect(); mobObserver = null; }
        if (!mobAnimMQ.matches) {
            document.querySelectorAll('.mob-reveal').forEach(el => el.classList.remove('mob-reveal', 'mob-visible'));
            return;
        }
        document.querySelectorAll(MOB_ANIM_SELECTORS).forEach(el => el.classList.add('mob-reveal'));
        mobObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('mob-visible');
                    mobObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        document.querySelectorAll('.mob-reveal').forEach(el => mobObserver.observe(el));
        setTimeout(() => { document.querySelectorAll('.mob-reveal:not(.mob-visible)').forEach(el => el.classList.add('mob-visible')); }, 3000);
    }
    setupMobAnimations();
    window.addEventListener('resize', debounce(setupMobAnimations, 200), { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(setupMobAnimations, 250), { passive: true });
    if (mobAnimMQ.addEventListener) mobAnimMQ.addEventListener('change', setupMobAnimations);
    else mobAnimMQ.addListener(setupMobAnimations);
});

/* ═══════════════════════════════════════════════════
   MOBILE POLISH — hero label, contact text reveal,
   and background mountain parallax.
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const mobileOnlyMQ = window.matchMedia('(max-width: 768px)');
    const heroCTA = document.querySelector('.hero-cta-circle');
    const root = document.documentElement;
    const contactRevealTargets = Array.from(document.querySelectorAll([
        '#contact .section-label',
        '#contact .section-title',
        '#contact .contact-intro',
        '#contact .contact-item .contact-type',
        '#contact .contact-item .contact-value',
        '#contact .contact-form h3'
    ].join(', ')));

    let contactRevealObserver = null;
    let parallaxTicking = false;

    if (heroCTA && !heroCTA.dataset.desktopLabel) {
        heroCTA.dataset.desktopLabel = heroCTA.innerHTML;
    }

    const syncHeroCTALabel = () => {
        if (!heroCTA) return;
        heroCTA.innerHTML = mobileOnlyMQ.matches ? 'Contact Me' : heroCTA.dataset.desktopLabel;
    };

    const updateMobileParallax = () => {
        if (!mobileOnlyMQ.matches || prefersReducedMotion) {
            root.style.setProperty('--mobile-mountain-shift', '0px');
            parallaxTicking = false;
            return;
        }

        const shift = Math.max(0, Math.min(window.scrollY, 3200));
        root.style.setProperty('--mobile-mountain-shift', `${shift}px`);
        parallaxTicking = false;
    };

    const requestMobileParallax = () => {
        if (parallaxTicking) return;
        requestAnimationFrame(updateMobileParallax);
        parallaxTicking = true;
    };

    const syncContactTextReveal = () => {
        if (contactRevealObserver) {
            contactRevealObserver.disconnect();
            contactRevealObserver = null;
        }

        contactRevealTargets.forEach((el, index) => {
            el.classList.remove('mobile-contact-text', 'is-visible');
            el.style.removeProperty('transition-delay');

            if (mobileOnlyMQ.matches) {
                el.classList.add('mobile-contact-text');
                el.style.transitionDelay = `${Math.min(index, 6) * 70}ms`;
            }
        });

        if (!mobileOnlyMQ.matches || !contactRevealTargets.length) return;

        if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
            contactRevealTargets.forEach(el => el.classList.add('is-visible'));
            return;
        }

        contactRevealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                contactRevealObserver.unobserve(entry.target);
            });
        }, {
            threshold: 0.22,
            rootMargin: '0px 0px -14% 0px'
        });

        contactRevealTargets.forEach(el => contactRevealObserver.observe(el));
    };

    syncHeroCTALabel();
    syncContactTextReveal();
    updateMobileParallax();

    window.addEventListener('scroll', requestMobileParallax, { passive: true });
    window.addEventListener('resize', debounce(() => {
        syncHeroCTALabel();
        syncContactTextReveal();
        updateMobileParallax();
    }, 180), { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(() => {
        syncHeroCTALabel();
        syncContactTextReveal();
        updateMobileParallax();
    }, 220), { passive: true });

    if (mobileOnlyMQ.addEventListener) {
        mobileOnlyMQ.addEventListener('change', () => {
            syncHeroCTALabel();
            syncContactTextReveal();
            updateMobileParallax();
        });
    } else {
        mobileOnlyMQ.addListener(() => {
            syncHeroCTALabel();
            syncContactTextReveal();
            updateMobileParallax();
        });
    }
});

/* ═══════════════════════════════════════════════════
   DEPLOYMENT POLISH — safer links + premium text reveal
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        link.setAttribute('rel', Array.from(rel).join(' '));
    });

    const splitTargets = Array.from(document.querySelectorAll([
        '.hero-greeting',
        '.profile-badge',
        '.section-label',
        '.section-title',
        '.section-subtitle',
        '.project-section-copy'
    ].join(', ')));

    const prepareSplitReveal = (el) => {
        if (!el || el.dataset.splitPrepared === '1') return;

        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text) return;

        el.dataset.splitPrepared = '1';
        el.setAttribute('data-split-reveal', '');
        el.setAttribute('aria-label', text);
        el.textContent = '';

        const frag = document.createDocumentFragment();
        const words = text.split(' ');

        words.forEach((word, index) => {
            const wrap = document.createElement('span');
            wrap.className = 'split-word';
            wrap.setAttribute('aria-hidden', 'true');

            const inner = document.createElement('span');
            inner.className = 'split-word-inner';
            inner.textContent = word;
            inner.style.setProperty('--split-index', String(index));

            wrap.appendChild(inner);
            frag.appendChild(wrap);
        });

        el.appendChild(frag);
        el.classList.add('split-reveal-ready');
    };

    splitTargets.forEach(prepareSplitReveal);

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
        splitTargets.forEach(el => el.classList.add('is-split-visible'));
        return;
    }

    const splitObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-split-visible');
            splitObserver.unobserve(entry.target);
        });
    }, {
        threshold: 0.22,
        rootMargin: '0px 0px -10% 0px'
    });

    splitTargets.forEach(el => splitObserver.observe(el));

    setTimeout(() => {
        splitTargets.forEach(el => el.classList.add('is-split-visible'));
    }, 2600);
});
