/**
 * FileFlux Dashboard — JS Controller
 * Handles navigation, charts, mock data, and real-time updates.
 */

// ─────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────
const navItems = document.querySelectorAll('.nav-item');
const pages    = document.querySelectorAll('.page');

function showPage(pageId) {
  pages.forEach(p => p.style.display = 'none');
  document.getElementById('page-' + pageId).style.display = 'flex';

  navItems.forEach(n => n.classList.remove('active'));
  document.getElementById('nav-' + pageId)?.classList.add('active');

  const titles = {
    overview:  'Overview',
    users:     'Users',
    analytics: 'Analytics',
    feedback:  'Feedback',
    formats:   'File Formats',
    health:    'Health & Status'
  };
  document.getElementById('page-title').textContent = titles[pageId] || pageId;

  if (pageId === 'analytics') renderAnalyticsCharts();
  if (pageId === 'formats')   renderFormatsGrid();
  if (pageId === 'health')    renderHealth();
  if (pageId === 'users')     renderUsers();
  if (pageId === 'feedback')  renderFeedbackPage();
}

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    showPage(item.dataset.page);
  });
});

// Also handle "view all" links
document.querySelectorAll('[data-page]').forEach(el => {
  if (el.classList.contains('link-all')) {
    el.addEventListener('click', (e) => { e.preventDefault(); showPage(el.dataset.page); });
  }
});

// ─────────────────────────────────────────
// Clock
// ─────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById('page-time').textContent =
    now.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
updateClock();
setInterval(updateClock, 10000);

// ─────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateDayLabels(n) {
  const labels = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return labels;
}

const MOCK_USERS = Array.from({ length: 87 }, (_, i) => ({
  id: `ff_${String(i + 1).padStart(5, '0')}`,
  browser: ['Chrome', 'Firefox', 'Brave', 'Edge', 'Safari'][rand(0, 4)],
  os: ['Windows 11', 'macOS 14', 'Ubuntu 24', 'Windows 10', 'Arch Linux'][rand(0, 4)],
  version: ['1.0.0', '0.9.5', '0.9.0'][rand(0, 2)],
  filesOpened: rand(2, 340),
  lastSeen: new Date(Date.now() - rand(0, 7 * 86400000)).toLocaleString(),
  active: Math.random() > 0.5,
}));

// Feedback is now loaded from the real API — no mock array needed.

const FB_ICONS = { love: '❤️', feature: '✨', bug: '🐛', general: '💭' };
const FB_TAGS  = {
  love:    '<span class="tag tag-pink">❤️ Love</span>',
  feature: '<span class="tag tag-cyan">✨ Feature</span>',
  bug:     '<span class="tag tag-orange">🐛 Bug</span>',
  general: '<span class="tag tag-purple">💭 General</span>',
};

const FILE_TYPES_DATA = [
  { ext: 'pdf',  icon: '📄', name: 'PDF Document',    count: rand(800, 2000) },
  { ext: 'docx', icon: '📝', name: 'Word Document',   count: rand(400, 900)  },
  { ext: 'png',  icon: '🖼️', name: 'PNG Image',       count: rand(600, 1500) },
  { ext: 'jpg',  icon: '🖼️', name: 'JPEG Image',      count: rand(500, 1200) },
  { ext: 'mp4',  icon: '🎬', name: 'MP4 Video',       count: rand(300, 700)  },
  { ext: 'mp3',  icon: '🎵', name: 'MP3 Audio',       count: rand(200, 500)  },
  { ext: 'zip',  icon: '🗜️', name: 'ZIP Archive',     count: rand(150, 400)  },
  { ext: 'csv',  icon: '📊', name: 'CSV Spreadsheet', count: rand(250, 600)  },
  { ext: 'svg',  icon: '✏️', name: 'SVG Vector',      count: rand(100, 300)  },
  { ext: 'md',   icon: '📑', name: 'Markdown',        count: rand(80, 250)   },
  { ext: 'json', icon: '🔧', name: 'JSON Data',       count: rand(200, 450)  },
  { ext: 'xlsx', icon: '📗', name: 'Excel Sheet',     count: rand(180, 380)  },
  { ext: 'webm', icon: '🎬', name: 'WebM Video',      count: rand(60, 200)   },
  { ext: 'flac', icon: '🎵', name: 'FLAC Audio',      count: rand(40, 150)   },
  { ext: 'epub', icon: '📚', name: 'ePub eBook',      count: rand(30, 120)   },
  { ext: 'stl',  icon: '🎲', name: 'STL 3D Model',   count: rand(10, 80)    },
  { ext: 'pptx', icon: '📊', name: 'PowerPoint',      count: rand(120, 280)  },
  { ext: 'mkv',  icon: '🎬', name: 'MKV Video',       count: rand(80, 200)   },
];

