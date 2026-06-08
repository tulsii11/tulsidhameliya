/**
 * TULSI DHAMELIYA — PORTFOLIO
 * script.js
 * Handles: loader, navbar scroll, mobile menu,
 *          scroll reveal, and horizontal carousels.
 */

/* ============================================================
   1. LOADER
   Fades out once the page is fully loaded.
   ============================================================ */
(function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;

  // Minimum display time so the animation feels intentional
  const MIN_LOADER_MS = 1600;
  const start = Date.now();

  function hideLoader() {
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, MIN_LOADER_MS - elapsed);

    setTimeout(() => {
      loader.classList.add('hidden');
      // Remove from DOM after transition ends (keeps accessibility tree clean)
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }, remaining);
  }

  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader);
  }
})();


/* ============================================================
   2. NAVBAR — scroll-aware background
   ============================================================ */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  // Add .scrolled class once user passes 60px to show blurred background
  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load in case page is already scrolled
})();


/* ============================================================
   3. MOBILE MENU — hamburger toggle
   ============================================================ */
(function initMobileMenu() {
  const hamburger   = document.getElementById('hamburger');
  const menu        = document.getElementById('mobile-menu');
  const overlay     = document.getElementById('mobile-overlay');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (!hamburger || !menu || !overlay) return;

  let isOpen = false;

  function openMenu() {
    isOpen = true;
    menu.classList.add('open');
    overlay.classList.add('visible');
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    // Prevent body scroll while menu is open
    document.body.style.overflow = 'hidden';
    // Move focus to first link for keyboard users
    mobileLinks[0] && mobileLinks[0].focus();
  }

  function closeMenu() {
    isOpen = false;
    menu.classList.remove('open');
    overlay.classList.remove('visible');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    hamburger.focus();
  }

  hamburger.addEventListener('click', () => {
    isOpen ? closeMenu() : openMenu();
  });

  // Close when overlay (dimmed bg) is clicked
  overlay.addEventListener('click', closeMenu);

  // Close when any nav link is tapped
  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });
})();


/* ============================================================
   4. SMOOTH SCROLLING for anchor links
   (CSS scroll-behavior handles most cases; this adds offset
    to clear the fixed navbar height.)
   ============================================================ */
(function initSmoothScroll() {
  const NAVBAR_HEIGHT = 80; // px — matches navbar padding

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      const target   = document.getElementById(targetId);
      if (!target) return;

      e.preventDefault();

      const top = target.getBoundingClientRect().top
                + window.scrollY
                - NAVBAR_HEIGHT;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ============================================================
   5. SCROLL REVEAL (Intersection Observer)
   Elements with .reveal class animate in when they enter
   the viewport. Cheap, performant, no libraries needed.
   ============================================================ */
(function initScrollReveal() {
  // Skip if browser doesn't support IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    // Fallback: make everything visible immediately
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Un-observe after triggering (one-shot animation)
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,       // trigger when 12% of element is visible
      rootMargin: '0px 0px -40px 0px' // small bottom offset for elegance
    }
  );

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();


/* ============================================================
   6. HORIZONTAL CAROUSELS
   Each .carousel block gets:
   - Arrow button navigation (desktop)
   - Pointer drag-to-scroll (desktop)
   - Touch/swipe (mobile — native smooth scroll via CSS)
   - Keyboard left/right arrow key support
   ============================================================ */
(function initCarousels() {
  const categories = document.querySelectorAll('.works-category');

  categories.forEach(category => {
    const track     = category.querySelector('.carousel-track');
    const prevBtn   = category.querySelector('.arrow-prev');
    const nextBtn   = category.querySelector('.arrow-next');

    if (!track) return;

    // ── Scroll amount per arrow click (one card-width + gap) ──
    const SCROLL_STEP = 340; // px; roughly one card

    // Arrow button click handlers
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        track.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' });
      });
    }

    // ── Keyboard navigation (left/right arrow keys while focused) ──
    track.setAttribute('tabindex', '0');

    track.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        track.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        track.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' });
      }
    });

    // ── Pointer (mouse) drag-to-scroll ──
    // Gives a natural feel on desktop without a heavy library
    let isDragging   = false;
    let startX       = 0;
    let startScrollL = 0;
    let hasDragged   = false; // distinguish click from drag

    track.addEventListener('pointerdown', e => {
      // Let variation sliders handle their own drag inside a card
      if (e.target.closest('.logo-variation-frame, .business-card-variation-frame')) return;
      // Only handle primary mouse button or pen
      if (e.pointerType === 'touch') return; // let native touch handle mobile

      isDragging   = true;
      hasDragged   = false;
      startX       = e.clientX;
      startScrollL = track.scrollLeft;
      track.setPointerCapture(e.pointerId);
      track.style.scrollBehavior = 'auto'; // instant while dragging
    });

    track.addEventListener('pointermove', e => {
      if (!isDragging || e.pointerType === 'touch') return;

      const delta = e.clientX - startX;
      if (Math.abs(delta) > 4) hasDragged = true; // threshold to detect real drag

      track.scrollLeft = startScrollL - delta;
    });

    function endDrag(e) {
      if (!isDragging || e.pointerType === 'touch') return;
      isDragging = false;
      track.style.scrollBehavior = ''; // restore smooth scroll
    }

    track.addEventListener('pointerup',     endDrag);
    track.addEventListener('pointercancel', endDrag);

    // Prevent click events on cards from firing after a drag
    track.addEventListener('click', e => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);

    // ── Update arrow button states (optional UX: dim when at edge) ──
    function updateArrows() {
      if (!prevBtn || !nextBtn) return;
      const atStart = track.scrollLeft <= 4;
      const atEnd   = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      prevBtn.style.opacity = atStart ? '0.3' : '1';
      nextBtn.style.opacity = atEnd   ? '0.3' : '1';
    }

    track.addEventListener('scroll', updateArrows, { passive: true });
    updateArrows(); // initial state
  });
})();


