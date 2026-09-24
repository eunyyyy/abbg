// AI WEB admin — login page
// Loaded as <script type="module" src="admin/js/admin-login.js"> from admin/index.html

import { firebaseConfig, isFirebaseConfigured } from '../../js/firebase-config.js';

const noticeEl = document.getElementById('admin-notice');
const errorEl = document.getElementById('admin-error');
const formEl = document.getElementById('admin-login-form');
const loginBtn = document.getElementById('admin-login-btn');

function showNotice() {
  if (noticeEl) noticeEl.style.display = 'block';
}
function showError(msg) {
  if (!errorEl) return;
  errorEl.textContent = msg;
  errorEl.classList.add('is-visible');
}
function clearError() {
  if (!errorEl) return;
  errorEl.textContent = '';
  errorEl.classList.remove('is-visible');
}

function translateAuthError(code) {
  switch (code) {
    case 'auth/invalid-email': return '이메일 형식이 올바르지 않습니다.';
    case 'auth/user-disabled': return '비활성화된 계정입니다.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return '이메일 또는 비밀번호가 올바르지 않습니다.';
    case 'auth/too-many-requests': return '시도가 너무 많습니다. 잠시 후 다시 시도해주세요.';
    default: return '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';
  }
}

async function init() {
  if (!isFirebaseConfigured()) {
    // Firebase project not wired up yet — show a clear inline notice instead
    // of throwing, and keep the form from pretending to work.
    showNotice();
    if (formEl) {
      formEl.addEventListener('submit', function (e) {
        e.preventDefault();
        showError('관리자 로그인 기능은 Firebase 설정 후 활성화됩니다.');
      });
    }
    return;
  }

  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js');
    const {
      getAuth, onAuthStateChanged, signInWithEmailAndPassword
    } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js');

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Already logged in (e.g. came back to /admin/) — go straight to the dashboard.
    onAuthStateChanged(auth, function (user) {
      if (user) window.location.replace('dashboard.html');
    });

    if (formEl) {
      formEl.addEventListener('submit', async function (e) {
        e.preventDefault();
        clearError();
        var email = document.getElementById('admin-email').value.trim();
        var password = document.getElementById('admin-password').value;
        if (!email || !password) return;

        if (loginBtn) loginBtn.disabled = true;
        try {
          await signInWithEmailAndPassword(auth, email, password);
          window.location.replace('dashboard.html');
        } catch (err) {
          console.error('admin login error', err);
          showError(translateAuthError(err && err.code));
        } finally {
          if (loginBtn) loginBtn.disabled = false;
        }
      });
    }
  } catch (err) {
    console.error('firebase init error (admin login)', err);
    showNotice();
  }
}

init();
