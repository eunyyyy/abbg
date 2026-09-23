(function(){
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isCoarse = window.matchMedia("(pointer: coarse)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------- custom cursor ----------------
     Stays opacity:0 (set in CSS) until the first real mousemove fires — this
     avoids the classic bug where a JS-positioned cursor defaults to (0,0) and
     flashes visibly in the top-left corner before the pointer has moved. */
  var cursor = document.getElementById("cursor");
  if (cursor && canHover) {
    var cx = -100, cy = -100, tx = -100, ty = -100, raf = null;
    function loop(){
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener("mousemove", function(e){
      tx = e.clientX; ty = e.clientY;
      if (!cursor.classList.contains("is-visible")) {
        cx = tx; cy = ty;
        cursor.classList.add("is-visible");
        if (!raf) raf = requestAnimationFrame(loop);
      }
    }, { passive: true });

    var hoverTargets = document.querySelectorAll("[data-cursor-label], .cta-arrow, .proj-more, .wordmark");
    hoverTargets.forEach(function(el){
      el.addEventListener("mouseenter", function(){
        cursor.classList.add("is-active");
        var label = el.getAttribute("data-cursor-label");
        var labelEl = cursor.querySelector(".cursor-label");
        if (label && labelEl) labelEl.innerHTML = label;
      });
      el.addEventListener("mouseleave", function(){
        cursor.classList.remove("is-active");
      });
    });
  }

  /* ---------------- GNB anchor smooth-scroll (in-page only, rule 13) ---------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener("click", function(e){
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  /* ---------------- hamburger / full menu overlay ---------------- */
  var menuBtn = document.getElementById("menuBtn");
  var menuOverlay = document.getElementById("menuOverlay");
  var menuClose = document.getElementById("menuClose");

  function openMenu(){
    menuOverlay.classList.add("is-open");
    menuOverlay.setAttribute("aria-hidden", "false");
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeMenu(){
    menuOverlay.classList.remove("is-open");
    menuOverlay.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", function(){
      menuOverlay.classList.contains("is-open") ? closeMenu() : openMenu();
    });
  }
  if (menuClose) menuClose.addEventListener("click", closeMenu);
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape") closeMenu();
  });

  /* ---------------- single rAF-batched scroll driver ----------------
     A raw, unthrottled `scroll` listener that reads layout (getBoundingClientRect)
     on every event is a performance hazard (main-thread jank, no batching), the
     same reason libraries like GSAP ScrollTrigger / Motion's useScroll exist.
     Without those libraries here, we get the same batching by consolidating
     every scroll-driven effect (GNB hide/show, pin-beyond swap, pin-insight
     crossfade, projects cycle) into ONE listener that only sets a dirty flag,
     with the actual layout reads/writes deferred to a single rAF tick. */
  var gnb = document.getElementById("gnb");
  var beyondStage = document.querySelector(".pin-beyond-stage");
  var beyondSection = document.querySelector(".pin-beyond");
  var insightSection = document.querySelector(".pin-insight");
  var insightSteps = document.querySelectorAll(".insight-step");
  var projectsSection = document.querySelector(".projects");
  var projSlides = document.querySelectorAll(".proj-slide");
  var projVis = document.querySelectorAll(".proj-vis");

  var lastY = window.scrollY;
  var scrollTicking = false;

  function sectionProgress(section){
    var rect = section.getBoundingClientRect();
    var p = -rect.top / (rect.height - window.innerHeight);
    return Math.min(Math.max(p, 0), 0.999);
  }

  function updateOnScroll(){
    scrollTicking = false;
    var y = window.scrollY;

    if (gnb) {
      gnb.classList.toggle("is-scrolled", y > 40);
      if (y > lastY && y > 120) gnb.classList.add("is-hidden");
      else gnb.classList.remove("is-hidden");
    }
    lastY = y;

    if (beyondStage && beyondSection) {
      var bp = -beyondSection.getBoundingClientRect().top / (beyondSection.getBoundingClientRect().height - window.innerHeight);
      beyondStage.classList.toggle("is-swapped", bp > 0.35 && bp < 0.95);
    }

    if (insightSection && insightSteps.length) {
      var ip = sectionProgress(insightSection);
      var iidx = Math.min(Math.floor(ip * insightSteps.length), insightSteps.length - 1);
      insightSteps.forEach(function(step, i){ step.classList.toggle("is-active", i === iidx); });
    }

    if (projectsSection && projSlides.length) {
      var pp = sectionProgress(projectsSection);
      var pidx = Math.min(Math.floor(pp * projSlides.length), projSlides.length - 1);
      projSlides.forEach(function(s, i){ s.classList.toggle("is-active", i === pidx); });
      projVis.forEach(function(v, i){ v.classList.toggle("is-active", i === pidx); });
    }
  }

  window.addEventListener("scroll", function(){
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(updateOnScroll);
    }
  }, { passive: true });
  updateOnScroll();

  /* ---------------- contact CTA glow (static soft radial paint — deliberate
     simplification: the reference's canvas glow is JS-driven and not
     recoverable from a static CSS/HTML fetch, so a lightweight one-time
     radial paint stands in for a continuous particle system) ---------------- */
  var glow = document.getElementById("ctaGlow");
  if (glow) {
    function paintGlow(){
      var dpr = window.devicePixelRatio || 1;
      var w = glow.clientWidth, h = glow.clientHeight;
      glow.width = w * dpr; glow.height = h * dpr;
      var ctx = glow.getContext("2d");
      ctx.scale(dpr, dpr);
      var grad = ctx.createRadialGradient(w/2, h*0.3, 0, w/2, h*0.3, Math.max(w,h)*0.5);
      grad.addColorStop(0, "rgba(240,64,58,0.16)");
      grad.addColorStop(1, "rgba(240,64,58,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    paintGlow();
    window.addEventListener("resize", paintGlow, { passive: true });
  }

  /* ---------------- mobile tap-feedback flash ---------------- */
  if (isCoarse) {
    document.querySelectorAll("a, button").forEach(function(el){
      el.addEventListener("touchstart", function(){
        el.classList.add("tap-flash");
        setTimeout(function(){ el.classList.remove("tap-flash"); }, 250);
      }, { passive: true });
    });
  }

})();
