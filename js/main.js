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
        url: row.querySelector('.plist__link').getAttribute('href')
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
      return '<li class="plist__row" data-category="' + escapeHtml(p.category) + '" data-name="' + escapeHtml(p.name) + '">' +
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
