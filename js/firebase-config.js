// AI WEB portfolio hub — shared Firebase config (single source of truth)
//
// TODO: paste the real Firebase project config here — see FIREBASE_SETUP.md
// Used by: js/firebase-feedback.js, js/main.js (project list sync),
// admin/js/admin-login.js, admin/js/admin-dashboard.js
//
// Until this is replaced, every consumer above falls back to its
// static/hardcoded content and shows a "설정 필요" style inline notice
// instead of throwing — see isFirebaseConfigured() below.
export const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

export function isFirebaseConfigured() {
  return !!firebaseConfig && firebaseConfig.apiKey !== 'REPLACE_ME';
}
