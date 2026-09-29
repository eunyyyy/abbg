(function(){
  var header = document.getElementById('siteHeader');
  var nav = document.getElementById('gnb');
  var pill = document.getElementById('gnbPill');
  var toggle = document.getElementById('menuToggle');
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a[data-nav]'));
  var sections = navLinks.map(function(a){ return document.querySelector(a.getAttribute('href')); });
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  toggle.addEventListener('click', function(){
    var open = nav.classList.toggle('is-open');
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks.forEach(function(a){
    a.addEventListener('click', function(){
      nav.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  var hero = document.getElementById('top');
  function updateHeader(){
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    var heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
    header.classList.toggle('is-inverse', heroBottom > header.offsetHeight * .55);
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  function movePill(link){
    if(!link) return;
    pill.style.left = link.offsetLeft + 'px';
    pill.style.width = link.offsetWidth + 'px';
    pill.classList.add('is-ready');
  }

  var active = navLinks[0];
  function setActive(link){
    if(link === active) return;
    active = link;
    navLinks.forEach(function(a){ a.classList.toggle('is-active', a === link); });
    if(window.innerWidth > 1024) movePill(link);
  }

  if('IntersectionObserver' in window){
    var spy = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var idx = sections.indexOf(entry.target);
          if(idx > -1) setActive(navLinks[idx]);
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function(s){ if(s) spy.observe(s); });

    var steps = document.querySelectorAll('.step');
    var stepObs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var idx = Array.prototype.indexOf.call(steps, entry.target);
          setTimeout(function(){ entry.target.classList.add('is-visible'); }, idx * 180);
          stepObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    steps.forEach(function(el){ stepObs.observe(el); });

    var meters = document.querySelectorAll('.meter .fill');
    var meterObs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.style.width = entry.target.getAttribute('data-fill') + '%';
          meterObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    meters.forEach(function(el){ meterObs.observe(el); });

    var counters = document.querySelectorAll('[data-count]');
    function formatCount(v, fmt){
      if(fmt === 'plus') return Math.round(v).toLocaleString('ko-KR') + '+';
      if(fmt === 'trillion') return (v/10).toFixed(1) + '조원';
      return Math.round(v).toLocaleString('ko-KR');
    }
    var counterObs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        counterObs.unobserve(entry.target);
        var el = entry.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var fmt = el.getAttribute('data-format');
        if(reduced){ el.textContent = formatCount(target, fmt); return; }
        var start = null; var dur = 1100;
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
    navLinks.forEach(function(a){ a.classList.remove('is-active'); });
  }

  window.addEventListener('load', function(){ movePill(navLinks[0]); navLinks[0].classList.add('is-active'); });
  window.addEventListener('resize', function(){ if(window.innerWidth > 1024) movePill(active); });
})();