// ─────────────────────────────────────────
// Overview Charts
// ─────────────────────────────────────────
const CHART_DEFAULTS = {
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#5d6189', font: { family: 'Space Grotesk' } } },
    y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#5d6189', font: { family: 'Space Grotesk' } } }
  }
};

function drawGrowthChart() {
  const labels = generateDayLabels(14);
  const users  = labels.map(() => rand(200, 1200));
  const opens  = labels.map(() => rand(800, 3500));

  const ctx = document.getElementById('chart-growth').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Users', data: users,
          borderColor: '#00f5ff', backgroundColor: 'rgba(0,245,255,0.08)',
          fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#00f5ff'
        },
        {
          label: 'File Opens', data: opens,
          borderColor: '#ff2d9e', backgroundColor: 'rgba(255,45,158,0.05)',
          fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#ff2d9e'
        }
      ]
    },
    options: { ...CHART_DEFAULTS, plugins: { legend: { display: true, labels: { color: '#9a9ec6', font: { family: 'Space Grotesk' } } } } }
  });
}

function drawFormatsChart() {
  const top5 = [...FILE_TYPES_DATA].sort((a, b) => b.count - a.count).slice(0, 6);
  const ctx  = document.getElementById('chart-formats').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: top5.map(f => f.ext.toUpperCase()),
      datasets: [{
        data: top5.map(f => f.count),
        backgroundColor: ['#00f5ff','#ff2d9e','#b14aed','#ffe600','#ff6b35','#39ff14'],
        borderColor: '#111422',
        borderWidth: 3
      }]
    },
    options: {
      plugins: {
        legend: { display: true, position: 'right', labels: { color: '#9a9ec6', font: { family: 'Space Grotesk', size: 11 }, padding: 12 } }
      }
    }
  });
}

// ─────────────────────────────────────────
// Activity Feed (live simulation)
// ─────────────────────────────────────────
const ACTIVITY_TEMPLATES = [
  (ext) => ({ icon: '📂', text: `User opened a <strong>.${ext}</strong> file` }),
  (ext) => ({ icon: '🔄', text: `File converted from <strong>.${ext}</strong>` }),
  ()    => ({ icon: '🔍', text: 'Page scan completed — files detected' }),
  ()    => ({ icon: '💬', text: 'New feedback submitted' }),
  (ext) => ({ icon: '⬇', text: `<strong>.${ext}</strong> file downloaded` }),
  ()    => ({ icon: '🆕', text: 'New user installed FileFlux' }),
];
const EXTS = ['pdf','mp4','docx','png','zip','csv','mp3','svg','json','xlsx'];

function addActivityItem(text, icon) {
  const feed = document.getElementById('activity-feed');
  const item = document.createElement('div');
  item.className = 'activity-item';
  item.innerHTML = `
    <span class="activity-item-icon">${icon}</span>
    <span class="activity-item-text">${text}</span>
    <span class="activity-item-time">just now</span>
  `;
  feed.insertBefore(item, feed.firstChild);
  if (feed.children.length > 20) feed.removeChild(feed.lastChild);
}

