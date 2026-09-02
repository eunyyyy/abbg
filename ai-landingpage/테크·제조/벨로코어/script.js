(function(){
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header scroll state ---------- */
  var header = document.getElementById("header");
  var lastScrolled = false;
  function updateHeader(){
    var scrolled = window.scrollY > 40;
    if (scrolled !== lastScrolled){
      header.classList.toggle("is-scrolled", scrolled);
      lastScrolled = scrolled;
    }
  }
  var headerTicking = false;
  window.addEventListener("scroll", function(){
    if (!headerTicking){
      headerTicking = true;
      requestAnimationFrame(function(){ updateHeader(); headerTicking = false; });
    }
  }, { passive:true });
  updateHeader();

  /* ---------- Hero load-in ---------- */
  var hero = document.querySelector(".hero");
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){ hero.classList.add("is-loaded"); });
  });

  /* ---------- Mobile menu (hamburger + right-side drawer) ---------- */
  var menuToggle = document.getElementById("menuToggle");
  var mobileMenu = document.getElementById("mobileMenu");
  var mobileMenuScrim = document.getElementById("mobileMenuScrim");
  function closeMobileMenu(){
    menuToggle.classList.remove("is-open");
    mobileMenu.classList.remove("is-open");
    mobileMenuScrim.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }
  function openMobileMenu(){
    menuToggle.classList.add("is-open");
    mobileMenu.classList.add("is-open");
    mobileMenuScrim.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
  }
  menuToggle.addEventListener("click", function(){
    if (mobileMenu.classList.contains("is-open")) closeMobileMenu();
    else openMobileMenu();
  });
  mobileMenuScrim.addEventListener("click", closeMobileMenu);

  /* ---------- Smooth scroll with fixed-header offset ---------- */
  var navLinks = document.querySelectorAll("[data-nav]");
  navLinks.forEach(function(link){
    link.addEventListener("click", function(e){
      closeMobileMenu();
      var targetId = link.getAttribute("href");
      if (!targetId || targetId.charAt(0) !== "#") return;
      var target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      var headerH = header.offsetHeight;
      var top = target.getBoundingClientRect().top + window.pageYOffset - headerH + 1;
      window.scrollTo({ top: top, behavior: reducedMotion ? "auto" : "smooth" });
    });
  });

  /* ---------- Reveal on scroll (one-shot) ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  revealEls.forEach(function(el){
    var delay = el.getAttribute("data-reveal-delay");
    if (delay) el.style.setProperty("--reveal-delay", delay);
  });
  if ("IntersectionObserver" in window){
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold:0.18, rootMargin:"0px 0px -8% 0px" });
    revealEls.forEach(function(el){ revealObserver.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add("is-visible"); });
  }

  /* ---------- Count-up numbers ---------- */
  function formatNumber(value, decimals){
    var fixed = value.toFixed(decimals);
    var parts = fixed.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
  function runCountUp(el){
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    if (reducedMotion || isNaN(target)){
      el.textContent = prefix + formatNumber(target || 0, decimals) + suffix;
      return;
    }
    var duration = 1600;
    var startTime = null;
    function step(timestamp){
      if (startTime === null) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = target * eased;
      el.textContent = prefix + formatNumber(current, decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var countEls = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window){
    var countObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          runCountUp(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold:0.4 });
    countEls.forEach(function(el){ countObserver.observe(el); });
  } else {
    countEls.forEach(runCountUp);
  }

  /* ---------- Bidirectional reveal (Performance rows) ---------- */
  var toggleEls = document.querySelectorAll("[data-reveal-toggle]");
  toggleEls.forEach(function(el){
    var delay = el.getAttribute("data-reveal-delay");
    if (delay) el.style.setProperty("--reveal-delay", delay);
  });
  if ("IntersectionObserver" in window && toggleEls.length){
    var toggleObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var el = entry.target;
        if (entry.isIntersecting){
          el.classList.remove("reveal-exit-up");
          el.classList.add("is-visible");
        } else {
          el.classList.remove("is-visible");
          if (entry.boundingClientRect.top < 0) el.classList.add("reveal-exit-up");
          else el.classList.remove("reveal-exit-up");
        }
      });
    }, { threshold:0.18, rootMargin:"0px 0px -8% 0px" });
    toggleEls.forEach(function(el){ toggleObserver.observe(el); });
  } else {
    toggleEls.forEach(function(el){ el.classList.add("is-visible"); });
  }

  /* ---------- Bidirectional reveal (Technology cards) ---------- */
  var bidirEls = document.querySelectorAll("[data-reveal-bidir]");
  bidirEls.forEach(function(el){
    var delay = el.getAttribute("data-reveal-delay");
    if (delay) el.style.setProperty("--reveal-delay", delay);
  });
  if ("IntersectionObserver" in window && bidirEls.length){
    var bidirObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    }, { threshold:0.18, rootMargin:"0px 0px -8% 0px" });
    bidirEls.forEach(function(el){ bidirObserver.observe(el); });
  } else {
    bidirEls.forEach(function(el){ el.classList.add("is-visible"); });
  }

  /* ---------- Scroll-fill text (Solutions heading) ---------- */
  var fillEls = document.querySelectorAll("[data-scroll-fill]");
  if (fillEls.length){
    function updateFill(){
      fillEls.forEach(function(el){
        var rect = el.getBoundingClientRect();
        var start = window.innerHeight * 0.92;
        var end = window.innerHeight * 0.38;
        var progress = (start - rect.top) / (start - end);
        progress = Math.min(Math.max(progress, 0), 1);
        el.style.setProperty("--fill", (progress * 100) + "%");
      });
    }
    var fillTicking = false;
    window.addEventListener("scroll", function(){
      if (!fillTicking){
        fillTicking = true;
        requestAnimationFrame(function(){ updateFill(); fillTicking = false; });
      }
    }, { passive:true });
    updateFill();
  }

  /* ---------- Scroll-driven fullscreen expand (Company visual) ---------- */
  var expandWraps = document.querySelectorAll("[data-scroll-expand]");
  if (expandWraps.length){
    function updateExpand(){
      expandWraps.forEach(function(wrap){
        var rect = wrap.getBoundingClientRect();
        var scrollable = rect.height - window.innerHeight;
        var progress = scrollable > 0 ? Math.min(Math.max(-rect.top / scrollable, 0), 1) : 0;
        wrap.style.setProperty("--p", progress);
      });
    }
    /* keep Company's resting (mobile) image 32px below the CTA button so it
       never overlaps it — recomputed continuously so it self-corrects once
       the button's own fade-up reveal has settled into its final position */
    function updateCompanyMobileOffset(){
      var wrap = document.querySelector("[data-scroll-expand]");
      var textEl = document.querySelector(".company__text");
      var pin = document.querySelector(".company__pin");
      if (!wrap || !textEl || !pin) return;
      if (window.innerWidth > 768){
        wrap.style.removeProperty("--vs-top");
        return;
      }
      var textRect = textEl.getBoundingClientRect();
      var pinRect = pin.getBoundingClientRect();
      var topPx = (textRect.bottom - pinRect.top) + 32;
      wrap.style.setProperty("--vs-top", topPx + "px");
    }
    var expandTicking = false;
    window.addEventListener("scroll", function(){
      if (!expandTicking){
        expandTicking = true;
        requestAnimationFrame(function(){ updateExpand(); updateCompanyMobileOffset(); expandTicking = false; });
      }
    }, { passive:true });
    window.addEventListener("resize", function(){
      if (!expandTicking){
        expandTicking = true;
        requestAnimationFrame(function(){ updateExpand(); updateCompanyMobileOffset(); expandTicking = false; });
      }
    }, { passive:true });
    updateExpand();
    updateCompanyMobileOffset();
    setTimeout(updateCompanyMobileOffset, 900); // after initial reveal transitions settle
  }

  /* ---------- Solutions accordion (hover on pointer, tap on touch) ---------- */
  var solutionItems = document.querySelectorAll(".solutions__item");
  function activateSolution(item){
    solutionItems.forEach(function(other){ other.classList.toggle("is-active", other === item); });
  }
  solutionItems.forEach(function(item){
    item.addEventListener("mouseenter", function(){
      if (window.matchMedia("(hover: hover)").matches) activateSolution(item);
    });
    item.addEventListener("click", function(){ activateSolution(item); });
  });

  /* ---------- Pause background videos when off-screen ---------- */
  var bgVideos = document.querySelectorAll(".hero__video, .contact__video");
  if ("IntersectionObserver" in window && bgVideos.length){
    var videoObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) entry.target.play().catch(function(){});
        else entry.target.pause();
      });
    }, { threshold:0.1 });
    bgVideos.forEach(function(video){ videoObserver.observe(video); });
  }

  /* ---------- Active nav link highlight ---------- */
  var sections = document.querySelectorAll("main section[id]");
  var navByHash = {};
  navLinks.forEach(function(link){
    var href = link.getAttribute("href");
    if (href && href.charAt(0) === "#") navByHash[href.slice(1)] = link;
  });
  if ("IntersectionObserver" in window && sections.length){
    var navObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var link = navByHash[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting){
          Object.keys(navByHash).forEach(function(id){ navByHash[id].classList.remove("is-active"); });
          link.classList.add("is-active");
        }
      });
    }, { rootMargin:"-45% 0px -45% 0px" });
    sections.forEach(function(section){ navObserver.observe(section); });
  }

})();
