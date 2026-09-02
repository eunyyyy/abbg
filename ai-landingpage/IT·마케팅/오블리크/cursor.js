/*
 * OBLIQ — Magnetic Cursor System
 * Custom dot+ring cursor, magnetic attraction to interactive elements,
 * edge magnetic zones, and a dedicated bottom-of-screen magnetic zone
 * that pulls both the cursor and any `.bottom-cta` element toward it.
 *
 * Kept as its own file (separate from script.js) since it is a fully
 * self-contained, reusable system — every element that should react to
 * the cursor gets it automatically by matching the ELIGIBLE_SELECTOR
 * below or simply carrying class="magnetic"; nothing else needs wiring.
 *
 * No GSAP dependency: everything here is a small damped-spring
 * (semi-implicit Euler) driven by requestAnimationFrame, which gives the
 * same "elastic + inertia" character GSAP's Elastic.out ease would,
 * without pulling in a runtime dependency for a self-contained static page.
 */
(function () {
  'use strict';

  // Bail out entirely on touch/coarse-pointer devices and when the user
  // has asked for less motion — leave the native cursor untouched.
  var supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!supportsFinePointer || reducedMotion) return;

  var cursorEl = document.getElementById('cursor');
  var innerEl = document.getElementById('cursorInner');
  var outerEl = document.getElementById('cursorOuter');
  if (!cursorEl || !innerEl || !outerEl) return;

  document.body.classList.add('has-custom-cursor');

  /* ------------------------------------------------------------- tuning -- */
  var MAGNETIC_RADIUS = 160;      // px — how far a magnetic element reaches
  var CURSOR_PULL_MAX = 28;       // px — cursor pulled toward element center
  var ELEMENT_PULL_MAX = 12;      // px — element itself shifts toward cursor

  var EDGE_SIZE = 80;             // px — top/left/right invisible edge zone
  var EDGE_PULL_MAX = 18;         // px — cursor pulled further toward that edge

  var BOTTOM_ZONE = 120;          // px — invisible bottom magnetic zone height
  var BOTTOM_RADIUS = 140;        // px — falloff radius for the force formula
  var BOTTOM_CURSOR_MAX = 22;     // px — cursor offset at full force
  var BOTTOM_ELEMENT_MAX = 14;    // px — .bottom-cta offset at full force

  var ELIGIBLE_SELECTOR = 'h1, h2, h3, p, a, button, .magnetic, .card';

  /* --------------------------------------------------------- pointer state */
  var mouseX = window.innerWidth / 2;
  var mouseY = window.innerHeight / 2;
  var hasMoved = false;

  window.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!hasMoved) {
      hasMoved = true;
      cursorEl.classList.add('is-ready');
    }
  }, { passive: true });

  /* --------------------------------------------------- damped spring util - */
  // Semi-implicit Euler spring: cheap, stable, and gives a natural
  // overshoot-then-settle ("elastic") feel when stiffness is high
  // relative to the damping factor — the vanilla-JS analogue of
  // GSAP's Elastic.out(1, 0.5) requested in the brief.
  function stepSpring(state, targetX, targetY, stiffness, damping) {
    var ax = (targetX - state.x) * stiffness;
    var ay = (targetY - state.y) * stiffness;
    state.vx = (state.vx + ax) * damping;
    state.vy = (state.vy + ay) * damping;
    state.x += state.vx;
    state.y += state.vy;
  }

  var inner = { x: mouseX, y: mouseY, vx: 0, vy: 0 };
  var outer = { x: mouseX, y: mouseY, vx: 0, vy: 0 };

  /* --------------------------------------------- eligible element cache --- */
  // Rects are cached in DOCUMENT space (top/left + current scroll offset)
  // so the hot per-frame loop never touches getBoundingClientRect — it
  // only does arithmetic against `window.scrollX/Y`, avoiding layout
  // thrashing entirely. Re-cached only on load settle + resize.
  var eligible = [];

  function rebuildEligibleCache() {
    var nodes = document.querySelectorAll(ELIGIBLE_SELECTOR);
    var next = [];
    nodes.forEach(function (el) {
      if (el.closest('#cursor, .service-preview, .loader, .scrollbar')) return;
      var prior = eligible.filter(function (e) { return e.el === el; })[0];
      var rect = el.getBoundingClientRect();
      next.push({
        el: el,
        docTop: rect.top + window.scrollY,
        docLeft: rect.left + window.scrollX,
        w: rect.width,
        h: rect.height,
        x: prior ? prior.x : 0,
        y: prior ? prior.y : 0,
        vx: prior ? prior.vx : 0,
        vy: prior ? prior.vy : 0,
      });
    });
    eligible = next;
  }

  var bottomCta = null; // { el, docTop, docLeft, w, h, x, y, vx, vy }

  function rebuildBottomCtaCache() {
    var el = document.querySelector('.bottom-cta');
    if (!el) { bottomCta = null; return; }
    var rect = el.getBoundingClientRect();
    bottomCta = {
      el: el,
      docTop: rect.top + window.scrollY,
      docLeft: rect.left + window.scrollX,
      w: rect.width,
      h: rect.height,
      x: bottomCta ? bottomCta.x : 0,
      y: bottomCta ? bottomCta.y : 0,
      vx: bottomCta ? bottomCta.vx : 0,
      vy: bottomCta ? bottomCta.vy : 0,
    };
  }

  function rebuildAllCaches() {
    rebuildEligibleCache();
    rebuildBottomCtaCache();
  }

  // Layout settles after the loader/hero reveal finishes; recache once
  // then, plus on any resize (debounced) and once more shortly after
  // full page load in case late-loading images shift anything below.
  window.addEventListener('load', function () {
    setTimeout(rebuildAllCaches, 200);
  });
  setTimeout(rebuildAllCaches, 1400);

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuildAllCaches, 150);
  });

  /* --------------------------------------------------------------- tick -- */
  var running = true;
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) requestAnimationFrame(tick);
  });

  function tick() {
    if (!running) return;

    var vw = window.innerWidth;
    var vh = window.innerHeight;

    // ---- 1. nearest in-radius magnetic element drives the cursor's pull -- //
    var cursorMagnetX = 0, cursorMagnetY = 0;
    var nearestDist = Infinity;
    var anyMagneticActive = false;

    for (var i = 0; i < eligible.length; i++) {
      var item = eligible[i];
      var cx = item.docLeft - window.scrollX + item.w / 2;
      var cy = item.docTop - window.scrollY + item.h / 2;
      var dx = mouseX - cx;
      var dy = mouseY - cy;
      var dist = Math.sqrt(dx * dx + dy * dy);

      var targetOx = 0, targetOy = 0;
      if (dist < MAGNETIC_RADIUS && dist > 0.01) {
        var force = (MAGNETIC_RADIUS - dist) / MAGNETIC_RADIUS;
        var nx = dx / dist, ny = dy / dist;
        targetOx = nx * ELEMENT_PULL_MAX * force;
        targetOy = ny * ELEMENT_PULL_MAX * force;
        anyMagneticActive = true;
        if (dist < nearestDist) {
          nearestDist = dist;
          cursorMagnetX = -nx * CURSOR_PULL_MAX * force;
          cursorMagnetY = -ny * CURSOR_PULL_MAX * force;
        }
      }

      // Individual element spring — always stepped so it relaxes back
      // to (0,0) with the same elastic character it was pulled with.
      stepSpring(item, targetOx, targetOy, 0.16, 0.78);
      if (Math.abs(item.x) > 0.05 || Math.abs(item.y) > 0.05 || targetOx !== 0 || targetOy !== 0) {
        item.el.style.transform = 'translate3d(' + item.x.toFixed(2) + 'px,' + item.y.toFixed(2) + 'px,0)';
      }
    }

    // ---- 2. edge magnetic zones: top / left / right only ------------------
    // (the bottom edge is owned entirely by the dedicated bottom-zone
    // system below, so the two don't fight over the same pull)
    var edgeX = 0, edgeY = 0;
    var edgeActive = false;

    if (mouseY < EDGE_SIZE) {
      var depthTop = (EDGE_SIZE - mouseY) / EDGE_SIZE;
      edgeY += -depthTop * EDGE_PULL_MAX;
      edgeActive = true;
    }
    if (mouseX < EDGE_SIZE) {
      var depthLeft = (EDGE_SIZE - mouseX) / EDGE_SIZE;
      edgeX += -depthLeft * EDGE_PULL_MAX;
      edgeActive = true;
    }
    if (mouseX > vw - EDGE_SIZE) {
      var depthRight = (EDGE_SIZE - (vw - mouseX)) / EDGE_SIZE;
      edgeX += depthRight * EDGE_PULL_MAX;
      edgeActive = true;
    }

    // ---- 3. dedicated bottom magnetic zone (cursor + .bottom-cta) --------
    var bottomCursorX = 0, bottomCursorY = 0, bottomActive = false;
    var distToBottom = vh - mouseY;
    if (distToBottom < BOTTOM_ZONE) {
      var bForce = Math.max(0, (BOTTOM_RADIUS - distToBottom) / BOTTOM_RADIUS);
      if (bForce > 0) {
        bottomActive = true;
        bottomCursorY = bForce * BOTTOM_CURSOR_MAX;
        // horizontal component is secondary/subtle, biased by which side
        // of the viewport the pointer is on (per spec: cursor near the
        // bottom-right nudges the footer bottom-right too).
        var xBias = (mouseX - vw / 2) / (vw / 2); // -1..1
        bottomCursorX = bForce * BOTTOM_CURSOR_MAX * 0.4 * xBias;

        if (bottomCta) {
          var footerTargetY = bForce * BOTTOM_ELEMENT_MAX;
          var footerTargetX = bForce * BOTTOM_ELEMENT_MAX * 0.5 * xBias;
          stepSpring(bottomCta, footerTargetX, footerTargetY, 0.14, 0.8);
          bottomCta.el.style.transform =
            'translate3d(' + bottomCta.x.toFixed(2) + 'px,' + bottomCta.y.toFixed(2) + 'px,0)';
        }
      }
    } else if (bottomCta && (Math.abs(bottomCta.x) > 0.05 || Math.abs(bottomCta.y) > 0.05)) {
      // relax the footer back to rest with the same spring once the
      // pointer leaves the zone (elastic release, not a snap-back).
      stepSpring(bottomCta, 0, 0, 0.14, 0.8);
      bottomCta.el.style.transform =
        'translate3d(' + bottomCta.x.toFixed(2) + 'px,' + bottomCta.y.toFixed(2) + 'px,0)';
    }

    // ---- 4. combine into a single cursor target and spring toward it ----
    var targetX = mouseX + cursorMagnetX + edgeX + bottomCursorX;
    var targetY = mouseY + cursorMagnetY + edgeY + bottomCursorY;

    stepSpring(inner, targetX, targetY, 0.32, 0.72);   // fast, slight snap
    stepSpring(outer, inner.x, inner.y, 0.14, 0.8);    // laggy ring follow

    innerEl.style.transform = 'translate3d(' + (inner.x - 4).toFixed(2) + 'px,' + (inner.y - 4).toFixed(2) + 'px,0)';
    outerEl.style.transform = 'translate3d(' + (outer.x - 20).toFixed(2) + 'px,' + (outer.y - 20).toFixed(2) + 'px,0)';

    cursorEl.classList.toggle('is-active', anyMagneticActive);
    cursorEl.classList.toggle('is-edge', edgeActive || bottomActive);

    requestAnimationFrame(tick);
  }

  rebuildAllCaches();
  requestAnimationFrame(tick);
})();
