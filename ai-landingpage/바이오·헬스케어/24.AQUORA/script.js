(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.getElementById('header');
  var menuButton = document.getElementById('menuButton');
  var mobileMenu = document.getElementById('mobileMenu');

  function closeMenu() {
    menuButton.classList.remove('is-open');
    mobileMenu.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  menuButton.addEventListener('click', function () {
    var open = !mobileMenu.classList.contains('is-open');
    menuButton.classList.toggle('is-open', open);
    mobileMenu.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });

  // GNB active state follows the section currently in view
  var navLinks = document.querySelectorAll('.nav a, .mobile-menu nav a');
  var sections = ['science', 'formula', 'system', 'insight'].map(function (id) { return document.getElementById(id); });
  function updateActive() {
    var line = window.innerHeight * 0.4, current = null;
    sections.forEach(function (s) { if (s.getBoundingClientRect().top <= line) current = s.id; });
    var contact = document.getElementById('contact');
    if (contact.getBoundingClientRect().top <= line) current = null;
    navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + current); });
  }
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 18);
    updateActive();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateActive);
  onScroll();

  var reveals = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var ro = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.classList.add('is-visible');
          obs.unobserve(el);
          // drop the stagger delay once revealed so hover transitions respond instantly
          setTimeout(function () { el.style.transitionDelay = ''; }, 1200);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 55 + 'ms';
      ro.observe(el);
    });
  }

  document.querySelectorAll('[data-count]').forEach(function (el) {
    var fired = false, target = parseFloat(el.dataset.count), decimal = parseInt(el.dataset.decimal || '0', 10);
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !fired) {
        fired = true;
        var start = performance.now();
        (function tick(now) {
          var p = Math.min(1, (now - start) / 1500), v = target * (1 - Math.pow(1 - p, 3));
          el.textContent = decimal ? v.toFixed(decimal) : Math.round(v);
          if (p < 1) requestAnimationFrame(tick);
        })(start);
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
  });

  var fi = document.getElementById('formulaImage');
  var fx = document.getElementById('formulaIndex');
  var cards = document.querySelectorAll('.formula-card');
  cards.forEach(function (card) {
    function activate() {
      if (card.classList.contains('is-active')) return;
      cards.forEach(function (c) { c.classList.remove('is-active'); });
      card.classList.add('is-active');
      fi.style.opacity = '0';
      fi.style.transform = 'scale(1.04)';
      setTimeout(function () {
        fi.onload = function () { fi.style.opacity = '1'; fi.style.transform = 'scale(1)'; };
        fi.src = card.dataset.image;
        fi.alt = card.querySelector('b').textContent + ' 제형';
        fx.textContent = card.dataset.index;
      }, 180);
    }
    card.addEventListener('mouseenter', activate);
    card.addEventListener('focus', activate);
    card.addEventListener('click', activate);
  });

  var orb = document.getElementById('orb');
  var visual = document.getElementById('heroVisual');
  if (!reduced && window.matchMedia('(pointer:fine)').matches) {
    visual.addEventListener('mousemove', function (e) {
      var r = visual.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      orb.style.transform = 'translate3d(' + (x * 18) + 'px,' + (y * 18) + 'px,0) rotateX(' + (-y * 4) + 'deg) rotateY(' + (x * 4) + 'deg)';
    });
    visual.addEventListener('mouseleave', function () { orb.style.transform = ''; });
  }
})();
