// AI WEB portfolio hub — realtime project feedback (Firestore)
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

const noticeEl = document.getElementById('feedback-notice');
const formEl = document.getElementById('feedback-form');
const statusEl = document.getElementById('feedback-status');
const historyListEl = document.getElementById('history-list');
const historySearchEl = document.getElementById('feedback-history-search');
const historyStatusEl = document.getElementById('feedback-history-status');
const dropzoneEl = document.getElementById('feedback-dropzone');
const attachmentInputEl = document.getElementById('fb-attachments');
const attachmentListEl = document.getElementById('fb-attachment-list');
const attachBtnEl = document.getElementById('fb-attach-btn');

var STATUS_LABEL = { pending: '반영 대기', in_progress: '진행중', done: '반영 완료' };
var STATUS_CLASS = { pending: 'is-pending', in_progress: 'is-progress', done: 'is-done' };
var STATUS_CURSOR_TEXT = { done: '프로젝트 이동', pending: '피드백 반영중' };
var PROJECT_DOWNLOAD_RELEASE = 'https://github.com/eunyyyy/abbg/releases/download/project-downloads/';
var MAX_ATTACHMENTS = 3, MAX_FILE_BYTES = 250 * 1024, MAX_TOTAL_BYTES = 550 * 1024;
var selectedAttachments = [], feedbackDocs = [], repliesByFeedback = {};

