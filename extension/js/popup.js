/**
 * FileFlux — Popup Controller
 * Handles user interaction in the extension popup.
 */

import { getFileInfo, getExtension, getFilenameFromUrl, formatFileSize } from './fileTypes.js';
import { Analytics } from './analytics.js';

// ─────────────────────────────────────────
// DOM References
// ─────────────────────────────────────────
const dropZone       = document.getElementById('drop-zone');
const dropOverlay    = document.getElementById('drop-overlay');
const urlInput       = document.getElementById('url-input');
const btnOpenUrl     = document.getElementById('btn-open-url');
const btnSettings    = document.getElementById('btn-settings');
const btnHistory     = document.getElementById('btn-history');
const fileInput      = document.getElementById('file-input');
const statusBar      = document.getElementById('status-bar');
const statusText     = document.getElementById('status-text');
const pageFilesSection = document.getElementById('page-files-section');
const pageFilesList  = document.getElementById('page-files-list');

// Quick Action Buttons
const qaScane    = document.getElementById('qa-scan');
const qaConvert  = document.getElementById('qa-convert');
const qaPaste    = document.getElementById('qa-paste');
const qaFeedback = document.getElementById('qa-feedback');

// Modals
const feedbackModal     = document.getElementById('feedback-modal');
const settingsModal     = document.getElementById('settings-modal');
const modalClose        = document.getElementById('modal-close');
const settingsClose     = document.getElementById('settings-close');
const btnSubmitFeedback = document.getElementById('btn-submit-feedback');
const btnCancelFeedback = document.getElementById('btn-cancel-feedback');
const btnSaveSettings   = document.getElementById('btn-save-settings');
const feedbackType      = document.getElementById('feedback-type');
const feedbackText      = document.getElementById('feedback-text');

// Settings checkboxes
const setAutoscan    = document.getElementById('set-autoscan');
const setContextmenu = document.getElementById('set-contextmenu');
const setAnalytics   = document.getElementById('set-analytics');
const setRetro       = document.getElementById('set-retro');

// ─────────────────────────────────────────
// Toast Notification
// ─────────────────────────────────────────
function showToast(msg, isError = false) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const t = document.createElement('div');
  t.className = 'toast' + (isError ? ' error' : '');
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2800);
}

// ─────────────────────────────────────────
// Status Bar
// ─────────────────────────────────────────
function setStatus(msg) {
  statusBar.style.display = 'flex';
  statusText.textContent = msg;
}
function clearStatus() {
  statusBar.style.display = 'none';
}

// ─────────────────────────────────────────
// Open File in Viewer
// ─────────────────────────────────────────
async function openInViewer(fileData) {
  // fileData: { url, name, ext, size, blob }
  setStatus('⚡ Opening file...');

  try {
    // Store file info in session storage for viewer to pick up
    const viewerData = {
      url:  fileData.url  || null,
      name: fileData.name || 'file',
      ext:  fileData.ext  || '',
      size: fileData.size || 0,
      timestamp: Date.now()
    };

    chrome.storage.session.set({ pendingFile: viewerData });

    // Open viewer tab
    const viewerUrl = chrome.runtime.getURL('pages/viewer.html');
    await chrome.tabs.create({ url: viewerUrl });

    Analytics.track('file_opened', { ext: fileData.ext, source: fileData.source });
    clearStatus();
    window.close();
  } catch (err) {
    showToast('Failed to open file: ' + err.message, true);
    clearStatus();
  }
}

// ─────────────────────────────────────────
// Handle Dropped / Pasted Files
// ─────────────────────────────────────────
async function handleFile(file) {
  const ext  = getExtension(file.name);
  const info = getFileInfo(ext);

  setStatus(`📂 Loading ${info.name}...`);

  const url = URL.createObjectURL(file);
  await openInViewer({
    url,
    name:   file.name,
    ext,
    size:   file.size,
    source: 'local'
  });
}

// ─────────────────────────────────────────
// Handle URL Input
// ─────────────────────────────────────────
async function handleUrl(rawUrl) {
  let url = rawUrl.trim();
  if (!url) { showToast('Please enter a URL! 🫤', true); return; }
  if (!url.startsWith('http')) url = 'https://' + url;

  const name = getFilenameFromUrl(url);
  const ext  = getExtension(name);

  setStatus('🔗 Fetching file info...');

  await openInViewer({ url, name, ext, source: 'url' });
}

