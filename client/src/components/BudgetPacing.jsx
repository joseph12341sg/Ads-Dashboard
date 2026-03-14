import React from 'react'
import dayjs from 'dayjs'

export default function BudgetPacing({ monthlySummary, settings }) {
  const budget = settings?.monthly_budget
  const spent = monthlySummary?.amount_spent ?? 0

  if (!budget) {
    return (
      <div className="card budget-pacing no-budget">
        <div className="no-targets-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
          </svg>
          Set a monthly budget in Settings to track pacing
        </div>
      </div>
    )
  }

  const now = dayjs()
  const daysInMonth = now.daysInMonth()
  const dayOfMonth = now.date()
  const pctMonthElapsed = (dayOfMonth / daysInMonth) * 100
  const pctBudgetUsed = Math.min((spent / budget) * 100, 100)

  let pacingStatus = 'On pace'
  let pacingClass = 'pacing-green'
  if (pctBudgetUsed > pctMonthElapsed + 10) {
    pacingStatus = 'Over pace'
    pacingClass = 'pacing-red'
  } else if (pctBudgetUsed < pctMonthElapsed - 10) {
    pacingStatus = 'Under pace'
    pacingClass = 'pacing-amber'
  }

  const barWidth = Math.min(pctBudgetUsed, 100)
  const targetMarker = Math.min(pctMonthElapsed, 100)

  return (
    <div className="card budget-pacing">
      <div className="budget-pacing-header">
        <span className="section-title">Budget Pacing</span>
        <span className={`pacing-badge ${pacingClass}`}>{pacingStatus}</span>
      </div>

      <div className="budget-bar-container">
        <div className="budget-bar-track">
          <div
            className={`budget-bar-fill ${pacingClass}`}
            style={{ width: `${barWidth}%` }}
          />
          <div
            className="budget-bar-marker"
            style={{ left: `${targetMarker}%` }}
            title={`Day ${dayOfMonth} of ${daysInMonth} (${pctMonthElapsed.toFixed(0)}% of month)`}
          />
        </div>
        <div className="budget-bar-labels">
          <span className="mono text-secondary">£0</span>
          <span className="mono text-secondary">£{Number(budget).toLocaleString('en-GB')}</span>
        </div>
      </div>

      <div className="budget-pacing-info">
        <span className="text-secondary">
          Day <span className="mono text-primary">{dayOfMonth}</span> of{' '}
          <span className="mono text-primary">{daysInMonth}</span>
        </span>
        <span className="text-secondary">
          <span className="mono text-primary">£{Number(spent).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          {' '}spent of{' '}
          <span className="mono text-primary">£{Number(budget).toLocaleString('en-GB')}</span>
          {' '}budget
        </span>
        <span className="mono text-secondary">
          {pctBudgetUsed.toFixed(1)}% used · {pctMonthElapsed.toFixed(0)}% of month
        </span>
      </div>
    </div>
  )
}
