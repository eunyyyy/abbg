// AI WEB admin — dashboard (feedback + project management)
// Loaded as <script type="module" src="admin/js/admin-dashboard.js"> from admin/dashboard.html

import { firebaseConfig, isFirebaseConfigured } from '../../js/firebase-config.js';
import { PROJECTS_FALLBACK } from '../../js/projects-data.js';

const gateMsgEl = document.getElementById('admin-gate-msg');
const gateNoticeEl = document.getElementById('admin-notice');
const gateLoadingEl = document.getElementById('admin-gate-loading');
const shellEl = document.getElementById('admin-shell');
const userEmailEl = document.getElementById('admin-user-email');
const logoutBtn = document.getElementById('admin-logout-btn');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function formatDate(ts) {
  try {
    var d = ts && typeof ts.toDate === 'function' ? ts.toDate() : new Date();
    var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    var hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
    return y + '.' + m + '.' + day + ' ' + hh + ':' + mm;
  } catch (e) { return ''; }
}

/* ---------- tabs ---------- */
function initTabs() {
  var tabs = [
    { btn: document.getElementById('tab-btn-feedback'), panel: document.getElementById('tab-panel-feedback') },
    { btn: document.getElementById('tab-btn-projects'), panel: document.getElementById('tab-panel-projects') }
  ];
  tabs.forEach(function (t) {
    t.btn.addEventListener('click', function () {
      tabs.forEach(function (o) {
        o.btn.classList.toggle('is-active', o === t);
        o.btn.setAttribute('aria-selected', String(o === t));
        o.panel.classList.toggle('is-active', o === t);
      });
    });
  });
}

async function init() {
  if (!isFirebaseConfigured()) {
    if (gateNoticeEl) gateNoticeEl.style.display = 'block';
    if (gateLoadingEl) gateLoadingEl.style.display = 'none';
    return;
  }

  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js');
    const { getAuth, onAuthStateChanged, signOut } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js');
    const {
      getFirestore, collection, doc, setDoc, updateDoc, deleteDoc,
      onSnapshot, query, orderBy, serverTimestamp
    } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js');

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    onAuthStateChanged(auth, function (user) {
      if (!user) {
        window.location.replace('index.html');
        return;
      }
      if (gateMsgEl) gateMsgEl.style.display = 'none';
      if (shellEl) shellEl.classList.add('is-ready');
      if (userEmailEl) userEmailEl.textContent = user.email || '';
      boot({ db, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp });
    });

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function () {
        try { await signOut(auth); } catch (err) { console.error('logout error', err); }
        window.location.replace('index.html');
      });
    }
  } catch (err) {
    console.error('firebase init error (admin dashboard)', err);
    if (gateNoticeEl) gateNoticeEl.style.display = 'block';
    if (gateLoadingEl) gateLoadingEl.style.display = 'none';
  }
}

/* ---------- boot: called once we know a real admin is signed in ---------- */
function boot(fs) {
  initTabs();
  initFeedbackTab(fs);
  initProjectsTab(fs);
}

/* ==================== FEEDBACK TAB ==================== */
var STATUS_LABEL = { pending: '반영 대기', in_progress: '진행중', done: '반영 완료' };
var PROJECT_DOWNLOAD_RELEASE = 'https://github.com/eunyyyy/abbg/releases/download/project-downloads/';

function displayProjectName(projectNumber, projectName) {
  return projectNumber === '07' ? 'AUBERON' : projectName;
}

