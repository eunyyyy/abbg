(function(){
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var siteHeader = document.getElementById('siteHeader');
  var mobileHeader = document.getElementById('mobileHeader');

  window.addEventListener('load', function(){
    setTimeout(function(){
      siteHeader.classList.add('is-visible');
      mobileHeader.classList.add('is-visible');
    }, 600);
  });

  /* ---------- mobile menu ---------- */
  var menuToggle = document.getElementById('menuToggle');
  var menuClose = document.getElementById('menuClose');
  var mobileMenu = document.getElementById('mobileMenu');

  function openMenu(){ mobileMenu.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
  function closeMenu(){ mobileMenu.classList.remove('is-open'); document.body.style.overflow = ''; }

  menuToggle.addEventListener('click', openMenu);
  menuClose.addEventListener('click', closeMenu);
  document.querySelectorAll('[data-nav-mobile]').forEach(function(a){
    a.addEventListener('click', closeMenu);
  });
  window.addEventListener('resize', function(){
    if(window.innerWidth > 1024) closeMenu();
  });

  /* ---------- header color-invert by section theme ---------- */
  var themedSections = Array.prototype.slice.call(document.querySelectorAll('[data-header-theme]'));
  if('IntersectionObserver' in window && themedSections.length){
    var themeObs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        var isDark = entry.target.getAttribute('data-header-theme') === 'dark';
        siteHeader.classList.toggle('is-dark', isDark);
        mobileHeader.classList.toggle('is-dark', isDark);
      });
    }, { rootMargin: '-50% 0px -49% 0px', threshold: 0 });
    themedSections.forEach(function(s){ themeObs.observe(s); });
  }

  /* ---------- fadeup reveal ---------- */
  var fadeEls = document.querySelectorAll('[data-fade]');
  if('IntersectionObserver' in window){
    var fadeObs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          fadeObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    fadeEls.forEach(function(el){ fadeObs.observe(el); });
  } else {
    fadeEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* ---------- hero entrance (staggered, no observer needed — always above the fold) ---------- */
  var heroFade = document.querySelectorAll('.hero [data-fade]');
  heroFade.forEach(function(el, i){
    el.style.animationDelay = (i * 0.12) + 's';
  });

  /* ---------- stat counters ---------- */
  function formatCount(v, fmt){
    if(fmt === 'plus') return Math.round(v).toLocaleString('ko-KR') + '+';
    if(fmt === 'percent') return Math.round(v) + '%';
    if(fmt === 'million') return v.toFixed(1) + 'M+';
    if(fmt === 'decimal') return v.toFixed(1) + '%';
    return Math.round(v).toLocaleString('ko-KR');
  }
  var counters = document.querySelectorAll('[data-count]');
  if('IntersectionObserver' in window && counters.length){
    var counterObs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        counterObs.unobserve(entry.target);
        var el = entry.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var fmt = el.getAttribute('data-format');
        if(reduced){ el.textContent = formatCount(target, fmt); return; }
        var start = null, dur = 1100;
        function step(ts){
          if(start === null) start = ts;
          var p = Math.min(1, (ts - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = formatCount(target * eased, fmt);
          if(p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function(el){ counterObs.observe(el); });
  } else {
    counters.forEach(function(el){
      el.textContent = formatCount(parseFloat(el.getAttribute('data-count')), el.getAttribute('data-format'));
    });
  }

  /* ---------- active nav link on scroll ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var navSections = navLinks.map(function(a){ return document.querySelector(a.getAttribute('href')); });
  if('IntersectionObserver' in window && navLinks.length){
    var navObs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        var idx = navSections.indexOf(entry.target);
        if(idx === -1) return;
        navLinks.forEach(function(a){ a.classList.remove('is-active'); });
        navLinks[idx].classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    navSections.forEach(function(s){ if(s) navObs.observe(s); });
  }

  /* ---------- contact form ---------- */
  var contactForm = document.getElementById('contactForm');
  var formNote = document.getElementById('ctaFormNote');
  if(contactForm){
    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      formNote.textContent = '문의가 접수되었습니다. 빠른 시일 내에 담당자가 연락드리겠습니다. (데모 페이지: 실제 전송되지 않습니다)';
      contactForm.reset();
    });
  }
})();
