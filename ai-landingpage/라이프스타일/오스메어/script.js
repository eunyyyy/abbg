(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------------------------------------------------------------------
     GNB — fade in, scrolled state, section theme, overlay menu
     ------------------------------------------------------------------- */
  const gnb = document.getElementById('gnb');
  const gnbTrigger = document.getElementById('gnbTrigger');
  const gnbOverlay = document.getElementById('gnbOverlay');

  requestAnimationFrame(() => gnb.classList.add('is-visible'));

  function setGnbOpen(open) {
    gnb.classList.toggle('is-open', open);
    gnbTrigger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  gnbTrigger.addEventListener('click', () => setGnbOpen(!gnb.classList.contains('is-open')));
  gnbOverlay.querySelectorAll('[data-nav-link]').forEach((link) => {
    link.addEventListener('click', () => setGnbOpen(false));
  });

  const darkThemeSections = ['hero', 'best', 'bold', 'campaign', 'motion'];
  const themeSections = darkThemeSections
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  let scrollTicking = false;
  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      gnb.classList.toggle('is-scrolled', y > 40);

      const probeY = 90;
      let dark = false;
      for (const section of themeSections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= probeY && rect.bottom >= probeY) { dark = true; break; }
      }
      gnb.classList.toggle('theme-dark', dark);
      gnb.classList.toggle('theme-light', !dark);

      scrollTicking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------------
     Hero reveal
     ------------------------------------------------------------------- */
  const hero = document.getElementById('hero');
  window.addEventListener('load', () => {
    requestAnimationFrame(() => hero.classList.add('is-revealed'));
  });
  setTimeout(() => hero.classList.add('is-revealed'), 600);

  /* ---------------------------------------------------------------------
     Scroll reveal — one-shot IntersectionObserver
     ------------------------------------------------------------------- */
  const revealTargets = document.querySelectorAll('.reveal-up, [data-lines], [data-words]');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  revealTargets.forEach((el) => revealObserver.observe(el));

  /* ---------------------------------------------------------------------
     Best — frame reveal (clip-path + image scale)
     ------------------------------------------------------------------- */
  const bestFrame = document.getElementById('bestFrame');
  if (bestFrame) {
    const bestObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          bestFrame.classList.add('is-visible');
          bestObserver.unobserve(bestFrame);
        }
      });
    }, { threshold: 0.25 });
    bestObserver.observe(bestFrame);
  }

  /* ---------------------------------------------------------------------
     Drag-to-scroll horizontal tracks (Arrivals, Categories)
     ------------------------------------------------------------------- */
  function makeDraggable(track) {
    if (!track) return;
    let isDown = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;

    const down = (x) => {
      isDown = true;
      moved = false;
      startX = x;
      startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
    };
    const move = (x) => {
      if (!isDown) return;
      const dx = x - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
    };
    const up = () => {
      isDown = false;
      track.classList.remove('is-dragging');
    };

    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      down(e.clientX);
    });
    window.addEventListener('pointermove', (e) => move(e.clientX));
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);

    track.addEventListener('click', (e) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }
  makeDraggable(document.getElementById('arrivalsTrack'));
  makeDraggable(document.getElementById('categoriesTrack'));

  /* ---------------------------------------------------------------------
     Motion — scroll-pinned circular reveal
     ------------------------------------------------------------------- */
  const motionSection = document.getElementById('motion');
  const motionReveal = document.getElementById('motionReveal');
  if (motionSection && motionReveal && !prefersReducedMotion) {
    let motionTicking = false;
    const updateMotion = () => {
      const rect = motionSection.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0
        ? Math.min(1, Math.max(0, -rect.top / scrollable))
        : 0;
      const radius = (progress * 78).toFixed(2);
      motionReveal.style.clipPath = `circle(${radius}% at 50% 50%)`;
      motionTicking = false;
    };
    window.addEventListener('scroll', () => {
      if (motionTicking) return;
      motionTicking = true;
      requestAnimationFrame(updateMotion);
    }, { passive: true });
    updateMotion();
  } else if (motionReveal) {
    motionReveal.style.clipPath = 'circle(78% at 50% 50%)';
  }

  /* ---------------------------------------------------------------------
     Custom cursor — dot + trailing ring + context label
     ------------------------------------------------------------------- */
  if (!isCoarsePointer && !prefersReducedMotion) {
    const cursor = document.getElementById('cursor');
    const cursorLabel = document.getElementById('cursorLabel');
    const ring = cursor.querySelector('.cursor__ring');
    const dot = cursor.querySelector('.cursor__dot');

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    let ready = false;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!ready) {
        ringX = mouseX;
        ringY = mouseY;
        ready = true;
        cursor.classList.add('is-ready');
      }
    });

    function tick() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    const hoverTargets = document.querySelectorAll('a, button, [data-cursor]');
    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('is-active');
        cursorLabel.textContent = el.getAttribute('data-cursor') || 'View';
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-active');
      });
    });
  }

  /* ---------------------------------------------------------------------
     Footer — newsletter form (static demo, no backend)
     ------------------------------------------------------------------- */
  const footerForm = document.getElementById('footerForm');
  if (footerForm) {
    footerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = footerForm.querySelector('button');
      const original = btn.textContent;
      btn.textContent = 'Subscribed';
      footerForm.reset();
      setTimeout(() => { btn.textContent = original; }, 2200);
    });
  }
})();
