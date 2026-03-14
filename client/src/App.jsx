import React, { useState, useEffect, useCallback } from 'react'
import './components/components.css'

import dayjs from 'dayjs'
import Header from './components/Header'
import MetricCard from './components/MetricCard'
import DailyInputForm from './components/DailyInputForm'
import DataTable from './components/DataTable'
import TrendChart from './components/TrendChart'
import TargetBanner from './components/TargetBanner'
import BudgetPacing from './components/BudgetPacing'
import SettingsPanel from './components/SettingsPanel'
import Calculator from './components/Calculator'
import {
  getEntries,
  getMonthlySummary,
  getSettings
} from './api'

// ─── Toast System ──────────────────────────────────────────────────
let toastId = 0

function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  return { toasts, addToast }
}

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && '✓'}
          {t.type === 'error' && '✕'}
          {t.type === 'info' && 'ℹ'}
          {t.message}
        </div>
      ))}
    </div>
  )
}

// ─── Aggregate helper ──────────────────────────────────────────────
function aggregateForPeriod(entries, period) {
  if (!entries?.length) return null
  const totals = entries.reduce(
    (acc, e) => {
      acc.amount_spent += e.amount_spent || 0
      acc.link_clicks += e.link_clicks || 0
      acc.leads += e.leads || 0
      acc.calls += e.calls || 0
      return acc
    },
    { amount_spent: 0, link_clicks: 0, leads: 0, calls: 0 }
  )
  return {
    ...totals,
    cpl: totals.leads > 0 ? totals.amount_spent / totals.leads : null,
    cost_per_call: totals.calls > 0 ? totals.amount_spent / totals.calls : null,
    click_to_lead_rate: totals.link_clicks > 0 ? (totals.leads / totals.link_clicks) * 100 : null
  }
}

// ─── App ───────────────────────────────────────────────────────────
export default function App() {
  const [period, setPeriod] = useState('daily')
  const [entries, setEntries] = useState([])
  const [settings, setSettings] = useState({})
  const [monthlySummary, setMonthlySummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const { toasts, addToast } = useToast()

  const loadData = useCallback(async () => {
    try {
      const [allEntries, allSettings] = await Promise.all([
        getEntries(),
        getSettings()
      ])
      setEntries(allEntries)
      setSettings(allSettings)

      // Load monthly summary for budget pacing
      const currentMonth = dayjs().format('YYYY-MM')
      const monthly = await getMonthlySummary(currentMonth)
      setMonthlySummary(monthly)
    } catch (err) {
      console.error('Failed to load data:', err)
      addToast('Failed to load data from server', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ─── Period filtering ────────────────────────────────────────────
  const filteredEntries = React.useMemo(() => {
    if (!entries.length) return []
    const today = dayjs()

    if (period === 'daily') {
      const todayStr = today.format('YYYY-MM-DD')
      return entries.filter(e => e.date === todayStr)
    }
    if (period === 'weekly') {
      const weekAgo = today.subtract(6, 'day').format('YYYY-MM-DD')
      return entries.filter(e => e.date >= weekAgo)
    }
    if (period === 'monthly') {
      const monthStart = today.startOf('month').format('YYYY-MM-DD')
      return entries.filter(e => e.date >= monthStart)
    }
    return entries
  }, [entries, period])

  const summary = React.useMemo(
    () => aggregateForPeriod(filteredEntries, period),
    [filteredEntries, period]
  )

  // ─── Handlers ───────────────────────────────────────────────────
  async function handleEntrySaved(action) {
    await loadData()
    addToast(action === 'updated' ? 'Entry updated successfully' : 'Entry saved successfully', 'success')
    setEditEntry(null)
  }

  async function handleEntryDeleted(date) {
    await loadData()
    addToast(`Entry for ${date} deleted`, 'info')
  }

  async function handleSettingsSaved() {
    await loadData()
    setSettingsOpen(false)
    addToast('Settings saved', 'success')
  }

  function handleEditEntry(entry) {
    setEditEntry(entry)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      <Header
        period={period}
        onPeriodChange={setPeriod}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="main-content">
        {loading ? (
          <div className="loading-screen">
            <div className="loading-spinner" />
            <p className="text-secondary">Loading dashboard…</p>
          </div>
        ) : (
          <>
            {/* Top section: form + metrics */}
            <div className="dashboard-top">
              <div className="form-column">
                <DailyInputForm
                  onSaved={handleEntrySaved}
                  editEntry={editEntry}
                  onCancelEdit={() => setEditEntry(null)}
                />
              </div>

              <div className="metrics-column">
                {/* Metric Cards */}
                <div className="metrics-grid">
                  <MetricCard
                    label="Amount Spent"
                    value={summary?.amount_spent ?? null}
                    type="currency"
                  />
                  <MetricCard
                    label="Link Clicks"
                    value={summary?.link_clicks ?? null}
                    type="integer"
                  />
                  <MetricCard
                    label="Total Leads"
                    value={summary?.leads ?? null}
                    type="integer"
                  />
                  <MetricCard
                    label="Click → Lead Rate"
                    value={summary?.click_to_lead_rate ?? null}
                    type="percent"
                    colorRule="click_to_lead"
                  />
                  <MetricCard
                    label="CPL"
                    value={summary?.cpl ?? null}
                    type="currency"
                    colorRule="cpl"
                    target={settings?.target_cpl}
                  />
                  <MetricCard
                    label="Cost per Call"
                    value={summary?.cost_per_call ?? null}
                    type="currency"
                    colorRule="cpl"
                    target={settings?.target_cost_per_call}
                  />
                </div>

                {/* Empty state for metrics */}
                {!summary && (
                  <div className="metrics-empty text-secondary">
                    No data for this period. Add an entry to see metrics.
                  </div>
                )}
              </div>
            </div>

            {/* Target Banner */}
            <TargetBanner summary={summary} settings={settings} />

            {/* Budget Pacing */}
            <BudgetPacing
              monthlySummary={monthlySummary}
              settings={settings}
            />

            {/* Trend Chart */}
            <TrendChart entries={entries} settings={settings} />

            {/* Data Table */}
            <DataTable
              entries={entries}
              onEdit={handleEditEntry}
              onDeleted={handleEntryDeleted}
            />

            {/* Calculator */}
            <Calculator settings={settings} />
          </>
        )}
      </main>

      {/* Settings Panel */}
      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSaved={handleSettingsSaved}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}