// ─────────────────────────────────────────
// Scan Page for Files
// ─────────────────────────────────────────
async function scanCurrentPage() {
  setStatus('🔍 Scanning page...');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) { showToast('No active tab found', true); clearStatus(); return; }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const links = Array.from(document.querySelectorAll('a[href]'));
        const fileExts = /\.(pdf|docx?|pptx?|xlsx?|zip|rar|7z|mp4|mkv|mp3|wav|png|jpg|jpeg|gif|svg|webp|csv|json|txt|md|epub|stl|obj|glb)(\?.*)?$/i;
        return links
          .map(a => a.href)
          .filter(href => fileExts.test(href))
          .slice(0, 10);
      }
    });

    const fileUrls = results?.[0]?.result || [];
    clearStatus();

    if (fileUrls.length === 0) {
      showToast('No files found on this page 🤷');
      return;
    }

    pageFilesSection.style.display = 'block';
    pageFilesList.innerHTML = '';

    fileUrls.forEach(url => {
      const name = getFilenameFromUrl(url);
      const ext  = getExtension(name);
      const info = getFileInfo(ext);

      const item = document.createElement('div');
      item.className = 'file-item';
      item.innerHTML = `
        <span class="file-item-icon">${info.icon}</span>
        <div class="file-item-info">
          <div class="file-item-name">${name}</div>
          <div class="file-item-meta">${info.name} • <a href="${url}" target="_blank" style="color:var(--neon-cyan)">preview URL</a></div>
        </div>
        <div class="file-item-actions">
          <button class="btn btn-primary btn-sm" data-url="${url}" data-name="${name}" data-ext="${ext}">Open</button>
        </div>
      `;

      item.querySelector('.btn').addEventListener('click', () => {
        handleUrl(url);
      });

      pageFilesList.appendChild(item);
    });

    showToast(`Found ${fileUrls.length} file(s)! 🎯`);
  } catch (err) {
    showToast('Cannot scan this page', true);
    clearStatus();
  }
}

// ─────────────────────────────────────────
// Load / Save Settings
// ─────────────────────────────────────────
async function loadSettings() {
  const defaults = {
    autoscan: true,
    contextmenu: true,
    analytics: true,
    retro: true
  };
  const saved = await chrome.storage.sync.get(defaults);
  setAutoscan.checked    = saved.autoscan;
  setContextmenu.checked = saved.contextmenu;
  setAnalytics.checked   = saved.analytics;
  setRetro.checked       = saved.retro;
}

async function saveSettings() {
  const settings = {
    autoscan:    setAutoscan.checked,
    contextmenu: setContextmenu.checked,
    analytics:   setAnalytics.checked,
    retro:       setRetro.checked
  };
  await chrome.storage.sync.set(settings);
  settingsModal.style.display = 'none';
  showToast('Settings saved! ✓');
}

// ─────────────────────────────────────────
// Feedback Submission
// ─────────────────────────────────────────
async function submitFeedback() {
  const type = feedbackType.value;
  const text = feedbackText.value.trim();
  if (!text) { showToast('Say something fr 💭', true); return; }

  setStatus('📨 Sending feedback...');
  feedbackModal.style.display = 'none';

  try {
    // Queue feedback for background to send when online
    const existing = await chrome.storage.local.get({ feedbackQueue: [] });
    existing.feedbackQueue.push({
      type, text,
      timestamp: new Date().toISOString(),
      version: chrome.runtime.getManifest().version
    });
    await chrome.storage.local.set({ feedbackQueue: existing.feedbackQueue });

    // Trigger background sync
    chrome.runtime.sendMessage({ action: 'syncFeedback' });

    showToast('Feedback sent! ty fr fr 🚀');
  } catch (err) {
    showToast('Could not send feedback rn', true);
  } finally {
    clearStatus();
    feedbackText.value = '';
  }
}

// ─────────────────────────────────────────
// Drag & Drop Events
// ─────────────────────────────────────────
dropZone.addEventListener('click', (e) => {
  if (e.target.closest('button')) return;
  fileInput.click();
});

dropZone.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-active');
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
});

dropZone.addEventListener('dragleave', (e) => {
  if (!dropZone.contains(e.relatedTarget)) {
    dropZone.classList.remove('drag-active');
  }
});

dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-active');
  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0) await handleFile(files[0]);
});

fileInput.addEventListener('change', async () => {
  if (fileInput.files.length > 0) await handleFile(fileInput.files[0]);
  fileInput.value = '';
});

// ─────────────────────────────────────────
// Button Events
// ─────────────────────────────────────────
btnOpenUrl.addEventListener('click', () => handleUrl(urlInput.value));
urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleUrl(urlInput.value); });

qaScane.addEventListener('click', scanCurrentPage);

qaConvert.addEventListener('click', () => { fileInput.click(); });

qaPaste.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text.startsWith('http')) {
      urlInput.value = text;
      showToast('URL pasted from clipboard 📋');
    } else {
      showToast('No URL in clipboard 🤔', true);
    }
  } catch {
    showToast('Clipboard access denied', true);
  }
});

qaFeedback.addEventListener('click', () => {
  feedbackModal.style.display = 'flex';
});

btnSettings.addEventListener('click', () => {
  loadSettings();
  settingsModal.style.display = 'flex';
});

// Modal close buttons
modalClose.addEventListener('click', () => { feedbackModal.style.display = 'none'; });
btnCancelFeedback.addEventListener('click', () => { feedbackModal.style.display = 'none'; });
settingsClose.addEventListener('click', () => { settingsModal.style.display = 'none'; });
btnSaveSettings.addEventListener('click', saveSettings);
btnSubmitFeedback.addEventListener('click', submitFeedback);

// Close modal on backdrop click
[feedbackModal, settingsModal].forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });
});

// ─────────────────────────────────────────
// Init
// ─────────────────────────────────────────
async function init() {
  // Load settings
  await loadSettings();

  // Check if current tab has file links
  const settings = await chrome.storage.sync.get({ autoscan: true });
  if (settings.autoscan) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:')) {
        // Show section immediately, scan runs when clicked
        pageFilesSection.style.display = 'block';
        document.getElementById('btn-scan-page').addEventListener('click', scanCurrentPage);
      }
    } catch {}
  }

  // Track popup open
  Analytics.track('popup_opened');
}

init();