/* ============================================================
  7. LOGO VARIATION FRAME
  Cycles through logo design variations inside the first card.
   ============================================================ */
(function initLogoVariationFrame() {
  const frames = document.querySelectorAll('.logo-variation-frame, .business-card-variation-frame');
  if (!frames.length) return;

  const DRAG_THRESHOLD = 48;

  frames.forEach(frame => {
    const track = frame.querySelector('.logo-variation-track');
    if (!track) return;

    const slides = track.querySelectorAll('img');
    if (slides.length <= 1) return;

    const card = frame.closest('.project-card');
    const dotsWrap = card ? card.querySelector('.logo-variation-dots') : null;
    let index = 0;
    const cycleMs = 3000;
    let timerId = null;
    let isDragging = false;
    let startX = 0;
    let dragPx = 0;

    const dots = [];

    function setTransform(offsetPx = 0) {
      track.style.transform = `translateX(calc(-${index * 100}% + ${offsetPx}px))`;
    }

    function updateView() {
      track.style.transition = '';
      setTransform(0);
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    if (dotsWrap) {
      slides.forEach((_, dotIndex) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'logo-dot';
        dot.setAttribute('aria-label', `Show variation ${dotIndex + 1}`);
        dot.addEventListener('click', () => {
          index = dotIndex;
          updateView();
        });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function startAutoSlide() {
      if (timerId) return;
      timerId = setInterval(() => {
        index = (index + 1) % slides.length;
        updateView();
      }, cycleMs);
    }

    function stopAutoSlide() {
      if (!timerId) return;
      clearInterval(timerId);
      timerId = null;
    }

    frame.addEventListener('pointerdown', e => {
      e.stopPropagation();
      stopAutoSlide();
      isDragging = true;
      startX = e.clientX;
      dragPx = 0;
      frame.setPointerCapture(e.pointerId);
      track.style.transition = 'none';
      frame.classList.add('is-dragging');
    });

    frame.addEventListener('pointermove', e => {
      if (!isDragging) return;
      e.stopPropagation();
      dragPx = e.clientX - startX;
      if (Math.abs(dragPx) > 4) e.preventDefault();
      setTransform(dragPx);
    });

    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      frame.classList.remove('is-dragging');

      if (dragPx <= -DRAG_THRESHOLD && index < slides.length - 1) index += 1;
      else if (dragPx >= DRAG_THRESHOLD && index > 0) index -= 1;

      updateView();
      if (!frame.matches(':hover')) startAutoSlide();
    }

    frame.addEventListener('pointerup', endDrag);
    frame.addEventListener('pointercancel', endDrag);

    frame.addEventListener('mouseenter', stopAutoSlide);
    frame.addEventListener('mouseleave', () => {
      if (isDragging) return;
      startAutoSlide();
    });
    frame.addEventListener('focusin', stopAutoSlide);
    frame.addEventListener('focusout', event => {
      if (frame.contains(event.relatedTarget) || isDragging) return;
      startAutoSlide();
    });

    updateView();
    startAutoSlide();
  });
})();


/* ============================================================
  8. ACTIVE NAV LINK HIGHLIGHTING
   Highlights the nav link corresponding to the current section
   as the user scrolls (nice premium touch).
   ============================================================ */
(function initActiveNav() {
  if (!('IntersectionObserver' in window)) return;

  const sections  = document.querySelectorAll('main section[id]');
  const navLinks  = document.querySelectorAll('.nav-links a');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const isMatch = link.getAttribute('href') === `#${id}`;
          link.style.color = isMatch
            ? 'var(--text-primary)'
            : '';
        });
      });
    },
    {
      rootMargin: '-40% 0px -50% 0px', // trigger near center of viewport
      threshold: 0
    }
  );

  sections.forEach(sec => observer.observe(sec));
})();
