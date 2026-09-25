(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     Custom cursor
     ========================================================= */
  (function cursorModule() {
    var cursor = document.getElementById('cursor');
    if (!cursor || reduceMotion) return;
    var isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if (isCoarse) return;

    document.body.classList.add('has-cursor');
    var label = cursor.querySelector('.cursor__label');
    var readyAdded = false;

    window.addEventListener('mousemove', function (e) {
      cursor.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      if (!readyAdded) {
        cursor.classList.add('is-ready');
        readyAdded = true;
      }
    }, { passive: true });

    var targets = document.querySelectorAll('[data-cursor]');
    targets.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        var type = el.getAttribute('data-cursor');
        var text = el.getAttribute('data-cursor-label') || '';
        cursor.classList.add('is-hover');
        cursor.classList.toggle('is-link', type === 'link');
        cursor.classList.toggle('is-drag', type === 'drag');
        label.textContent = text;
      });
      el.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-hover', 'is-link', 'is-drag');
        label.textContent = '';
      });
    });
  })();

  /* =========================================================
     GNB — hide on scroll down / show on scroll up + theme invert
     ========================================================= */
  (function gnbModule() {
    var gnb = document.getElementById('gnb');
    var hamburgerBtn = document.getElementById('hamburgerBtn');
    var mobileNav = document.getElementById('gnbMobile');
    if (!gnb) return;

    var lastY = window.scrollY;
    var ticking = false;

    function onScroll() {
      var y = window.scrollY;
      if (y <= 4) {
        gnb.classList.remove('is-hidden');
      } else if (y > lastY + 2) {
        gnb.classList.add('is-hidden');
      } else if (y < lastY - 2) {
        gnb.classList.remove('is-hidden');
      }
      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });

    // theme invert via IntersectionObserver on a thin band at the nav's height
    var themeEls = document.querySelectorAll('[data-theme]');
    if (themeEls.length && 'IntersectionObserver' in window) {
      var currentTheme = 'light';
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            currentTheme = entry.target.getAttribute('data-theme');
          }
        });
        gnb.classList.toggle('is-dark', currentTheme === 'dark');
      }, { rootMargin: '-40px 0px -85% 0px', threshold: 0 });
      themeEls.forEach(function (el) { io.observe(el); });
    }

    if (hamburgerBtn && mobileNav) {
      hamburgerBtn.addEventListener('click', function () {
        var willOpen = !mobileNav.classList.contains('is-open');
        mobileNav.classList.toggle('is-open', willOpen);
        hamburgerBtn.classList.toggle('is-open', willOpen);
        hamburgerBtn.setAttribute('aria-expanded', String(willOpen));
        document.body.style.overflow = willOpen ? 'hidden' : '';
      });
      mobileNav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          mobileNav.classList.remove('is-open');
          hamburgerBtn.classList.remove('is-open');
          hamburgerBtn.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        });
      });
    }
  })();

  /* =========================================================
     DIFF — scroll-pin blur/opacity reveal + independent idle float
     ========================================================= */
  (function diffModule() {
    var section = document.querySelector('.diff');
    if (!section) return;
    var descLines = section.querySelectorAll('.diff__desc-line');
    var imgs = section.querySelectorAll('.diff__img');

    var floating = [];
    var t = 0;

    function addFloat(el, i) {
      floating.push({ el: el, phase: i * 1.3, amp: 8 + (i % 3) * 4, speed: .6 + (i % 4) * .12 });
    }

    function tickFloat() {
      t += 0.016;
      floating.forEach(function (f) {
        var y = Math.sin(t * f.speed + f.phase) * f.amp;
        f.el.style.transform = 'translateY(' + y.toFixed(2) + 'px)';
      });
      requestAnimationFrame(tickFloat);
    }
    if (!reduceMotion) requestAnimationFrame(tickFloat);

    function update() {
      var rect = section.getBoundingClientRect();
      var scrollable = rect.height - window.innerHeight;
      var progress = scrollable > 0 ? (-rect.top) / scrollable : 0;
      progress = Math.max(0, Math.min(1, progress));

      descLines.forEach(function (line, i) {
        var threshold = 0.08 + i * 0.1;
        if (progress > threshold) line.classList.add('is-visible');
      });

      imgs.forEach(function (img, i) {
        var threshold = 0.05 + i * 0.09;
        if (progress > threshold && !img.classList.contains('is-visible')) {
          img.classList.add('is-visible');
          addFloat(img, i);
        }
      });
    }

    var scheduled = false;
    window.addEventListener('scroll', function () {
      if (!scheduled) {
        requestAnimationFrame(function () { update(); scheduled = false; });
        scheduled = true;
      }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* =========================================================
     NUMBERS — count-up on first view
     ========================================================= */
  (function numbersModule() {
    var rows = document.querySelectorAll('.numbers__row');
    if (!rows.length || !('IntersectionObserver' in window)) return;

    function animateRow(row) {
      var target = parseFloat(row.getAttribute('data-target'));
      var decimals = parseInt(row.getAttribute('data-decimals'), 10) || 0;
      var numEl = row.querySelector('.numbers__num');
      var duration = 1400;
      var start = null;

      function step(ts) {
        if (!start) start = ts;
        var p = Math.min(1, (ts - start) / duration);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = target * eased;
        numEl.textContent = decimals ? val.toFixed(decimals) : Math.round(val);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateRow(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    rows.forEach(function (row) { io.observe(row); });
  })();

  /* =========================================================
     FORMULA — scroll-pin crossfade categories (no click nav)
     ========================================================= */
  (function formulaModule() {
    var scene = document.querySelector('.formula-scene');
    if (!scene) return;

    var categories = [
      { en: 'SPRAYABLE HYDROGEL', kr: '스프레이 하이드로겔', desc: '초미세 입자화 및 분사 최적화 시스템을 이용한 스프레이 형태 하이드로겔 처방 기술. 미세 분사와 피부 밀착형 텍스처를 구현합니다.' },
      { en: 'CICA DERMA COMPLEX', kr: '시카 더마 컴플렉스', desc: '민감성 피부를 위한 시카 유래 성분 기반의 저자극 진정 복합 처방 기술. 자극 완화와 장벽 강화를 동시에 설계합니다.' },
      { en: 'MULTI-LAYER AMPOULE', kr: '멀티 레이어 앰플', desc: '유효 성분의 안정성과 흡수율을 높이는 다층 구조 앰플 처방 기술. 층별로 다른 활성 성분을 안정적으로 담아냅니다.' },
      { en: 'BIOFERMENT ESSENCE', kr: '바이오 발효 에센스', desc: '자체 발효 공정을 통해 저분자화한 활성 성분 기반의 에센스 처방 기술. 흡수력과 지속력을 동시에 높입니다.' },
      { en: 'LOW-PH BARRIER GEL', kr: '저자극 배리어 젤', desc: '피부 본연의 pH에 가까운 저자극 젤 처방 기술. 장벽 손상을 최소화하며 산뜻한 사용감을 구현합니다.' },
      { en: 'COLD-PROCESS CREAM', kr: '저온 공정 크림', desc: '저온 유화 공정으로 열에 민감한 활성 성분의 손실을 줄인 크림 처방 기술. 밀도 높은 보습막을 형성합니다.' }
    ];

    var icons = scene.querySelectorAll('.formula__icon');
    var bgs = scene.querySelectorAll('.formula__bg');
    var labelEn = scene.querySelector('.formula__label-en');
    var labelKr = scene.querySelector('.formula__label-kr');
    var descEl = scene.querySelector('#formulaDesc');
    var pgActive = scene.querySelector('#pgActive');

    var currentIndex = -1;

    function setIndex(i) {
      if (i === currentIndex) return;
      currentIndex = i;
      icons.forEach(function (icon, idx) { icon.classList.toggle('is-active', idx === i); });
      bgs.forEach(function (bg, idx) { bg.classList.toggle('is-active', idx === i); });
      var cat = categories[i];
      labelEn.textContent = cat.en;
      labelKr.textContent = cat.kr;
      descEl.textContent = cat.desc;
      pgActive.textContent = String(i + 1).padStart(2, '0');
    }

    function update() {
      var rect = scene.getBoundingClientRect();
      var scrollable = rect.height - window.innerHeight;
      var progress = scrollable > 0 ? (-rect.top) / scrollable : 0;
      progress = Math.max(0, Math.min(0.999, progress));
      var idx = Math.floor(progress * categories.length);
      idx = Math.max(0, Math.min(categories.length - 1, idx));
      setIndex(idx);
    }

    var scheduled = false;
    window.addEventListener('scroll', function () {
      if (!scheduled) {
        requestAnimationFrame(function () { update(); scheduled = false; });
        scheduled = true;
      }
    }, { passive: true });
    window.addEventListener('resize', update);
    setIndex(0);
    update();
  })();

  /* =========================================================
     ODM — scroll-driven horizontal panel translate (no arrows)
     ========================================================= */
  (function odmModule() {
    var scene = document.querySelector('.odm-scene');
    var stage = document.querySelector('.odm');
    var panels = document.getElementById('odmPanels');
    if (!scene || !panels || !stage) return;

    function maxScroll() {
      return Math.max(0, panels.scrollWidth - stage.clientWidth);
    }

    function update() {
      var rect = scene.getBoundingClientRect();
      var scrollable = rect.height - window.innerHeight;
      var progress = scrollable > 0 ? (-rect.top) / scrollable : 0;
      progress = Math.max(0, Math.min(1, progress));
      var tx = -progress * maxScroll();
      panels.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,0,0)';
    }

    var scheduled = false;
    window.addEventListener('scroll', function () {
      if (!scheduled) {
        requestAnimationFrame(function () { update(); scheduled = false; });
        scheduled = true;
      }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* =========================================================
     MAGAZINE — native drag-to-scroll (mouse) + native touch scroll
     ========================================================= */
  (function magazineModule() {
    var track = document.getElementById('magazineTrack');
    if (!track) return;

    track.addEventListener('dragstart', function (e) { e.preventDefault(); });
    track.querySelectorAll('img, a').forEach(function (el) {
      el.setAttribute('draggable', 'false');
    });

    var isDown = false;
    var startX = 0;
    var startScroll = 0;
    var moved = false;

    track.addEventListener('mousedown', function (e) {
      isDown = true;
      moved = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
    });
    window.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      track.scrollLeft = startScroll - dx;
    });
    window.addEventListener('mouseup', function () {
      isDown = false;
      track.classList.remove('is-dragging');
    });
    // prevent accidental click-through right after a drag
    track.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  })();

  /* =========================================================
     Back to top
     ========================================================= */
  (function backToTopModule() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('is-visible', window.scrollY > 700);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  })();

})();
