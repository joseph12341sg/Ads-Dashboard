const BASE_URL = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  })
  const data = await res.json()
  if (!data.success) {
    throw new Error(data.error || 'Request failed')
  }
  return data.data
}

// ─── Entries ──────────────────────────────────────────────────────

export const getEntries = () => request('/api/entries')

export const getEntryByDate = (date) => request(`/api/entries/${date}`)

export const getEntriesInRange = (start, end) =>
  request(`/api/entries/range?start=${start}&end=${end}`)

export const createEntry = (entry) =>
  request('/api/entries', { method: 'POST', body: JSON.stringify(entry) })

export const updateEntry = (date, entry) =>
  request(`/api/entries/${date}`, { method: 'PUT', body: JSON.stringify(entry) })

export const deleteEntry = (date) =>
  request(`/api/entries/${date}`, { method: 'DELETE' })

// ─── Summary ──────────────────────────────────────────────────────

export const getMonthlySummary = (month) =>
  request(`/api/summary/monthly?month=${month}`)

export const getWeeklySummary = () => request('/api/summary/weekly')

// ─── Settings ─────────────────────────────────────────────────────

export const getSettings = () => request('/api/settings')

export const saveSetting = (key, value) =>
  request('/api/settings', { method: 'POST', body: JSON.stringify({ key, value }) })
