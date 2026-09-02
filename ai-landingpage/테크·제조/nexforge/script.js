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

  window.addEventListener('scroll', function(){
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }, { passive: true });

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
          setTimeout(function(){ entry.target.classList.add('is-visible'); }, idx * 110);
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

  function initIndustrialCanvas(canvas, seedNum){
    if(!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var W, H, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pts = [];
    var skyline = [];
    function resize(){
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seedRandom(s){
      return function(){ s = (s * 9301 + 49297) % 233280; return s / 233280; };
    }
    var rand = seedRandom(seedNum);
    function buildSkyline(){
      skyline = [];
      var x = -20, base = H;
      while(x < W + 20){
        var w = 24 + rand() * 46;
        var h = 40 + rand() * (H * 0.32);
        var kind = rand();
        skyline.push({ x: x, w: w, h: h, tower: kind > 0.72 });
        x += w + 10 + rand() * 30;
      }
    }
    function seed(){
      pts = [];
      var n = Math.round((W * H) / 30000);
      for(var i = 0; i < n; i++){
        pts.push({
          x: rand() * W, y: rand() * H * 0.7,
          vx: (rand() - 0.5) * 0.15, vy: (rand() - 0.5) * 0.15,
          r: rand() * 1.5 + 0.5
        });
      }
      buildSkyline();
    }
    var accentRGB = '184,83,31';
    function draw(){
      ctx.clearRect(0, 0, W, H);
      var base = H;

      /* industrial skyline silhouette along the horizon */
      ctx.fillStyle = 'rgba(10,8,6,0.55)';
      skyline.forEach(function(b){
        ctx.fillRect(b.x, base - b.h, b.w, b.h);
        if(b.tower){
          ctx.fillRect(b.x + b.w * 0.4, base - b.h - 26, b.w * 0.2, 26);
        }
      });

      /* ambient spark network */
      for(var i = 0; i < pts.length; i++){
        var p = pts[i];
        if(!reduced){ p.x += p.vx; p.y += p.vy; }
        if(p.x < 0) p.x = W; if(p.x > W) p.x = 0;
        if(p.y < 0) p.y = H * 0.7; if(p.y > H * 0.7) p.y = 0;
      }
      for(i = 0; i < pts.length; i++){
        for(var j = i + 1; j < pts.length; j++){
          var a = pts[i], b2 = pts[j];
          var dx = a.x - b2.x, dy = a.y - b2.y;
          var d2 = dx * dx + dy * dy;
          if(d2 < 130 * 130){
            var op = (1 - d2 / (130 * 130)) * 0.3;
            ctx.strokeStyle = 'rgba(' + accentRGB + ',' + op.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
          }
        }
      }
      for(i = 0; i < pts.length; i++){
        var p2 = pts[i];
        ctx.fillStyle = 'rgba(' + accentRGB + ',0.5)';
        ctx.beginPath(); ctx.arc(p2.x, p2.y, p2.r, 0, Math.PI * 2); ctx.fill();
      }
      if(!reduced) requestAnimationFrame(draw);
    }
    resize(); seed(); draw();
    window.addEventListener('resize', function(){ resize(); seed(); if(reduced) draw(); });
  }

  initIndustrialCanvas(document.getElementById('heroCanvas'), 42);
  initIndustrialCanvas(document.getElementById('ctaCanvas'), 91);
})();
