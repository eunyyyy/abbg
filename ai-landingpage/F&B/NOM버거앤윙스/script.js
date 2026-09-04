// NOM Burger & Wings — interactions
(() => {
  'use strict';

  /* ---------- header scroll state ---------- */
  const header = document.getElementById('header');
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile nav toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navToggle.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  });

  /* ---------- reveal on scroll ---------- */
  const revealTargets = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- scroll-progress pins (hero fullscreen reveal + ingredients merge) ---------- */
  const heroPin = document.getElementById('heroPin');
  const hero = document.getElementById('hero');
  const ingredientsSection = document.querySelector('.ingredients');
  const ingredientsPin = document.getElementById('ingredientsPin');

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const pinProgress = (pinEl) => {
    const rect = pinEl.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    if (scrollable <= 0) return 1;
    return clamp(-rect.top / scrollable, 0, 1);
  };

  let ticking = false;
  const updatePins = () => {
    ticking = false;
    if (heroPin && hero) {
      hero.style.setProperty('--p', pinProgress(heroPin).toFixed(4));
    }
    if (ingredientsSection && ingredientsPin) {
      ingredientsPin.style.setProperty('--ip', pinProgress(ingredientsSection).toFixed(4));
    }
  };
  const requestPinUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updatePins);
    }
  };
  updatePins();
  window.addEventListener('scroll', requestPinUpdate, { passive: true });
  window.addEventListener('resize', requestPinUpdate);

  /* ---------- menu tabs ---------- */
  const menuTabs = document.querySelectorAll('.menu-tab');
  const menuPanels = document.querySelectorAll('.menu-panel');
  menuTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      menuTabs.forEach((t) => {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      menuPanels.forEach((panel) => {
        panel.classList.toggle('is-active', panel.dataset.panel === target);
      });
    });
  });

  /* ---------- carousel drag-to-scroll (mouse) ---------- */
  document.querySelectorAll('.menu-carousel').forEach((carousel) => {
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    carousel.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX;
      scrollStart = carousel.scrollLeft;
    });
    window.addEventListener('mouseup', () => { isDown = false; });
    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      carousel.scrollLeft = scrollStart - (e.pageX - startX);
    });
  });
})();