function projectArchiveUrl(projectNumber, projectName) {
  var slug = String(projectName || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project';
  return PROJECT_DOWNLOAD_RELEASE + 'project-' + encodeURIComponent(projectNumber) + '-' + slug + '.zip';
}

function initFeedbackTab(fs) {
  var listEl = document.getElementById('fb-admin-list');
  var searchEl = document.getElementById('fb-search');
  var projectFilterEl = document.getElementById('fb-project-filter');
  var allDocs = []; // [{ id, ...data }]

  function statusSelectHtml(d) {
    var current = STATUS_LABEL[d.status] ? d.status : 'pending';
    return '<select class="admin-status-select" data-action="set-status" data-id="' + d.id + '">' +
      Object.keys(STATUS_LABEL).map(function (key) {
        return '<option value="' + key + '"' + (key === current ? ' selected' : '') + '>' + STATUS_LABEL[key] + '</option>';
      }).join('') +
      '</select>';
  }

  function render() {
    // Preserve any reply text the admin is mid-typing (not yet saved) across
    // re-renders — onSnapshot can fire for unrelated reasons (another row's
    // status changed, a new feedback came in) while a draft is in progress.
    var drafts = {};
    listEl.querySelectorAll('.admin-reply-box__input').forEach(function (ta) {
      if (document.activeElement === ta) drafts[ta.dataset.id] = ta.value;
    });

    var term = (searchEl.value || '').trim().toLowerCase();
    var projectNo = projectFilterEl.value;

    var filtered = allDocs.filter(function (d) {
      if (projectNo && d.projectNumber !== projectNo) return false;
      if (term) {
        var hay = ((d.comment || '') + ' ' + (d.author || '')).toLowerCase();
        if (hay.indexOf(term) === -1) return false;
      }
      return true;
    });

    if (!filtered.length) {
      listEl.innerHTML = '<p class="admin-empty">표시할 피드백이 없습니다.</p>';
      return;
    }

    listEl.innerHTML = filtered.map(function (d) {
      var author = d.author ? escapeHtml(d.author) : '익명';
      var replyVal = d.reply ? escapeHtml(d.reply) : '';
      var downloadHtml = d.status === 'done'
        ? '<a class="admin-project-download" href="' + projectArchiveUrl(d.projectNumber || '', d.projectName || '') + '" download>' +
            '<span aria-hidden="true">&#8595;</span> 프로젝트 ZIP 다운로드' +
          '</a>'
        : '<p class="admin-project-download-note">반영 완료로 변경하면 프로젝트 ZIP 다운로드가 활성화됩니다.</p>';
      return (
        '<div class="admin-fb-row" data-id="' + d.id + '">' +
          '<div>' +
            '<div class="admin-fb-row__meta">' +
              '<span class="admin-fb-row__project">' + escapeHtml(d.projectNumber || '') + ' · ' + escapeHtml(displayProjectName(d.projectNumber, d.projectName || '')) + '</span>' +
              statusSelectHtml(d) +
              '<span>' + formatDate(d.createdAt) + '</span>' +
              '<span class="admin-fb-row__author">' + author + '</span>' +
            '</div>' +
            '<div class="admin-fb-row__comment">' + escapeHtml(d.comment || '') + '</div>' +
            '<div class="admin-reply-box">' +
              '<textarea class="admin-reply-box__input" data-id="' + d.id + '" placeholder="사용자에게 보여질 답변을 입력하세요...">' + replyVal + '</textarea>' +
              '<button type="button" class="admin-mini-btn" data-action="save-reply" data-id="' + d.id + '">답글 저장</button>' +
            '</div>' +
            downloadHtml +
          '</div>' +
          '<button type="button" class="admin-danger-btn" data-action="delete-feedback" data-id="' + d.id + '">삭제</button>' +
        '</div>'
      );
    }).join('');

    Object.keys(drafts).forEach(function (id) {
      var ta = listEl.querySelector('.admin-reply-box__input[data-id="' + id + '"]');
      if (ta) { ta.value = drafts[id]; ta.focus(); }
    });
  }

  var q = fs.query(fs.collection(fs.db, 'feedback'), fs.orderBy('createdAt', 'desc'));
  fs.onSnapshot(q, function (snapshot) {
    allDocs = [];
    snapshot.forEach(function (d) { allDocs.push(Object.assign({ id: d.id }, d.data())); });
    render();
  }, function (err) {
    console.error('admin feedback onSnapshot error', err);
    listEl.innerHTML = '<p class="admin-empty">피드백을 불러오는 중 문제가 발생했습니다.</p>';
  });

  listEl.addEventListener('click', async function (e) {
    var delBtn = e.target.closest('[data-action="delete-feedback"]');
    var replyBtn = e.target.closest('[data-action="save-reply"]');

    if (delBtn) {
      var id = delBtn.dataset.id;
      if (!confirm('이 피드백을 삭제할까요? 되돌릴 수 없습니다.')) return;
      delBtn.disabled = true;
      try {
        await fs.deleteDoc(fs.doc(fs.db, 'feedback', id));
      } catch (err) {
        console.error('feedback delete error', err);
        alert('삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
        delBtn.disabled = false;
      }
      return;
    }

    if (replyBtn) {
      var rid = replyBtn.dataset.id;
      var textarea = listEl.querySelector('.admin-reply-box__input[data-id="' + rid + '"]');
      var text = (textarea && textarea.value || '').trim();
      replyBtn.disabled = true;
      try {
        await fs.updateDoc(fs.doc(fs.db, 'feedback', rid), {
          reply: text,
          repliedAt: fs.serverTimestamp()
        });
      } catch (err) {
        console.error('feedback reply save error', err);
        alert('답글 저장에 실패했습니다.');
      } finally {
        replyBtn.disabled = false;
      }
      return;
    }
  });

  listEl.addEventListener('change', async function (e) {
    var sel = e.target.closest('[data-action="set-status"]');
    if (!sel) return;
    var id = sel.dataset.id;
    var newStatus = sel.value;
    sel.disabled = true;
    try {
      await fs.updateDoc(fs.doc(fs.db, 'feedback', id), { status: newStatus });
    } catch (err) {
      console.error('feedback status update error', err);
      alert('상태 변경에 실패했습니다.');
    } finally {
      sel.disabled = false;
    }
  });

  searchEl.addEventListener('input', render);
  projectFilterEl.addEventListener('change', render);

  // Populate the project filter dropdown once project data is available.
  window.__aiwebPopulateFeedbackProjectFilter = function (projects) {
    var current = projectFilterEl.value;
    projectFilterEl.innerHTML = '<option value="">전체 프로젝트</option>' + projects.map(function (p) {
      return '<option value="' + escapeHtml(p.number) + '">' + escapeHtml(p.number) + ' · ' + escapeHtml(p.name) + '</option>';
    }).join('');
    projectFilterEl.value = current;
  };
}

// Fixed 10-category taxonomy (matches the public site's industry filter —
// see js/main.js INDUSTRIES). '전체' is deliberately excluded here since a
// project must be assigned one real industry, not the "all" filter value.
var INDUSTRIES = ['IT·마케팅', '라이프스타일', '교육·미디어', '바이오·헬스케어', '테크·제조', '모빌리티', 'F&B', '농축수산업', '물류·유통'];
function categoryOptionsHtml(selected) {
  return INDUSTRIES.map(function (name) {
    return '<option value="' + name + '"' + (name === selected ? ' selected' : '') + '>' + name + '</option>';
  }).join('');
}

/* ==================== PROJECTS TAB ==================== */
function initProjectsTab(fs) {
  var tbody = document.getElementById('projects-admin-tbody');
  var addForm = document.getElementById('project-add-form');
  var numberInput = document.getElementById('pf-number');
  var nameInput = document.getElementById('pf-name');
  var categoryInput = document.getElementById('pf-category');
  var urlInput = document.getElementById('pf-url');
  var seedBtn = document.getElementById('projects-seed-btn');
  var editingId = null;
  var projectsCache = [];

  categoryInput.innerHTML = categoryOptionsHtml();

  function padNumber(n) {
    var s = String(n).trim();
    return s.length < 2 ? ('0' + s).slice(-2) : s;
  }
  function suggestNextNumber(list) {
    var max = 0;
    list.forEach(function (p) {
      var n = parseInt(p.number, 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return padNumber(max + 1);
  }

  function renderRow(p) {
    if (editingId === p.id) {
      return (
        '<tr data-id="' + p.id + '">' +
          '<td><input type="text" class="admin-mini-btn" style="width:52px;padding:6px 8px;" value="' + escapeHtml(p.number) + '" data-field="number"></td>' +
          '<td><input type="text" style="width:100%;padding:6px 8px;" value="' + escapeHtml(p.name) + '" data-field="name"></td>' +
          '<td><select style="width:100%;padding:6px 8px;" data-field="category">' + categoryOptionsHtml(p.category) + '</select></td>' +
          '<td><input type="text" style="width:100%;padding:6px 8px;" value="' + escapeHtml(p.url) + '" data-field="url"></td>' +
          '<td class="admin-project-table__actions">' +
            '<button type="button" class="admin-mini-btn" data-action="save-project" data-id="' + p.id + '">저장</button>' +
            '<button type="button" class="admin-mini-btn" data-action="cancel-edit">취소</button>' +
          '</td>' +
        '</tr>'
      );
    }
    return (
      '<tr data-id="' + p.id + '">' +
        '<td class="admin-project-table__no">' + escapeHtml(p.number) + '</td>' +
        '<td class="admin-project-table__name">' + escapeHtml(p.name) + '</td>' +
        '<td>' + escapeHtml(p.category) + '</td>' +
        '<td><a class="admin-project-table__url" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener">' + escapeHtml(p.url) + '</a></td>' +
        '<td class="admin-project-table__actions">' +
          '<button type="button" class="admin-mini-btn" data-action="edit-project" data-id="' + p.id + '">수정</button>' +
          '<button type="button" class="admin-mini-btn" data-action="delete-project" data-id="' + p.id + '">삭제</button>' +
        '</td>' +
      '</tr>'
    );
  }

  function render() {
    if (!projectsCache.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="admin-empty">등록된 프로젝트가 없습니다. 아래 "시드 데이터 불러오기"로 초기 16개를 불러오거나 새로 추가하세요.</td></tr>';
    } else {
      tbody.innerHTML = projectsCache.map(renderRow).join('');
    }
    numberInput.value = suggestNextNumber(projectsCache);
    if (typeof window.__aiwebPopulateFeedbackProjectFilter === 'function') {
      window.__aiwebPopulateFeedbackProjectFilter(projectsCache.length ? projectsCache : PROJECTS_FALLBACK);
    }
  }

  var q = fs.query(fs.collection(fs.db, 'projects'), fs.orderBy('number', 'asc'));
  fs.onSnapshot(q, function (snapshot) {
    projectsCache = [];
    snapshot.forEach(function (d) { projectsCache.push(Object.assign({ id: d.id }, d.data())); });
    render();
  }, function (err) {
    console.error('admin projects onSnapshot error', err);
    tbody.innerHTML = '<tr><td colspan="5" class="admin-empty">프로젝트를 불러오는 중 문제가 발생했습니다.</td></tr>';
  });

  addForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var number = padNumber(numberInput.value);
    var name = nameInput.value.trim();
    var category = categoryInput.value.trim();
    var url = urlInput.value.trim();
    if (!number || !name || !category || !url) return;

    var submitBtn = addForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    try {
      await fs.setDoc(fs.doc(fs.db, 'projects', number), {
        number: number, name: name, category: category, url: url, cover: '',
        createdAt: fs.serverTimestamp(), updatedAt: fs.serverTimestamp()
      });
      addForm.reset();
    } catch (err) {
      console.error('project add error', err);
      alert('프로젝트 추가에 실패했습니다.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  tbody.addEventListener('click', async function (e) {
    var editBtn = e.target.closest('[data-action="edit-project"]');
    var cancelBtn = e.target.closest('[data-action="cancel-edit"]');
    var saveBtn = e.target.closest('[data-action="save-project"]');
    var delBtn = e.target.closest('[data-action="delete-project"]');

    if (editBtn) { editingId = editBtn.dataset.id; render(); return; }
    if (cancelBtn) { editingId = null; render(); return; }

    if (saveBtn) {
      var id = saveBtn.dataset.id;
      var row = tbody.querySelector('tr[data-id="' + id + '"]');
      var fields = {};
      row.querySelectorAll('[data-field]').forEach(function (input) {
        fields[input.dataset.field] = input.value.trim();
      });
      if (fields.number) fields.number = padNumber(fields.number);
      saveBtn.disabled = true;
      try {
        await fs.updateDoc(fs.doc(fs.db, 'projects', id), Object.assign({}, fields, { updatedAt: fs.serverTimestamp() }));
        editingId = null;
      } catch (err) {
        console.error('project update error', err);
        alert('저장에 실패했습니다.');
        saveBtn.disabled = false;
      }
      return;
    }

    if (delBtn) {
      var delId = delBtn.dataset.id;
      var target = projectsCache.find(function (p) { return p.id === delId; });
      var label = target ? (target.number + ' · ' + target.name) : delId;
      if (!confirm('"' + label + '"를 삭제할까요?\n번호 순서상 빈 자리가 생길 수 있으며, 필요하면 다른 항목을 수정해 번호를 다시 정렬하세요.')) return;
      delBtn.disabled = true;
      try {
        await fs.deleteDoc(fs.doc(fs.db, 'projects', delId));
      } catch (err) {
        console.error('project delete error', err);
        alert('삭제에 실패했습니다.');
        delBtn.disabled = false;
      }
    }
  });

  seedBtn.addEventListener('click', async function () {
    if (!confirm('현재 공개 사이트에 하드코딩된 16개 프로젝트를 Firestore projects 컬렉션에 불러옵니다.\n같은 번호의 문서가 이미 있으면 값이 덮어써집니다. 계속할까요?')) return;
    seedBtn.disabled = true;
    seedBtn.textContent = '불러오는 중…';
    try {
      await Promise.all(PROJECTS_FALLBACK.map(function (p) {
        return fs.setDoc(fs.doc(fs.db, 'projects', p.number), Object.assign({}, p, {
          updatedAt: fs.serverTimestamp()
        }), { merge: true });
      }));
      alert('시드 데이터를 불러왔습니다.');
    } catch (err) {
      console.error('seed error', err);
      alert('시드 데이터를 불러오는 중 문제가 발생했습니다.');
    } finally {
      seedBtn.disabled = false;
      seedBtn.textContent = '시드 데이터 불러오기 (최초 1회)';
    }
  });
}

init();
