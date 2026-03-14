import React from 'react'

function TargetRow({ label, actual, target, type }) {
  if (actual === null || actual === undefined) return null

  const isOnTarget = actual <= target
  const formatted = type === 'currency' ? `£${Number(actual).toFixed(2)}` : actual
  const targetFormatted = type === 'currency' ? `£${Number(target).toFixed(2)}` : target

  return (
    <div className="target-row">
      <span className="target-label">{label}</span>
      <div className="target-values">
        <span className="target-value-target text-secondary">
          Target: {targetFormatted}
        </span>
        <span className="target-separator">→</span>
        <span className={`target-value-actual mono ${isOnTarget ? 'text-green' : 'text-red'}`}>
          Actual: {formatted}
        </span>
        <span className={`target-badge ${isOnTarget ? 'badge-green' : 'badge-red'}`}>
          {isOnTarget ? '✓ On target' : '↑ Over target'}
        </span>
      </div>
    </div>
  )
}

export default function TargetBanner({ summary, settings }) {
  const hasCplTarget = settings?.target_cpl != null
  const hasCallTarget = settings?.target_cost_per_call != null
  const hasTargets = hasCplTarget || hasCallTarget

  if (!hasTargets) {
    return (
      <div className="card target-banner no-targets">
        <div className="no-targets-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Set your targets in Settings to track performance against goals
        </div>
      </div>
    )
  }

  return (
    <div className="card target-banner">
      <div className="section-title" style={{ marginBottom: '12px' }}>Target vs Actual</div>
      <div className="target-rows">
        {hasCplTarget && (
          <TargetRow
            label="Cost per Lead (CPL)"
            actual={summary?.cpl}
            target={settings.target_cpl}
            type="currency"
          />
        )}
        {hasCallTarget && (
          <TargetRow
            label="Cost per Call"
            actual={summary?.cost_per_call}
            target={settings.target_cost_per_call}
            type="currency"
          />
        )}
      </div>
    </div>
  )
}