function seedActivityFeed() {
  const times = ['2s ago','5s ago','12s ago','28s ago','1m ago','2m ago','3m ago','5m ago'];
  times.forEach((t, i) => {
    const tpl = ACTIVITY_TEMPLATES[i % ACTIVITY_TEMPLATES.length];
    const ext = EXTS[rand(0, EXTS.length - 1)];
    const { icon, text } = tpl(ext);
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <span class="activity-item-icon">${icon}</span>
      <span class="activity-item-text">${text}</span>
      <span class="activity-item-time">${t}</span>
    `;
    document.getElementById('activity-feed').appendChild(item);
  });
}

function startLiveActivity() {
  setInterval(() => {
    if (document.getElementById('page-overview').style.display !== 'none') {
      const tpl = ACTIVITY_TEMPLATES[rand(0, ACTIVITY_TEMPLATES.length - 1)];
      const ext = EXTS[rand(0, EXTS.length - 1)];
      const { icon, text } = tpl(ext);
      addActivityItem(text, icon);
    }
  }, 3000);
}

// ─────────────────────────────────────────
// Recent Feedback (overview) — fetched from API
// ─────────────────────────────────────────
async function renderRecentFeedback() {
  const container = document.getElementById('recent-feedback');
  container.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px">Loading...</div>';
  try {
    const res  = await fetch('/api/feedback/recent?limit=5');
    const data = await res.json();
    container.innerHTML = '';

    if (!data.items || data.items.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px">No feedback yet.</div>';
      return;
    }

    data.items.forEach(fb => {
      const relTime = getRelativeTime(fb.created_at);
      const el = document.createElement('div');
      el.className = 'feedback-item-small';
      el.innerHTML = `
        <span class="fb-type-icon">${FB_ICONS[fb.type]}</span>
        <div class="fb-content">
          <div class="fb-text-preview">${fb.text}</div>
          <div class="fb-meta">${relTime} · v${fb.version} · ${fb.browser || 'Unknown'}</div>
        </div>
        <span class="tag ${fb.status === 'new' ? 'tag-pink' : 'tag-purple'}" style="flex-shrink:0">${fb.status}</span>
      `;
      container.appendChild(el);
    });

    // Update badge with real count
    const bugCount = data.items.filter(f => f.type === 'bug' && f.status === 'new').length;
    if (bugCount > 0) document.getElementById('badge-feedback').textContent = bugCount;

  } catch (err) {
    container.innerHTML = '<div style="color:var(--neon-pink);font-size:12px;padding:8px">Failed to load feedback</div>';
  }
}

// Format DB datetime string as relative time
function getRelativeTime(dateStr) {
  if (!dateStr) return 'Unknown';
  const then = new Date(dateStr.replace(' ', 'T') + 'Z');
  const diff = Date.now() - then.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─────────────────────────────────────────
// Analytics Charts
// ─────────────────────────────────────────
let analyticsInitialized = false;
function renderAnalyticsCharts() {
  if (analyticsInitialized) return;
  analyticsInitialized = true;

  // DAU
  const dauCtx = document.getElementById('chart-dau').getContext('2d');
  new Chart(dauCtx, {
    type: 'bar',
    data: {
      labels: generateDayLabels(30),
      datasets: [{
        label: 'DAU',
        data: Array.from({ length: 30 }, () => rand(150, 900)),
        backgroundColor: 'rgba(0,245,255,0.3)',
        borderColor: '#00f5ff',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: CHART_DEFAULTS
  });

  // Browser
  const brCtx = document.getElementById('chart-browsers').getContext('2d');
  new Chart(brCtx, {
    type: 'pie',
    data: {
      labels: ['Chrome', 'Firefox', 'Brave', 'Edge', 'Other'],
      datasets: [{
        data: [52, 24, 14, 7, 3],
        backgroundColor: ['#00f5ff','#ff6b35','ff2d9e','#b14aed','#888'],
        borderColor: '#111422', borderWidth: 3
      }]
    },
    options: {
      plugins: { legend: { display: true, labels: { color: '#9a9ec6', font: { family: 'Space Grotesk' } } } }
    }
  });

  // Conversions
  const cvCtx = document.getElementById('chart-conversions').getContext('2d');
  new Chart(cvCtx, {
    type: 'bar',
    data: {
      labels: ['JPG→PNG', 'CSV→JSON', 'PNG→PDF', 'MD→HTML', 'PDF→TXT', 'MP4→GIF', 'DOC→PDF'],
      datasets: [{
        data: [312, 201, 155, 134, 98, 67, 44],
        backgroundColor: ['#00f5ff','#b14aed','#ff2d9e','#ffe600','#ff6b35','#39ff14','#3a86ff'],
        borderRadius: 6
      }]
    },
    options: { ...CHART_DEFAULTS, indexAxis: 'y' }
  });

  // Heatmap
  renderHeatmap();
}

function renderHeatmap() {
  const container = document.getElementById('heatmap-container');
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  days.forEach(day => {
    const row = document.createElement('div');
    row.className = 'heatmap-row';
    const label = document.createElement('span');
    label.className = 'heatmap-label';
    label.textContent = day;
    row.appendChild(label);

    hours.forEach(h => {
      const v = rand(0, 100);
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      cell.title = `${day} ${h}:00 — ${v} actions`;
      if (v > 75) cell.style.background = 'rgba(0,245,255,0.8)';
      else if (v > 50) cell.style.background = 'rgba(0,245,255,0.4)';
      else if (v > 25) cell.style.background = 'rgba(177,74,237,0.3)';
      else if (v > 10) cell.style.background = 'rgba(177,74,237,0.1)';
      row.appendChild(cell);
    });

    container.appendChild(row);
  });
}

// ─────────────────────────────────────────
// Users Page
// ─────────────────────────────────────────
let filteredUsers = [...MOCK_USERS];
let currentPage = 1;
const PAGE_SIZE = 12;

function renderUsers() {
  const tbody = document.getElementById('users-tbody');
  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = filteredUsers.slice(start, start + PAGE_SIZE);

  tbody.innerHTML = '';
  page.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code style="color:var(--neon-cyan);font-size:11px">${u.id}</code></td>
      <td>${getBrowserEmoji(u.browser)} ${u.browser}</td>
      <td>${u.os}</td>
      <td><span class="tag tag-purple">${u.version}</span></td>
      <td style="font-weight:700; color:var(--text-primary)">${u.filesOpened.toLocaleString()}</td>
      <td style="color:var(--text-muted); font-size:12px">${u.lastSeen}</td>
      <td><span class="tag ${u.active ? 'tag-green' : 'tag-pink'}">${u.active ? '● Active' : '○ Idle'}</span></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('user-count').textContent = `${filteredUsers.length} users`;
  renderPagination();
}

function getBrowserEmoji(b) {
  return { Chrome: '🌐', Firefox: '🦊', Brave: '🦁', Edge: '🔷', Safari: '🧭' }[b] || '🌐';
}

function renderPagination() {
  const total = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const container = document.getElementById('user-pagination');
  container.innerHTML = '';

  for (let i = 1; i <= total; i++) {
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
    btn.textContent = i;
    btn.addEventListener('click', () => { currentPage = i; renderUsers(); });
    container.appendChild(btn);
  }
}

document.getElementById('user-search').addEventListener('input', () => {
  const q = document.getElementById('user-search').value.toLowerCase();
  filteredUsers = MOCK_USERS.filter(u =>
    u.id.includes(q) || u.browser.toLowerCase().includes(q) || u.os.toLowerCase().includes(q)
  );
  currentPage = 1;
  renderUsers();
});

document.getElementById('user-filter-browser').addEventListener('change', () => {
  const br = document.getElementById('user-filter-browser').value.toLowerCase();
  filteredUsers = br ? MOCK_USERS.filter(u => u.browser.toLowerCase() === br) : [...MOCK_USERS];
  currentPage = 1;
  renderUsers();
});

// ─────────────────────────────────────────
// Feedback Page — fetched from real API
// ─────────────────────────────────────────
async function renderFeedbackPage() {
  const container = document.getElementById('feedback-cards');
  const typeFilter   = document.getElementById('fb-filter').value;
  const statusFilter = document.getElementById('fb-status-filter')?.value || '';

  container.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:20px">⏳ Loading from database...</div>';

  try {
    const params = new URLSearchParams({ limit: 100 });
    if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

    const res  = await fetch(`/api/feedback?${params}`);
    const data = await res.json();

    container.innerHTML = '';

    // Update badge
    const bugNew = (data.stats || []).find(s => s.type === 'bug')?.count || 0;
    document.getElementById('badge-feedback').textContent = data.total || 0;

    if (!data.items || data.items.length === 0) {
      container.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--text-muted)">No feedback found 🤷</div>';
      return;
    }

    data.items.forEach(fb => {
      const relTime = getRelativeTime(fb.created_at);
      const el = document.createElement('div');
      el.className = 'feedback-card';
      el.dataset.id = fb.id;
      el.innerHTML = `
        <div class="fb-card-header">
          <span style="font-size:20px">${FB_ICONS[fb.type]}</span>
          ${FB_TAGS[fb.type]}
          <span class="tag ${fb.status === 'new' ? 'tag-pink' : fb.status === 'resolved' ? 'tag-green' : 'tag-purple'}" style="font-size:10px">${fb.status.toUpperCase()}</span>
          <span style="font-size:12px;color:var(--text-muted);margin-left:auto">
            ${fb.browser || '?'} · v${fb.version} · ${relTime}
          </span>
        </div>
        <div class="fb-card-body">${fb.text}</div>
        <div class="fb-card-footer">
          <button class="btn btn-ghost btn-sm btn-resolve" data-id="${fb.id}" ${fb.status === 'resolved' ? 'disabled' : ''}>✓ Resolve</button>
          <button class="btn btn-ghost btn-sm btn-dismiss" data-id="${fb.id}">⊘ Dismiss</button>
          <button class="btn btn-sm btn-danger btn-delete" data-id="${fb.id}" style="margin-left:auto">🗑 Delete</button>
        </div>
      `;

      // Resolve
      el.querySelector('.btn-resolve').addEventListener('click', async () => {
        await fetch(`/api/feedback/${fb.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'resolved' })
        });
        renderFeedbackPage();
      });

      // Dismiss
      el.querySelector('.btn-dismiss').addEventListener('click', async () => {
        await fetch(`/api/feedback/${fb.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'dismissed' })
        });
        renderFeedbackPage();
      });

      // Delete
      el.querySelector('.btn-delete').addEventListener('click', async () => {
        if (!confirm('Delete this feedback? This cannot be undone.')) return;
        await fetch(`/api/feedback/${fb.id}`, { method: 'DELETE' });
        el.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => el.remove(), 300);
      });

      container.appendChild(el);
    });

  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--neon-pink);padding:20px">⚠ Failed to load feedback: ${err.message}</div>`;
  }
}

document.getElementById('fb-filter').addEventListener('change', renderFeedbackPage);

document.getElementById('btn-export-feedback').addEventListener('click', () => {
  window.open('/api/feedback/export', '_blank');
});

// ─────────────────────────────────────────
// Formats Grid
// ─────────────────────────────────────────
function renderFormatsGrid() {
  const grid = document.getElementById('formats-grid');
  if (grid.children.length > 0) return;

  [...FILE_TYPES_DATA].sort((a, b) => b.count - a.count).forEach(f => {
    const el = document.createElement('div');
    el.className = 'format-item';
    el.innerHTML = `
      <span class="format-item-icon">${f.icon}</span>
      <span class="format-item-ext">.${f.ext}</span>
      <span class="format-item-name">${f.name}</span>
      <span class="format-item-count">${f.count.toLocaleString()} opens</span>
    `;
    grid.appendChild(el);
  });
}

// ─────────────────────────────────────────
// Health Page
// ─────────────────────────────────────────
const startTime = Date.now();
function renderHealth() {
  const uptimeEl = document.getElementById('health-uptime');
  setInterval(() => {
    const diff = Date.now() - startTime;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    uptimeEl.textContent = `${h}h ${m}m ${s}s`;
  }, 1000);

  const logs = document.getElementById('system-logs');
  const SAMPLE_LOGS = [
    { level: 'ok', msg: 'Analytics flush completed — 47 events sent' },
    { level: 'ok', msg: 'Feedback queue processed — 3 items synced' },
    { level: 'info', msg: 'New user session started: ff_00088' },
    { level: 'ok', msg: 'Extension health check passed' },
    { level: 'info', msg: 'Context menu registered successfully' },
    { level: 'warn', msg: 'Rate limit approaching on analytics endpoint (78%)' },
    { level: 'info', msg: 'Alarm fired: periodicSync' },
    { level: 'ok', msg: 'Storage quota nominal: 12% used' },
    { level: 'info', msg: '284 active sessions detected' },
    { level: 'error', msg: 'MKV stream decode failed for user ff_00023 — fallback to download' },
    { level: 'ok', msg: 'Service worker activated: v1.0.0' },
  ];

  SAMPLE_LOGS.forEach(log => {
    const now = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = `
      <span class="log-time">${now}</span>
      <span class="log-level ${log.level}">[${log.level.toUpperCase()}]</span>
      <span class="log-msg">${log.msg}</span>
    `;
    logs.appendChild(line);
  });
}

// ─────────────────────────────────────────
// Refresh
// ─────────────────────────────────────────
document.getElementById('btn-refresh').addEventListener('click', () => {
  const btn = document.getElementById('btn-refresh');
  btn.textContent = '⏳ Refreshing...';
  btn.disabled = true;

  // Simulate refresh with small delay
  setTimeout(() => {
    // Bump KPI values slightly
    const kpiUsers = document.getElementById('kpi-users');
    kpiUsers.textContent = (parseInt(kpiUsers.textContent.replace(/,/g,'')) + rand(0, 5)).toLocaleString();

    const kpiFiles = document.getElementById('kpi-files');
    kpiFiles.textContent = (parseInt(kpiFiles.textContent.replace(/,/g,'')) + rand(0, 20)).toLocaleString();

    const sessions = document.getElementById('kpi-sessions');
    sessions.textContent = rand(250, 320);

    btn.textContent = '🔄 Refresh';
    btn.disabled = false;
  }, 1200);
});

// ─────────────────────────────────────────
// Init
// ─────────────────────────────────────────
function init() {
  // Initialize overview
  drawGrowthChart();
  drawFormatsChart();
  seedActivityFeed();
  renderRecentFeedback();
  startLiveActivity();

  // Fetch real counts from API for badges
  fetch('/api/stats').then(r => r.json()).then(data => {
    if (data.summary) {
      document.getElementById('badge-users').textContent    = data.summary.totalUsers || MOCK_USERS.length;
      document.getElementById('badge-feedback').textContent = data.summary.newFeedback || 0;
    }
  }).catch(() => {
    document.getElementById('badge-users').textContent = MOCK_USERS.length;
  });
}

init();
