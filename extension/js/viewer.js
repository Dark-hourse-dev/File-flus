/**
 * FileFlux — Viewer Controller
 * Handles loading, rendering, and editing of all supported file types.
 */

import { getFileInfo, getExtension, getFilenameFromUrl, formatFileSize, getConversionOptions } from './fileTypes.js';

// ─────────────────────────────────────────
// State
// ─────────────────────────────────────────
let currentFile = null;
let imgZoom = 1;
let imgRotate = 0;
let imgFlipH = false, imgFlipV = false;
let pdfDoc = null, pdfPage = 1, pdfScale = 1.5;
let isEditing = false;
let textContent = '';

// ─────────────────────────────────────────
// Show / Hide Panes
// ─────────────────────────────────────────
function showPane(id) {
  document.querySelectorAll('.viewer-pane, #viewer-loading, #viewer-error, #viewer-welcome')
    .forEach(el => el.style.display = 'none');
  document.getElementById(id).style.display = 'flex';
}

function showLoading() { showPane('viewer-loading'); }
function showError(msg) {
  document.getElementById('error-message').textContent = msg;
  showPane('viewer-error');
}
function showWelcome() { showPane('viewer-welcome'); }

// ─────────────────────────────────────────
// Status
// ─────────────────────────────────────────
function setStatus(msg) {
  document.getElementById('viewer-status-msg').textContent = msg;
}

// ─────────────────────────────────────────
// Update Topbar
// ─────────────────────────────────────────
function updateTopbar(file, info) {
  document.title = `${file.name} — FileFlux`;
  document.getElementById('file-icon').textContent = info.icon;
  document.getElementById('file-name').textContent = file.name;
  document.getElementById('file-type-badge').textContent = (file.ext || 'FILE').toUpperCase();
  document.getElementById('file-type-badge').className = 'tag tag-cyan';
  if (file.size) {
    document.getElementById('file-size').textContent = formatFileSize(file.size);
  }
}

// ─────────────────────────────────────────
// Viewers
// ─────────────────────────────────────────

// ── IMAGE ──
async function viewImage(file, info) {
  showPane('viewer-image');
  const img = document.getElementById('img-display');
  img.src = file.url;
  img.onload = () => setStatus(`${img.naturalWidth} × ${img.naturalHeight}px`);
  img.onerror = () => showError('Could not load image');
}

function applyImageTransform() {
  const img = document.getElementById('img-display');
  const scaleX = imgFlipH ? -imgZoom : imgZoom;
  const scaleY = imgFlipV ? -imgZoom : imgZoom;
  img.style.transform = `rotate(${imgRotate}deg) scale(${scaleX}, ${scaleY})`;
  document.getElementById('img-zoom-label').textContent = Math.round(imgZoom * 100) + '%';
}

document.getElementById('img-zoom-in').addEventListener('click',  () => { imgZoom = Math.min(imgZoom + 0.25, 10); applyImageTransform(); });
document.getElementById('img-zoom-out').addEventListener('click', () => { imgZoom = Math.max(imgZoom - 0.25, 0.1); applyImageTransform(); });
document.getElementById('img-reset').addEventListener('click',    () => { imgZoom = 1; imgRotate = 0; imgFlipH = false; imgFlipV = false; applyImageTransform(); });
document.getElementById('img-rotate').addEventListener('click',   () => { imgRotate = (imgRotate + 90) % 360; applyImageTransform(); });
document.getElementById('img-flip-h').addEventListener('click',   () => { imgFlipH = !imgFlipH; applyImageTransform(); });
document.getElementById('img-flip-v').addEventListener('click',   () => { imgFlipV = !imgFlipV; applyImageTransform(); });

// Mouse wheel zoom for image
document.getElementById('viewer-image').addEventListener('wheel', (e) => {
  e.preventDefault();
  imgZoom = Math.min(Math.max(imgZoom - e.deltaY * 0.001, 0.1), 10);
  applyImageTransform();
}, { passive: false });

// ── VIDEO ──
async function viewVideo(file) {
  showPane('viewer-video');
  const vid = document.getElementById('vid-display');
  vid.src = file.url;
  vid.onerror = () => showError('Cannot play this video format in browser. Try downloading.');
}

// ── AUDIO ──
async function viewAudio(file) {
  showPane('viewer-audio');
  document.getElementById('audio-title').textContent = file.name;
  const aud = document.getElementById('aud-display');
  aud.src = file.url;
}

