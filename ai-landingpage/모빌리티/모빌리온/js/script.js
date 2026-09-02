/* ==========================================================================
   MOBILION — Landing Page Interactions
   Vanilla JS. IntersectionObserver-driven reveals, counters, timeline,
   GNB behavior, ripple buttons, scroll progress.
   ========================================================================== */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     GNB: scroll background + mobile toggle
  --------------------------------------------------------------------- */
  var gnb = document.getElementById('gnb');
  var gnbToggle = document.getElementById('gnbToggle');
  var gnbNav = document.getElementById('gnbNav');

  function updateGnbBackground() {
    if (window.scrollY > 40) {
      gnb.classList.add('is-scrolled');
    } else {
      gnb.classList.remove('is-scrolled');
    }
  }
  updateGnbBackground();
  window.addEventListener('scroll', updateGnbBackground, { passive: true });

  if (gnbToggle && gnbNav) {
    gnbToggle.addEventListener('click', function () {
      var isOpen = gnbNav.classList.toggle('is-open');
      gnbToggle.classList.toggle('is-open', isOpen);
      gnbToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  /* ---------------------------------------------------------------------
     Smooth scroll for anchor links (with mobile menu auto-close)
  --------------------------------------------------------------------- */
  var navLinks = document.querySelectorAll('[data-nav-link]');
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#') { return; }
      var target = document.querySelector(href);
      if (!target) { return; }
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      if (gnbNav && gnbNav.classList.contains('is-open')) {
        gnbNav.classList.remove('is-open');
        gnbToggle.classList.remove('is-open');
        gnbToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  /* ---------------------------------------------------------------------
     Active nav highlighting via IntersectionObserver
  --------------------------------------------------------------------- */
  var navAnchorMap = {};
  document.querySelectorAll('.gnb__link').forEach(function (link) {
    var id = link.getAttribute('href');
    if (id && id.charAt(0) === '#') {
      navAnchorMap[id.slice(1)] = link;
    }
  });

  var navSections = Object.keys(navAnchorMap)
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  if (navSections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = navAnchorMap[entry.target.id];
        if (!link) { return; }
        if (entry.isIntersecting) {
          Object.values(navAnchorMap).forEach(function (l) { l.classList.remove('active'); });
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    navSections.forEach(function (sec) { navObserver.observe(sec); });
  }

  /* ---------------------------------------------------------------------
     Generic scroll reveal (fade-up / fade-in / slide-left / slide-right / scale)
  --------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('[data-reveal]');

  revealEls.forEach(function (el) {
    var delay = el.getAttribute('data-reveal-delay');
    if (delay) { el.style.setProperty('--rd', delay); }
  });

  if (prefersReducedMotion) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------------------------------------------------------------------
     Counter animation (stat / impact numbers)
  --------------------------------------------------------------------- */
  function formatCounterValue(value, format) {
    if (format === 'decimal') { return value.toFixed(1); }
    return Math.round(value).toString();
  }

  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-target')) || 0;
    var format = el.getAttribute('data-format') || 'int';
    var duration = 1600;
    var startTime = null;

    function step(timestamp) {
      if (startTime === null) { startTime = timestamp; }
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = target * eased;
      el.textContent = formatCounterValue(current, format);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = formatCounterValue(target, format);
      }
    }
    requestAnimationFrame(step);
  }

  var counterEls = document.querySelectorAll('.counter');
  if (prefersReducedMotion) {
    counterEls.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-target')) || 0;
      var format = el.getAttribute('data-format') || 'int';
      el.textContent = formatCounterValue(target, format);
    });
  } else if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counterEls.forEach(function (el) { counterObserver.observe(el); });
  } else {
    counterEls.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-target')) || 0;
      var format = el.getAttribute('data-format') || 'int';
      el.textContent = formatCounterValue(target, format);
    });
  }

  /* ---------------------------------------------------------------------
     Timeline activation (History section) — bidirectional, scroll-progress driven.
     Active count tracks how far the section has been scrolled through, so
     items light up left-to-right going down and switch off right-to-left
     going back up, with no separate direction-tracking needed.

     On mobile (<=600px) the section drops the pin/scroll-scrub entirely and
     becomes a normal in-flow vertical list (see the ≤600px CSS), so progress
     there is driven by each item's own position in the viewport instead of
     the desktop/tablet pinned-wrapper math, and the progress bar fills by
     height (a vertical line) instead of width.
  --------------------------------------------------------------------- */
  var timelineItems = document.querySelectorAll('.timeline__item');
  var timelineProgress = document.getElementById('timelineProgress');
  var historySection = document.getElementById('history');
  var mobileHistoryQuery = window.matchMedia('(max-width: 600px)');

  function updateTimelineProgress(activeCount, vertical) {
    if (!timelineProgress || !timelineItems.length) { return; }
    var pct = (activeCount / timelineItems.length) * 100;
    if (vertical) {
      timelineProgress.style.height = pct + '%';
      timelineProgress.style.width = '';
    } else {
      timelineProgress.style.width = pct + '%';
      timelineProgress.style.height = '';
    }
  }

  function updateTimelineMobile() {
    var triggerLine = window.innerHeight * 0.75;
    var activeCount = 0;
    timelineItems.forEach(function (item, i) {
      var isActive = item.getBoundingClientRect().top < triggerLine;
      item.classList.toggle('is-active', isActive);
      if (isActive) { activeCount = i + 1; }
    });
    updateTimelineProgress(activeCount, true);
  }

  function updateTimelineDesktop() {
    if (!historySection) { return; }
    var rect = historySection.getBoundingClientRect();
    // .history is a tall (e.g. 280vh) wrapper around a position:sticky pin
    // (.history__pin) that stays centered on screen for that whole range.
    // progress 0 → the wrapper's top just reached the viewport top (pin engages)
    // progress 1 → the wrapper's bottom reaches the viewport bottom (pin
    // releases and native scroll continues into the next section) — so the
    // reveal finishes exactly when the page is about to move on.
    var scrollableRange = rect.height - window.innerHeight;
    var progress = scrollableRange > 0
      ? Math.min(1, Math.max(0, -rect.top / scrollableRange))
      : 1;
    var activeCount = Math.round(progress * timelineItems.length);
    timelineItems.forEach(function (item, i) {
      item.classList.toggle('is-active', i < activeCount);
    });
    updateTimelineProgress(activeCount, false);
  }

  function updateTimelineByScroll() {
    if (!timelineItems.length) { return; }
    if (mobileHistoryQuery.matches) {
      updateTimelineMobile();
    } else {
      updateTimelineDesktop();
    }
  }

  if (timelineItems.length) {
    if (prefersReducedMotion) {
      timelineItems.forEach(function (item) { item.classList.add('is-active'); });
      updateTimelineProgress(timelineItems.length, mobileHistoryQuery.matches);
    } else {
      updateTimelineByScroll();
      window.addEventListener('scroll', updateTimelineByScroll, { passive: true });
      window.addEventListener('resize', updateTimelineByScroll);
    }
  }

  /* ---------------------------------------------------------------------
     Vision boxes (mobile only) — bidirectional reveal. The generic
     [data-reveal] system is one-shot (unobserve after first reveal), which
     can't un-reveal on scroll-up, so these 4 cards get their own observer
     that just mirrors isIntersecting onto an `is-shown` class: appearing
     one after another while scrolling down past them, disappearing in
     reverse order while scrolling back up, since each card's own
     intersection naturally flips at a different scroll position.
  --------------------------------------------------------------------- */
  var mobileVisionBoxQuery = window.matchMedia('(max-width: 600px)');
  var visionBoxEls = document.querySelectorAll('.vision__box');
  if (visionBoxEls.length && 'IntersectionObserver' in window && !prefersReducedMotion) {
    var visionBoxObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!mobileVisionBoxQuery.matches) { return; }
        entry.target.classList.toggle('is-shown', entry.isIntersecting);
      });
    }, { threshold: 0.2 });
    visionBoxEls.forEach(function (el) { visionBoxObserver.observe(el); });
  }

  /* ---------------------------------------------------------------------
     Scroll progress bar (top of viewport)
  --------------------------------------------------------------------- */
  var scrollProgress = document.getElementById('scrollProgress');
  function updateScrollProgress() {
    if (!scrollProgress) { return; }
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = pct + '%';
  }
  updateScrollProgress();
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress);

  /* ---------------------------------------------------------------------
     Button ripple effect
  --------------------------------------------------------------------- */
  var rippleEls = document.querySelectorAll('[data-ripple]');
  rippleEls.forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (prefersReducedMotion) { return; }
      var rect = el.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 1.4;
      var span = document.createElement('span');
      span.className = 'ripple';
      span.style.width = size + 'px';
      span.style.height = size + 'px';
      span.style.left = (e.clientX - rect.left - size / 2) + 'px';
      span.style.top = (e.clientY - rect.top - size / 2) + 'px';
      el.appendChild(span);
      window.setTimeout(function () {
        if (span.parentNode) { span.parentNode.removeChild(span); }
      }, 650);
    });
  });

  /* ---------------------------------------------------------------------
     Technology cards — hover swaps the section background to that card's image
  --------------------------------------------------------------------- */
  var techHoverBg = document.getElementById('techHoverBg');
  if (techHoverBg) {
    document.querySelectorAll('.tech-card[data-bg]').forEach(function (card) {
      var img = card.getAttribute('data-bg');
      card.addEventListener('mouseenter', function () {
        techHoverBg.style.backgroundImage = "linear-gradient(rgba(5,11,20,.62), rgba(5,11,20,.62)), url('" + img + "')";
        techHoverBg.classList.add('is-active');
      });
      card.addEventListener('mouseleave', function () {
        techHoverBg.classList.remove('is-active');
      });
    });
  }

  /* ---------------------------------------------------------------------
     Solution cards — own background image only. The section background
     stays a flat color and no longer echoes the card's photo.
  --------------------------------------------------------------------- */
  document.querySelectorAll('.solution-card[data-bg]').forEach(function (card) {
    var img = card.getAttribute('data-bg');
    var bgEl = card.querySelector('.solution-card__bg');
    if (bgEl) { bgEl.style.backgroundImage = "url('" + img + "')"; }
  });

})();
