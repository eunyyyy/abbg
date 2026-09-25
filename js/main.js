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
     Mouse-REPELLED gradient backgrounds
     Sections with a blended radial-gradient are built from N
     independent radial-gradient layers, each with its own base
     anchor point (--gxN/--gyN). Instead of the whole cluster
     being attracted toward the cursor, each layer is individually
     pushed AWAY from it — like same-pole magnets repelling — with
     the push strength falling off with distance, then eases back
     to its base position on mouseleave. `targetEl` is the element
     the custom properties are set on — a real layer div
     (.feedback__art) or the section itself for a ::before-based
     wash, since custom properties inherit down into pseudo-
     elements but can't be set on them directly.
     (.intro and .footer are both exempt — js/hero-gl.js runs the
     same WebGL simplex-noise shader on both, owning their motion
     with a time-based flow instead of cursor tracking; .intro__art
     and .footer::before are only their static no-WebGL fallbacks.)
     ========================================================= */
  function initRepelGradient(sectionEl, targetEl, blobs, radius, maxPush) {
    if (!sectionEl || !targetEl || reduceMotion) return;

    var state = blobs.map(function (b) {
      return { baseX: b[0], baseY: b[1], curX: b[0], curY: b[1], targetX: b[0], targetY: b[1] };
    });
    var rafId = null;

    function tick() {
      var moving = false;
      state.forEach(function (s, i) {
        s.curX += (s.targetX - s.curX) * 0.1;
        s.curY += (s.targetY - s.curY) * 0.1;
        targetEl.style.setProperty('--gx' + (i + 1), s.curX.toFixed(2) + '%');
        targetEl.style.setProperty('--gy' + (i + 1), s.curY.toFixed(2) + '%');
        if (Math.abs(s.targetX - s.curX) > 0.05 || Math.abs(s.targetY - s.curY) > 0.05) moving = true;
      });
      rafId = moving ? requestAnimationFrame(tick) : null;
    }
    function ensureLoop() {
      if (rafId === null) rafId = requestAnimationFrame(tick);
    }

    sectionEl.addEventListener('mousemove', function (e) {
      var rect = sectionEl.getBoundingClientRect();
      var mx = ((e.clientX - rect.left) / rect.width) * 100;
      var my = ((e.clientY - rect.top) / rect.height) * 100;
      state.forEach(function (s) {
        var dx = s.baseX - mx, dy = s.baseY - my;
        var dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        // Linear falloff within `radius`: full maxPush right under the
        // cursor, fading to 0 at the edge of the influence radius — a much
        // more directly-felt "magnet" push than 1/distance, which is nearly
        // imperceptible once the cursor is more than a few percent away.
        var falloff = Math.max(0, 1 - dist / radius);
        var push = maxPush * falloff;
        s.targetX = s.baseX + (dx / dist) * push;
        s.targetY = s.baseY + (dy / dist) * push;
      });
      ensureLoop();
    });
    sectionEl.addEventListener('mouseleave', function () {
      state.forEach(function (s) { s.targetX = s.baseX; s.targetY = s.baseY; });
      ensureLoop();
    });
  }
  initRepelGradient(document.querySelector('.feedback'), document.querySelector('.feedback__art'),
    [[90, 88], [96, 94], [80, 96], [86, 76]], 45, 20);

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

  var PROJECTS_PER_PAGE = 10;

  /* =========================================================
     Project-List section: industry + project filter dropdowns
     ========================================================= */
  function initPlistFilters() {
    var industrySel = document.getElementById('plist-industry-filter');
    var projectSel = document.getElementById('plist-project-filter');
    var searchInput = document.getElementById('plist-search');
    var plistEl = document.querySelector('.plist');
    var paginationEl = document.getElementById('plist-pagination');
    var emptyEl = document.getElementById('plist-empty');
    var currentPage = 1;
    if (!industrySel || !projectSel || !searchInput || !plistEl || !paginationEl) return;

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
      var term = searchInput.value.trim().toLowerCase();
      var rows = Array.prototype.slice.call(plistEl.querySelectorAll('.plist__row'));
      var matched = rows.filter(function (row) {
        var matchesIndustry = industry === '전체' || row.dataset.category === industry;
        var matchesProject = !projectNo || row.querySelector('.plist__no').textContent.trim() === projectNo;
        var hay = (row.dataset.name + ' ' + row.dataset.category + ' ' + row.querySelector('.plist__no').textContent).toLowerCase();
        return matchesIndustry && matchesProject && (!term || hay.indexOf(term) !== -1);
      });
      var pageCount = Math.max(1, Math.ceil(matched.length / PROJECTS_PER_PAGE));
      if (currentPage > pageCount) currentPage = pageCount;
      rows.forEach(function (row) { row.style.display = 'none'; });
      matched.slice((currentPage - 1) * PROJECTS_PER_PAGE, currentPage * PROJECTS_PER_PAGE).forEach(function (row) { row.style.display = ''; });
      if (emptyEl) emptyEl.hidden = matched.length > 0;
      paginationEl.innerHTML = matched.length > PROJECTS_PER_PAGE
        ? '<button type="button" data-page="prev"' + (currentPage === 1 ? ' disabled' : '') + '>이전</button>' +
          Array.from({ length: pageCount }, function (_, i) { var page = i + 1; return '<button type="button" data-page="' + page + '" class="' + (page === currentPage ? 'is-active' : '') + '" aria-label="' + page + '페이지">' + page + '</button>'; }).join('') +
          '<button type="button" data-page="next"' + (currentPage === pageCount ? ' disabled' : '') + '>다음</button>'
        : '';
    }

    populateIndustryOptions();
    populateProjectOptions('전체');
    applyFilter();

    industrySel.addEventListener('change', function () {
      currentPage = 1;
      populateProjectOptions(industrySel.value);
      applyFilter();
    });
    projectSel.addEventListener('change', function () { currentPage = 1; applyFilter(); });
    searchInput.addEventListener('input', function () { currentPage = 1; applyFilter(); });
    paginationEl.addEventListener('click', function (e) {
      var button = e.target.closest('[data-page]'); if (!button || button.disabled) return;
      if (button.dataset.page === 'prev') currentPage--;
      else if (button.dataset.page === 'next') currentPage++;
      else currentPage = Number(button.dataset.page);
      applyFilter();
      plistEl.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
    });

    window.__aiwebRebindPlistFilters = function () {
      populateIndustryOptions();
      industrySel.value = '전체';
      populateProjectOptions('전체');
      currentPage = 1;
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
    // Guards the brief window after a touch interaction ends: mobile
    // browsers replay a synthetic mouseover/mousemove/click ~ tens of ms
    // after touchend for compatibility, which would otherwise instantly
    // re-open the preview this same gesture just closed.
    var suppressMouseUntil = 0;

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
      if (Date.now() < suppressMouseUntil) return;
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

    // Touch: press-and-hold a row to reveal the same preview (PC hover
    // parity), tracking the finger until it lifts. elementFromPoint is used
    // because touchstart's own target is wherever the finger first landed,
    // which is reliable, but touchmove keeps reporting that same original
    // target — so the row lookup on move re-resolves from the live point.
    function rowFromPoint(x, y) {
      var el = document.elementFromPoint(x, y);
      var link = el && el.closest && el.closest('.plist__link');
      return link && link.closest('.plist__row');
    }

    plistEl.addEventListener('touchstart', function (e) {
      var touch = e.touches[0];
      if (!touch) return;
      var row = rowFromPoint(touch.clientX, touch.clientY);
      var cover = row && row.dataset.cover;
      if (!cover) return;
      if (img.src.indexOf(cover) === -1) img.src = cover;
      img.alt = (row.dataset.name || '') + ' 커버';
      preview.classList.add('is-visible');
      visible = true;
      var rect = sectionEl.getBoundingClientRect();
      targetY = touch.clientY - rect.top;
      ensureLoop();
    }, { passive: true });

    plistEl.addEventListener('touchmove', function (e) {
      if (!visible) return;
      var touch = e.touches[0];
      if (!touch) return;
      var rect = sectionEl.getBoundingClientRect();
      targetY = touch.clientY - rect.top;
      ensureLoop();
    }, { passive: true });

    function endTouch() {
      preview.classList.remove('is-visible');
      visible = false;
      suppressMouseUntil = Date.now() + 700;
    }
    plistEl.addEventListener('touchend', endTouch);
    plistEl.addEventListener('touchcancel', endTouch);
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
