/**
 * FileFlux Dashboard — Express API Server
 * Vercel-compatible: exports `app` for serverless, also runs standalone locally.
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./src/db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// ─────────────────────────────────────────
// ── FEEDBACK ─────────────────────────────
// ─────────────────────────────────────────

app.post('/api/feedback', async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'items array required' });

    const VALID = ['bug', 'feature', 'general', 'love'];
    const results = [];

    for (const item of items) {
      if (!VALID.includes(item.type))
        return res.status(400).json({ error: `Invalid type: "${item.type}"` });
      if (!item.text?.trim())
        return res.status(400).json({ error: 'Feedback text cannot be empty' });
      if (item.text.length > 2000)
        return res.status(400).json({ error: 'Text too long (max 2000 chars)' });

      results.push(await db.addFeedback({
        type:    item.type,
        text:    item.text.trim(),
        version: item.version || '1.0.0',
        browser: item.browser || null,
        os:      item.os      || null,
      }));
    }

    res.status(201).json({ ok: true, received: results.length, items: results });
  } catch (err) {
    console.error('[Feedback POST]', err.message);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

app.get('/api/feedback', async (req, res) => {
  try {
    const { type, status, limit = 50, offset = 0 } = req.query;
    const [items, total, stats] = await Promise.all([
      db.listFeedback({ type: type || null, status: status || null,
        limit: Math.min(parseInt(limit), 200), offset: Math.max(parseInt(offset), 0) }),
      db.countFeedback({ type: type || null, status: status || null }),
      db.getFeedbackStats(),
    ]);
    res.json({ items, total, stats });
  } catch (err) {
    console.error('[Feedback GET]', err.message);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

app.get('/api/feedback/recent', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    res.json({ items: await db.getRecentFeedback(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent feedback' });
  }
});

app.get('/api/feedback/export', async (req, res) => {
  try {
    const items  = await db.exportFeedbackCsv();
    const header = 'id,type,text,version,browser,os,status,created_at,resolved_at';
    const rows   = items.map(f =>
      [f.id, f.type, `"${(f.text || '').replace(/"/g, '""')}"`,
       f.version, f.browser, f.os, f.status, f.created_at, f.resolved_at].join(',')
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="fileflux_feedback_${Date.now()}.csv"`);
    res.send([header, ...rows].join('\n'));
  } catch (err) {
    res.status(500).json({ error: 'Failed to export' });
  }
});

app.patch('/api/feedback/:id/status', async (req, res) => {
  try {
    const id     = parseInt(req.params.id);
    const { status } = req.body;
    const VALID  = ['new', 'read', 'resolved', 'dismissed'];
    if (!VALID.includes(status))
      return res.status(400).json({ error: `Invalid status. Must be: ${VALID.join(', ')}` });

    const updated = await db.updateFeedbackStatus(id, status);
    if (!updated) return res.status(404).json({ error: 'Feedback not found' });

    res.json({ ok: true, item: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.delete('/api/feedback/:id', async (req, res) => {
  try {
    const deleted = await db.deleteFeedback(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Feedback not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

// ─────────────────────────────────────────
// ── ANALYTICS ────────────────────────────
// ─────────────────────────────────────────

app.post('/api/analytics', async (req, res) => {
  try {
    const { events } = req.body || {};
    if (!Array.isArray(events))
      return res.status(400).json({ error: 'events array required' });

    const mapped = events.map(evt => ({
      event:   evt.event,
      ext:     evt.data?.ext     || null,
      source:  evt.data?.source  || null,
      version: evt.version       || null,
      browser: evt.data?.browser || null,
      data:    evt.data          || null,
    }));

    await db.addAnalyticsBatch(mapped);

    // Upsert anonymous user sessions
    await Promise.all(events
      .filter(e => ['popup_opened', 'extension_installed', 'file_opened'].includes(e.event))
      .map(e => db.upsertUser({
        session_key:        `${e.version || 'x'}_${e.data?.browser || 'x'}_${req.ip}`,
        browser:            e.data?.browser || null,
        os:                 e.data?.os      || null,
        version:            e.version       || null,
        files_opened_delta: e.event === 'file_opened' ? 1 : 0,
      }))
    );

    res.json({ ok: true, received: events.length });
  } catch (err) {
    console.error('[Analytics POST]', err.message);
    res.status(500).json({ error: 'Failed to store events' });
  }
});

// ─────────────────────────────────────────
// ── STATS / HEALTH ────────────────────────
// ─────────────────────────────────────────

app.get('/api/stats', async (req, res) => {
  try {
    const [summary, topFormats, byDay, browsers, feedbackStats] = await Promise.all([
      db.getSummaryStats(),
      db.getTopFormats(10),
      db.getEventsByDay(),
      db.getBrowserDistribution(),
      db.getFeedbackStats(),
    ]);
    res.json({ summary, topFormats, byDay, browsers, feedbackStats });
  } catch (err) {
    console.error('[Stats]', err.message);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 50, 200);
    const offset = Math.max(parseInt(req.query.offset) || 0,  0);
    const [items, total] = await Promise.all([db.getUsers(limit, offset), db.getTotalUsers()]);
    res.json({ items, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const summary = await db.getSummaryStats();
    res.json({ status: 'ok', uptime: Math.floor(process.uptime()), db: 'neon-postgres', version: '1.0.0', ...summary });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// ─────────────────────────────────────────
// ── SPA Fallback ─────────────────────────
// ─────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─────────────────────────────────────────
// ── Start (local dev) or Export (Vercel) ─
// ─────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, async () => {
    const summary = await db.getSummaryStats().catch(() => ({}));
    console.log(`
  ⚡ FileFlux Dashboard (local)
  ──────────────────────────────────
  🌐 http://localhost:${PORT}
  🗄️  Neon Postgres (${process.env.DATABASE_URL ? 'connected' : 'NO DATABASE_URL SET'})
  💬 Feedback: ${summary.totalFeedback ?? '?'} items
  ──────────────────────────────────
    `);
  });
}

// Vercel uses this export
module.exports = app;
