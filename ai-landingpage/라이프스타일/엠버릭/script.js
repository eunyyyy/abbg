(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Live open/closed ticker — mirrors the reference site's
     real-time status marquee, computed from the posted hours
     (Mon-Fri 11:00-19:00, Sat 10:00-18:00, Sun closed).
     --------------------------------------------------------- */
  var HOURS_BY_DAY = {
    0: null,
    1: [11, 19],
    2: [11, 19],
    3: [11, 19],
    4: [11, 19],
    5: [11, 19],
    6: [10, 18]
  };
  var DAY_NAMES = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }
  function formatTime(h) {
    return pad2(h) + ":00";
  }
  function nextOpeningLabel(now) {
    for (var i = 1; i <= 7; i++) {
      var d = (now.getDay() + i) % 7;
      var hours = HOURS_BY_DAY[d];
      if (hours) {
        var label = i === 1 ? "내일" : DAY_NAMES[d];
        return label + " " + formatTime(hours[0]) + " 오픈";
      }
    }
    return "";
  }
  function getStatusText(now) {
    var hours = HOURS_BY_DAY[now.getDay()];
    var minutesNow = now.getHours() * 60 + now.getMinutes();
    if (!hours) {
      return "오늘 휴무 — " + nextOpeningLabel(now);
    }
    var openMin = hours[0] * 60;
    var closeMin = hours[1] * 60;
    if (minutesNow < openMin) {
      return "오픈 예정 — " + formatTime(hours[0]) + "부터";
    }
    if (minutesNow >= closeMin) {
      return "영업 종료 — " + nextOpeningLabel(now);
    }
    if (closeMin - minutesNow <= 30) {
      return "마감 임박 — " + formatTime(hours[1]) + "까지";
    }
    return "영업중 — " + formatTime(hours[1]) + "까지";
  }
  function renderTicker() {
    var track = document.getElementById("tickerTrack");
    if (!track) return;
    var text = getStatusText(new Date());
    var html = "";
    for (var i = 0; i < 8; i++) {
      html += "<span>" + text + "</span><span class=\"ticker__sep\">—</span>";
    }
    track.innerHTML = html;
  }

  /* ---------------------------------------------------------
     GNB: mobile toggle + anchor scroll
     --------------------------------------------------------- */
  var gnbToggle = document.getElementById("gnbToggle");
  var gnbMenu = document.getElementById("gnbMenu");

  function closeMenu() {
    gnbMenu.classList.remove("is-open");
    gnbToggle.setAttribute("aria-expanded", "false");
  }

  if (gnbToggle && gnbMenu) {
    gnbToggle.addEventListener("click", function () {
      var isOpen = gnbMenu.classList.toggle("is-open");
      gnbToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  document.addEventListener("click", function (e) {
    var anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    var targetSel = anchor.getAttribute("href");
    if (!targetSel || targetSel === "#") return;
    var target = document.querySelector(targetSel);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    target.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
  });

  /* ---------------------------------------------------------
     Draggable floating hero stickers (desktop only, >=1024px)
     --------------------------------------------------------- */
  function initStickers() {
    var wrap = document.querySelector('[data-sticker="wrap"]');
    if (!wrap) return;
    var items = Array.prototype.slice.call(wrap.querySelectorAll('[data-sticker="item"]'));
    if (!items.length) return;

    var states = items.map(function (el, index) {
      return {
        el: el,
        baseRotate: readRotation(el),
        offsetX: 0,
        offsetY: 0,
        dragging: false,
        pointerStartX: 0,
        pointerStartY: 0,
        startOffsetX: 0,
        startOffsetY: 0,
        floatDuration: 2.2 + Math.random() * 1.6,
        floatAmpX: -12 + Math.random() * 24,
        floatAmpY: 14 + Math.random() * 14,
        floatDelay: index * 0.18,
        floatScaleAmp: 0.03 + Math.random() * 0.05,
        pressScale: 1
      };
    });

    items.forEach(function (el, index) {
      var state = states[index];

      el.addEventListener("pointerdown", function (e) {
        state.dragging = true;
        state.pointerStartX = e.clientX;
        state.pointerStartY = e.clientY;
        state.startOffsetX = state.offsetX;
        state.startOffsetY = state.offsetY;
        state.pressScale = 1.2;
        el.setPointerCapture(e.pointerId);
        el.style.filter = "drop-shadow(0 10px 14px rgba(0,0,0,.35))";
      });

      el.addEventListener("pointermove", function (e) {
        if (!state.dragging) return;
        var wrapRect = wrap.getBoundingClientRect();
        var elRect = el.getBoundingClientRect();
        var dx = e.clientX - state.pointerStartX;
        var dy = e.clientY - state.pointerStartY;
        var nextX = state.startOffsetX + dx;
        var nextY = state.startOffsetY + dy;

        var minX = wrapRect.left - (elRect.left - state.offsetX);
        var maxX = wrapRect.right - (elRect.right - state.offsetX);
        var minY = wrapRect.top - (elRect.top - state.offsetY);
        var maxY = wrapRect.bottom - (elRect.bottom - state.offsetY);

        state.offsetX = clamp(nextX, minX, maxX);
        state.offsetY = clamp(nextY, minY, maxY);
      });

      function release(e) {
        if (!state.dragging) return;
        state.dragging = false;
        state.pressScale = 1;
        el.style.filter = "";
        try { el.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      el.addEventListener("pointerup", release);
      el.addEventListener("pointercancel", release);
    });

    if (reduceMotion) {
      states.forEach(function (state) {
        state.el.style.transform = "rotate(" + state.baseRotate + "deg)";
      });
      return;
    }

    var start = performance.now();
    function tick(now) {
      var t = (now - start) / 1000;
      states.forEach(function (state) {
        var floatX = state.dragging ? 0 : Math.sin((t + state.floatDelay) / state.floatDuration) * state.floatAmpX;
        var floatY = state.dragging ? 0 : Math.sin((t + state.floatDelay) / state.floatDuration + 1.2) * state.floatAmpY;
        var floatScale = state.dragging ? state.pressScale : 1 + Math.sin((t + state.floatDelay) / state.floatDuration) * state.floatScaleAmp;
        var x = state.offsetX + floatX;
        var y = state.offsetY + floatY;
        var scale = state.dragging ? state.pressScale : floatScale;
        state.el.style.transform =
          "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + state.baseRotate + "deg) scale(" + scale.toFixed(3) + ")";
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function readRotation(el) {
    var m = /rotate\((-?\d+(?:\.\d+)?)deg\)/.exec(el.getAttribute("style") || "");
    return m ? parseFloat(m[1]) : 0;
  }
  function clamp(v, min, max) {
    if (min > max) return (min + max) / 2;
    return Math.max(min, Math.min(max, v));
  }

  /* ---------------------------------------------------------
     About: dual-image scroll parallax (mirrors reference's
     gsap.fromTo left/right image scrub)
     --------------------------------------------------------- */
  function initAboutParallax() {
    var section = document.getElementById("about");
    var left = section && section.querySelector('[data-parallax="left"]');
    var right = section && section.querySelector('[data-parallax="right"]');
    if (!section || !left || !right) return;

    function update() {
      var rect = section.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = 1 - clamp((rect.top + rect.height) / (vh + rect.height), 0, 1);
      progress = clamp(progress * 1.6 - 0.3, 0, 1);
      var amount = reduceMotion ? 0 : 70;
      left.style.transform = "translateY(" + (amount - progress * amount * 2).toFixed(1) + "px)";
      right.style.transform = "translateY(" + (-amount + progress * amount * 2).toFixed(1) + "px)";
    }
    return update;
  }

  /* ---------------------------------------------------------
     Reviews: continuous scroll-position-driven reveal. Every
     frame reads each card's OWN current getBoundingClientRect()
     directly (no shared section-height estimate to miscalibrate)
     and toggles visibility purely off that live position — so it
     is trivially, exactly reversible: scrolling down brings each
     card's own reveal-line crossing before the one below it
     (natural top-to-bottom cascade), scrolling up un-reveals in
     the exact mirrored order with zero extra bookkeeping, since
     it is the same inequality re-evaluated every frame, not a
     one-shot trigger.
     --------------------------------------------------------- */
  function initReviewsReveal() {
    var section = document.getElementById("reviews");
    if (!section) return;
    var cards = Array.prototype.slice.call(section.querySelectorAll(".review-card"));
    if (!cards.length) return;

    if (reduceMotion) {
      cards.forEach(function (card) { card.classList.add("is-visible"); });
      return;
    }

    function update() {
      var vh = window.innerHeight;
      var revealLine = vh * 0.85;
      cards.forEach(function (card) {
        var top = card.getBoundingClientRect().top;
        card.classList.toggle("is-visible", top < revealLine);
      });
    }
    return update;
  }

  /* ---------------------------------------------------------
     Single rAF scroll loop drives every scrubbed/scroll-tied
     effect on the page
     --------------------------------------------------------- */
  function initScrollEffects() {
    var updaters = [initAboutParallax(), initReviewsReveal()].filter(Boolean);
    if (!updaters.length) return;
    var ticking = false;
    function run() {
      updaters.forEach(function (fn) { fn(); });
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(run);
        ticking = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    run();
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderTicker();
    setInterval(renderTicker, 60000);
    if (window.innerWidth >= 1024) {
      initStickers();
    }
    initScrollEffects();
  });
})();
