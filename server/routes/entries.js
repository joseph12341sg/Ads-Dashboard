const express = require('express')
const router = express.Router()
const db = require('../db')

// ─── Helper ───────────────────────────────────────────────────────

function computeMetrics(entry) {
  if (!entry) return entry
  return {
    ...entry,
    cpl: entry.leads > 0 ? entry.amount_spent / entry.leads : null,
    cost_per_call: entry.calls > 0 ? entry.amount_spent / entry.calls : null,
    click_to_lead_rate: entry.link_clicks > 0 ? (entry.leads / entry.link_clicks) * 100 : null
  }
}

// ─── Entries ──────────────────────────────────────────────────────

// GET /api/entries — all entries, newest first
router.get('/', (req, res) => {
  try {
    const entries = db.getAllEntries().map(computeMetrics)
    res.json({ success: true, data: entries })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/entries/range?start=&end=
router.get('/range', (req, res) => {
  try {
    const { start, end } = req.query
    if (!start || !end) {
      return res.status(400).json({ success: false, error: 'start and end query params required' })
    }
    const entries = db.getEntriesInRange(start, end).map(computeMetrics)
    res.json({ success: true, data: entries })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/entries/:date
router.get('/:date', (req, res) => {
  try {
    const entry = db.getEntryByDate(req.params.date)
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Entry not found' })
    }
    res.json({ success: true, data: computeMetrics(entry) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/entries — create new entry
router.post('/', (req, res) => {
  try {
    const { date, amount_spent, link_clicks, leads, calls } = req.body

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'Valid date (YYYY-MM-DD) is required' })
    }

    const hasAtLeastOneMetric =
      amount_spent != null || link_clicks != null || leads != null || calls != null
    if (!hasAtLeastOneMetric) {
      return res.status(400).json({ success: false, error: 'At least one metric field must be provided' })
    }

    if (amount_spent != null && amount_spent < 0) {
      return res.status(400).json({ success: false, error: 'amount_spent must be >= 0' })
    }
    if (link_clicks != null && link_clicks < 0) {
      return res.status(400).json({ success: false, error: 'link_clicks must be >= 0' })
    }
    if (leads != null && leads < 0) {
      return res.status(400).json({ success: false, error: 'leads must be >= 0' })
    }
    if (calls != null && calls < 0) {
      return res.status(400).json({ success: false, error: 'calls must be >= 0' })
    }

    const existing = db.getEntryByDate(date)
    if (existing) {
      return res.status(409).json({ success: false, error: 'Entry already exists for this date. Use PUT to update.' })
    }

    const entry = db.createEntry({ date, amount_spent, link_clicks, leads, calls })
    res.status(201).json({ success: true, data: computeMetrics(entry) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PUT /api/entries/:date — update existing entry
router.put('/:date', (req, res) => {
  try {
    const { date } = req.params
    const { amount_spent, link_clicks, leads, calls } = req.body

    if (!db.getEntryByDate(date)) {
      return res.status(404).json({ success: false, error: 'Entry not found' })
    }

    if (amount_spent != null && amount_spent < 0) {
      return res.status(400).json({ success: false, error: 'amount_spent must be >= 0' })
    }
    if (link_clicks != null && link_clicks < 0) {
      return res.status(400).json({ success: false, error: 'link_clicks must be >= 0' })
    }
    if (leads != null && leads < 0) {
      return res.status(400).json({ success: false, error: 'leads must be >= 0' })
    }
    if (calls != null && calls < 0) {
      return res.status(400).json({ success: false, error: 'calls must be >= 0' })
    }

    const entry = db.updateEntry(date, { amount_spent, link_clicks, leads, calls })
    res.json({ success: true, data: computeMetrics(entry) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/entries/:date
router.delete('/:date', (req, res) => {
  try {
    const { date } = req.params
    const result = db.deleteEntry(date)
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Entry not found' })
    }
    res.json({ success: true, data: { deleted: date } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
