// localStorage persistence — no backend needed
const ENTRIES_KEY = 'ads_entries'
const SETTINGS_KEY = 'ads_settings'

function loadEntries() {
  try { return JSON.parse(localStorage.getItem(ENTRIES_KEY) || '[]') } catch { return [] }
}
function saveEntries(entries) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
}
function computeMetrics(entry) {
  return {
    ...entry,
    cpl: entry.leads > 0 ? entry.amount_spent / entry.leads : null,
    cost_per_call: entry.calls > 0 ? entry.amount_spent / entry.calls : null,
    click_to_lead_rate: entry.link_clicks > 0 ? (entry.leads / entry.link_clicks) * 100 : null
  }
}
function aggregateEntries(rows) {
  const totals = rows.reduce((acc, row) => {
    acc.amount_spent += row.amount_spent || 0
    acc.link_clicks += row.link_clicks || 0
    acc.leads += row.leads || 0
    acc.calls += row.calls || 0
    return acc
  }, { amount_spent: 0, link_clicks: 0, leads: 0, calls: 0 })
  return {
    ...totals,
    cpl: totals.leads > 0 ? totals.amount_spent / totals.leads : null,
    cost_per_call: totals.calls > 0 ? totals.amount_spent / totals.calls : null,
    click_to_lead_rate: totals.link_clicks > 0 ? (totals.leads / totals.link_clicks) * 100 : null,
    entry_count: rows.length,
    entries: rows
  }
}

export function getEntries() {
  return loadEntries().map(computeMetrics).sort((a, b) => b.date.localeCompare(a.date))
}
export function getEntryByDate(date) {
  const e = loadEntries().find(e => e.date === date)
  return e ? computeMetrics(e) : null
}
export function createEntry({ date, amount_spent, link_clicks, leads, calls }) {
  const entries = loadEntries()
  if (entries.find(e => e.date === date)) throw new Error('Entry already exists for this date')
  const entry = { id: Date.now(), date, amount_spent: amount_spent ?? null, link_clicks: link_clicks ?? null, leads: leads ?? null, calls: calls ?? null, created_at: new Date().toISOString() }
  entries.push(entry)
  saveEntries(entries)
  return computeMetrics(entry)
}
export function updateEntry(date, { amount_spent, link_clicks, leads, calls }) {
  const entries = loadEntries()
  const idx = entries.findIndex(e => e.date === date)
  if (idx === -1) throw new Error('Entry not found')
  entries[idx] = { ...entries[idx], amount_spent: amount_spent ?? null, link_clicks: link_clicks ?? null, leads: leads ?? null, calls: calls ?? null }
  saveEntries(entries)
  return computeMetrics(entries[idx])
}
export function deleteEntry(date) {
  const entries = loadEntries()
  const filtered = entries.filter(e => e.date !== date)
  if (filtered.length === entries.length) throw new Error('Entry not found')
  saveEntries(filtered)
}
export function getMonthlySummary(month) {
  return aggregateEntries(loadEntries().filter(e => e.date.startsWith(month)))
}
export function getWeeklySummary() {
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]
  return aggregateEntries(loadEntries().filter(e => e.date >= weekAgoStr))
}
export function getSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } catch { return {} }
}
export function saveSetting(key, value) {
  const s = getSettings(); s[key] = value
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  return { key, value }
}
