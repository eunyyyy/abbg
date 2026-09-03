/* =========================================================
   AGRINOVA — script.js
   Vanilla JS only. No build step, no external runtime deps.
   ========================================================= */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initGnb();
    initHero();
    initReveal();
    initCounters();
    initTestimonials();
    initAmbientCanvas();
    initGlobe();
  });

  /* ---------------------------------------------------------
     GNB — mobile toggle + smooth anchor scroll (native CSS
     scroll-behavior handles the smoothness; this just closes
     the mobile drawer after a same-page jump).
  --------------------------------------------------------- */
  function initGnb() {
    var gnb = document.getElementById("gnb");
    var toggle = document.getElementById("gnbToggle");
    var mobile = document.getElementById("gnbMobile");
    if (!gnb || !toggle || !mobile) return;

    toggle.addEventListener("click", function () {
      var open = mobile.classList.toggle("is-open");
      gnb.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    mobile.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobile.classList.remove("is-open");
        gnb.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------------------------------------
     HERO — tall wrapper + sticky pin scroll choreography.
     Ported from the React/GSAP/Swiper reference per its own
     PORTING NOTE: progress = clamp(-rect.top / (rect.height -
     innerHeight), 0, 1) measured off the OUTER wrapper. No
     scroll-jacking, no wheel interception.
  --------------------------------------------------------- */
  function initHero() {
    var wrap = document.querySelector(".hero-wrap");
    var pin = document.querySelector(".hero-pin");
    var bg = document.querySelector(".hero-bg");
    var bgImgs = Array.prototype.slice.call(document.querySelectorAll(".hero-bg__img"));
    var row = document.getElementById("heroRow");
    var icons = Array.prototype.slice.call(document.querySelectorAll(".hero-row__icon"));
    var slots = Array.prototype.slice.call(document.querySelectorAll(".hero-slot"));
    var segs = Array.prototype.slice.call(document.querySelectorAll(".hero-seg"));
    if (!wrap || !pin || !row || !segs.length) return;

    /* background crossfade — timer driven, independent of scroll,
       replaces the Swiper autoplay+fade in the source component. */
    var bgIndex = 0;
    if (bgImgs.length > 1) {
      setInterval(function () {
        bgImgs[bgIndex].classList.remove("is-active");
        bgIndex = (bgIndex + 1) % bgImgs.length;
        bgImgs[bgIndex].classList.add("is-active");
      }, 3200);
    }

    /* Fisher-Yates shuffle of the reveal order — reproduced exactly
       as the source does it, each segment reveals in its own
       0.015-wide progress window starting at 0.75 + i*0.03. */
    var order = segs.map(function (_, i) { return i; });
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
    }

    var duplicates = null;

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function mapRange(v, a, b, c, d) {
      var t = (v - a) / (b - a);
      return c + (d - c) * t;
    }
    function isMobile() { return window.innerWidth < 1000; }

    function removeDuplicates() {
      if (duplicates) {
        duplicates.forEach(function (d) { if (d.parentNode) d.parentNode.removeChild(d); });
        duplicates = null;
      }
    }

    function createDuplicates(size) {
      duplicates = icons.map(function (icon) {
        var img = icon.querySelector("img");
        var clone = document.createElement("div");
        clone.className = "hero-dupe";
        clone.style.width = size + "px";
        clone.style.height = size + "px";
        if (img) clone.appendChild(img.cloneNode(true));
        document.body.appendChild(clone);
        return clone;
      });
    }

    function update() {
      var rect = wrap.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var progress = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;

      var headerIconSize = isMobile() ? 35 : 60;
      var currentIconWidth = (icons[0] && icons[0].getBoundingClientRect().width) || 1;
      var exactScale = headerIconSize / currentIconWidth;

      segs.forEach(function (s) { s.style.opacity = 0; });

      if (progress < 0.3) {
        var moveProgress = progress / 0.3;
        var containerMoveY = -window.innerHeight * 0.3 * moveProgress;

        if (progress < 0.15) {
          var headerProgress = progress / 0.15;
          bg.style.transform = "translateY(" + (-50 * headerProgress) + "px)";
          bg.style.opacity = 1 - headerProgress;
        } else {
          bg.style.transform = "translateY(-50px)";
          bg.style.opacity = 0;
        }

        removeDuplicates();

        row.style.transform = "translate(-50%, " + containerMoveY + "px) scale(1)";
        row.style.opacity = 1;

        icons.forEach(function (icon, index) {
          var staggerDelay = index * 0.1;
          var iconProgress = clamp(mapRange(moveProgress, staggerDelay, staggerDelay + 0.5, 0, 1), 0, 1);
          icon.style.transform = "translateY(" + (-containerMoveY * (1 - iconProgress)) + "px)";
        });

      } else if (progress < 0.6) {
        var scaleProgress = (progress - 0.3) / 0.3;
        bg.style.transform = "translateY(-50px)";
        bg.style.opacity = 0;
        removeDuplicates();

        var r1 = row.getBoundingClientRect();
        var deltaX = (window.innerWidth / 2 - (r1.left + r1.width / 2)) * scaleProgress;
        var deltaY = (window.innerHeight / 2 - (r1.top + r1.height / 2)) * scaleProgress;
        var scale = 1 + (exactScale - 1) * scaleProgress;

        row.style.transform = "translate(-50%, 0) translate(" + deltaX + "px, " + (-window.innerHeight * 0.3 + deltaY) + "px) scale(" + scale + ")";
        row.style.opacity = 1;
        icons.forEach(function (icon) { icon.style.transform = "translate(0,0)"; });

      } else if (progress < 0.75) {
        var moveProgress2 = (progress - 0.6) / 0.15;
        bg.style.transform = "translateY(-50px)";
        bg.style.opacity = 0;

        var r2 = row.getBoundingClientRect();
        var dX = window.innerWidth / 2 - (r2.left + r2.width / 2);
        var dY = window.innerHeight / 2 - (r2.top + r2.height / 2);
        row.style.transform = "translate(-50%,0) translate(" + dX + "px, " + (-window.innerHeight * 0.3 + dY) + "px) scale(" + exactScale + ")";
        row.style.opacity = 0;
        icons.forEach(function (icon) { icon.style.transform = "translate(0,0)"; });

        if (!duplicates) createDuplicates(headerIconSize);

        duplicates.forEach(function (dupe, index) {
          if (index >= slots.length) return;
          var iconRect = icons[index].getBoundingClientRect();
          var startX = iconRect.left + iconRect.width / 2;
          var startY = iconRect.top + iconRect.height / 2;
          var slotRect = slots[index].getBoundingClientRect();
          var targetX = slotRect.left + slotRect.width / 2;
          var targetY = slotRect.top + slotRect.height / 2;
          var moveX = targetX - startX;
          var moveY = targetY - startY;

          var curX = 0;
          var curY = moveProgress2 < 0.5 ? moveY * (moveProgress2 / 0.5) : moveY;
          if (moveProgress2 >= 0.5) curX = moveX * ((moveProgress2 - 0.5) / 0.5);

          dupe.style.left = (startX + curX - headerIconSize / 2) + "px";
          dupe.style.top = (startY + curY - headerIconSize / 2) + "px";
          dupe.style.opacity = 1;
          dupe.style.display = "flex";
        });

      } else {
        bg.style.transform = "translateY(-100px)";
        bg.style.opacity = 0;
        row.style.opacity = 0;

        if (duplicates) {
          duplicates.forEach(function (dupe, index) {
            if (index >= slots.length) return;
            var slotRect = slots[index].getBoundingClientRect();
            var targetX = slotRect.left + slotRect.width / 2;
            var targetY = slotRect.top + slotRect.height / 2;
            dupe.style.left = (targetX - headerIconSize / 2) + "px";
            dupe.style.top = (targetY - headerIconSize / 2) + "px";
            dupe.style.opacity = 1;
            dupe.style.display = "flex";
          });
        }

        order.forEach(function (originalIndex, randomIndex) {
          var segStart = 0.75 + randomIndex * 0.03;
          var segProgress = clamp(mapRange(progress, segStart, segStart + 0.015, 0, 1), 0, 1);
          segs[originalIndex].style.opacity = segProgress;
        });
      }
    }

    var ticking = false;
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () { update(); ticking = false; });
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { removeDuplicates(); update(); });
    update();
  }

  /* ---------------------------------------------------------
     REVEAL — IntersectionObserver-gated [data-reveal], fires
     once, PLUS a permanent rAF/timeout fallback sweep so a
     same-load full-page capture (or an observer that never
     gets a frame at the current scroll position) can never
     leave a section stuck invisible.
  --------------------------------------------------------- */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!items.length) return;

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
      items.forEach(function (el) { io.observe(el); });
    }

    function sweep() {
      var vh = window.innerHeight;
      items.forEach(function (el) {
        if (el.classList.contains("is-visible")) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add("is-visible");
      });
    }
    requestAnimationFrame(sweep);
    window.addEventListener("load", sweep);
    setTimeout(sweep, 400);
    setTimeout(sweep, 1200);
    setTimeout(sweep, 2500);
  }

  /* ---------------------------------------------------------
     STATS COUNT-UP — IntersectionObserver-gated, fires once
     per element, with the same fallback sweep guard.
  --------------------------------------------------------- */
  function initCounters() {
    var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count-to]"));
    if (!counters.length) return;
    var done = new Set();

    function run(el) {
      if (done.has(el)) return;
      done.add(el);
      var to = parseFloat(el.getAttribute("data-count-to"));
      var decimals = el.hasAttribute("data-count-decimals") ? parseInt(el.getAttribute("data-count-decimals"), 10) : 0;
      var useComma = el.getAttribute("data-count-format") === "comma";
      var duration = 1600;
      var start = null;

      function format(v) {
        var fixed = v.toFixed(decimals);
        if (!useComma) return fixed;
        var parts = fixed.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
      }

      function frame(now) {
        if (start === null) start = now;
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = format(to * eased);
        if (t < 1) requestAnimationFrame(frame);
        else el.textContent = format(to);
      }
      requestAnimationFrame(frame);
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            run(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { io.observe(el); });
    }

    function sweep() {
      var vh = window.innerHeight;
      counters.forEach(function (el) {
        if (done.has(el)) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.85 && r.bottom > 0) run(el);
      });
    }
    requestAnimationFrame(sweep);
    window.addEventListener("load", sweep);
    setTimeout(sweep, 500);
    setTimeout(sweep, 1500);
  }

  /* ---------------------------------------------------------
     VOICES — testimonial crossfade with autoplay + manual
     prev/next + thumbnail rail, fully keyboard/pointer usable.
  --------------------------------------------------------- */
  function initTestimonials() {
    var stage = document.getElementById("voiceStage");
    if (!stage) return;
    var photos = Array.prototype.slice.call(stage.querySelectorAll(".voice-photo img"));
    var cards = Array.prototype.slice.call(stage.querySelectorAll(".voice-card"));
    var thumbs = Array.prototype.slice.call(stage.querySelectorAll(".voice-thumb"));
    var prevBtn = document.getElementById("voicePrev");
    var nextBtn = document.getElementById("voiceNext");
    if (!cards.length) return;

    var index = 0;
    var timer = null;

    function show(i) {
      index = (i + cards.length) % cards.length;
      photos.forEach(function (p, pi) { p.classList.toggle("is-active", pi === index); });
      cards.forEach(function (c, ci) { c.classList.toggle("is-active", ci === index); });
      thumbs.forEach(function (t, ti) { t.classList.toggle("is-active", ti === index); });
    }
    function next() { show(index + 1); }
    function prev() { show(index - 1); }
    function restart() {
      if (timer) clearInterval(timer);
      timer = setInterval(next, 5500);
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); restart(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { next(); restart(); });
    thumbs.forEach(function (t, i) {
      t.addEventListener("click", function () { show(i); restart(); });
    });
    stage.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { next(); restart(); }
      if (e.key === "ArrowLeft") { prev(); restart(); }
    });
    stage.addEventListener("mouseenter", function () { if (timer) clearInterval(timer); });
    stage.addEventListener("mouseleave", restart);

    show(0);
    restart();
  }

  /* ---------------------------------------------------------
     AMBIENT MOUSE CANVAS — cursor-reactive dot grid layered
     behind the Brand Intro section. Gated with opacity:0 until
     the first real mousemove (avoids a (0,0) flash on load),
     and fully skipped under prefers-reduced-motion.
  --------------------------------------------------------- */
  function initAmbientCanvas() {
    var canvas = document.getElementById("ambientCanvas");
    if (!canvas) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var ctx = canvas.getContext("2d");
    var w = 0, h = 0, dpr = 1;
    var mouse = { x: -9999, y: -9999 };
    var hasMouse = false;
    var section = canvas.parentElement;

    function resize() {
      var rect = section.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function onMove(e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      if (!hasMouse) {
        hasMouse = true;
        canvas.classList.add("is-active");
      }
    }
    window.addEventListener("mousemove", onMove, { passive: true });

    var GAP = 36;
    function visible() {
      var r = section.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    }

    function draw() {
      if (visible() && w && h) {
        ctx.clearRect(0, 0, w, h);
        for (var y = GAP / 2; y < h; y += GAP) {
          for (var x = GAP / 2; x < w; x += GAP) {
            var dx = x - mouse.x, dy = y - mouse.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var influence = Math.max(0, 1 - dist / 240);
            var rad = 1.1 + influence * 2.4;
            ctx.beginPath();
            ctx.arc(x, y, rad, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(30,74,52," + (0.06 + influence * 0.4) + ")";
            ctx.fill();
            if (influence > 0.02) {
              ctx.beginPath();
              ctx.arc(x, y, rad * 1.9, 0, Math.PI * 2);
              ctx.fillStyle = "rgba(217,164,65," + (influence * 0.18) + ")";
              ctx.fill();
            }
          }
        }
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ---------------------------------------------------------
     GLOBAL NETWORK — interactive canvas globe.
     Ported near-verbatim from the vanilla Canvas2D reference
     (world land-bitmap decode, orthographic projection,
     drag-to-rotate, wheel-to-zoom, click-to-pin). Recolored
     INK to AGRINOVA's harvest-gold accent and pre-seeded with
     AGRINOVA partner locations.
  --------------------------------------------------------- */
  function initGlobe() {
    var cv = document.getElementById("globeCanvas");
    if (!cv) return;

    var FACE = '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace';
    var INK = "217,164,65"; /* AGRINOVA harvest-gold accent, recolored from the neutral-gray reference */
    var LAND_B64 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPcBAOD/HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA//+P//f/LwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4/v/4/////wcAAAAEAPABAAAAfAAAAAAAAAAAAAAAAAAAAADg9w/4/////wEAAP4AAAAAAAAA+AAAAAAAAAAAAAAAAAAAAIAG+Of//////wAAAHwGAAAAAAAAAAMAAAAAAAAAAAAAAACABwAc/4P//////wAAADAAAAAAQAAAAD4AAAAAAAAAAAAAAAAAfMbDcQAA/v///wAAAAAAAADABwAA//8HAMAPAAAAAAAAAABgAAAAAAAA/P///wAAAAAAAABwAADg//8AAAAAAAAAAAAAAADwG457dwcA8P//HwAAAAAAAAAYAAD///9/eAAAAAAAAAAAAAD4/g0H/w8A8P//PwAAAAAAAAAOgOv/////fwD/AAAAAAA/AAAA/B84/v8A8P//LwAAAAD4AAAA4PP//////////wAAAOD///H/+D/3cPgDoP//DwAAAID/BwAAx/v/////////P4AA/P///////////////////////w8AAOcBAAgAAAAAAAAAAAAAgP///////////////////////wcAACYAAAQAAAAAAAAAAAAAgf///////////////////////wMM8AAAAAAAAAAAAAAAAAAAIID/////////e+wPwH8AgA8AAP/5z/////////////////8/ANH///////9/AIALgD8AAAAAwH/+//////////////////9/APj///////8fADwAAD8AAAAA8D/+//////////////////sPAPC/+f////8fAPwAADgAAAAA8D/+////////////////D/wBAMCfAP////8PAPwYAAAAAAAA8H/4//////////////9/DgcAAAAcAOD///8/APw/AAAAAAAQAB7w//////////////8BgAMAAAACAMD/////Afh/AAAAAAA4gBz+/////////////38A4AMAAMAAAMD/////B/z/AAAAAABwwAb+/////////////x8A8AEAAAAAAAD/////P///AwAAAADmgOH//////////////z8A4AAAAAAAAAD+////P/7/BwAAAADz+f////////////////8D4AAAAAAAAAD8////f/7/BwAAAADz+f////////////////8HIAAAAAAAAAD6////////BAAAAABw/v////////////////8EAAAAAAAAAADo//////8jHgAAAACA//////////////////8MAAAAAAAAAADQ//////8OPgAAAADw//////////////////8AAAAAAAAAAADg//////+PIAAAAADA////v////////////38EAAAAAAAAAADg////////AAAAAACA//v/zD/8/////////z8AAAAAAAAAAADg//////8bAAAAAACA//N/gD///////////x8GAAAAAAAAAADw//////8AAAAAAAD+B8c/AD/+/////////wcPAAAAAAAAAADg//////8AAAAAAAD+gx4/DH74/////////wABAAAAAAAAAADg/////x8AAAAAAAD+gbCn///8////////fQABAAAAAAAAAADg/////w8AAAAAAAD/gCDn///4//////9/MgADAAAAAAAAAADA/////w8AAAAAAAD+AADm/3/4//////8/cIABAAAAAAAAAADA/////wcAAAAAAAA44AHC///5////////4+ABAAAAAAAAAACA/////wcAAAAAAACI/wEA4P//////////4OgAAAAAAAAAAAAA/////wMAAAAAAAD4/wAA4P//////////ADYAAAAAAAAAAAAA/P///wEAAAAAAAD+/wEA8P//////////AQcAAAAAAAAAAAAA+P//fwAAAAAAAAD//w8P8P//////////AQEAAAAAAAAAAAAAyP//fwAAAAAAAAD//3//////////////AQAAAAAAAAAAAAAA0P+PYQAAAAAAAAD//////z//////////AwAAAAAAAAAAAAAAoP8HwAAAAAAAAMD/////83/+////////AQAAAAAAAAAAAAAAIP8DwAAAAAAAAOD/////5//I////////AAAAAAAAAAAAAAAAQP4DgAAAAAAAAPD/////z/+A////////AAAAAAAAAAAAAAAAAPwDAAIAAAAAAPD/////z/8ZwP////9/AQAAAAAAAAAAAAAAAPgDQAAAAAAAAPj/////j/9/gP////8fAQAAAAAAAAAAAAAAAPADEAMAAAAAAPz/////v///AP9//P8DAAAAAAAAAAAAAAAAAPADAwwAAAAAAPj/////P/9/APw//B8AAAAAAAAAAAAIAAAAAPCHA8AAAAAAAPj/////P/4/APwP+J8BAAAAAAAAAAAAAAAAAMD/A0YEAAAAAPj/////f/4fAPwH+B8AAwAAAAAAAAAAAAAAAAD/AQAAAAAAAPj/////f/wHAPgD8D8AAwAAAAAAAAAAAAAAAADgHwAAAAAAAPz//////30AAPAAwH8AAAAAAAAAAAAAAAAAAAAAHAAAAAAAAPj//////wsAAPAAgH4AAQAAAAAAAAAAAAAAAAAAGEAAAAAAAPj//////wMBAPAAgHwAAAAAAAAAAAAAAAAAAAAAGPAhAAAAAPD///////cBAOAAgDiABAAAAAAAAAAAAAAAAAAAIPl/AAAAAOD///////8AAGABABBAFAAAAAAAAAAAAAAAAAAAgP7/AQAAAMD///////8AAAABgAAAHAAAAAAAAAAAAAAAAAAAAPz/AQAAAID///////8AAAABAAEgCAAAAAAAAAAAAAAAAAAAAPz/HwAAAAD/8P///38AAAAAAANgAAAAAAAAAAAAAAAAAAAAAPz/fwAAAAAAoP///z8AAAAAYAd4AAAAAAAAAAAAAAAAAAAAAPz/fwAAAAAAAP///x8AAAAAwAY8AAAAAAAAAAAAAAAAAAAAAP7//wAAAAAAAP///w8AAAAAgAc+AAAAAAAAAAAAAAAAAAAAAP///wAAAAAAAP///wcAAAAAgIM/TwAAAAAAAAAAAAAAAAAAAP///wEAAAAAgP///wMAAAAAAIc/QAQAAAAAAAAAAAAAAAAAgP///w8AAAAAgP///wEAAAAAAA6fAUQAAAAAAAAAAAAAAAAAAP////8AAAAAAP///wAAAAAAAB6ewuwDAgAAAAAAAAAAAAAAgP////8DAAAAAP7//wAAAAAAABwAAvAPAgAAAAAAAAAAAAAAgP////8PAAAAAPz/fwAAAAAAABAAAMCfAQAAAAAAAAAAAAAAAP////8PAAAAAPz//wAAAAAAAOADAIA/MAAAAAAAAAAAAAAAAP7///8PAAAAAPz/fwAAAAAAAAAPAMBngAAAAAAAAAAAAAAAAP7///8PAAAAAPz//wAAAAAAAAAACABAAAAAAAAAAAAAAAAAAPz///8HAAAAAPj//wAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAPz///8DAAAAAPj//wAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAPj///8BAAAAAPz//4AAAAAAAAAAAB8GAAAAAAAAAAAAAAAAAPj///8BAAAAAPz//8EAAAAAAAAAIB8OAAAAAAAAAAAAAAAAAPD///8BAAAAAP7//+AAAAAAAAAA+B8OACAAAAAAAAAAAAAAAMD///8BAAAAAP7/f/gAAAAAAAAA/H8eAAAAAAAAAAAAAAAAAID///8AAAAAAP7/H/gAAAAAAAAA/P8fAABAAAAAAAAAAAAAAAD///8AAAAAAPz/D3AAAAAAAAAA/v8/AAAAAAAAAAAAAAAAAAD///8AAAAAAPj/D3gAAAAAAADA//9/AAgAAAAAAAAAAAAAAAD//38AAAAAAPj/DzgAAAAAAADw////AAAAAAAAAAAAAAAAAAD//x8AAAAAAPD/DzgAAAAAAAD4////AQAAAAAAAAAAAAAAAID//wMAAAAAAPD/DzgAAAAAAAD4////AwAAAAAAAAAAAAAAAID//wEAAAAAAPD/AwAAAAAAAAD4////AwAAAAAAAAAAAAAAAID//wEAAAAAAPD/AwAAAAAAAAD4////BwAAAAAAAAAAAAAAAID//wEAAAAAAOD/AwAAAAAAAAD4////BwAAAAAAAAAAAAAAAID//wAAAAAAAOD/AQAAAAAAAADw////BwAAAAAAAAAAAAAAAID//wAAAAAAAMD/AAAAAAAAAADw////AwAAAAAAAAAAAAAAAID/fwAAAAAAAIB/AAAAAAAAAADgf/z/AwAAAAAAAAAAAAAAAID/PwAAAAAAAIA/AAAAAAAAAADgB/D/AQAAAAAAAAAAAAAAAMD/HQAAAAAAAIABAAAAAAAAAADwAND/AQAAAAAAAAAAAAAAAMD/AwAAAAAAAAAAAAAAAAAAAAAAAID/AAAIAAAAAAAAAAAAAMD/BwAAAAAAAAAAAAAAAAAAAAAAAAD/AAAQAAAAAAAAAAAAAOD/AwAAAAAAAAAAAAAAAAAAAAAAAAA+AABwAAAAAAAAAAAAAOA/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAOAPAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAGAAAAAAAAAAAAAMAPAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAADAAAAAAAAAAAAAPAPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMABAAAAAAAAAAAAAPADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOABAAAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPADAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAPABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPCBAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAA+AABAAJ8//j8PAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAPD/fwD///////8/AAAAAAAAAAAAAAAAAIA+AAAAAAAAAAAAPP///8D/////////HwAAAAAAAAAAAAAAAIA9AAAAAAAA8Pz/////P/j//////////wMAAAAAAAAAAMAAAPB9AAAAAID/////////P/7///////////8BAAAAAAAAAOABAwB/AAAAAPD///////////////////////8AAAAAAFACPoD///9/AAAAAPD//////////////////////x8AAAAA+P////////8HAAAAAP///////////////////////wcAAAAA/v///////wMAAAAA/v///////////////////////wcAAAD8/////////w8AAA7w/////////////////////////w8AAMAB/////////wMAgB84/////////////////////////wEAAAAA/P///////3/w4AcA/////////////////////////wAAAADg//////////8/gM///////////////////////////wMAAADg/////////////f///////////////////////////z8A7wMA/v////////////////////////////////////////8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

    var SOFT = 0.88;
    var INK64 = [];
    for (var q0 = 0; q0 < 64; q0++) INK64.push("rgba(" + INK + "," + (q0 / 63 * SOFT).toFixed(4) + ")");
    function ink(a) { return INK64[a <= 0 ? 0 : a >= 1 ? 63 : (a * 63) | 0]; }

    function Surface(el) {
      this.el = el; this.ctx = el.getContext("2d");
      this.w = 0; this.h = 0; this.dpr = 1;
      this.resize();
    }
    Surface.prototype.resize = function () {
      var r = this.el.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      var dpr = Math.min(1.5, window.devicePixelRatio || 1);
      var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
      if (w === this.el.width && h === this.el.height && this.w === r.width) return false;
      this.el.width = w; this.el.height = h;
      this.w = r.width; this.h = r.height; this.dpr = dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    };
    Object.defineProperty(Surface.prototype, "u", {
      get: function () { return this.w < this.h ? this.w : this.h; }
    });
    Surface.prototype.base = function () {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    };

    var QA = Math.PI * 2 / 64;
    function qang(a) { return Math.round(a / QA) * QA; }

    function local(canvas, e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    var Globe = (function () {
      var s = new Surface(cv);
      var MW = 288, MH = 144, land;
      (function () {
        var bin = atob(LAND_B64);
        land = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) land[i] = bin.charCodeAt(i);
      })();
      function isLand(lon, lat) {
        var gx = Math.floor((lon + 180) / 360 * MW), gy = Math.floor((90 - lat) / 180 * MH);
        if (gx < 0 || gx >= MW || gy < 0 || gy >= MH) return false;
        var b = gy * MW + gx;
        return (land[b >> 3] >> (b & 7)) & 1;
      }

      var PHRASE = "agrinovasoiltobargetoseaonelivingledger";
      var nodes = [];
      (function () {
        var LAT_STEP = 3.05, k = 0, run = 0, sea3 = 0;
        for (var lat = -86; lat <= 86; lat += LAT_STEP) {
          var rl = Math.cos(lat * Math.PI / 180);
          var n = Math.max(1, Math.round(98 * rl));
          for (var i = 0; i < n; i++) {
            var lon = -180 + 360 * i / n;
            var l = isLand(lon, lat);
            if (!l && (sea3++ % 2)) continue;
            var letter = 0;
            if (l && (run++ % 2 === 0)) letter = PHRASE.charAt(k++ % PHRASE.length);
            nodes.push({ lat: lat * Math.PI / 180, lon: lon * Math.PI / 180, land: l, c: letter });
          }
        }
      })();

      var spin = 2.1, vel = 0.16, hover = false, drag = null, tilt = -0.36, vtilt = 0;
      var land8 = [];
      var zoom = 1, zoomT = 1, look = null;

      /* Pre-seeded AGRINOVA network pins (degrees -> radians), so the
         globe reads as populated immediately, not only via click. */
      var SEED = [
        { name: "부산항", lat: 35.10, lon: 129.04 },
        { name: "목포", lat: 34.81, lon: 126.39 },
        { name: "홍천", lat: 37.70, lon: 127.88 },
        { name: "제주", lat: 33.50, lon: 126.53 },
        { name: "오슬로", lat: 59.91, lon: 10.75 },
        { name: "호치민", lat: 10.82, lon: 106.63 }
      ];
      var pins = SEED.map(function (p) {
        return { lat: p.lat * Math.PI / 180, lon: p.lon * Math.PI / 180, t: performance.now() };
      });

      var sea = [], soil = [];

      cv.addEventListener("pointerenter", function () { hover = true; });
      cv.addEventListener("pointerleave", function () { hover = false; });
      cv.addEventListener("pointerdown", function (e) {
        drag = local(cv, e); drag.moved = false;
        cv.setPointerCapture(e.pointerId);
      });
      cv.addEventListener("pointermove", function (e) {
        var p = local(cv, e);
        look = p;
        if (!drag) return;
        vel = (p.x - drag.x) / s.u * 9;
        vtilt = -(p.y - drag.y) / s.u * 6;
        tilt = Math.max(-1.15, Math.min(1.15, tilt + vtilt * 0.016));
        drag = p; drag.moved = true;
      });
      function release() {
        if (drag && !drag.moved) {
          var g = unproject(drag.x, drag.y);
          if (g) {
            pins.push({ lat: g.lat, lon: g.lon, t: performance.now() });
            if (pins.length > 16) pins.shift();
          }
        }
        drag = null;
      }
      cv.addEventListener("pointerup", release);
      cv.addEventListener("pointercancel", function () { drag = null; });
      cv.addEventListener("wheel", function (e) {
        e.preventDefault();
        zoomT = Math.max(0.85, Math.min(2.6, zoomT * Math.exp(-e.deltaY * 0.0016)));
      }, { passive: false });

      var view = { cx: 0, cy: 0, R: 1, cs: 1, sn: 0, ct: 1, st: 0 };
      function unproject(px, py) {
        var x1 = (px - view.cx) / view.R, y2 = (view.cy - py) / view.R;
        var q = 1 - x1 * x1 - y2 * y2;
        if (q <= 0.002) return null;
        var z2 = Math.sqrt(q);
        var y0 = y2 * view.ct + z2 * view.st;
        var z1 = -y2 * view.st + z2 * view.ct;
        var x0 = x1 * view.cs + z1 * view.sn;
        var z0 = -x1 * view.sn + z1 * view.cs;
        return { lat: Math.asin(Math.max(-1, Math.min(1, y0))), lon: Math.atan2(z0, x0) };
      }

      function draw(now, dt) {
        var ctx = s.ctx;
        ctx.clearRect(0, 0, s.w, s.h);

        zoom += (zoomT - zoom) * Math.min(1, dt / 180);
        if (!drag) {
          var idle = hover ? 0.045 : 0.16;
          vel += (idle - vel) * Math.min(1, dt / 900);
          vtilt *= Math.pow(0.90, dt / 16);
          tilt += vtilt * dt / 1000;
          tilt += (-0.36 - tilt) * Math.min(1, dt / 4000);
        }
        spin += vel * dt / 1000;

        var cx = s.w / 2, cy = s.h / 2 + s.u * 0.035;
        var R = s.u * 0.318 * zoom;
        var fs = s.u * 0.0275 * Math.pow(zoom, 0.72);
        var cs = Math.cos(spin), sn = Math.sin(spin);
        var ct = Math.cos(tilt), st = Math.sin(tilt);
        view.cx = cx; view.cy = cy; view.R = R; view.cs = cs; view.sn = sn; view.ct = ct; view.st = st;

        var lx = -1e9, ly = -1e9, lr = s.u * 0.20, lr2 = lr * lr;
        if (look && !drag) { lx = look.x; ly = look.y; }

        ctx.textAlign = "center"; ctx.textBaseline = "middle";

        sea.length = 0; soil.length = 0;
        for (var i = 0; i < nodes.length; i++) {
          var nd = nodes[i];
          var cl = Math.cos(nd.lat);
          var x0 = cl * Math.cos(nd.lon), y0 = Math.sin(nd.lat), z0 = cl * Math.sin(nd.lon);
          var x1 = x0 * cs - z0 * sn, z1 = x0 * sn + z0 * cs;
          var y2 = y0 * ct - z1 * st, z2 = y0 * st + z1 * ct;
          if (z2 <= 0.02) continue;

          var px = cx + x1 * R, py = cy - y2 * R;
          var dx = px - lx, dy = py - ly;
          var glow = (dx * dx + dy * dy < lr2) ? (1 - Math.sqrt(dx * dx + dy * dy) / lr) : 0;
          if (!nd.land) { sea.push(px, py, Math.min(0.999, z2 + glow * 0.55)); continue; }
          if (!nd.c) { soil.push(px, py, Math.min(0.999, z2 + glow * 0.55)); continue; }

          var tx0 = -Math.sin(nd.lon), tz0 = Math.cos(nd.lon);
          var tx1 = tx0 * cs - tz0 * sn, tz1 = tx0 * sn + tz0 * cs;
          var ang = qang(Math.atan2(tz1 * st, tx1));
          var b = Math.min(7, Math.max(0, ((Math.min(0.999, z2 + glow * 0.6)) * 7.99) | 0));
          (land8[b] || (land8[b] = [])).push(px, py, ang, nd.c, 0);
        }

        var dmin = Math.max(0.7, s.u * 0.0029);
        function dots(list, base, gain, grow) {
          for (var lvl = 0; lvl < 6; lvl++) {
            var z = (lvl + 0.5) / 6, dsz = dmin * grow * (0.55 + 0.75 * z);
            ctx.fillStyle = ink(base + gain * z);
            ctx.beginPath();
            for (var q = 0; q < list.length; q += 3) {
              var lv = list[q + 2] >= 1 ? 5 : (list[q + 2] * 6) | 0;
              if (lv !== lvl) continue;
              ctx.rect(list[q] - dsz / 2, list[q + 1] - dsz / 2, dsz, dsz);
            }
            ctx.fill();
          }
        }
        dots(sea, 0.10, 0.22, 1.0);
        dots(soil, 0.34, 0.46, 1.7);

        for (var bi = 0; bi < 8; bi++) {
          var arr = land8[bi];
          if (!arr || !arr.length) continue;
          var zb = (bi + 0.5) / 8;
          ctx.font = "bold " + (fs * (0.42 + 0.58 * zb)).toFixed(2) + "px " + FACE;
          ctx.fillStyle = ink(0.28 + 0.72 * Math.pow(zb, 0.6));
          for (var t = 0; t < arr.length; t += 5) {
            ctx.save();
            ctx.translate(arr[t], arr[t + 1]);
            ctx.rotate(arr[t + 2]);
            ctx.fillText(arr[t + 3], 0, 0);
            ctx.restore();
          }
          arr.length = 0;
        }

        for (var pi = 0; pi < pins.length; pi++) {
          var pn = pins[pi];
          var pcl = Math.cos(pn.lat);
          var ax = pcl * Math.cos(pn.lon), ay = Math.sin(pn.lat), az = pcl * Math.sin(pn.lon);
          var bx1 = ax * cs - az * sn, bz1 = ax * sn + az * cs;
          var by2 = ay * ct - bz1 * st, bz2 = ay * st + bz1 * ct;
          if (bz2 <= 0.02) continue;
          var ppx = cx + bx1 * R, ppy = cy - by2 * R;
          var age = (now - pn.t) / 1000;
          var pop = Math.min(1, age / 0.22);
          var rr2 = s.u * 0.016 * (0.4 + 0.6 * pop) * (0.55 + 0.45 * bz2);
          ctx.beginPath();
          ctx.arc(ppx, ppy, rr2, 0, Math.PI * 2);
          ctx.strokeStyle = ink(0.30 + 0.55 * bz2);
          ctx.lineWidth = Math.max(0.7, s.u * 0.0022);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(ppx, ppy, Math.max(0.7, rr2 * 0.22), 0, Math.PI * 2);
          ctx.fillStyle = ink(0.45 + 0.55 * bz2);
          ctx.fill();
          if (age < 0.9) {
            var w2 = 1 - age / 0.9;
            ctx.beginPath();
            ctx.arc(ppx, ppy, rr2 + (1 - w2) * s.u * 0.05, 0, Math.PI * 2);
            ctx.strokeStyle = ink(0.55 * w2 * w2);
            ctx.lineWidth = Math.max(0.6, s.u * 0.0016);
            ctx.stroke();
          }
        }
      }
      return { s: s, draw: draw, pins: pins };
    })();

    var studies = [Globe];
    var prev = performance.now();
    var visible = [true];
    function checkVisible() {
      var vh = window.innerHeight;
      for (var i = 0; i < studies.length; i++) {
        var r = studies[i].s.el.getBoundingClientRect();
        visible[i] = r.bottom > -80 && r.top < vh + 80;
      }
    }
    function frame(now) {
      var dt = Math.min(64, now - prev); prev = now;
      for (var i = 0; i < studies.length; i++) {
        var st = studies[i], sf = st.s;
        if (!sf.w || !visible[i]) continue;
        sf.base();
        st.draw(now, dt);
      }
      requestAnimationFrame(frame);
    }
    window.addEventListener("scroll", checkVisible, true);
    requestAnimationFrame(frame);

    function onResize() {
      for (var i = 0; i < studies.length; i++) studies[i].s.resize();
      checkVisible();
    }
    window.addEventListener("resize", onResize);
    if (window.ResizeObserver) new ResizeObserver(onResize).observe(cv.parentElement);
    onResize();
  }
})();
