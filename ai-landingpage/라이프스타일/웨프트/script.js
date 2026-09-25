(function () {
  'use strict';

  /* ---------------- Nav overlay (hamburger) ---------------- */
  var hamburgerBtn = document.getElementById('hamburgerBtn');
  var navCloseBtn = document.getElementById('navCloseBtn');
  var navOverlay = document.getElementById('navOverlay');
  var navLinks = document.querySelectorAll('.nav-link');

  function openNav() {
    navOverlay.classList.add('is-open');
    hamburgerBtn.classList.add('is-open');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-locked');
  }
  function closeNav() {
    navOverlay.classList.remove('is-open');
    hamburgerBtn.classList.remove('is-open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-locked');
  }
  hamburgerBtn.addEventListener('click', function () {
    if (navOverlay.classList.contains('is-open')) closeNav(); else openNav();
  });
  navCloseBtn.addEventListener('click', closeNav);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navOverlay.classList.contains('is-open')) closeNav();
  });
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      closeNav();
    });
  });

  /* ---------------- Hero slider (crossfade) ---------------- */
  var slides = [document.getElementById('heroSlide0'), document.getElementById('heroSlide1')];
  var heroPrev = document.getElementById('heroPrev');
  var heroNext = document.getElementById('heroNext');
  var activeSlide = 0;
  var autoplayTimer = null;

  function showSlide(index) {
    slides[activeSlide].classList.remove('is-active');
    activeSlide = (index + slides.length) % slides.length;
    slides[activeSlide].classList.add('is-active');
  }
  function restartAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayTimer = setInterval(function () { showSlide(activeSlide + 1); }, 6000);
  }
  heroNext.addEventListener('click', function () { showSlide(activeSlide + 1); restartAutoplay(); });
  heroPrev.addEventListener('click', function () { showSlide(activeSlide - 1); restartAutoplay(); });
  restartAutoplay();

  /* ---------------- GRIPH-inspired poster accordion ---------------- */
  var posterStack = document.getElementById('posterStack');
  var posterPanels = posterStack ? Array.prototype.slice.call(posterStack.querySelectorAll('.poster-panel')) : [];
  var activePoster = Math.max(0, posterPanels.findIndex(function (panel) { return panel.classList.contains('is-active'); }));
  var wheelLocked = false;

  function setActivePoster(index, shouldFocus) {
    if (!posterPanels.length) return;
    activePoster = (index + posterPanels.length) % posterPanels.length;
    posterPanels.forEach(function (panel, panelIndex) {
      panel.classList.toggle('is-active', panelIndex === activePoster);
      panel.setAttribute('aria-pressed', panelIndex === activePoster ? 'true' : 'false');
    });
    if (shouldFocus && window.innerWidth <= 768) {
      posterPanels[activePoster].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  posterPanels.forEach(function (panel, index) {
    panel.addEventListener('mouseenter', function () {
      if (window.matchMedia('(hover:hover)').matches) setActivePoster(index, false);
    });
    panel.addEventListener('click', function () { setActivePoster(index, true); });
  });

  if (posterStack) {
    posterStack.addEventListener('wheel', function (event) {
      if (window.innerWidth <= 768 || wheelLocked || Math.abs(event.deltaY) < 16) return;
      event.preventDefault();
      wheelLocked = true;
      setActivePoster(activePoster + (event.deltaY > 0 ? 1 : -1), false);
      window.setTimeout(function () { wheelLocked = false; }, 420);
    }, { passive: false });
    posterStack.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') { event.preventDefault(); setActivePoster(activePoster + 1, true); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setActivePoster(activePoster - 1, true); }
    });
    setActivePoster(activePoster, false);
  }

  /* ---------------- Counter animation ---------------- */
  var counters = document.querySelectorAll('[data-count]');
  function runCounter(element) {
    var target = Number(element.getAttribute('data-count')) || 0;
    var duration = 1300;
    var startTime = null;
    function tick(time) {
      if (!startTime) startTime = time;
      var progress = Math.min((time - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(target * eased).toLocaleString('ko-KR');
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .7 });
    counters.forEach(function (counter) { counterObserver.observe(counter); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------------- Clipart character cursor ---------------- */
  var customCursor = document.getElementById('customCursor');
  if (customCursor && window.matchMedia('(pointer:fine)').matches) {
    var cursorX = -100;
    var cursorY = -100;
    var cursorFrame = null;
    document.addEventListener('mousemove', function (event) {
      cursorX = event.clientX;
      cursorY = event.clientY;
      customCursor.classList.add('is-visible');
      if (!cursorFrame) {
        cursorFrame = requestAnimationFrame(function () {
          customCursor.style.transform = 'translate3d(' + cursorX + 'px,' + cursorY + 'px,0) translate(-20%,-18%)';
          cursorFrame = null;
        });
      }
    });
    document.addEventListener('mouseover', function (event) {
      customCursor.classList.toggle('is-hover', Boolean(event.target.closest('a,button,.poster-stack')));
    });
    document.addEventListener('mousedown', function () { customCursor.classList.add('is-pressed'); });
    document.addEventListener('mouseup', function () { customCursor.classList.remove('is-pressed'); });
    document.addEventListener('mouseleave', function () { customCursor.classList.remove('is-visible'); });
  }

  /* ---------------- Scroll reveal ---------------- */
  var revealTargets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------------- Back to top ---------------- */
  var toTopBtn = document.getElementById('toTopBtn');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 800) toTopBtn.classList.add('is-visible');
    else toTopBtn.classList.remove('is-visible');
  });
  toTopBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
