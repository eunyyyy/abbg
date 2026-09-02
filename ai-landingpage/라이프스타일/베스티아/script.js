(() => {
  'use strict';

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /* ------------------------------------------------------------------ *
   * GNB — reveal on load, scroll state, open/close overlay, anchor nav
   * ------------------------------------------------------------------ */
  const gnb = document.getElementById('gnb');
  const gnbTrigger = document.getElementById('gnbTrigger');
  const gnbOverlay = document.getElementById('gnbOverlay');

  requestAnimationFrame(() => gnb.classList.add('is-visible'));

  function setGnbScrolled() {
    gnb.classList.toggle('is-scrolled', window.scrollY > window.innerHeight * 0.6);
  }
  setGnbScrolled();

  function toggleMenu(force) {
    const open = typeof force === 'boolean' ? force : !gnb.classList.contains('is-open');
    gnb.classList.toggle('is-open', open);
    gnbOverlay.classList.toggle('is-open', open);
    gnbTrigger.setAttribute('aria-expanded', String(open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }

  gnbTrigger.addEventListener('click', () => toggleMenu());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gnb.classList.contains('is-open')) toggleMenu(false);
  });

  document.querySelectorAll('[data-anchor-link]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      toggleMenu(false);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ------------------------------------------------------------------ *
   * Generic one-shot reveal (fade-up / line / word)
   * ------------------------------------------------------------------ */
  const revealTargets = document.querySelectorAll('.reveal-up, [data-lines], [data-words]');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  revealTargets.forEach((el) => revealObserver.observe(el));

  /* ------------------------------------------------------------------ *
   * Hero — reveal-in on load, scroll-tied contract effect
   * ------------------------------------------------------------------ */
  const hero = document.querySelector('.hero');
  const heroFrame = document.getElementById('heroFrame');
  requestAnimationFrame(() => {
    setTimeout(() => hero.classList.add('is-revealed'), 150);
  });

  function updateHero() {
    const rect = hero.getBoundingClientRect();
    const progress = clamp(-rect.top / rect.height, 0, 1);
    const inset = progress * 7;
    heroFrame.style.clipPath = `inset(${inset}vh ${inset}vw round 4px)`;
  }

  /* ------------------------------------------------------------------ *
   * About — pinned dual-line swap + content reveal, scroll-progress driven
   * ------------------------------------------------------------------ */
  const about = document.getElementById('about');
  const aboutLines = about.querySelectorAll('[data-swap-line]');
  const aboutContent = document.getElementById('aboutContent');

  function updateAbout() {
    const rect = about.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const progress = clamp(-rect.top / Math.max(scrollable, 1), 0, 1);

    const line0 = aboutLines[0];
    const line1 = aboutLines[1];

    line0.classList.toggle('is-visible', progress >= 0.08 && progress < 0.38);
    line0.classList.toggle('is-up', progress >= 0.38);

    line1.classList.toggle('is-visible', progress >= 0.38 && progress < 0.82);
    line1.classList.toggle('is-up', progress >= 0.82);

    aboutContent.classList.toggle('is-visible', progress >= 0.7);
  }

  /* ------------------------------------------------------------------ *
   * Process — pinned sticky-stack stepper, clip-path wipe + active labels
   * ------------------------------------------------------------------ */
  const processRunway = document.getElementById('processRunway');
  const processItems = processRunway.querySelectorAll('.process__item');
  const processLabels = document.querySelectorAll('.process__label');
  const processPoints = document.querySelectorAll('.process__point');
  const stepCount = processItems.length;

  function updateProcess() {
    const rect = processRunway.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const globalProgress = clamp(-rect.top / Math.max(scrollable, 1), 0, 1);
    const activeIndex = clamp(Math.floor(globalProgress * stepCount), 0, stepCount - 1);

    processItems.forEach((item, i) => {
      if (i === 0) {
        item.style.clipPath = 'polygon(0 0,100% 0,100% 100%,0 100%)';
        return;
      }
      const local = clamp(globalProgress * stepCount - i, 0, 1);
      const x = local * 100;
      item.style.clipPath = `polygon(0 0, ${x}% 0, ${x}% 100%, 0 100%)`;
    });

    processLabels.forEach((label, i) => label.classList.toggle('is-active', i === activeIndex));
    processPoints.forEach((point, i) => point.classList.toggle('is-active', i === activeIndex));
  }

  /* ------------------------------------------------------------------ *
   * Scroll loop — single rAF-throttled handler for all progress effects
   * ------------------------------------------------------------------ */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      setGnbScrolled();
      updateHero();
      updateAbout();
      updateProcess();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
