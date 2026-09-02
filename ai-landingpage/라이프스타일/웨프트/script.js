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

  /* ---------------- Draggable bestseller shelf ---------------- */
  var shelf = document.getElementById('dragShelf');
  var isDown = false;
  var startX = 0;
  var startScroll = 0;
  var moved = false;

  function pointerDown(x) {
    isDown = true;
    moved = false;
    startX = x;
    startScroll = shelf.scrollLeft;
    shelf.classList.add('is-dragging');
  }
  function pointerMove(x) {
    if (!isDown) return;
    var delta = x - startX;
    if (Math.abs(delta) > 6) moved = true;
    shelf.scrollLeft = startScroll - delta;
  }
  function pointerUp() {
    isDown = false;
    shelf.classList.remove('is-dragging');
  }

  shelf.addEventListener('dragstart', function (e) { e.preventDefault(); });
  shelf.addEventListener('mousedown', function (e) { pointerDown(e.clientX); });
  window.addEventListener('mousemove', function (e) { pointerMove(e.clientX); });
  window.addEventListener('mouseup', pointerUp);

  shelf.addEventListener('touchstart', function (e) { pointerDown(e.touches[0].clientX); }, { passive: true });
  shelf.addEventListener('touchmove', function (e) { pointerMove(e.touches[0].clientX); }, { passive: true });
  shelf.addEventListener('touchend', pointerUp);

  // suppress the click-through navigation when the gesture was actually a drag
  shelf.addEventListener('click', function (e) {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

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
