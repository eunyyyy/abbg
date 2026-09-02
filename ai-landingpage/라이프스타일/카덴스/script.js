(() => {
  'use strict';

  /* ---------------------------------------------------------------------
     Pageloader — fades out after content is ready
     --------------------------------------------------------------------- */
  function initPageloader() {
    const loader = document.querySelector('[data-pageloader]');
    if (!loader) return;
    const done = () => {
      loader.style.opacity = '0';
      loader.style.pointerEvents = 'none';
      setTimeout(() => loader.remove(), 700);
    };
    if (document.readyState === 'complete') {
      setTimeout(done, 500);
    } else {
      window.addEventListener('load', () => setTimeout(done, 500));
      setTimeout(done, 2200); // safety fallback
    }
    loader.style.transition = 'opacity .6s ease';
  }

  /* ---------------------------------------------------------------------
     Custom cursor — dot + difference-blend, hidden until first mousemove
     (kept opacity:0 until is-ready is added, avoids the origin-corner
     artifact seen on prior builds in this series)
     --------------------------------------------------------------------- */
  function initCursor() {
    const cursor = document.querySelector('[data-cursor]');
    if (!cursor) return;
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

    let mx = 0, my = 0, ready = false;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%,-50%)`;
      if (!ready) {
        ready = true;
        cursor.classList.add('is-ready');
      }
    }, { passive: true });

    document.querySelectorAll('[data-cursor-target]').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-pointer'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-pointer'));
    });

    document.querySelectorAll('[data-cursor-zone="grab"]').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-grab'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-grab'));
    });
  }

  /* ---------------------------------------------------------------------
     Nav burger overlay
     --------------------------------------------------------------------- */
  function initBurger() {
    const toggle = document.querySelector('[data-burger-toggle]');
    const burger = document.querySelector('[data-burger]');
    if (!toggle || !burger) return;

    const setOpen = (open) => {
      burger.classList.toggle('is-open', open);
      document.documentElement.style.overflow = open ? 'hidden' : '';
      toggle.classList.toggle('is-active', open);
    };

    toggle.addEventListener('click', () => setOpen(!burger.classList.contains('is-open')));
    burger.querySelectorAll('[data-burger-link]').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });
  }

  /* ---------------------------------------------------------------------
     GNB anchor scroll — smooth, offset for the fixed nav bar height
     --------------------------------------------------------------------- */
  function initAnchorNav() {
    const nav = document.querySelector('[data-nav]');
    const offset = () => (nav ? nav.getBoundingClientRect().height + 12 : 0);

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href').slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - offset();
        window.scrollTo({ top, behavior: 'smooth' });
        history.replaceState(null, '', `#${id}`);
      });
    });
  }

  /* ---------------------------------------------------------------------
     Scroll reveal — one-shot fade/rise via IntersectionObserver
     --------------------------------------------------------------------- */
  function initReveal() {
    const targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    targets.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------------
     Decorative squiggle stroke-draw — one-shot on scroll into view
     --------------------------------------------------------------------- */
  function initSquiggles() {
    const targets = document.querySelectorAll('.squiggle');
    if (!targets.length || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    targets.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------------
     Lightweight scroll parallax for [data-parallax] media
     --------------------------------------------------------------------- */
  function initParallax() {
    const els = Array.from(document.querySelectorAll('[data-parallax]'));
    if (!els.length) return;
    let ticking = false;

    const update = () => {
      const vh = window.innerHeight;
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const centerDelta = (rect.top + rect.height / 2 - vh / 2) / vh; // -~1..1
        const shift = centerDelta * 24; // px
        el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(1.08)`;
      });
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------------------------------------------------------------------
     Drag-to-scroll helper for native horizontal strips (calendar slider)
     --------------------------------------------------------------------- */
  function makeDraggable(el, { autoplayMs } = {}) {
    if (!el) return;
    let isDown = false, startX = 0, startScroll = 0, moved = false;

    const down = (x) => {
      isDown = true;
      moved = false;
      startX = x;
      startScroll = el.scrollLeft;
      el.classList.add('is-dragging');
      stopAutoplay();
    };
    const move = (x) => {
      if (!isDown) return;
      const dx = x - startX;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = startScroll - dx;
    };
    const up = () => {
      if (!isDown) return;
      isDown = false;
      el.classList.remove('is-dragging');
      startAutoplay();
    };

    el.addEventListener('mousedown', (e) => { down(e.clientX); e.preventDefault(); });
    window.addEventListener('mousemove', (e) => move(e.clientX));
    window.addEventListener('mouseup', up);

    el.addEventListener('touchstart', (e) => down(e.touches[0].clientX), { passive: true });
    el.addEventListener('touchmove', (e) => move(e.touches[0].clientX), { passive: true });
    el.addEventListener('touchend', up);

    // suppress the trailing click that follows a real drag
    el.addEventListener('click', (e) => { if (moved) e.preventDefault(); }, true);

    let autoplayTimer = null;
    function startAutoplay() {
      if (!autoplayMs || !('IntersectionObserver' in window)) return;
      stopAutoplay();
      autoplayTimer = setInterval(() => {
        const card = el.firstElementChild;
        if (!card) return;
        const step = card.getBoundingClientRect().width + 24;
        const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
        el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + step, behavior: 'smooth' });
      }, autoplayMs);
    }
    function stopAutoplay() {
      if (autoplayTimer) clearInterval(autoplayTimer);
      autoplayTimer = null;
    }

    el.addEventListener('mouseenter', stopAutoplay);
    el.addEventListener('mouseleave', () => { if (!isDown) startAutoplay(); });

    startAutoplay();
  }

  function initDraggableSliders() {
    makeDraggable(document.querySelector('.calendar__slider[data-slider]'), { autoplayMs: 4000 });
  }

  /* ---------------------------------------------------------------------
     Scroll-driven word fill — words dim -> full color as the block
     scrolls through a fixed band of the viewport (continuous, bidirectional)
     --------------------------------------------------------------------- */
  function initScrollFill() {
    const blocks = Array.from(document.querySelectorAll('.js-scroll-fill')).map((el) => ({
      el,
      words: Array.from(el.querySelectorAll('.word')),
    })).filter((b) => b.words.length);
    if (!blocks.length) return;

    let ticking = false;

    const update = () => {
      const vh = window.innerHeight;
      const start = vh * 0.85;
      const end = vh * 0.35;
      blocks.forEach(({ el, words }) => {
        const rect = el.getBoundingClientRect();
        const span = (start - end) + rect.height;
        const progress = span <= 0 ? 1 : Math.min(1, Math.max(0, (start - rect.top) / span));
        const filledCount = Math.round(progress * words.length);
        words.forEach((w, i) => w.classList.toggle('is-filled', i < filledCount));
      });
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------------------------------------------------------------------
     Count-up — animates a number from 0 to its target once it scrolls
     into view (one-shot, mirrors the data-reveal timing)
     --------------------------------------------------------------------- */
  function formatCount(value, el) {
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    let str = value.toFixed(decimals);
    if (el.dataset.format === 'comma') {
      const parts = str.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      str = parts.join('.');
    }
    return str + suffix;
  }

  function animateCount(el) {
    const target = parseFloat(el.dataset.countTo);
    const duration = 1400;
    const startTime = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatCount(target * eased, el);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function initCountUp() {
    const targets = document.querySelectorAll('[data-count-to]');
    if (!targets.length) return;
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => animateCount(el));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    targets.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------------
     Newsletter form — no backend, just a friendly inline confirmation
     --------------------------------------------------------------------- */
  function initNewsletterForm() {
    const form = document.querySelector('[data-newsletter-form]');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn = form.querySelector('button');
      const label = btn?.querySelector('.is-default, .is-hover');
      if (label) {
        const original = label.textContent;
        btn.querySelectorAll('.is-default, .is-hover').forEach((s) => (s.textContent = '감사합니다!'));
        setTimeout(() => {
          btn.querySelectorAll('.is-default, .is-hover').forEach((s) => (s.textContent = original));
        }, 2400);
      }
      if (input) input.value = '';
    });
  }

  /* ---------------------------------------------------------------------
     boot
     --------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initPageloader();
    initCursor();
    initBurger();
    initAnchorNav();
    initReveal();
    initSquiggles();
    initParallax();
    initDraggableSliders();
    initScrollFill();
    initCountUp();
    initNewsletterForm();
  });
})();