// ─────────────────────────────────────────
// Fetch Proxy (Bypasses CORS via Background)
// ─────────────────────────────────────────
async function fetchProxy(url, type = 'text') {
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('file:')) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return type === 'arrayBuffer' ? await res.arrayBuffer() : await res.text();
  }
  const result = await chrome.runtime.sendMessage({ action: 'fetchUrl', url, responseType: type });
  if (!result || !result.ok) throw new Error(result?.error || 'Network error / CORS blocked');
  
  if (type === 'arrayBuffer') {
    const binary = atob(result.data);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }
  return result.data;
}

// ── PDF ──
async function viewPdf(file) {
  showPane('viewer-pdf');
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    setStatus('Loading PDF...');
    const buffer = await fetchProxy(file.url, 'arrayBuffer');
    pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    pdfPage = 1;
    await renderPdfPage();
    setStatus(`${pdfDoc.numPages} page(s)`);
  } catch (e) {
    showError('Could not render PDF: ' + e.message);
  }
}

async function renderPdfPage() {
  if (!pdfDoc) return;
  const page = await pdfDoc.getPage(pdfPage);
  const canvas = document.getElementById('pdf-canvas');
  const ctx = canvas.getContext('2d');
  const viewport = page.getViewport({ scale: pdfScale });
  canvas.width  = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: ctx, viewport }).promise;
  document.getElementById('pdf-pageinfo').textContent = `Page ${pdfPage} / ${pdfDoc.numPages}`;
}

document.getElementById('pdf-prev').addEventListener('click', async () => { if (pdfPage > 1) { pdfPage--; await renderPdfPage(); } });
document.getElementById('pdf-next').addEventListener('click', async () => { if (pdfDoc && pdfPage < pdfDoc.numPages) { pdfPage++; await renderPdfPage(); } });
document.getElementById('pdf-zoom-in').addEventListener('click',  async () => { pdfScale = Math.min(pdfScale + 0.25, 4); await renderPdfPage(); });
document.getElementById('pdf-zoom-out').addEventListener('click', async () => { pdfScale = Math.max(pdfScale - 0.25, 0.5); await renderPdfPage(); });

// ── TEXT / CODE / MARKDOWN ──
async function viewText(file, ext) {
  showPane('viewer-text');
  try {
    setStatus('Loading text...');
    textContent = await fetchProxy(file.url, 'text');

    const isMarkdown = ['md', 'markdown'].includes(ext);
    const code = document.getElementById('text-code');
    const mdPreview = document.getElementById('md-preview');
    const textView = document.getElementById('text-view-container');

    setStatus(`${textContent.split('\n').length} lines, ${formatFileSize(new Blob([textContent]).size)}`);
    document.getElementById('text-info').textContent = `${textContent.split('\n').length} lines`;

    if (isMarkdown) {
      mdPreview.innerHTML = marked.parse(textContent);
      mdPreview.style.display = 'block';
      textView.style.display = 'none';
    } else {
      code.textContent = textContent;
      if (ext && hljs.getLanguage(ext)) {
        hljs.highlightElement(code);
      }
      textView.style.display = 'block';
      mdPreview.style.display = 'none';
    }

    // Edit mode
    document.getElementById('text-editor').value = textContent;

  } catch (e) {
    showError('Could not load text file: ' + e.message);
  }
}

document.getElementById('text-edit-toggle').addEventListener('click', () => {
  const btn = document.getElementById('text-edit-toggle');
  const editor = document.getElementById('text-editor');
  const viewContainer = document.getElementById('text-view-container');
  const mdPreview = document.getElementById('md-preview');

  isEditing = !isEditing;
  btn.textContent = isEditing ? '👁 View' : '✏️ Edit';

  if (isEditing) {
    editor.style.display = 'block';
    viewContainer.style.display = 'none';
    mdPreview.style.display = 'none';
    editor.focus();
  } else {
    editor.style.display = 'none';
    textContent = editor.value;
    // Re-render
    viewText({ url: URL.createObjectURL(new Blob([textContent])), name: currentFile.name }, currentFile.ext);
  }
});

document.getElementById('text-wrap-toggle').addEventListener('click', () => {
  const display = document.getElementById('text-display');
  const isWrapped = display.style.whiteSpace === 'pre-wrap';
  display.style.whiteSpace = isWrapped ? 'pre' : 'pre-wrap';
});

document.getElementById('text-copy').addEventListener('click', async () => {
  await navigator.clipboard.writeText(textContent);
  document.getElementById('text-copy').textContent = '✓ Copied!';
  setTimeout(() => { document.getElementById('text-copy').textContent = '📋 Copy'; }, 1500);
});