function showNotice() { if (noticeEl) noticeEl.classList.add('is-visible'); }
function showToast(message) {
  var toast = document.createElement('div');
  toast.className = 'site-toast'; toast.setAttribute('role', 'status'); toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(function () { toast.classList.add('is-visible'); });
  setTimeout(function () { toast.classList.remove('is-visible'); setTimeout(function () { toast.remove(); }, 250); }, 2200);
}
function formatDate(ts) {
  try {
    var d = ts && typeof ts.toDate === 'function' ? ts.toDate() : new Date();
    var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    var hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
    return y + '.' + m + '.' + day + ' ' + hh + ':' + mm;
  } catch (e) { return ''; }
}
function escapeHtml(str) { return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function normalizeSearchText(value) { return String(value || '').normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/g, ''); }
function isClickableStatus(status) { return Object.prototype.hasOwnProperty.call(STATUS_CURSOR_TEXT, status); }
function displayProjectName(projectNumber, projectName) { return projectNumber === '07' ? 'AUBERON' : projectName; }
function projectArchiveUrl(projectNumber, projectName) {
  var slug = String(projectName || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project';
  return PROJECT_DOWNLOAD_RELEASE + 'project-' + encodeURIComponent(projectNumber) + '-' + slug + '.zip';
}
function resolveProjectUrl(projectNumber) {
  var rows = document.querySelectorAll('.plist__row');
  for (var i = 0; i < rows.length; i++) {
    var noEl = rows[i].querySelector('.plist__no');
    if (noEl && noEl.textContent.trim() === projectNumber) {
      var link = rows[i].querySelector('.plist__link'); return link ? link.getAttribute('href') : '';
    }
  }
  return '';
}

function validAttachmentData(a) {
  return a && typeof a.data === 'string' && /^data:(image\/(jpeg|png|webp|gif)|application\/pdf|text\/plain|application\/zip);/i.test(a.data);
}
function renderAttachments(items) {
  if (!Array.isArray(items) || !items.length) return '';
  var safeItems = items.filter(validAttachmentData);
  if (!safeItems.length) return '';
  return '<div class="history-attachments">' + safeItems.map(function (a, index) {
    var name = escapeHtml(a.name || ('첨부파일 ' + (index + 1)));
    var preview = /^image\//i.test(a.type || '') ? '<img src="' + escapeHtml(a.data) + '" alt="' + name + '">' : '<span class="history-attachment__icon" aria-hidden="true">↓</span>';
    return '<a class="history-attachment" data-feedback-control href="' + escapeHtml(a.data) + '" download="' + name + '">' + preview + '<span>' + name + '</span></a>';
  }).join('') + '</div>';
}
function renderReplyThread(feedbackId, legacyReply) {
  var replies = (repliesByFeedback[feedbackId] || []).slice().sort(function (a, b) {
    return ((a.createdAt && a.createdAt.seconds) || 0) - ((b.createdAt && b.createdAt.seconds) || 0);
  });
  var admins = replies.filter(function (r) { return r.role === 'admin'; });
  var html = legacyReply ? '<div class="history-item__reply"><span class="history-item__reply-label">AI WEB 답변</span>' + escapeHtml(legacyReply) + '</div>' : '';
  admins.forEach(function (reply) {
    var children = replies.filter(function (r) { return r.role === 'user' && r.parentReplyId === reply.id; });
    html += '<div class="feedback-thread" data-feedback-control><div class="feedback-thread__admin">' +
      '<span class="history-item__reply-label">AI WEB 답변</span><p>' + escapeHtml(reply.message || '') + '</p>' +
      '<div class="feedback-thread__meta"><span>' + formatDate(reply.createdAt) + '</span>' +
      (reply.acknowledged ? '<span class="feedback-thread__checked">확인 완료</span>' : '<button type="button" data-action="ack-reply" data-feedback-id="' + feedbackId + '" data-reply-id="' + reply.id + '">확인 완료</button>') +
      '<button type="button" data-action="toggle-user-reply" data-reply-id="' + reply.id + '">답글 달기</button></div></div>' +
      children.map(function (child) { return '<div class="feedback-thread__user"><span>사용자 리플</span><p>' + escapeHtml(child.message || '') + '</p><small>' + formatDate(child.createdAt) + '</small></div>'; }).join('') +
      '<form class="feedback-thread__form" data-action="user-reply-form" data-feedback-id="' + feedbackId + '" data-parent-id="' + reply.id + '" hidden><textarea maxlength="500" required placeholder="관리자 답글에 리플을 남겨주세요."></textarea><button type="submit">답글 추가</button></form></div>';
  });
  return html ? '<div class="feedback-threads">' + html + '</div>' : '';
}
function renderHistory() {
  if (!historyListEl) return;
  var term = historySearchEl ? normalizeSearchText(historySearchEl.value) : '';
  var selectedStatus = historyStatusEl ? historyStatusEl.value : '';
  var visibleDocs = feedbackDocs.filter(function (data) {
    if (selectedStatus && data.status !== selectedStatus) return false;
    var replyText = (repliesByFeedback[data.id] || []).map(function (r) { return r.message || ''; }).join(' ');
    var hay = normalizeSearchText((data.projectName || '') + (data.projectNumber || '') + (data.category || '') + (data.author || '') + (data.comment || '') + (data.reply || '') + replyText);
    return !term || hay.includes(term);
  });
  if (!visibleDocs.length) { historyListEl.innerHTML = '<p class="history-empty">' + ((term || selectedStatus) ? '검색 결과가 없습니다.' : '아직 등록된 피드백이 없습니다. 첫 의견을 남겨보세요.') + '</p>'; return; }
  historyListEl.innerHTML = visibleDocs.map(function (data) {
    var statusKey = STATUS_LABEL[data.status] ? data.status : 'pending';
    var downloadHtml = statusKey === 'done' ? '<a class="history-item__download" data-feedback-control data-action="download-project" href="' + projectArchiveUrl(data.projectNumber || '', data.projectName || '') + '" download><span aria-hidden="true">↓</span> 프로젝트 파일 다운로드 <small>ZIP</small></a>' : '';
    return '<div class="history-item" data-status="' + statusKey + '" data-project-no="' + escapeHtml(data.projectNumber || '') + '"' + (isClickableStatus(statusKey) ? ' role="link" tabindex="0"' : '') + '>' +
      '<div class="history-item__meta"><span class="history-item__project">' + escapeHtml(displayProjectName(data.projectNumber, data.projectName)) + '</span><span class="history-item__author">' + escapeHtml(data.author || '익명') + '</span></div>' +
      '<div class="history-item__comment">' + escapeHtml(data.comment || '') + '</div>' + renderAttachments(data.attachments) +
      '<div class="history-item__statusrow"><span class="history-item__status ' + STATUS_CLASS[statusKey] + '">' + STATUS_LABEL[statusKey] + '</span><span class="history-item__date">' + formatDate(data.createdAt) + '</span></div>' +
      renderReplyThread(data.id, data.reply) + downloadHtml + '</div>';
  }).join('');
}

function initHistoryInteractions(api) {
  if (!historyListEl) return;
  var pointerFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches, cursorEl = null, activeItem = null;
  if (pointerFine) {
    cursorEl = document.createElement('div'); cursorEl.className = 'feedback-cursor'; document.body.appendChild(cursorEl);
    historyListEl.addEventListener('mouseover', function (e) {
      if (e.target.closest('[data-feedback-control]')) { cursorEl.classList.remove('is-visible'); activeItem = null; return; }
      var item = e.target.closest('.history-item');
      if (!item || !STATUS_CURSOR_TEXT[item.dataset.status]) { cursorEl.classList.remove('is-visible'); activeItem = null; return; }
      cursorEl.textContent = STATUS_CURSOR_TEXT[item.dataset.status]; cursorEl.className = 'feedback-cursor is-visible ' + (item.dataset.status === 'done' ? 'is-done' : 'is-pending'); activeItem = item;
    });
    historyListEl.addEventListener('mousemove', function (e) { if (activeItem) { cursorEl.style.left = e.clientX + 'px'; cursorEl.style.top = e.clientY + 'px'; } });
    historyListEl.addEventListener('mouseout', function (e) { var item = e.target.closest('.history-item'); if (item && item === activeItem && (!e.relatedTarget || !item.contains(e.relatedTarget))) { cursorEl.classList.remove('is-visible'); activeItem = null; } });
  }
  historyListEl.addEventListener('click', async function (e) {
    var toggle = e.target.closest('[data-action="toggle-user-reply"]');
    if (toggle) { var form = historyListEl.querySelector('form[data-parent-id="' + toggle.dataset.replyId + '"]'); if (form) { form.hidden = !form.hidden; if (!form.hidden) form.querySelector('textarea').focus(); } return; }
    var ack = e.target.closest('[data-action="ack-reply"]');
    if (ack) {
      ack.disabled = true;
      try { await api.updateDoc(api.doc(api.db, 'feedback', ack.dataset.feedbackId, 'replies', ack.dataset.replyId), { acknowledged: true, acknowledgedAt: api.serverTimestamp() }); showToast('확인 완료했습니다.'); }
      catch (err) { console.error('acknowledge reply error', err); ack.disabled = false; }
      return;
    }
    if (e.target.closest('[data-feedback-control]')) return;
    var item = e.target.closest('.history-item');
    if (item && isClickableStatus(item.dataset.status)) { var url = resolveProjectUrl(item.dataset.projectNo); if (url) window.open(url, '_blank', 'noopener'); }
  });
  historyListEl.addEventListener('keydown', function (e) {
    if ((e.key !== 'Enter' && e.key !== ' ') || e.target.closest('[data-feedback-control]')) return;
    var item = e.target.closest('.history-item'); if (!item || !isClickableStatus(item.dataset.status)) return;
    e.preventDefault(); var url = resolveProjectUrl(item.dataset.projectNo); if (url) window.open(url, '_blank', 'noopener');
  });
  historyListEl.addEventListener('submit', async function (e) {
    var replyForm = e.target.closest('[data-action="user-reply-form"]'); if (!replyForm) return;
    e.preventDefault(); var textarea = replyForm.querySelector('textarea'), message = textarea.value.trim(); if (!message) return;
    var btn = replyForm.querySelector('button'); btn.disabled = true;
    try {
      await api.addDoc(api.collection(api.db, 'feedback', replyForm.dataset.feedbackId, 'replies'), { feedbackId: replyForm.dataset.feedbackId, role: 'user', author: '사용자', parentReplyId: replyForm.dataset.parentId, message: message, createdAt: api.serverTimestamp() });
      textarea.value = ''; replyForm.hidden = true; showToast('답글이 추가되었습니다.');
    } catch (err) { console.error('user reply error', err); if (statusEl) statusEl.textContent = '답글 등록에 실패했습니다.'; }
    finally { btn.disabled = false; }
  });
}

function readAsDataUrl(file) { return new Promise(function (resolve, reject) { var reader = new FileReader(); reader.onload = function () { resolve(reader.result); }; reader.onerror = reject; reader.readAsDataURL(file); }); }
function compressImage(file) {
  if (file.size <= MAX_FILE_BYTES) return readAsDataUrl(file).then(function (data) { return { name: file.name, type: file.type, size: file.size, data: data }; });
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.onload = async function () {
      var scale = Math.min(1, 1600 / Math.max(img.width, img.height)), canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale)); canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      var quality = .82, blob = null;
      while (quality >= .35) { blob = await new Promise(function (done) { canvas.toBlob(done, 'image/jpeg', quality); }); if (blob && blob.size <= MAX_FILE_BYTES) break; quality -= .1; }
      if (!blob || blob.size > MAX_FILE_BYTES) { reject(new Error('이미지 용량을 250KB 이하로 줄일 수 없습니다.')); return; }
      resolve({ name: file.name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg', size: blob.size, data: await readAsDataUrl(blob) });
    };
    img.onerror = function () { reject(new Error('이미지를 읽을 수 없습니다.')); };
    img.src = URL.createObjectURL(file);
  });
}
async function prepareFiles(files) {
  var allowed = /^(image\/(jpeg|png|webp|gif)|application\/pdf|text\/plain|application\/zip)$/i;
  for (var i = 0; i < files.length; i++) {
    if (selectedAttachments.length >= MAX_ATTACHMENTS) { showToast('첨부파일은 최대 3개까지 가능합니다.'); break; }
    var file = files[i];
    if (!allowed.test(file.type)) { showToast('이미지, PDF, TXT, ZIP 파일만 첨부할 수 있습니다.'); continue; }
    try {
      var item;
      if (/^image\//i.test(file.type)) item = await compressImage(file);
      else { if (file.size > MAX_FILE_BYTES) throw new Error('파일은 250KB 이하여야 합니다.'); item = { name: file.name, type: file.type, size: file.size, data: await readAsDataUrl(file) }; }
      var total = selectedAttachments.reduce(function (sum, a) { return sum + a.size; }, 0) + item.size;
      if (total > MAX_TOTAL_BYTES) throw new Error('전체 첨부파일 용량은 550KB 이하여야 합니다.');
      selectedAttachments.push(item);
    } catch (err) { showToast(err.message || '첨부파일 처리에 실패했습니다.'); }
  }
  renderSelectedAttachments(); if (attachmentInputEl) attachmentInputEl.value = '';
}
function renderSelectedAttachments() {
  if (!attachmentListEl) return;
  attachmentListEl.innerHTML = selectedAttachments.map(function (a, i) { return '<span>' + escapeHtml(a.name) + ' <button type="button" data-remove-attachment="' + i + '" aria-label="첨부 삭제">×</button></span>'; }).join('');
}
function initAttachments() {
  if (!dropzoneEl || !attachmentInputEl) return;
  attachBtnEl.addEventListener('click', function () { attachmentInputEl.click(); });
  attachmentInputEl.addEventListener('change', function () { prepareFiles(Array.from(attachmentInputEl.files || [])); });
  ['dragenter', 'dragover'].forEach(function (name) { dropzoneEl.addEventListener(name, function (e) { e.preventDefault(); dropzoneEl.classList.add('is-dragging'); }); });
  ['dragleave', 'drop'].forEach(function (name) { dropzoneEl.addEventListener(name, function (e) { e.preventDefault(); dropzoneEl.classList.remove('is-dragging'); }); });
  dropzoneEl.addEventListener('drop', function (e) { prepareFiles(Array.from(e.dataTransfer.files || [])); });
  attachmentListEl.addEventListener('click', function (e) { var btn = e.target.closest('[data-remove-attachment]'); if (!btn) return; selectedAttachments.splice(Number(btn.dataset.removeAttachment), 1); renderSelectedAttachments(); });
}

async function init() {
  initAttachments();
  if (historySearchEl) {
    historySearchEl.addEventListener('input', renderHistory);
    historySearchEl.addEventListener('search', renderHistory);
    historySearchEl.addEventListener('compositionend', renderHistory);
  }
  if (historyStatusEl) historyStatusEl.addEventListener('change', renderHistory);
  if (!isFirebaseConfigured()) { showNotice(); renderHistory(); if (formEl) formEl.addEventListener('submit', function (e) { e.preventDefault(); if (statusEl) statusEl.textContent = '피드백 기능은 Firebase 설정 후 활성화됩니다.'; }); return; }
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js');
    const { getFirestore, collection, collectionGroup, doc, addDoc, updateDoc, serverTimestamp, query, orderBy, onSnapshot, limit } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js');
    const db = getFirestore(initializeApp(firebaseConfig));
    const api = { db, collection, doc, addDoc, updateDoc, serverTimestamp };
    initHistoryInteractions(api);
    onSnapshot(query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(100)), function (snapshot) { feedbackDocs = []; snapshot.forEach(function (item) { feedbackDocs.push(Object.assign({ id: item.id }, item.data())); }); renderHistory(); }, function (err) { console.error('feedback onSnapshot error', err); if (statusEl) statusEl.textContent = '피드백을 불러오는 중 문제가 발생했습니다.'; });
    onSnapshot(collectionGroup(db, 'replies'), function (snapshot) {
      repliesByFeedback = {};
      snapshot.forEach(function (item) { var data = Object.assign({ id: item.id }, item.data()); if (!repliesByFeedback[data.feedbackId]) repliesByFeedback[data.feedbackId] = []; repliesByFeedback[data.feedbackId].push(data); }); renderHistory();
    }, function (err) { console.error('replies onSnapshot error', err); });
    if (formEl) formEl.addEventListener('submit', async function (e) {
      e.preventDefault(); var comment = document.getElementById('fb-comment').value.trim();
      if (!comment) { if (statusEl) statusEl.textContent = '의견을 입력해주세요.'; return; }
      var submitBtn = formEl.querySelector('button[type="submit"]'); submitBtn.disabled = true; if (statusEl) statusEl.textContent = '전송 중...';
      try {
        var payload = { projectNumber: document.getElementById('fb-project-no').value, projectName: document.getElementById('fb-project-name').value, category: document.getElementById('fb-project-category').value, comment: comment, status: 'pending', createdAt: serverTimestamp() };
        var author = document.getElementById('fb-author').value.trim(); if (author) payload.author = author; if (selectedAttachments.length) payload.attachments = selectedAttachments;
        await addDoc(collection(db, 'feedback'), payload); formEl.reset(); selectedAttachments = []; renderSelectedAttachments(); if (statusEl) statusEl.textContent = ''; showToast('코멘트가 추가 되었습니다.');
      } catch (err) { console.error('feedback submit error', err); if (statusEl) statusEl.textContent = '전송에 실패했습니다. 잠시 후 다시 시도해주세요.'; }
      finally { submitBtn.disabled = false; }
    });
  } catch (err) { console.error('firebase init error', err); showNotice(); renderHistory(); }
}

init();
