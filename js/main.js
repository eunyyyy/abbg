// AI WEB portfolio hub — site interactions (nav, reveal, project filters, feedback picker)
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fixed 10-category taxonomy (per Figma annotation on the industry filter) —
  // always shown in full even for categories with zero projects registered yet.
  var INDUSTRIES = ['전체', 'IT·마케팅', '라이프스타일', '교육·미디어', '바이오·헬스케어', '테크·제조', '모빌리티', 'F&B', '농축수산업', '물류·유통'];

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

  /* =========================================================
     Hero background: card corridor
     Two mirrored rails of project-cover cards ride from the
     centre of the hero out toward the viewer's left/right, using
     a perspective projection so apparent size and lateral offset
     grow together. Ported (vanilla JS/CSS, no React/Tailwind —
     this site has neither) from a reference component; the path
     geometry below is copied as-is since it was numerically fitted
     against a reference recording, not eyeballed.
     ========================================================= */
  function initIntroStream() {
    var root = document.getElementById('intro-stream');
    if (!root) return;

    var PATH = {
      perspective: 30,
      cardWidth: 18,
      cardHeight: 25,
      cardRadius: 0.6,
      birthHeight: 2.6,
      exitHeight: 46,
      railBirth: -11,
      railExit: 44,
      fan: 3.3,
      turnBirth: 6,
      turnExit: 28,
      stops: 24
    };
    var CARDS_PER_RAIL = 8;
    var SPEED_SECONDS = 22;
    var AXIS_PERCENT = 42; // vertical placement of the vanishing point, % of .intro__stream's own height
    var COVERS = [
      'nexforge', 'aerium', 'mobilion', 'velocore', 'obliq', 'osmere', 'auberon', 'vestia',
      'kadence', 'weft', 'emberic', 'nom-burger-wings', 'halcyon', 'agrinova', 'verahyde', 'cognova'
    ];

    function keyframes(dir, name) {
      var steps = [];
      for (var s = 0; s <= PATH.stops; s++) {
        var u = s / PATH.stops;
        // Geometric in apparent size, so consecutive cards keep a constant
        // size ratio and the ribbon stays solid from birth to exit.
        var scale = (PATH.birthHeight / PATH.cardHeight) * Math.pow(PATH.exitHeight / PATH.birthHeight, u);
        var z = PATH.perspective * (1 - 1 / scale);
        var rail = PATH.railExit - (PATH.railExit - PATH.railBirth) * Math.pow(1 - u, PATH.fan);
        var turn = PATH.turnBirth + (PATH.turnExit - PATH.turnBirth) * u;
        steps.push(
          (u * 100).toFixed(2) + '%{transform:translate3d(' +
          (dir * rail).toFixed(2) + 'cqw,0,' + z.toFixed(2) + 'cqw) rotateY(' +
          (-dir * turn).toFixed(2) + 'deg)}'
        );
      }
      return '@keyframes ' + name + '{' + steps.join('') + '}';
    }

    var uid = 'is' + Math.random().toString(36).slice(2, 8);
    var rightName = 'introstream-r-' + uid;
    var leftName = 'introstream-l-' + uid;
    var cardClass = 'introstream-card-' + uid;

    var styleEl = document.createElement('style');
    styleEl.textContent =
      keyframes(1, rightName) + keyframes(-1, leftName) +
      // !important is required here: each card also carries an inline
      // `style.animation` shorthand (set below), and inline styles beat a
      // plain external rule regardless of DOM order or selector specificity.
      '@media(prefers-reduced-motion:reduce){.' + cardClass + '{animation-play-state:paused !important}}';
    document.head.appendChild(styleEl);

    root.style.perspective = PATH.perspective + 'cqw';
    root.style.perspectiveOrigin = '50% ' + AXIS_PERCENT + '%';

    var scene = document.createElement('div');
    scene.className = 'intro__stream-scene';
    var rail = document.createElement('div');
    rail.className = 'intro__stream-rail';
    scene.appendChild(rail);
    root.appendChild(scene);

    [rightName, leftName].forEach(function (name) {
      for (var i = 0; i < CARDS_PER_RAIL; i++) {
        var slug = COVERS[i % COVERS.length];
        var el = document.createElement('div');
        el.className = 'intro__stream-card ' + cardClass;
        el.style.left = '50%';
        el.style.top = AXIS_PERCENT + '%';
        el.style.width = PATH.cardWidth + 'cqw';
        el.style.height = PATH.cardHeight + 'cqw';
        el.style.marginLeft = (-PATH.cardWidth / 2) + 'cqw';
        el.style.marginTop = (-PATH.cardHeight / 2) + 'cqw';
        el.style.borderRadius = PATH.cardRadius + 'cqw';
        el.style.animation = name + ' ' + SPEED_SECONDS + 's linear infinite';
        // Negative delay drops each card mid-flight so the corridor is
        // already full on the first frame, instead of birthing empty.
        el.style.animationDelay = (-(i * SPEED_SECONDS) / CARDS_PER_RAIL) + 's';

        var img = document.createElement('img');
        img.src = 'img/covers/' + slug + '.jpg';
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.draggable = false;
        el.appendChild(img);

        rail.appendChild(el);
      }
    });
  }
  initIntroStream();

  /* =========================================================
     Hero background: cursor-reactive gradient
     .intro__art's blended radial-gradient cluster (6 brand colors,
     defined in css/style.css) shares one moving centre point via
     --gx/--gy. This smoothly lerps that centre toward the mouse
     position while it's over the hero, and eases it back to the
     default centre on mouseleave — the rAF loop only runs while
     actively interpolating, not continuously at rest.
     ========================================================= */
  function initIntroGradient() {
    var section = document.querySelector('.intro');
    var art = document.querySelector('.intro__art');
    if (!section || !art || reduceMotion) return;

    var DEFAULT_X = 50, DEFAULT_Y = 42;
    var targetX = DEFAULT_X, targetY = DEFAULT_Y;
    var currentX = DEFAULT_X, currentY = DEFAULT_Y;
    var rafId = null;

    function tick() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      art.style.setProperty('--gx', currentX.toFixed(2) + '%');
      art.style.setProperty('--gy', currentY.toFixed(2) + '%');
      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    }
    function ensureLoop() {
      if (rafId === null) rafId = requestAnimationFrame(tick);
    }

    section.addEventListener('mousemove', function (e) {
      var rect = section.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      // clamp so the gradient cluster never slides fully off the section
      targetX = Math.max(20, Math.min(80, x));
      targetY = Math.max(15, Math.min(75, y));
      ensureLoop();
    });
    section.addEventListener('mouseleave', function () {
      targetX = DEFAULT_X;
      targetY = DEFAULT_Y;
      ensureLoop();
    });
  }
  initIntroGradient();

  /* =========================================================
     Shared project data — read from the static DOM at boot,
     replaced wholesale if/when Firestore sync succeeds (see
     bottom of file). Every filter/picker below reads from this
     single array so the project-list filter, the feedback
     picker, and any future consumer never drift out of sync.
     ========================================================= */
  var currentProjects = [];
  function readProjectsFromDom() {
    return Array.prototype.map.call(document.querySelectorAll('.plist__row'), function (row) {
      return {
        number: row.querySelector('.plist__no').textContent.trim(),
        name: row.dataset.name || row.querySelector('.plist__name').textContent.trim(),
        category: row.dataset.category || row.querySelector('.plist__cat').textContent.trim(),
        url: row.querySelector('.plist__link').getAttribute('href'),
        cover: row.dataset.cover || ''
      };
    });
  }

  function projectsForIndustry(list, industry) {
    if (!industry || industry === '전체') return list;
    return list.filter(function (p) { return p.category === industry; });
  }

  /* =========================================================
     Project-List section: industry + project filter dropdowns
     ========================================================= */
  function initPlistFilters() {
    var industrySel = document.getElementById('plist-industry-filter');
    var projectSel = document.getElementById('plist-project-filter');
    var plistEl = document.querySelector('.plist');
    if (!industrySel || !projectSel || !plistEl) return;

    function populateIndustryOptions() {
      industrySel.innerHTML = INDUSTRIES.map(function (name) {
        return '<option value="' + name + '">' + name + '</option>';
      }).join('');
    }

    function populateProjectOptions(industry) {
      var scoped = projectsForIndustry(currentProjects, industry);
      if (!scoped.length) {
        projectSel.innerHTML = '<option value="">등록 프로젝트 없음</option>';
        projectSel.disabled = true;
        return;
      }
      projectSel.disabled = false;
      projectSel.innerHTML =
        '<option value="">전체 프로젝트</option>' +
        scoped.map(function (p) { return '<option value="' + p.number + '">' + p.name + '</option>'; }).join('');
    }

    function applyFilter() {
      var industry = industrySel.value;
      var projectNo = projectSel.value;
      var rows = plistEl.querySelectorAll('.plist__row');
      rows.forEach(function (row) {
        var matchesIndustry = industry === '전체' || row.dataset.category === industry;
        var matchesProject = !projectNo || row.querySelector('.plist__no').textContent.trim() === projectNo;
        row.style.display = matchesIndustry && matchesProject ? '' : 'none';
      });
    }

    populateIndustryOptions();
    populateProjectOptions('전체');
    applyFilter();

    industrySel.addEventListener('change', function () {
      populateProjectOptions(industrySel.value);
      applyFilter();
    });
    projectSel.addEventListener('change', applyFilter);

    window.__aiwebRebindPlistFilters = function () {
      populateIndustryOptions();
      industrySel.value = '전체';
      populateProjectOptions('전체');
      applyFilter();
    };
  }

  /* =========================================================
     Feedback section: cascading industry → project picker
     (industry dropdown includes 전체; the project dropdown here
     always resolves to one concrete, submittable project — no
     "전체 프로젝트" placeholder, unlike the Project-List filter)
     ========================================================= */
  var hiddenNo = document.getElementById('fb-project-no');
  var hiddenName = document.getElementById('fb-project-name');
  var hiddenCategory = document.getElementById('fb-project-category');
  var selectedLabel = document.getElementById('fb-selected-label');

  function initFeedbackPicker() {
    var industrySel = document.getElementById('fb-industry-select');
    var projectSel = document.getElementById('fb-project-select');
    if (!industrySel || !projectSel) return;

    function commitSelection(p) {
      if (!p) {
        if (hiddenNo) hiddenNo.value = '';
        if (hiddenName) hiddenName.value = '';
        if (hiddenCategory) hiddenCategory.value = '';
        if (selectedLabel) selectedLabel.textContent = '선택 가능한 프로젝트가 없습니다';
        return;
      }
      if (hiddenNo) hiddenNo.value = p.number;
      if (hiddenName) hiddenName.value = p.name;
      if (hiddenCategory) hiddenCategory.value = p.category;
      if (selectedLabel) selectedLabel.textContent = p.name + ' 선택됨';
    }

    function populateIndustryOptions() {
      industrySel.innerHTML = INDUSTRIES.map(function (name) {
        return '<option value="' + name + '">' + name + '</option>';
      }).join('');
    }

    function populateProjectOptions(industry, preferredNo) {
      var scoped = projectsForIndustry(currentProjects, industry);
      if (!scoped.length) {
        projectSel.innerHTML = '<option value="">등록 프로젝트 없음</option>';
        projectSel.disabled = true;
        commitSelection(null);
        return;
      }
      projectSel.disabled = false;
      projectSel.innerHTML = scoped.map(function (p) {
        return '<option value="' + p.number + '">' + p.name + '</option>';
      }).join('');
      var pick = scoped.find(function (p) { return p.number === preferredNo; }) || scoped[0];
      projectSel.value = pick.number;
      commitSelection(pick);
    }

    populateIndustryOptions();
    industrySel.value = '전체';
    populateProjectOptions('전체', currentProjects[0] && currentProjects[0].number);

    industrySel.addEventListener('change', function () {
      populateProjectOptions(industrySel.value);
    });
    projectSel.addEventListener('change', function () {
      var scoped = projectsForIndustry(currentProjects, industrySel.value);
      var picked = scoped.find(function (p) { return p.number === projectSel.value; });
      commitSelection(picked);
    });

    window.__aiwebRebindFeedbackPicker = function () {
      populateIndustryOptions();
      industrySel.value = '전체';
      populateProjectOptions('전체', currentProjects[0] && currentProjects[0].number);
    };
  }

  /* =========================================================
     Project list: cursor-following cover preview on row hover
     Event delegation on the .plist container (not per-row
     listeners) so this keeps working after Firestore swaps the
     rows' innerHTML — the container itself never gets replaced.
     ========================================================= */
  function initPlistPreview() {
    var plistEl = document.querySelector('.plist');
    // Anchored to .plist-section (a stable ancestor), not .plist itself —
    // .plist's innerHTML gets replaced wholesale whenever the Firestore
    // live-sync re-renders rows, which would silently delete this element
    // if it were a child of .plist.
    var sectionEl = document.querySelector('.plist-section');
    if (!plistEl || !sectionEl) return;

    var preview = document.createElement('div');
    preview.className = 'plist__preview';
    var img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    preview.appendChild(img);
    sectionEl.appendChild(preview);

    var targetY = 0, currentY = 0, rafId = null, visible = false;

    function tick() {
      currentY += (targetY - currentY) * (reduceMotion ? 1 : 0.25);
      preview.style.top = currentY + 'px';
      if (!reduceMotion && Math.abs(targetY - currentY) > 0.5) {
        rafId = requestAnimationFrame(tick);
      } else {
        preview.style.top = targetY + 'px';
        rafId = null;
      }
    }
    function ensureLoop() {
      if (rafId === null) rafId = requestAnimationFrame(tick);
    }

    plistEl.addEventListener('mouseover', function (e) {
      var link = e.target.closest('.plist__link');
      var row = link && link.closest('.plist__row');
      var cover = row && row.dataset.cover;
      if (!cover) {
        preview.classList.remove('is-visible');
        visible = false;
        return;
      }
      if (img.src.indexOf(cover) === -1) img.src = cover;
      img.alt = (row.dataset.name || '') + ' 커버';
      preview.classList.add('is-visible');
      visible = true;
    });

    plistEl.addEventListener('mousemove', function (e) {
      if (!visible) return;
      var rect = sectionEl.getBoundingClientRect();
      targetY = e.clientY - rect.top;
      ensureLoop();
    });

    plistEl.addEventListener('mouseleave', function () {
      preview.classList.remove('is-visible');
      visible = false;
    });
  }
  initPlistPreview();

  /* =========================================================
     Boot: read the static markup first (works instantly, zero
     JS-dependency for first paint), wire up both filter UIs,
     then attempt a live Firestore subscription that — if it
     succeeds — re-renders the plist and re-runs both UIs against
     fresh data. Any Firestore failure leaves everything exactly
     as it rendered from static HTML.
     ========================================================= */
  currentProjects = readProjectsFromDom();
  initPlistFilters();
  initFeedbackPicker();

  (function () {
    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function plistRowHtml(p) {
      return '<li class="plist__row" data-category="' + escapeHtml(p.category) + '" data-name="' + escapeHtml(p.name) + '" data-cover="' + escapeHtml(p.cover || '') + '">' +
        '<a class="plist__link" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener">' +
        '<span class="plist__no">' + escapeHtml(p.number) + '</span>' +
        '<span class="plist__name">' + escapeHtml(p.name) + '</span>' +
        '<span class="plist__cat">' + escapeHtml(p.category) + '</span>' +
        '<span class="plist__arrow" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 19L19 5M19 5H8M19 5V16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
        '</a></li>';
    }

    function renderProjectsUI(list) {
      if (!list || !list.length) return;
      var plistEl = document.querySelector('.plist');
      if (!plistEl) return;

      currentProjects = list;
      plistEl.innerHTML = list.map(plistRowHtml).join('');

      if (typeof window.__aiwebRebindPlistFilters === 'function') window.__aiwebRebindPlistFilters();
      if (typeof window.__aiwebRebindFeedbackPicker === 'function') window.__aiwebRebindFeedbackPicker();
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
        // page re-renders the list + both filter UIs automatically, with
        // no reload needed. If the very first snapshot is empty (Firestore
        // not seeded yet), the static/fallback markup already in the page
        // stays put — renderProjectsUI() only touches the DOM when
        // list.length > 0.
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
