/**
 * FileFlux — Neon Serverless Postgres Database
 * Compatible with Vercel serverless functions.
 * Reads DATABASE_URL from environment variables.
 */

const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error('[DB] ⚠  DATABASE_URL is not set. Please add it to your .env file or Vercel environment variables.');
}

const sql = neon(process.env.DATABASE_URL || 'postgresql://localhost/fileflux');

// ─────────────────────────────────────────
// Schema Init (run once on cold start)
// ─────────────────────────────────────────
let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;

  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id          BIGSERIAL    PRIMARY KEY,
      type        TEXT         NOT NULL CHECK(type IN ('bug','feature','general','love')),
      text        TEXT         NOT NULL,
      version     TEXT         NOT NULL DEFAULT '1.0.0',
      browser     TEXT,
      os          TEXT,
      status      TEXT         NOT NULL DEFAULT 'new'
                               CHECK(status IN ('new','read','resolved','dismissed')),
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS analytics (
      id          BIGSERIAL    PRIMARY KEY,
      event       TEXT         NOT NULL,
      ext         TEXT,
      source      TEXT,
      version     TEXT,
      browser     TEXT,
      data        JSONB,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id           BIGSERIAL    PRIMARY KEY,
      session_key  TEXT         NOT NULL UNIQUE,
      browser      TEXT,
      os           TEXT,
      version      TEXT,
      files_opened INTEGER      NOT NULL DEFAULT 0,
      first_seen   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      last_seen    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_fb_type    ON feedback  (type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_fb_status  ON feedback  (status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_fb_created ON feedback  (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_an_event   ON analytics (event)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_an_created ON analytics (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_us_key     ON users     (session_key)`;

  schemaReady = true;
  console.log('[DB] Schema ready ✓');
}

// ─────────────────────────────────────────
// Feedback
// ─────────────────────────────────────────
async function addFeedback({ type, text, version = '1.0.0', browser = null, os = null }) {
  await ensureSchema();
  const rows = await sql`
    INSERT INTO feedback (type, text, version, browser, os)
    VALUES (${type}, ${text}, ${version}, ${browser}, ${os})
    RETURNING *
  `;
  return rows[0];
}

async function listFeedback({ type = null, status = null, limit = 50, offset = 0 } = {}) {
  await ensureSchema();
  return sql`
    SELECT * FROM feedback
    WHERE (${type}   IS NULL OR type   = ${type})
      AND (${status} IS NULL OR status = ${status})
    ORDER BY created_at DESC
    LIMIT  ${limit}
    OFFSET ${offset}
  `;
}

async function countFeedback({ type = null, status = null } = {}) {
  await ensureSchema();
  const rows = await sql`
    SELECT COUNT(*)::int AS total FROM feedback
    WHERE (${type}   IS NULL OR type   = ${type})
      AND (${status} IS NULL OR status = ${status})
  `;
  return rows[0].total;
}

async function updateFeedbackStatus(id, status) {
  await ensureSchema();
  const rows = await sql`
    UPDATE feedback
    SET status      = ${status},
        resolved_at = CASE WHEN ${status} = 'resolved' THEN NOW() ELSE NULL END
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] || null;
}

async function deleteFeedback(id) {
  await ensureSchema();
  const rows = await sql`DELETE FROM feedback WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

async function getFeedbackStats() {
  await ensureSchema();
  return sql`
    SELECT type, COUNT(*)::int AS count
    FROM feedback
    GROUP BY type
    ORDER BY count DESC
  `;
}

async function getRecentFeedback(n = 10) {
  await ensureSchema();
  return sql`SELECT * FROM feedback ORDER BY created_at DESC LIMIT ${n}`;
}

async function exportFeedbackCsv() {
  await ensureSchema();
  return sql`SELECT * FROM feedback ORDER BY created_at DESC LIMIT 9999`;
}

// ─────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────
async function addAnalyticsBatch(events) {
  if (!events || events.length === 0) return;
  await ensureSchema();

  // Insert each event (Neon doesn't support bulk unnest easily without pg)
  await Promise.all(events.map(evt =>
    sql`
      INSERT INTO analytics (event, ext, source, version, browser, data)
      VALUES (${evt.event}, ${evt.ext || null}, ${evt.source || null},
              ${evt.version || null}, ${evt.browser || null},
              ${evt.data ? JSON.stringify(evt.data) : null})
    `
  ));
}

async function getTopFormats(n = 10) {
  await ensureSchema();
  return sql`
    SELECT ext, COUNT(*)::int AS count
    FROM analytics
    WHERE event = 'file_opened' AND ext IS NOT NULL
    GROUP BY ext
    ORDER BY count DESC
    LIMIT ${n}
  `;
}

async function getEventsByDay() {
  await ensureSchema();
  return sql`
    SELECT DATE(created_at)::text AS day, COUNT(*)::int AS count
    FROM analytics
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  `;
}

async function getAnalyticsToday() {
  await ensureSchema();
  const rows = await sql`
    SELECT COUNT(*)::int AS total FROM analytics
    WHERE created_at >= DATE_TRUNC('day', NOW())
  `;
  return rows[0].total;
}

// ─────────────────────────────────────────
// Users
// ─────────────────────────────────────────
async function upsertUser({ session_key, browser = null, os = null, version = null, files_opened_delta = 0 }) {
  await ensureSchema();
  await sql`
    INSERT INTO users (session_key, browser, os, version, files_opened)
    VALUES (${session_key}, ${browser}, ${os}, ${version}, ${files_opened_delta})
    ON CONFLICT (session_key) DO UPDATE SET
      last_seen    = NOW(),
      version      = COALESCE(${version}, users.version),
      files_opened = users.files_opened + ${files_opened_delta}
  `;
}

async function getTotalUsers() {
  await ensureSchema();
  const rows = await sql`SELECT COUNT(*)::int AS total FROM users`;
  return rows[0].total;
}

async function getActiveUsers() {
  await ensureSchema();
  const rows = await sql`
    SELECT COUNT(*)::int AS total FROM users
    WHERE last_seen >= NOW() - INTERVAL '1 hour'
  `;
  return rows[0].total;
}

async function getUsers(limit = 50, offset = 0) {
  await ensureSchema();
  return sql`SELECT * FROM users ORDER BY last_seen DESC LIMIT ${limit} OFFSET ${offset}`;
}

async function getBrowserDistribution() {
  await ensureSchema();
  return sql`
    SELECT browser, COUNT(*)::int AS count
    FROM users WHERE browser IS NOT NULL
    GROUP BY browser ORDER BY count DESC
  `;
}

// ─────────────────────────────────────────
// Summary Stats
// ─────────────────────────────────────────
async function getSummaryStats() {
  await ensureSchema();

  const [users, active, files, convs, installs, totalFb, newFb, bugs, today] = await Promise.all([
    getTotalUsers(),
    getActiveUsers(),
    sql`SELECT COUNT(*)::int AS t FROM analytics WHERE event = 'file_opened'`.then(r => r[0].t),
    sql`SELECT COUNT(*)::int AS t FROM analytics WHERE event = 'file_converted'`.then(r => r[0].t),
    sql`SELECT COUNT(*)::int AS t FROM analytics WHERE event = 'extension_installed'`.then(r => r[0].t),
    countFeedback(),
    countFeedback({ status: 'new' }),
    countFeedback({ type: 'bug' }),
    getAnalyticsToday(),
  ]);

  return {
    totalUsers:       users,
    activeUsers:      active,
    totalFilesOpened: files,
    totalConversions: convs,
    totalInstalls:    installs,
    totalFeedback:    totalFb,
    newFeedback:      newFb,
    bugReports:       bugs,
    eventsToday:      today,
  };
}

module.exports = {
  ensureSchema,
  addFeedback,
  listFeedback,
  countFeedback,
  updateFeedbackStatus,
  deleteFeedback,
  getFeedbackStats,
  getRecentFeedback,
  exportFeedbackCsv,
  addAnalyticsBatch,
  getTopFormats,
  getEventsByDay,
  getAnalyticsToday,
  upsertUser,
  getTotalUsers,
  getActiveUsers,
  getUsers,
  getBrowserDistribution,
  getSummaryStats,
};
