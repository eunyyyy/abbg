(function () {
  'use strict';

  /* ---------------------------------------------------------
     1. Notice ticker — auto-rotate every 3s
  --------------------------------------------------------- */
  var track = document.getElementById('tickerTrack');
  if (track) {
    var items = track.querySelectorAll('.ticker-item');
    var count = items.length;
    var idx = 0;
    if (count > 1) {
      setInterval(function () {
        idx = (idx + 1) % count;
        track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      }, 3000);
    }
  }

  /* ---------------------------------------------------------
     2. Smooth anchor-scroll GNB (accounts for fixed header + ticker)
  --------------------------------------------------------- */
  var header = document.getElementById('header');
  var ticker = document.getElementById('ticker');

  function getOffset() {
    var h = header ? header.offsetHeight : 0;
    var t = ticker ? ticker.offsetHeight : 0;
    return h + t + 20;
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - getOffset();
      window.scrollTo({ top: top, behavior: 'smooth' });
      closeMobileNav();
    });
  });

  /* ---------------------------------------------------------
     3. Mobile hamburger nav
  --------------------------------------------------------- */
  var hamburger = document.getElementById('hamburger');
  var mobileNav = document.getElementById('mobileNav');

  function closeMobileNav() {
    if (hamburger) hamburger.classList.remove('open');
    if (mobileNav) mobileNav.classList.remove('open');
  }

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open');
    });
  }

  /* ---------------------------------------------------------
     4. AOS-style scroll reveal via IntersectionObserver
  --------------------------------------------------------- */
  var revealEls = document.querySelectorAll('[data-aos]');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 80 + 'ms';
      io.observe(el);
    });

    /* Fallback sweep: guards against instant jumps (anchor nav, End/Home
       key, scrollbar drag) that fire too few scroll events for IO to
       catch mid-flight elements. Runs every frame until nothing is left
       unrevealed, then stops — negligible cost, zero permanent listener. */
    var remaining = revealEls.length;
    var sweepLoop = function () {
      var vh = window.innerHeight;
      remaining = 0;
      revealEls.forEach(function (el) {
        if (el.classList.contains('aos-in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) {
          el.classList.add('aos-in');
          io.unobserve(el);
        } else {
          remaining++;
        }
      });
      if (remaining > 0) requestAnimationFrame(sweepLoop);
    };
    requestAnimationFrame(sweepLoop);
  } else {
    revealEls.forEach(function (el) { el.classList.add('aos-in'); });
  }

  /* ---------------------------------------------------------
     5. Custom cursor — dot + lagging ring
     (disabled on touch/coarse-pointer + prefers-reduced-motion via CSS,
      but skip the JS work too for perf)
  --------------------------------------------------------- */
  var isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isCoarse && !reduceMotion) {
    var dot = document.getElementById('cursorDot');
    var ring = document.getElementById('cursorRing');
    var mouseX = 0, mouseY = 0;
    var ringX = 0, ringY = 0;
    var started = false;

    function onMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!started) {
        started = true;
        dot.classList.add('active');
        ring.classList.add('active');
        ringX = mouseX;
        ringY = mouseY;
      }
      dot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px) translate(-50%,-50%)';
    }
    window.addEventListener('mousemove', onMove, { passive: true });

    function raf() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      if (ring) {
        ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px) translate(-50%,-50%)';
      }
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    var growTargets = document.querySelectorAll('a, button, .card, .job-card, .people-card, .value-card');
    growTargets.forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('grow'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('grow'); });
    });

    window.addEventListener('mouseleave', function () {
      dot.classList.remove('active');
      ring.classList.remove('active');
    });
    window.addEventListener('mouseenter', function () {
      if (started) {
        dot.classList.add('active');
        ring.classList.add('active');
      }
    });
  }

  /* ---------------------------------------------------------
     6. Scroll thread — a line spools down the page as you scroll,
        proportional to how far through the page you are (the
        reference site's spool-of-thread motif, made interactive)
  --------------------------------------------------------- */
  var threadFill = document.getElementById('threadFill');
  var threadBead = document.getElementById('threadBead');
  if (threadFill && threadBead) {
    var threadTicking = false;
    var updateThread = function () {
      var doc = document.documentElement;
      var scrollTop = window.pageYOffset || doc.scrollTop;
      var scrollable = doc.scrollHeight - window.innerHeight;
      var progress = scrollable > 0 ? Math.min(1, Math.max(0, scrollTop / scrollable)) : 0;
      threadFill.style.transform = 'scaleY(' + progress + ')';
      threadBead.style.top = (progress * 100) + '%';
      threadTicking = false;
    };
    window.addEventListener('scroll', function () {
      if (!threadTicking) {
        requestAnimationFrame(updateThread);
        threadTicking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', updateThread);
    updateThread();
  }

  /* ---------------------------------------------------------
     7. Header shadow on scroll (subtle polish)
  --------------------------------------------------------- */
  window.addEventListener('scroll', function () {
    if (!header) return;
    if (window.scrollY > 10) {
      header.style.boxShadow = '0 2px 12px rgba(51,20,10,0.06)';
    } else {
      header.style.boxShadow = 'none';
    }
  }, { passive: true });

})();
