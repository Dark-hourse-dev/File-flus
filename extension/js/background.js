/**
 * FileFlux — Background Service Worker
 * Handles context menus, download interception, feedback sync.
 */

import { getApiUrl } from './config.js';

// ─────────────────────────────────────────
// Installation
// ─────────────────────────────────────────
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      autoscan: true,
      contextmenu: true,
      analytics: true,
      retro: true,
      installDate: new Date().toISOString()
    });

    // Track install
    trackEvent('extension_installed', { version: chrome.runtime.getManifest().version });

    // Open welcome tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('pages/viewer.html') + '?welcome=1'
    });
  }

  // Register context menus
  setupContextMenus();
});

// ─────────────────────────────────────────
// Context Menus
// ─────────────────────────────────────────
function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'fileflux-open-link',
      title: '⚡ Open with FileFlux',
      contexts: ['link'],
      documentUrlPatterns: ['<all_urls>']
    });

    chrome.contextMenus.create({
      id: 'fileflux-open-image',
      title: '⚡ View Image with FileFlux',
      contexts: ['image'],
      documentUrlPatterns: ['<all_urls>']
    });

    chrome.contextMenus.create({
      id: 'fileflux-scan-page',
      title: '🔍 Scan Page for Files',
      contexts: ['page'],
      documentUrlPatterns: ['<all_urls>']
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const url = info.linkUrl || info.srcUrl;

  if (info.menuItemId === 'fileflux-open-link' || info.menuItemId === 'fileflux-open-image') {
    if (!url) return;

    const name = getFilenameFromUrl(url);
    const ext  = getExtension(name);

    await chrome.storage.session.set({
      pendingFile: { url, name, ext, size: 0, timestamp: Date.now(), source: 'context_menu' }
    });

    chrome.tabs.create({ url: chrome.runtime.getURL('pages/viewer.html') });
    trackEvent('file_opened', { ext, source: 'context_menu' });
  }

  if (info.menuItemId === 'fileflux-scan-page' && tab) {
    chrome.action.openPopup();
  }
});

// ─────────────────────────────────────────
// Message Handler
// ─────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'syncFeedback') {
    syncFeedback();
    sendResponse({ ok: true });
  }
  if (msg.action === 'trackEvent') {
    trackEvent(msg.event, msg.data);
    sendResponse({ ok: true });
  }
  if (msg.action === 'fetchUrl') {
    // Proxy fetch to bypass CORS
    fetch(msg.url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return msg.responseType === 'arrayBuffer' ? r.arrayBuffer() : r.text();
      })
      .then(data => {
        if (msg.responseType === 'arrayBuffer') {
          // Convert arrayBuffer to base64 to send over message passing
          const base64 = btoa(new Uint8Array(data).reduce((acc, byte) => acc + String.fromCharCode(byte), ''));
          sendResponse({ ok: true, data: base64 });
        } else {
          sendResponse({ ok: true, data });
        }
      })
      .catch(err => {
        sendResponse({ ok: false, error: err.message });
      });
    return true; // keep channel open
  }
  return true;
});

// ─────────────────────────────────────────
// Feedback Sync
// ─────────────────────────────────────────
async function syncFeedback() {
  try {
    const stored = await chrome.storage.local.get({ feedbackQueue: [] });
    if (stored.feedbackQueue.length === 0) return;

    // Use URL from config.js
    const DASHBOARD_URL = getApiUrl('/api/feedback');

    const resp = await fetch(DASHBOARD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: stored.feedbackQueue })
    });

    if (resp.ok) {
      await chrome.storage.local.set({ feedbackQueue: [] });
      console.log('[FileFlux] Feedback synced successfully');
    }
  } catch (err) {
    console.warn('[FileFlux] Feedback sync failed (will retry):', err.message);
  }
}

// ─────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────
async function trackEvent(event, data = {}) {
  try {
    const settings = await chrome.storage.sync.get({ analytics: true });
    if (!settings.analytics) return;

    const queue = await chrome.storage.local.get({ analyticsQueue: [] });
    queue.analyticsQueue.push({
      event,
      data,
      timestamp: new Date().toISOString(),
      version: chrome.runtime.getManifest().version
    });

    // Keep max 100 events queued
    if (queue.analyticsQueue.length > 100) {
      queue.analyticsQueue = queue.analyticsQueue.slice(-100);
    }

    await chrome.storage.local.set({ analyticsQueue: queue.analyticsQueue });
    flushAnalytics();
  } catch {}
}

async function flushAnalytics() {
  try {
    const stored = await chrome.storage.local.get({ analyticsQueue: [] });
    if (stored.analyticsQueue.length === 0) return;

    const ANALYTICS_URL = getApiUrl('/api/analytics');

    const resp = await fetch(ANALYTICS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: stored.analyticsQueue })
    });

    if (resp.ok) {
      await chrome.storage.local.set({ analyticsQueue: [] });
    }
  } catch {}
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
function getExtension(filename) {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

function getFilenameFromUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    return decodeURIComponent(parts[parts.length - 1]) || u.hostname;
  } catch {
    return url.split('/').pop() || 'file';
  }
}

// ─────────────────────────────────────────
// Periodic Sync (every 30 min)
// ─────────────────────────────────────────
chrome.alarms.create('periodicSync', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodicSync') {
    syncFeedback();
    flushAnalytics();
  }
});
