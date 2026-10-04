/* NORDLANE | interaction layer (Lenis + GSAP ScrollTrigger) */
(function () {
  'use strict';
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToY(y) {
    if (lenis) lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ---------- section targets ---------- */
  var secs = $$('[data-sec]');
  function goto(n) {
    closeNav();
    if (n === 0) return scrollToY(0);
    if (n === 5) return scrollToY(document.documentElement.scrollHeight);
    var el = secs[n];
    if (el) scrollToY(el.getBoundingClientRect().top + window.scrollY);
  }
  $$('[data-goto]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      goto(parseInt(b.getAttribute('data-goto'), 10));
    });
  });

  /* ---------- header ---------- */
  var hd = $('#hd');
  var toggle = $('.hd__toggle');
  var mq = window.matchMedia('(max-width: 1023px)');
  function closeNav() {
    if (!html.classList.contains('nav-open')) return;
    html.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
  }
  toggle.addEventListener('click', function () {
    if (mq.matches) {
      var open = html.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (lenis) open ? lenis.stop() : lenis.start();
    } else {
      hd.classList.toggle('is-open');
    }
  });
  $('.hd__right').addEventListener('mouseenter', function () { if (!mq.matches) hd.classList.add('is-open'); });
  hd.addEventListener('mouseleave', function () { hd.classList.remove('is-open'); });

  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      var y = self.scroll();
      hd.classList.toggle('is-scroll', y > 0);
      html.classList.toggle('is-down', y > window.innerHeight / 2);
      if (mq.matches && !html.classList.contains('nav-open')) {
        hd.classList.toggle('is-hide', self.direction === 1 && y > 120);
      } else {
        hd.classList.remove('is-hide');
      }
    }
  });

  /* dark themes under header / quick / float */
  $$('[data-theme="dark"]').forEach(function (el) {
    ScrollTrigger.create({ trigger: el, start: 'top 40px', end: 'bottom 40px', toggleClass: { targets: html, className: 'hd-dark' } });
    ScrollTrigger.create({ trigger: el, start: 'top bottom-=70', end: 'bottom bottom-=70', toggleClass: { targets: html, className: 'fl-light' } });
  });
  ScrollTrigger.create({ trigger: '.busi__motion', start: 'top center', end: 'bottom center', toggleClass: { targets: html, className: 'q-dark' } });

  /* current section for quick nav */
  secs.forEach(function (el, i) {
    ScrollTrigger.create({
      trigger: el, start: 'top center', end: 'bottom center',
      onToggle: function (self) {
        if (self.isActive) {
          html.setAttribute('data-sec', i);
          html.classList.toggle('show-quick', i > 0);
        }
      }
    });
  });

  ScrollTrigger.create({ trigger: '.ft', start: 'top 85%', end: 'max', toggleClass: { targets: html, className: 'at-foot' } });

  $('.float').addEventListener('click', function () {
    if (html.classList.contains('is-down')) scrollToY(0);
    else scrollToY(window.innerHeight);
  });

  /* ---------- hero slider ---------- */
  var slides = $$('.slide');
  var typos = $$('.visual__typo');
  var dots = $$('.visual__dots li');
  var cur = 0, timer = null, paused = reduce, DUR = 5500;
  var typoTl = null;
  html.style.setProperty('--dur', DUR / 1000 + 's');

  function playTypo(i) {
    if (typoTl) typoTl.kill();
    var lines = $$('.ln', typos[i]);
    gsap.set($$('.visual__typo .ln'), { backgroundSize: '0% 100%' });
    if (reduce) { gsap.set(lines, { backgroundSize: '200% 100%' }); return; }
    typoTl = gsap.timeline().to(lines, { backgroundSize: '200% 100%', duration: 1.6, stagger: 1, delay: 0.6, ease: 'power1.inOut' });
  }
  function show(i) {
    var prev = cur;
    cur = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.classList.toggle('is-active', k === cur); });
    typos.forEach(function (t, k) { t.classList.toggle('is-active', k === cur); });
    dots.forEach(function (d, k) {
      d.classList.remove('is-active', 'is-done');
      void d.offsetWidth;
      if (k === cur) d.classList.add('is-active');
    });
    $$('video', slides[prev]).forEach(function (v) { v.pause(); });
    $$('video', slides[cur]).forEach(function (v) { v.currentTime = 0; var p = v.play(); if (p && p.catch) p.catch(function () {}); });
    playTypo(cur);
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (!paused) timer = setTimeout(function () { show(cur + 1); }, DUR);
  }
  var pauseBtn = $('.vb.pause');
  function setPaused(p) {
    paused = p;
    html.classList.toggle('is-paused', p);
    pauseBtn.innerHTML = p ? '<i class="ph ph-play"></i>' : '<i class="ph ph-pause"></i>';
    pauseBtn.setAttribute('aria-label', p ? '슬라이드 재생' : '슬라이드 멈춤');
    if (p) clearTimeout(timer); else show(cur);
  }
  pauseBtn.addEventListener('click', function () { setPaused(!paused); });
  $('.vb.prev').addEventListener('click', function () { if (paused) setPaused(false); show(cur - 1); });
  $('.vb.next').addEventListener('click', function () { if (paused) setPaused(false); show(cur + 1); });
  dots.forEach(function (d, k) { $('button', d).addEventListener('click', function () { show(k); }); });

  /* hero shrink + parallax */
  var mm = gsap.matchMedia();
  mm.add({ desk: '(min-width: 1024px)', mob: '(max-width: 1023px)' }, function (ctx) {
    gsap.to('.visual__back', {
      borderRadius: ctx.conditions.desk ? 40 : 20, scaleX: 0.965, ease: 'none',
      scrollTrigger: { trigger: '.visual', start: 'top top', end: 'bottom center', scrub: true }
    });
  });
  gsap.to('.slide__media', { y: 150, ease: 'none', scrollTrigger: { trigger: '.visual', start: 'top top', end: 'bottom center', scrub: true } });

  /* ---------- text fill ---------- */
  $$('.fill-wrap').forEach(function (wrap) {
    var lines = $$('.ln', wrap);
    if (reduce) { gsap.set(lines, { backgroundSize: '200% 100%' }); return; }
    var tl = gsap.timeline().to(lines, { backgroundSize: '200% 100%', duration: 0.5, stagger: 0.5, ease: 'none' });
    ScrollTrigger.create({ trigger: wrap, start: 'top 85%', end: 'bottom 15%', animation: tl, scrub: true });
  });

  /* ---------- about (pinned image stack) ---------- */
  var aboutMotion = $('.about__motion');
  mm.add('(min-width: 1024px)', function () {
    var wraps = $$('.about__imgwrap');
    var imgs = wraps.map(function (w) { return $('img', w); });
    gsap.set(wraps.slice(1), { yPercent: 100 });
    gsap.from(imgs[0], { scale: 1.05, ease: 'none', scrollTrigger: { trigger: '.about__intro', start: 'top top', end: 'bottom center', scrub: true } });
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.about__intro', start: 'bottom top', end: function () { return '+=' + window.innerHeight * 3; }, scrub: true,
        onUpdate: function (self) {
          aboutMotion.setAttribute('data-idx', Math.min(3, Math.floor(self.progress * 3 + 0.5)));
        },
        onLeaveBack: function () { aboutMotion.setAttribute('data-idx', 0); }
      }
    });
    for (var i = 1; i < wraps.length; i++) {
      tl.to(wraps[i], { yPercent: 0, ease: 'none' }, 'a' + i)
        .from(imgs[i], { scale: 1.2, ease: 'none' }, 'a' + i);
    }
    return function () { aboutMotion.setAttribute('data-idx', 0); };
  });

  /* ---------- business (horizontal slide-over) ---------- */
  gsap.to('.busi__motion', { borderRadius: 0, scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.busi__motion', start: 'top center', end: 'top top', scrub: true } });
  var menu = $$('.busi__menu li');
  mm.add('(min-width: 1024px)', function () {
    var items = $$('.busi__item');
    gsap.set(items.slice(1), { xPercent: 100 });
    var tl = gsap.timeline();
    items.slice(1).forEach(function (it, k) {
      tl.to(it, { xPercent: 0, ease: 'none' }, 'b' + (k + 1));
      tl.fromTo($('.busi__thumb img', it), { xPercent: -12 }, { xPercent: 0, ease: 'none' }, 'b' + (k + 1));
    });
    var st = ScrollTrigger.create({
      animation: tl, trigger: '.busi__motion', start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: function (self) {
        var idx = Math.min(4, Math.floor(self.progress * 4 + 0.5));
        menu.forEach(function (m, k) { m.classList.toggle('is-active', k === idx); });
      }
    });
    function onMenu(e) {
      var i = parseInt(e.currentTarget.getAttribute('data-b'), 10);
      scrollToY(st.start + (st.end - st.start) * (i / 4));
    }
    var btns = $$('.busi__menu button');
    btns.forEach(function (b) { b.addEventListener('click', onMenu); });
    return function () { btns.forEach(function (b) { b.removeEventListener('click', onMenu); }); };
  });

  /* ---------- recruit / media entrance (scrubbed, never leaves content hidden) ---------- */
  $$('.rs__item').forEach(function (el) {
    gsap.from(el, { y: 90, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 55%', scrub: true } });
  });
  gsap.from('.media__marquee', { xPercent: 12, ease: 'none', scrollTrigger: { trigger: '.media', start: 'top bottom', end: 'top top', scrub: true } });
  $$('.media__grid .media__item').forEach(function (el, k) {
    gsap.from(el, { y: 50 + (k % 2) * 40, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 60%', scrub: true } });
  });

  /* ---------- footer reveal ---------- */
  mm.add({ desk: '(min-width: 1024px)', mob: '(max-width: 1023px)' }, function (ctx) {
    gsap.to('.content', { borderRadius: ctx.conditions.desk ? 40 : 20, scaleX: 0.965, ease: 'none',
      scrollTrigger: { trigger: '.ft', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  });
  gsap.from('.ft__inner', { yPercent: -40, ease: 'none', scrollTrigger: { trigger: '.ft', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  /* ---------- intro (once per session) ---------- */
  var seen = false;
  try { seen = sessionStorage.getItem('nl-intro') === '1'; sessionStorage.setItem('nl-intro', '1'); } catch (e) {}
  if (!seen && !reduce) {
    html.classList.add('is-intro');
    if (lenis) lenis.stop();
    var letters = $$('.intro__word span');
    gsap.timeline({
      onComplete: function () {
        html.classList.remove('is-intro');
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
      }
    })
      .to(letters, { y: '0%', duration: 0.8, stagger: 0.06, ease: 'expo.out' })
      .to(letters, { y: '-110%', duration: 0.6, stagger: 0.04, ease: 'expo.in' }, '+=0.55')
      .add(function () { show(0); }, '-=0.15')
      .to('.intro', { autoAlpha: 0, duration: 0.6 }, '-=0.1');
  } else {
    show(0);
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
