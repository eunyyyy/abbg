/* BAROWAY | interactions (vanilla + GSAP ScrollTrigger) */
(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMo = function(){ return window.innerWidth < 768; };
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- hero video ---------- */
  var vid = document.getElementById('heroVideo');
  if (vid){
    vid.src = isMo() ? 'video/hero-mo.mp4' : 'video/hero.mp4';
    var p = vid.play(); if (p && p.catch) p.catch(function(){});
  }
  requestAnimationFrame(function(){ setTimeout(function(){ document.body.classList.add('is-loaded'); }, 60); });

  /* ---------- GNB light/dark by section under it ---------- */
  var gnb = document.getElementById('gnb');
  var themed = [].slice.call(document.querySelectorAll('[data-theme]'));
  function syncGnb(){
    var y = 40, mode = 'dark';
    for (var i = 0; i < themed.length; i++){
      var r = themed[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y){ mode = themed[i].getAttribute('data-theme'); break; }
    }
    if (gnb.getAttribute('data-mode') !== mode) gnb.setAttribute('data-mode', mode);
  }
  if (hasGsap){ ScrollTrigger.create({ start: 0, end: 'max', onUpdate: syncGnb }); }
  else { var io0 = new IntersectionObserver(syncGnb, { threshold: [0, 1] }); themed.forEach(function(s){ io0.observe(s); }); }
  syncGnb();

  /* ---------- mobile menu ---------- */
  var menuBtn = document.getElementById('menuBtn'), sheet = document.getElementById('msheet');
  function setMenu(open){
    gnb.classList.toggle('is-open', open); sheet.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open); sheet.setAttribute('aria-hidden', !open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }
  menuBtn.addEventListener('click', function(){ setMenu(!gnb.classList.contains('is-open')); });
  sheet.addEventListener('click', function(e){ if (e.target.closest('a')) setMenu(false); });

  /* ---------- reveal ---------- */
  var revealEls = [].slice.call(document.querySelectorAll('.rv, .clients, .tile'));
  function show(el){
    if (el.classList.contains('is-in')) return;
    if (el.classList.contains('clients')){
      [].forEach.call(el.querySelectorAll('.wm'), function(w, i){ w.style.transitionDelay = (i % 6) * 0.06 + Math.floor(i / 6) * 0.14 + 's'; });
    }
    el.classList.add('is-in');
  }
  if (reduce){ revealEls.forEach(show); }
  else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting){ show(en.target); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
    /* fallback sweep: covers instant jumps / anchor clicks where IO misses a frame */
    var sweep = function(){
      var vh = window.innerHeight;
      revealEls.forEach(function(el){ var r = el.getBoundingClientRect(); if (r.top < vh * 0.9 && r.bottom > 0) show(el); });
    };
    if (hasGsap) ScrollTrigger.create({ start: 0, end: 'max', onUpdate: sweep });
    window.addEventListener('load', sweep);
  }

  /* ---------- pain rows: scrubbed in / out with scroll length ---------- */
  var painRows = [].slice.call(document.querySelectorAll('.pain__row'));
  function seg(p, a, b){ return Math.max(0, Math.min(1, (p - a) / (b - a))); }
  function setPain(p){
    painRows.forEach(function(r, i){
      var inK = seg(p, .06 + i * .1, .16 + i * .1);          /* appear one by one */
      var outK = seg(p, .7 + i * .065, .78 + i * .065);       /* leave in the same order */
      var o = inK * (1 - outK);
      var y = (1 - inK) * 40 - outK * 40;
      r.style.opacity = o.toFixed(3);
      r.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0) scale(' + (.96 + .04 * Math.min(inK, 1 - outK + 0)).toFixed(3) + ')';
    });
  }
  if (hasGsap && !reduce){
    ScrollTrigger.create({ trigger: '.pain', start: 'top top', end: 'bottom bottom',
      onUpdate: function(s){ setPain(s.progress); }, onRefresh: function(s){ setPain(s.progress); } });
    setPain(0);
  } else { painRows.forEach(function(r){ r.style.opacity = 1; r.style.transform = 'none'; }); }

  /* ---------- counters ---------- */
  var counters = [].slice.call(document.querySelectorAll('.count'));
  function fmt(v, dec){ return dec ? v.toFixed(dec) : Math.round(v).toLocaleString('ko-KR'); }
  function runCount(el){
    if (el.dataset.done) return; el.dataset.done = 1;
    var to = parseFloat(el.dataset.to), dec = parseInt(el.dataset.dec || 0, 10);
    if (reduce){ el.textContent = fmt(to, dec); return; }
    var t0 = performance.now(), dur = 1600;
    (function tick(now){
      var k = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(to * e, dec);
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  var ioc = new IntersectionObserver(function(en){ en.forEach(function(x){ if (x.isIntersecting) runCount(x.target); }); }, { threshold: .6 });
  counters.forEach(function(c){ ioc.observe(c); });

  /* ---------- morph headline: 바로웨이를 만나면, -> 바로 해결됩니다. ---------- */
  var A = '웨이를 만나면,', B = ' 해결됩니다.';
  var aWrap = document.querySelector('.morph__a'), bWrap = document.querySelector('.morph__b');
  function split(wrap, str){
    return str.split('').map(function(c){ var s = document.createElement('span'); s.className = 'ch'; s.textContent = c; wrap.appendChild(s); return s; });
  }
  var aCh = split(aWrap, A), bCh = split(bWrap, B);
  var fixedCh = [].slice.call(document.querySelectorAll('.morph__fixed .ch'));
  if (hasGsap && !reduce){
    gsap.set(bCh, { yPercent: 110, opacity: 0, rotateX: -70 });
    gsap.set(fixedCh, { color: '#444F52' });
    var mt = gsap.timeline({ scrollTrigger: { trigger: '.morph', start: 'top top', end: 'bottom bottom', scrub: .6 } });
    mt.to(fixedCh.concat(aCh.slice(0, 2)), { color: '#2FA99A', stagger: .06, duration: .2, ease: 'none' }, 0)
      .to(aCh.slice(2), { color: '#FBFDFD', stagger: .03, duration: .16, ease: 'none' }, .12)
      .to(aCh, { yPercent: -110, opacity: 0, rotateX: 70, stagger: .025, duration: .22, ease: 'power2.in' }, .5)
      .to(bCh, { yPercent: 0, opacity: 1, rotateX: 0, stagger: .025, duration: .24, ease: 'power3.out' }, .62)
      .to(bCh, { color: '#2FA99A', stagger: .03, duration: .14, ease: 'none' }, .92)
      .to({}, { duration: .12 });
  } else {
    aWrap.style.display = 'none'; bWrap.style.position = 'static';
    bCh.forEach(function(c){ c.style.color = '#2FA99A'; });
  }

  /* ---------- process: crane descends, steps advance ---------- */
  var load = document.querySelector('.crane__load'), stack = document.querySelector('.crane__stack');
  var stepsBox = document.querySelector('.steps'), list = document.querySelector('.steps__list');
  var items = [].slice.call(list.children), fill = document.querySelector('.steps__fill');
  var box = document.querySelector('.crane__box');
  function setProcess(k){
    var H = load.parentNode.clientHeight, mo = isMo();
    var land = Math.min(1, k / .88), e = 1 - Math.pow(1 - land, 2.2);
    var boxTop = box.offsetTop, boxH = box.offsetHeight;
    var stackTop = mo ? H - boxH * .62 : H * .64;
    stack.style.top = stackTop + 'px';
    stack.style.transform = 'translate3d(0,' + ((1 - e) * H * (mo ? .7 : .55)).toFixed(1) + 'px,0)';
    var startY = (mo ? H * .06 : H * .3) - boxTop, endY = stackTop - boxTop - boxH + 2;
    load.style.transform = 'translate3d(0,' + (startY + (endY - startY) * e).toFixed(1) + 'px,0)';
    var n = items.length, act = Math.min(n - 1, Math.floor(k * n * 1.02));
    items.forEach(function(li, i){ li.classList.toggle('is-on', i <= act); });
    fill.style.transform = 'scaleY(' + Math.min(1, (items[act].offsetTop + 30) / list.scrollHeight) + ')';
    var target = items[act].offsetTop - stepsBox.clientHeight * 0.32;
    var maxY = Math.max(0, list.scrollHeight - stepsBox.clientHeight + 40);
    var y = Math.max(0, Math.min(maxY, target));
    list.style.transform = 'translate3d(0,' + (-y).toFixed(1) + 'px,0)';
    fill.parentNode.style.transform = 'translate3d(0,' + (-y).toFixed(1) + 'px,0)';
    fill.parentNode.style.height = list.scrollHeight + 'px';
  }
  if (hasGsap){
    ScrollTrigger.create({ trigger: '.process', start: 'top top', end: 'bottom bottom',
      onUpdate: function(s){ setProcess(reduce ? 1 : s.progress); },
      onRefresh: function(s){ setProcess(reduce ? 1 : s.progress); } });
  }
  setProcess(reduce ? 1 : 0);

  /* ---------- carousels (arrows + drag + dots) ---------- */
  function carousel(track, prev, next, dotsBox){
    if (!track) return;
    var cards = [].slice.call(track.children);
    function step(){ return cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 16); }
    function update(){
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.forEach(function(b){ b.disabled = track.scrollLeft <= 2; });
      next.forEach(function(b){ b.disabled = track.scrollLeft >= max; });
      if (dotsBox){
        var i = Math.round(track.scrollLeft / step());
        [].forEach.call(dotsBox.children, function(d, j){ d.classList.toggle('on', j === Math.min(i, cards.length - 1)); });
      }
    }
    if (dotsBox){ cards.forEach(function(){ dotsBox.appendChild(document.createElement('i')); }); }
    prev.forEach(function(b){ b.addEventListener('click', function(){ track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); }); });
    next.forEach(function(b){ b.addEventListener('click', function(){ track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); }); });
    track.addEventListener('scroll', update, { passive: true });
    /* mouse drag */
    var down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('pointerdown', function(e){ if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; track.classList.add('is-drag'); });
    window.addEventListener('pointermove', function(e){ if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; track.scrollLeft = sl - dx; });
    window.addEventListener('pointerup', function(){ if (!down) return; down = false; track.classList.remove('is-drag');
      var i = Math.round(track.scrollLeft / step()); track.scrollTo({ left: i * step(), behavior: 'smooth' }); });
    track.addEventListener('click', function(e){ if (moved){ e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    track.addEventListener('dragstart', function(e){ e.preventDefault(); });
    update(); window.addEventListener('resize', update);
  }
  var cv = document.querySelector('.cases__viewport');
  carousel(document.getElementById('casesTrack'), [cv.querySelector('.arrow--prev')], [cv.querySelector('.arrow--next')]);

  /* ---------- infinite leftward loops (cases on mobile, modes everywhere) ---------- */
  function makeLoop(track, speed){
    if (!track) return;
    var orig = [].slice.call(track.children);
    orig.forEach(function(el){
      var c = el.cloneNode(true); c.classList.add('is-clone'); c.setAttribute('aria-hidden', 'true');
      [].forEach.call(c.querySelectorAll('a,button'), function(a){ a.setAttribute('tabindex', '-1'); });
      track.appendChild(c);
    });
    function setDur(){
      var gap = parseFloat(getComputedStyle(track).columnGap) || 16, w = 0;
      orig.forEach(function(el){ w += el.getBoundingClientRect().width + gap; });
      if (w > 0) track.style.setProperty('--loop-dur', (w / speed).toFixed(1) + 's');
    }
    setDur(); window.addEventListener('resize', setDur); window.addEventListener('load', setDur);
  }
  makeLoop(document.getElementById('casesTrack'), 38);
  makeLoop(document.getElementById('modesTrack'), 42);

  /* first case card shows its photo until the user hovers another (reference behaviour) */
  var caseCards = [].slice.call(document.querySelectorAll('.case'));
  if (caseCards.length){
    caseCards[0].classList.add('is-feature');
    caseCards.forEach(function(c){ c.addEventListener('mouseenter', function(){ caseCards.forEach(function(x){ x.classList.toggle('is-feature', x === c); }); }); });
  }

  /* ---------- magnetic buttons ---------- */
  if (!reduce && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    [].forEach.call(document.querySelectorAll('.magnet'), function(b){
      b.addEventListener('pointermove', function(e){
        var r = b.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + x * .18 + 'px,' + y * .3 + 'px)';
      });
      b.addEventListener('pointerleave', function(){ b.style.transform = ''; });
    });
  }

  /* ---------- CTA particle globe ---------- */
  var cvs = document.getElementById('globe');
  if (cvs){
    var ctx = cvs.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W, H, pts = [], N, rot = 0, mx = 0, my = 0, tmx = 0, tmy = 0, running = false;
    function build(){
      W = cvs.clientWidth; H = cvs.clientHeight; cvs.width = W * dpr; cvs.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      N = isMo() ? 900 : 1700; pts = [];
      var g = Math.PI * (3 - Math.sqrt(5));
      for (var i = 0; i < N; i++){
        var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), t = g * i;
        pts.push([Math.cos(t) * r, y, Math.sin(t) * r, Math.random()]);
      }
      /* loose dust outside the sphere */
      for (var j = 0; j < N * .35; j++){
        var u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, rr = 1.1 + Math.random() * .7, s = Math.sqrt(1 - u * u);
        pts.push([Math.cos(th) * s * rr, u * rr, Math.sin(th) * s * rr, Math.random()]);
      }
    }
    function draw(){
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      mx += (tmx - mx) * .05; my += (tmy - my) * .05;
      rot += reduce ? 0 : .0016;
      var R = Math.min(W, H) * (isMo() ? .42 : .4), cx = W / 2, cy = H / 2;
      var ry = rot + mx * .5, rx = -.32 + my * .3, cyr = Math.cos(ry), syr = Math.sin(ry), cxr = Math.cos(rx), sxr = Math.sin(rx);
      for (var i = 0; i < pts.length; i++){
        var p = pts[i], x = p[0] * cyr - p[2] * syr, z = p[0] * syr + p[2] * cyr, y = p[1] * cxr - z * sxr; z = p[1] * sxr + z * cxr;
        var k = 2.6 / (2.6 + z), a = (.18 + (1 - (z + 1) / 2) * .82) * (.55 + p[3] * .45);
        ctx.fillStyle = p[3] > .93 ? 'rgba(95,194,181,' + a + ')' : 'rgba(234,240,240,' + Math.min(1, a * 1.05) + ')';
        var s = (p[3] > .8 ? 1.7 : 1.1) * k;
        ctx.fillRect(cx + x * R * k, cy + y * R * k, s, s);
      }
      requestAnimationFrame(draw);
    }
    build(); window.addEventListener('resize', build);
    cvs.parentNode.addEventListener('pointermove', function(e){ var r = cvs.getBoundingClientRect(); tmx = (e.clientX - r.left) / r.width - .5; tmy = (e.clientY - r.top) / r.height - .5; });
    new IntersectionObserver(function(en){ var on = en[0].isIntersecting; if (on && !running){ running = true; requestAnimationFrame(draw); } else if (!on) running = false; }).observe(cvs);
  }

  window.addEventListener('load', function(){ if (hasGsap) ScrollTrigger.refresh(); });
})();
