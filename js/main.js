// AI WEB portfolio hub — site interactions (nav, reveal, marquee, parallax, picker UI)
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- GNB scroll state + mobile drawer ---------- */
  var gnb = document.querySelector('.gnb');
  var burger = document.querySelector('.gnb__burger');
  var mobileNav = document.querySelector('.gnb-mobile');

  function onScroll() {
    if (!gnb) return;
    gnb.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      var open = burger.classList.toggle('is-open');
      mobileNav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        burger.classList.remove('is-open');
        mobileNav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- smooth anchor scroll (instant if reduced-motion) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
    });
  });

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach(function (el) { io.observe(el); });
    // rAF fallback sweep in case IO never fires for an already-in-view element
    requestAnimationFrame(function sweep() {
      revealEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-visible');
      });
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- marquee: hover-pause + reduced motion ---------- */
  var marquee = document.querySelector('.marquee');
  var track = document.querySelector('.marquee__track');
  if (marquee && track) {
    if (reduceMotion) {
      track.classList.add('no-motion');
      marquee.classList.add('no-motion');
    } else {
      marquee.addEventListener('mouseenter', function () { track.classList.add('is-paused'); });
      marquee.addEventListener('mouseleave', function () { track.classList.remove('is-paused'); });
      marquee.addEventListener('focusin', function () { track.classList.add('is-paused'); });
      marquee.addEventListener('focusout', function () { track.classList.remove('is-paused'); });
    }
  }

  /* ---------- collage parallax (mouse-follow, rest state = no offset) ---------- */
  var stage = document.querySelector('.collage__stage');
  if (stage && !reduceMotion) {
    var photos = stage.querySelectorAll('.collage__photo');
    var rafId = null;
    var pointerX = 0, pointerY = 0;
    stage.addEventListener('mousemove', function (e) {
      var rect = stage.getBoundingClientRect();
      pointerX = (e.clientX - rect.left) / rect.width - 0.5;
      pointerY = (e.clientY - rect.top) / rect.height - 0.5;
      if (rafId) return;
      rafId = requestAnimationFrame(function () {
        photos.forEach(function (p, i) {
          var depth = (i % 3 + 1) * 8;
          var baseRotate = getComputedStyle(p).getPropertyValue('--base-rotate') || '0deg';
          p.style.transform = 'translate(' + (pointerX * depth) + 'px,' + (pointerY * depth) + 'px)';
        });
        rafId = null;
      });
    });
    stage.addEventListener('mouseleave', function () {
      photos.forEach(function (p) { p.style.transform = 'translate(0,0)'; });
    });
  }

  /* ---------- feedback: project picker (buttons + mobile select stay in sync) ---------- */
  var hiddenNo = document.getElementById('fb-project-no');
  var hiddenName = document.getElementById('fb-project-name');
  var hiddenCategory = document.getElementById('fb-project-category');
  var selectedLabel = document.getElementById('fb-selected-label');

  function selectProject(no, name, category) {
    document.querySelectorAll('.picker__btn').forEach(function (b) { b.classList.toggle('is-active', b.dataset.no === no); });
    var pickerSelect = document.querySelector('.picker-select');
    if (pickerSelect) pickerSelect.value = no;
    if (hiddenNo) hiddenNo.value = no;
    if (hiddenName) hiddenName.value = name;
    if (hiddenCategory) hiddenCategory.value = category;
    if (selectedLabel) selectedLabel.textContent = no + ' · ' + name;
  }

  // Re-run after every render (initial static markup, and again if/when the
  // project list is swapped in from Firestore) so click/change handlers are
  // always bound to whatever picker elements currently exist in the DOM.
  function bindPicker() {
    var pickerBtns = document.querySelectorAll('.picker__btn');
    var pickerSelect = document.querySelector('.picker-select');

    pickerBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectProject(btn.dataset.no, btn.dataset.name, btn.dataset.category);
      });
    });
    if (pickerSelect) {
      pickerSelect.addEventListener('change', function () {
        var opt = pickerSelect.options[pickerSelect.selectedIndex];
        selectProject(opt.value, opt.dataset.name, opt.dataset.category);
      });
    }
    // default to the first project selected
    if (pickerBtns.length) selectProject(pickerBtns[0].dataset.no, pickerBtns[0].dataset.name, pickerBtns[0].dataset.category);
  }
  bindPicker();
  window.__aiwebBindPicker = bindPicker; // exposed for the project-sync block below

  /* ---------- project list: render from data + Firestore-with-fallback sync ----------
     The page ships with the 16 projects baked into static HTML (marquee track,
     project list, feedback picker) so it renders correctly with zero JS and
     with Firestore unreachable/unconfigured. Once a real Firebase project is
     wired up (js/firebase-config.js), this swaps all three in for live data
     from the `projects` collection — see FIREBASE_SETUP.md / admin/ Project tab.
     Any failure here is caught and silently ignored, leaving the proven-good
     static markup exactly as shipped. */
  (function () {
    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function marqueeCardHtml(p) {
      var img = p.cover
        ? '<img src="' + escapeHtml(p.cover) + '" alt="' + escapeHtml(p.name) + ' 커버" loading="lazy" width="480" height="270">'
        : '';
      return '<a class="marquee__card" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener" aria-label="' + escapeHtml(p.name) + ' 라이브 페이지로 이동">' +
        img +
        '<span class="marquee__meta"><span class="marquee__no">' + escapeHtml(p.number) + '</span><span class="marquee__name">' + escapeHtml(p.name) + '</span></span>' +
        '</a>';
    }
    function plistRowHtml(p) {
      return '<li class="plist__row"><a class="plist__link" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener">' +
        '<span class="plist__no">' + escapeHtml(p.number) + '</span>' +
        '<span class="plist__name">' + escapeHtml(p.name) + '</span>' +
        '<span class="plist__cat">' + escapeHtml(p.category) + '</span>' +
        '<span class="plist__arrow" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 19L19 5M19 5H8M19 5V16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
        '</a></li>';
    }
    function pickerBtnHtml(p) {
      return '<button type="button" class="picker__btn" data-no="' + escapeHtml(p.number) + '" data-name="' + escapeHtml(p.name) + '" data-category="' + escapeHtml(p.category) + '">' +
        '<span class="picker__no">' + escapeHtml(p.number) + '</span><span class="picker__name">' + escapeHtml(p.name) + '</span>' +
        '</button>';
    }
    function pickerOptionHtml(p) {
      return '<option value="' + escapeHtml(p.number) + '" data-name="' + escapeHtml(p.name) + '" data-category="' + escapeHtml(p.category) + '">' + escapeHtml(p.number) + ' · ' + escapeHtml(p.name) + '</option>';
    }

    function renderProjectsUI(list) {
      if (!list || !list.length) return;
      var track = document.querySelector('.marquee__track');
      var plistEl = document.querySelector('.plist');
      var pickerEl = document.querySelector('.picker');
      var pickerSelectEl = document.querySelector('.picker-select');
      if (!track || !plistEl || !pickerEl || !pickerSelectEl) return;

      var cardsHtml = list.map(marqueeCardHtml).join('');
      track.innerHTML = cardsHtml + cardsHtml; // duplicated for the seamless -50% loop
      plistEl.innerHTML = list.map(plistRowHtml).join('');
      pickerEl.innerHTML = list.map(pickerBtnHtml).join('');
      pickerSelectEl.innerHTML = list.map(pickerOptionHtml).join('');

      if (typeof window.__aiwebBindPicker === 'function') window.__aiwebBindPicker();
    }

    (async function syncProjectsFromFirestore() {
      try {
        var cfgMod = await import('./firebase-config.js');
        if (!cfgMod.isFirebaseConfigured()) return; // stay on static/fallback markup

        var appMod = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js');
        var fsMod = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js');

        var app = appMod.initializeApp(cfgMod.firebaseConfig);
        var db = fsMod.getFirestore(app);
        var projectsCol = fsMod.collection(db, 'projects');
        var q = fsMod.query(projectsCol, fsMod.orderBy('number', 'asc'));

        // Live subscription (not a one-time fetch): whenever the admin
        // dashboard adds/edits/deletes a project, every open copy of this
        // page re-renders the marquee/plist/picker automatically, with no
        // reload needed. If the very first snapshot is empty (Firestore not
        // seeded yet), the static/fallback markup already in the page stays
        // put — renderProjectsUI() only touches the DOM when list.length > 0.
        fsMod.onSnapshot(q, function (snap) {
          var list = [];
          snap.forEach(function (doc) { list.push(doc.data()); });
          if (list.length) renderProjectsUI(list);
        }, function (err) {
          console.error('project list onSnapshot error, keeping fallback UI', err);
        });
      } catch (err) {
        console.error('project list sync error, keeping fallback UI', err);
        // no-op: the static/fallback markup already shipped with the page stays visible
      }
    })();
  })();
})();
