// AI WEB portfolio hub — site interactions (nav, reveal, marquee, parallax, picker UI)
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- GNB scroll state + mobile drawer ---------- */
  var gnb = document.querySelector('.gnb');
  var burger = document.querySelector('.gnb__burger');
  var mobileNav = document.querySelector('.gnb-mobile');

  function onScroll() {
    if (!gnb) return;
    gnb.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      var open = burger.classList.toggle('is-open');
      mobileNav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        burger.classList.remove('is-open');
        mobileNav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- smooth anchor scroll (instant if reduced-motion) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
    });
  });

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach(function (el) { io.observe(el); });
    // rAF fallback sweep in case IO never fires for an already-in-view element
    requestAnimationFrame(function sweep() {
      revealEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-visible');
      });
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- marquee: hover-pause + reduced motion ---------- */
  var marquee = document.querySelector('.marquee');
  var track = document.querySelector('.marquee__track');
  if (marquee && track) {
    if (reduceMotion) {
      track.classList.add('no-motion');
      marquee.classList.add('no-motion');
    } else {
      marquee.addEventListener('mouseenter', function () { track.classList.add('is-paused'); });
      marquee.addEventListener('mouseleave', function () { track.classList.remove('is-paused'); });
      marquee.addEventListener('focusin', function () { track.classList.add('is-paused'); });
      marquee.addEventListener('focusout', function () { track.classList.remove('is-paused'); });
    }
  }

  /* ---------- collage parallax (mouse-follow, rest state = no offset) ---------- */
  var stage = document.querySelector('.collage__stage');
  if (stage && !reduceMotion) {
    var photos = stage.querySelectorAll('.collage__photo');
    var rafId = null;
    var pointerX = 0, pointerY = 0;
    stage.addEventListener('mousemove', function (e) {
      var rect = stage.getBoundingClientRect();
      pointerX = (e.clientX - rect.left) / rect.width - 0.5;
      pointerY = (e.clientY - rect.top) / rect.height - 0.5;
      if (rafId) return;
      rafId = requestAnimationFrame(function () {
        photos.forEach(function (p, i) {
          var depth = (i % 3 + 1) * 8;
          var baseRotate = getComputedStyle(p).getPropertyValue('--base-rotate') || '0deg';
          p.style.transform = 'translate(' + (pointerX * depth) + 'px,' + (pointerY * depth) + 'px)';
        });
        rafId = null;
      });
    });
    stage.addEventListener('mouseleave', function () {
      photos.forEach(function (p) { p.style.transform = 'translate(0,0)'; });
    });
  }

  /* ---------- feedback: project picker (buttons + mobile select stay in sync) ---------- */
  var pickerBtns = document.querySelectorAll('.picker__btn');
  var pickerSelect = document.querySelector('.picker-select');
  var hiddenNo = document.getElementById('fb-project-no');
  var hiddenName = document.getElementById('fb-project-name');
  var hiddenCategory = document.getElementById('fb-project-category');
  var selectedLabel = document.getElementById('fb-selected-label');

  function selectProject(no, name, category) {
    pickerBtns.forEach(function (b) { b.classList.toggle('is-active', b.dataset.no === no); });
    if (pickerSelect) pickerSelect.value = no;
    if (hiddenNo) hiddenNo.value = no;
    if (hiddenName) hiddenName.value = name;
    if (hiddenCategory) hiddenCategory.value = category;
    if (selectedLabel) selectedLabel.textContent = no + ' · ' + name;
  }

  pickerBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectProject(btn.dataset.no, btn.dataset.name, btn.dataset.category);
    });
  });
  if (pickerSelect) {
    pickerSelect.addEventListener('change', function () {
      var opt = pickerSelect.options[pickerSelect.selectedIndex];
      selectProject(opt.value, opt.dataset.name, opt.dataset.category);
    });
  }
  // default to project 01 selected
  if (pickerBtns.length) selectProject(pickerBtns[0].dataset.no, pickerBtns[0].dataset.name, pickerBtns[0].dataset.category);
})();
