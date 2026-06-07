/**
 * FileFlux — Content Script
 * Intercepts file links and adds FileFlux context to the page.
 */

(function () {
  'use strict';

  const FILE_EXTS = /\.(pdf|docx?|pptx?|xlsx?|zip|rar|7z|mp4|mkv|webm|mp3|wav|flac|png|jpg|jpeg|gif|svg|webp|csv|json|txt|md|epub|stl|obj|glb|ogg|aac|avi|mov|bmp|ico|tiff|heic|avif|fb2|mobi|rtf|odt|yaml|toml|ini|sh|py|js|ts|html|css|rb|go|rs|php|sql)(\?.*)?$/i;

  // Inject badge tooltip style into page (minimal, scoped)
  const style = document.createElement('style');
  style.textContent = `
    .fileflux-badge {
      display: inline-block;
      margin-left: 4px;
      padding: 1px 5px;
      background: linear-gradient(135deg, #00f5ff, #b14aed);
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      color: #08090e;
      vertical-align: middle;
      cursor: pointer;
      font-family: 'Space Grotesk', sans-serif;
      letter-spacing: 0.5px;
      opacity: 0.85;
      transition: opacity 0.2s;
    }
    .fileflux-badge:hover { opacity: 1; }
  `;
  document.head.appendChild(style);

  // Find all file links and add badges
  function decorateFileLinks() {
    const links = document.querySelectorAll('a[href]:not([data-fileflux])');

    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      if (!FILE_EXTS.test(href)) return;

      link.dataset.fileflux = '1';

      const badge = document.createElement('span');
      badge.className = 'fileflux-badge';
      badge.textContent = '⚡ FF';
      badge.title = 'Open with FileFlux';

      badge.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const absUrl = new URL(href, window.location.href).href;

        // Send to extension
        chrome.runtime.sendMessage({
          action: 'openFile',
          url: absUrl,
          name: decodeURIComponent(absUrl.split('/').pop() || 'file')
        });
      });

      link.insertAdjacentElement('afterend', badge);
    });
  }

  // Run on load and observe DOM changes
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    decorateFileLinks();
  } else {
    document.addEventListener('DOMContentLoaded', decorateFileLinks);
  }

  const observer = new MutationObserver(() => decorateFileLinks());
  observer.observe(document.body, { childList: true, subtree: true });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'scanPage') {
      decorateFileLinks();
    }
  });
})();
