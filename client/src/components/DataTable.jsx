import React, { useState, useMemo } from 'react'
import { deleteEntry } from '../api'

function fmt(v, type) {
  if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) return '—'
  if (type === 'currency') return `£${Number(v).toFixed(2)}`
  if (type === 'percent') return `${Number(v).toFixed(2)}%`
  if (type === 'integer') return Number(v).toLocaleString('en-GB')
  return v
}

const COLUMNS = [
  { key: 'date', label: 'Date', type: 'text' },
  { key: 'amount_spent', label: 'Spent', type: 'currency' },
  { key: 'link_clicks', label: 'Clicks', type: 'integer' },
  { key: 'leads', label: 'Leads', type: 'integer' },
  { key: 'calls', label: 'Calls', type: 'integer' },
  { key: 'cpl', label: 'CPL', type: 'currency' },
  { key: 'cost_per_call', label: 'Cost/Call', type: 'currency' },
  { key: 'click_to_lead_rate', label: 'Conv%', type: 'percent' }
]

export default function DataTable({ entries, onEdit, onDeleted }) {
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [confirmDelete, setConfirmDelete] = useState(null)

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = useMemo(() => {
    if (!entries?.length) return []
    return [...entries].sort((a, b) => {
      const av = a[sortKey] ?? (sortKey === 'date' ? '' : -Infinity)
      const bv = b[sortKey] ?? (sortKey === 'date' ? '' : -Infinity)
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [entries, sortKey, sortDir])

  function exportCSV() {
    const headers = COLUMNS.map(c => c.label)
    const rows = sorted.map(row =>
      COLUMNS.map(c => {
        const v = row[c.key]
        if (v === null || v === undefined) return ''
        return v
      })
    )
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ads-data-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDelete(date) {
    try {
      await deleteEntry(date)
      onDeleted(date)
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setConfirmDelete(null)
    }
  }

  if (!entries?.length) {
    return (
      <div className="card">
        <div className="section-header">
          <span className="section-title">Historical Data</span>
        </div>
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          <p>No entries yet. Add your first entry to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card data-table-card">
      <div className="section-header">
        <span className="section-title">Historical Data ({entries.length} entries)</span>
        <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`sortable ${sortKey === col.key ? 'sort-active' : ''}`}
                >
                  {col.label}
                  <span className="sort-icon">
                    {sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                  </span>
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(entry => (
              <tr key={entry.date} className="table-row">
                {COLUMNS.map(col => (
                  <td key={col.key} className={col.type === 'currency' || col.type === 'percent' ? 'mono' : ''}>
                    {fmt(entry[col.key], col.type)}
                  </td>
                ))}
                <td className="actions-cell">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onEdit(entry)}
                    title="Edit"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  {confirmDelete === entry.date ? (
                    <span className="confirm-delete">
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(entry.date)}>
                        Confirm
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(null)}>
                        ✕
                      </button>
                    </span>
                  ) : (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setConfirmDelete(entry.date)}
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
