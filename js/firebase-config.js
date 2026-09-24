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
  apiKey: "AIzaSyD6QyIcNnOCkFzCkHajh7byugE5yvJCRU8",
  authDomain: "abbg-ai-web.firebaseapp.com",
  projectId: "abbg-ai-web",
  storageBucket: "abbg-ai-web.firebasestorage.app",
  messagingSenderId: "378541599563",
  appId: "1:378541599563:web:1dce33fb2b21dbd6b296ce"
};

export function isFirebaseConfigured() {
  return !!firebaseConfig && firebaseConfig.apiKey !== 'REPLACE_ME';
}