// ── CSV / TABLE ──
async function viewCsv(file) {
  showPane('viewer-table');
  try {
    setStatus('Loading CSV...');
    const text = await fetchProxy(file.url, 'text');
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    const { data, meta } = result;

    if (!data.length) { showError('CSV is empty'); return; }

    const table = document.getElementById('csv-table');
    const search = document.getElementById('table-search');

    document.getElementById('table-info').textContent = `${data.length} rows × ${meta.fields.length} cols`;
    setStatus(`${data.length} rows`);

    function renderTable(rows) {
      table.innerHTML = '';
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');
      meta.fields.forEach(f => {
        const th = document.createElement('th');
        th.textContent = f;
        tr.appendChild(th);
      });
      thead.appendChild(tr);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      rows.forEach(row => {
        const tr = document.createElement('tr');
        meta.fields.forEach(f => {
          const td = document.createElement('td');
          td.textContent = row[f] || '';
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
    }

    renderTable(data);

    search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      const filtered = data.filter(row =>
        Object.values(row).some(v => String(v).toLowerCase().includes(q))
      );
      renderTable(filtered);
    });

    document.getElementById('table-copy-csv').addEventListener('click', async () => {
      await navigator.clipboard.writeText(text);
    });

  } catch (e) {
    showError('Could not parse CSV: ' + e.message);
  }
}

// ── ARCHIVE ──
async function viewArchive(file) {
  showPane('viewer-archive');
  try {
    setStatus('Loading archive...');
    const buf = await fetchProxy(file.url, 'arrayBuffer');
    const zip  = await JSZip.loadAsync(buf);

    const files = Object.values(zip.files);
    document.getElementById('archive-info').textContent =
      `📦 ${file.name} — ${files.length} items`;
    setStatus(`${files.length} items in archive`);

    const list = document.getElementById('archive-list');
    list.innerHTML = '';

    files.sort((a, b) => a.name.localeCompare(b.name)).forEach(f => {
      const ext  = getExtension(f.name.split('/').pop());
      const info = getFileInfo(ext);
      const item = document.createElement('div');
      item.className = 'archive-item';
      item.innerHTML = `
        <span class="archive-item-icon">${f.dir ? '📁' : info.icon}</span>
        <span class="archive-item-name">${f.name}</span>
        <span class="archive-item-size">${f.dir ? 'folder' : formatFileSize(f._data?.uncompressedSize || 0)}</span>
        ${!f.dir ? `<button class="btn btn-ghost btn-sm" data-name="${f.name}">Extract</button>` : ''}
      `;

      if (!f.dir) {
        item.querySelector('button').addEventListener('click', async () => {
          const blob = await f.async('blob');
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = f.name.split('/').pop();
          a.click();
          URL.revokeObjectURL(url);
        });
      }

      list.appendChild(item);
    });
  } catch (e) {
    showError('Could not open archive: ' + e.message);
  }
}

// ── DOCX ──
async function viewDocx(file) {
  showPane('viewer-docx');
  try {
    setStatus('Rendering DOCX...');
    const buffer = await fetchProxy(file.url, 'arrayBuffer');
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    document.getElementById('docx-content').innerHTML = result.value;
    setStatus('Loaded DOCX successfully');
  } catch (e) {
    showError('Could not render DOCX: ' + e.message);
  }
}

// ── XLSX ──
async function viewXlsx(file) {
  showPane('viewer-xlsx');
  try {
    setStatus('Rendering Spreadsheet...');
    const buffer = await fetchProxy(file.url, 'arrayBuffer');
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    const tabsContainer = document.getElementById('xlsx-tabs');
    const tableContainer = document.getElementById('xlsx-table');
    tabsContainer.innerHTML = '';
    
    workbook.SheetNames.forEach((sheetName, i) => {
      const btn = document.createElement('button');
      btn.className = `btn btn-sm ${i === 0 ? 'btn-primary' : 'btn-ghost'}`;
      btn.textContent = sheetName;
      btn.addEventListener('click', () => {
        tabsContainer.querySelectorAll('button').forEach(b => b.className = 'btn btn-sm btn-ghost');
        btn.className = 'btn btn-sm btn-primary';
        const html = XLSX.utils.sheet_to_html(workbook.Sheets[sheetName]);
        tableContainer.innerHTML = html.replace(/<table.*?>/i, '').replace(/<\/table>/i, '');
      });
      tabsContainer.appendChild(btn);
    });

    if (workbook.SheetNames.length > 0) {
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const html = XLSX.utils.sheet_to_html(firstSheet);
      tableContainer.innerHTML = html.replace(/<table.*?>/i, '').replace(/<\/table>/i, '');
    }
    setStatus('Loaded Spreadsheet successfully');
  } catch (e) {
    showError('Could not render Spreadsheet: ' + e.message);
  }
}

// ── OFFICE (Fallback) ──
function viewOffice(file, info) {
  showPane('viewer-office');
  document.getElementById('office-icon').textContent  = info.icon;
  document.getElementById('office-title').textContent = file.name;

  document.getElementById('office-google').addEventListener('click', () => {
    const container = document.getElementById('office-iframe-container');
    const iframe    = document.getElementById('office-iframe');
    
    // Google Docs Viewer needs a public HTTP/HTTPS URL to work
    if (file.url.startsWith('blob:') || file.url.startsWith('file:') || file.url.startsWith('data:')) {
      alert("Cannot open in Google Docs: This is a local file. Google Docs requires a public link to preview it.\n\nPlease click 'Download' to view it on your computer instead.");
      return;
    }

    const googleUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(file.url)}&embedded=true`;
    container.style.display = 'block';
    iframe.src = googleUrl;
    setStatus('Loading via Google Docs viewer...');
  });

  document.getElementById('office-download').addEventListener('click', () => {
    downloadFile(file);
  });
}

// ── UNKNOWN ──
function viewUnknown(file, info) {
  showPane('viewer-unknown');
  document.getElementById('unknown-icon').textContent = info.icon;
  document.getElementById('unknown-msg').textContent =
    `"${file.name}" — We don't have a native viewer for this format yet. You can download it or try opening it as plain text.`;

  document.getElementById('unknown-download').addEventListener('click', () => downloadFile(file));
  document.getElementById('unknown-text').addEventListener('click', () => viewText(file, 'txt'));
}

// ─────────────────────────────────────────
// Dispatch to correct viewer
// ─────────────────────────────────────────
async function loadFile(file) {
  currentFile = file;
  const info = getFileInfo(file.ext);

  updateTopbar(file, info);
  showLoading();
  setupConvertPanel(file.ext);

  try {
    switch (info.viewer) {
      case 'image':   await viewImage(file, info); break;
      case 'video':   await viewVideo(file); break;
      case 'audio':   await viewAudio(file); break;
      case 'pdf':     await viewPdf(file); break;
      case 'text':    await viewText(file, file.ext); break;
      case 'code':    await viewText(file, file.ext); break;
      case 'table':   await viewCsv(file); break;
      case 'archive': await viewArchive(file); break;
      case 'docx':    await viewDocx(file); break;
      case 'xlsx':    await viewXlsx(file); break;
      case 'office':  viewOffice(file, info); break;
      default:        viewUnknown(file, info); break;
    }
  } catch (e) {
    showError(`Error: ${e.message}`);
  }
}

// ─────────────────────────────────────────
// Convert Panel
// ─────────────────────────────────────────
function setupConvertPanel(ext) {
  const options = getConversionOptions(ext);
  const container = document.getElementById('convert-options');
  container.innerHTML = '';

  if (options.length === 0) {
    container.innerHTML = '<span style="font-size:12px; color:var(--text-muted)">No conversions available</span>';
    return;
  }

  options.forEach(targetExt => {
    const btn = document.createElement('button');
    btn.className = 'convert-option-btn';
    btn.textContent = `→ ${targetExt.toUpperCase()}`;
    btn.addEventListener('click', () => triggerConvert(ext, targetExt));
    container.appendChild(btn);
  });
}

document.getElementById('btn-convert').addEventListener('click', () => {
  const panel = document.getElementById('convert-panel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('convert-close').addEventListener('click', () => {
  document.getElementById('convert-panel').style.display = 'none';
});

async function triggerConvert(fromExt, toExt) {
  const statusDiv  = document.getElementById('convert-status');
  const statusText = document.getElementById('convert-status-text');
  const progressEl = document.getElementById('convert-progress');

  statusDiv.style.display = 'block';
  statusText.textContent = `Converting ${fromExt.toUpperCase()} → ${toExt.toUpperCase()}...`;
  progressEl.style.width = '20%';

  // Browser-native conversions
  try {
    if (['jpg','jpeg','png','webp','gif','bmp'].includes(fromExt) &&
        ['jpg','jpeg','png','webp','gif','bmp'].includes(toExt)) {

      progressEl.style.width = '60%';

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = currentFile.url;

      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);

      const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp' };
      const mime = mimeMap[toExt] || 'image/png';

      canvas.toBlob((blob) => {
        progressEl.style.width = '100%';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const newName = currentFile.name.replace(/\.[^.]+$/, '') + '.' + toExt;
        a.href = url; a.download = newName; a.click();
        statusText.textContent = `✓ Converted to ${toExt.toUpperCase()} and downloaded!`;
        setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
      }, mime, 0.92);

    } else if (fromExt === 'md' && toExt === 'html') {
      progressEl.style.width = '80%';
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${currentFile.name}</title></head><body>${marked.parse(textContent)}</body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = currentFile.name.replace('.md', '.html'); a.click();
      progressEl.style.width = '100%';
      statusText.textContent = `✓ Converted to HTML!`;
      setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);

    } else if (fromExt === 'csv' && toExt === 'json') {
      const resp = await fetch(currentFile.url);
      const text = await resp.text();
      const result = Papa.parse(text, { header: true, skipEmptyLines: true });
      progressEl.style.width = '80%';
      const json = JSON.stringify(result.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = currentFile.name.replace('.csv', '.json'); a.click();
      progressEl.style.width = '100%';
      statusText.textContent = '✓ Converted CSV to JSON!';
      setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);

    } else if (fromExt === 'txt' && toExt === 'html') {
      const content = textContent.split('\n').map(l => `<p>${l}</p>`).join('\n');
      const html = `<!DOCTYPE html><html><body>${content}</body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = currentFile.name.replace('.txt', '.html'); a.click();
      statusText.textContent = '✓ Converted to HTML!';
      progressEl.style.width = '100%';
      setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);

    } else {
      statusText.textContent = `⚠ Browser conversion for ${fromExt}→${toExt} not supported yet. Downloading original.`;
      progressEl.style.width = '100%';
      downloadFile(currentFile);
      setTimeout(() => { statusDiv.style.display = 'none'; }, 4000);
    }
  } catch (e) {
    statusText.textContent = `Error during conversion: ${e.message}`;
    setTimeout(() => { statusDiv.style.display = 'none'; }, 4000);
  }
}

// ─────────────────────────────────────────
// Download
// ─────────────────────────────────────────
function downloadFile(file) {
  // If it's a blob/local file, use the <a> tag fallback
  if (file.url.startsWith('blob:') || file.url.startsWith('data:')) {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name || 'download';
    a.click();
  } else {
    // For external URLs (especially protected ones like university portals),
    // use chrome.downloads to bypass CORS and attach the right cookies.
    chrome.downloads.download({
      url: file.url,
      filename: file.name || 'download',
      saveAs: false
    }).catch(err => {
      // Fallback if chrome.downloads fails for some reason
      console.warn('chrome.downloads failed, falling back to <a> tag', err);
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name || 'download';
      a.click();
    });
  }
}

document.getElementById('btn-download').addEventListener('click', () => {
  if (currentFile) downloadFile(currentFile);
});

document.getElementById('btn-try-download').addEventListener('click', () => {
  if (currentFile) downloadFile(currentFile);
});

document.getElementById('btn-back').addEventListener('click', () => window.close());
document.getElementById('btn-back-error').addEventListener('click', () => window.close());

document.getElementById('btn-share').addEventListener('click', async () => {
  if (!currentFile) return;
  try {
    await navigator.clipboard.writeText(currentFile.url);
    document.getElementById('btn-share').textContent = '✓ Copied!';
    setTimeout(() => { document.getElementById('btn-share').textContent = '📤'; }, 2000);
  } catch {}
});

// ─────────────────────────────────────────
// Welcome screen file input
// ─────────────────────────────────────────
document.getElementById('welcome-file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const ext  = getExtension(file.name);
  await loadFile({ url: URL.createObjectURL(file), name: file.name, ext, size: file.size, source: 'local' });
});

// ─────────────────────────────────────────
// Init — Load pending file from extension storage
// ─────────────────────────────────────────
async function init() {
  // Check for welcome param
  const params = new URLSearchParams(window.location.search);
  if (params.get('welcome') === '1') {
    showWelcome();
    return;
  }

  try {
    const result = await chrome.storage.session.get('pendingFile');
    const pending = result.pendingFile;

    if (!pending || !pending.url) {
      showWelcome();
      return;
    }

    // Clear pending
    await chrome.storage.session.remove('pendingFile');

    await loadFile({
      url:    pending.url,
      name:   pending.name || 'file',
      ext:    pending.ext  || getExtension(pending.name || ''),
      size:   pending.size || 0,
      source: pending.source || 'unknown'
    });

  } catch (e) {
    // Not in extension context (development)
    showWelcome();
  }
}

init();
