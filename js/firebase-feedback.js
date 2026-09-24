// AI WEB portfolio hub — realtime project feedback (Firestore)
// Loaded as <script type="module" src="js/firebase-feedback.js">

// Real Firebase project config lives in js/firebase-config.js (shared with
// js/main.js and the admin/ section) — see FIREBASE_SETUP.md.
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

const noticeEl = document.getElementById('feedback-notice');
const formEl = document.getElementById('feedback-form');
const statusEl = document.getElementById('feedback-status');
const historyListEl = document.getElementById('history-list');

function showNotice() {
  if (noticeEl) noticeEl.classList.add('is-visible');
}

function formatDate(ts) {
  try {
    var d = ts && typeof ts.toDate === 'function' ? ts.toDate() : new Date();
    var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    var hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
    return y + '.' + m + '.' + day + ' ' + hh + ':' + mm;
  } catch (e) {
    return '';
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

var STATUS_LABEL = { pending: '대기중', in_progress: '진행중', done: '반영 완료' };
var STATUS_CLASS = { pending: 'is-pending', in_progress: 'is-progress', done: 'is-done' };

function statusBadgeHtml(status) {
  var key = STATUS_LABEL[status] ? status : 'pending'; // legacy docs with no status render as 대기중
  return '<span class="status-badge ' + STATUS_CLASS[key] + '">' + STATUS_LABEL[key] + '</span>';
}

function renderHistory(docs) {
  if (!historyListEl) return;
  if (!docs.length) {
    historyListEl.innerHTML = '<p class="history-empty">아직 등록된 피드백이 없습니다. 첫 의견을 남겨보세요.</p>';
    return;
  }
  historyListEl.innerHTML = docs.map(function (data) {
    var dateStr = formatDate(data.createdAt);
    var author = data.author ? escapeHtml(data.author) : '익명';
    var replyHtml = data.reply
      ? '<div class="history-item__reply"><span class="history-item__reply-label">AI WEB 답변</span>' + escapeHtml(data.reply) + '</div>'
      : '';
    return (
      '<div class="history-item">' +
        '<div class="history-item__meta">' +
          '<span class="history-item__project">' + escapeHtml(data.projectNumber) + ' · ' + escapeHtml(data.projectName) + '</span>' +
          statusBadgeHtml(data.status) +
          '<span>' + dateStr + '</span>' +
        '</div>' +
        '<div class="history-item__comment">' + escapeHtml(data.comment) + '</div>' +
        '<div class="history-item__author">' + author + '</div>' +
        replyHtml +
      '</div>'
    );
  }).join('');
}

async function init() {
  if (!isFirebaseConfigured()) {
    // Firebase project not configured yet — keep the rest of the page fully functional,
    // just show an inline notice instead of throwing/crashing.
    showNotice();
    if (formEl) {
      formEl.addEventListener('submit', function (e) {
        e.preventDefault();
        if (statusEl) statusEl.textContent = '피드백 기능은 Firebase 설정 후 활성화됩니다.';
      });
    }
    renderHistory([]);
    return;
  }

  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js');
    const {
      getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, limit
    } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js');

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const feedbackCol = collection(db, 'feedback');

    // Realtime history feed, newest first
    const q = query(feedbackCol, orderBy('createdAt', 'desc'), limit(100));
    onSnapshot(q, function (snapshot) {
      var docs = [];
      snapshot.forEach(function (doc) { docs.push(doc.data()); });
      renderHistory(docs);
    }, function (err) {
      console.error('feedback onSnapshot error', err);
      if (statusEl) statusEl.textContent = '피드백을 불러오는 중 문제가 발생했습니다.';
    });

    if (formEl) {
      formEl.addEventListener('submit', async function (e) {
        e.preventDefault();
        var no = document.getElementById('fb-project-no').value;
        var name = document.getElementById('fb-project-name').value;
        var category = document.getElementById('fb-project-category').value;
        var comment = document.getElementById('fb-comment').value.trim();
        var author = document.getElementById('fb-author').value.trim();

        if (!comment) {
          if (statusEl) statusEl.textContent = '의견을 입력해주세요.';
          return;
        }
        if (comment.length > 500) {
          if (statusEl) statusEl.textContent = '의견은 500자 이내로 작성해주세요.';
          return;
        }

        var submitBtn = formEl.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        if (statusEl) statusEl.textContent = '전송 중...';

        try {
          var payload = {
            projectNumber: no,
            projectName: name,
            category: category,
            comment: comment,
            status: 'pending', // 대기중 — 관리자가 관리자페이지에서 진행중/반영완료로 바꿀 수 있습니다
            createdAt: serverTimestamp()
          };
          if (author) payload.author = author;

          await addDoc(feedbackCol, payload);
          if (statusEl) statusEl.textContent = '소중한 의견 감사합니다.';
          formEl.reset();
        } catch (err) {
          console.error('feedback submit error', err);
          if (statusEl) statusEl.textContent = '전송에 실패했습니다. 잠시 후 다시 시도해주세요.';
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }
  } catch (err) {
    console.error('firebase init error', err);
    showNotice();
    renderHistory([]);
  }
}

init();
