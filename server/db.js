const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbPath = process.env.DB_PATH || './data/dashboard.db'
const dbDir = path.dirname(dbPath)

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath)

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    amount_spent REAL,
    link_clicks INTEGER,
    leads INTEGER,
    calls INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`)

// ─── Entry Queries ────────────────────────────────────────────────

function getAllEntries() {
  return db.prepare(`
    SELECT * FROM entries ORDER BY date DESC
  `).all()
}

function getEntryByDate(date) {
  return db.prepare(`
    SELECT * FROM entries WHERE date = ?
  `).get(date)
}

function getEntriesInRange(start, end) {
  return db.prepare(`
    SELECT * FROM entries WHERE date >= ? AND date <= ? ORDER BY date ASC
  `).all(start, end)
}

function createEntry({ date, amount_spent, link_clicks, leads, calls }) {
  const stmt = db.prepare(`
    INSERT INTO entries (date, amount_spent, link_clicks, leads, calls)
    VALUES (?, ?, ?, ?, ?)
  `)
  const result = stmt.run(date, amount_spent ?? null, link_clicks ?? null, leads ?? null, calls ?? null)
  return getEntryByDate(date)
}

function updateEntry(date, { amount_spent, link_clicks, leads, calls }) {
  const stmt = db.prepare(`
    UPDATE entries
    SET amount_spent = ?, link_clicks = ?, leads = ?, calls = ?
    WHERE date = ?
  `)
  const result = stmt.run(amount_spent ?? null, link_clicks ?? null, leads ?? null, calls ?? null, date)
  return getEntryByDate(date)
}

function deleteEntry(date) {
  return db.prepare(`DELETE FROM entries WHERE date = ?`).run(date)
}

// ─── Summary Queries ──────────────────────────────────────────────

function getMonthlySummary(month) {
  // month format: YYYY-MM
  const rows = db.prepare(`
    SELECT * FROM entries WHERE date LIKE ? ORDER BY date ASC
  `).all(`${month}%`)
  return aggregateEntries(rows)
}

function getWeeklySummary() {
  const rows = db.prepare(`
    SELECT * FROM entries
    WHERE date >= date('now', '-6 days')
    ORDER BY date ASC
  `).all()
  return aggregateEntries(rows)
}

function aggregateEntries(rows) {
  const totals = rows.reduce(
    (acc, row) => {
      acc.amount_spent += row.amount_spent || 0
      acc.link_clicks += row.link_clicks || 0
      acc.leads += row.leads || 0
      acc.calls += row.calls || 0
      return acc
    },
    { amount_spent: 0, link_clicks: 0, leads: 0, calls: 0 }
  )

  return {
    ...totals,
    cpl: totals.leads > 0 ? totals.amount_spent / totals.leads : null,
    cost_per_call: totals.calls > 0 ? totals.amount_spent / totals.calls : null,
    click_to_lead_rate: totals.link_clicks > 0 ? (totals.leads / totals.link_clicks) * 100 : null,
    entry_count: rows.length,
    entries: rows
  }
}

// ─── Settings Queries ─────────────────────────────────────────────

function getAllSettings() {
  const rows = db.prepare(`SELECT key, value FROM settings`).all()
  const settings = {}
  for (const row of rows) {
    try {
      settings[row.key] = JSON.parse(row.value)
    } catch {
      settings[row.key] = row.value
    }
  }
  return settings
}

function setSetting(key, value) {
  db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, JSON.stringify(value))
  return { key, value }
}

module.exports = {
  getAllEntries,
  getEntryByDate,
  getEntriesInRange,
  createEntry,
  updateEntry,
  deleteEntry,
  getMonthlySummary,
  getWeeklySummary,
  getAllSettings,
  setSetting,
  aggregateEntries
}
