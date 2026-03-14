require('dotenv').config()
const express = require('express')
const cors = require('cors')
const db = require('./db')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// ─── Routes ───────────────────────────────────────────────────────

const entriesRouter = require('./routes/entries')

// Summary routes (must come before /:date to avoid conflicts)
app.get('/api/summary/monthly', (req, res) => {
  try {
    const { month } = req.query
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, error: 'Valid month (YYYY-MM) is required' })
    }
    const summary = db.getMonthlySummary(month)
    res.json({ success: true, data: summary })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/api/summary/weekly', (req, res) => {
  try {
    const summary = db.getWeeklySummary()
    res.json({ success: true, data: summary })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Entries routes
app.use('/api/entries', entriesRouter)

// Settings routes
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.getAllSettings()
    res.json({ success: true, data: settings })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.post('/api/settings', (req, res) => {
  try {
    const { key, value } = req.body
    if (!key) {
      return res.status(400).json({ success: false, error: 'key is required' })
    }
    const result = db.setSetting(key, value)
    res.json({ success: true, data: result })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } })
})

app.listen(PORT, () => {
  console.log(`Ads Dashboard API running on port ${PORT}`)
})
