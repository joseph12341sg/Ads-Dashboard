import React from 'react'

function formatValue(value, type) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  switch (type) {
    case 'currency':
      return `£${Number(value).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    case 'percent':
      return `${Number(value).toFixed(2)}%`
    case 'integer':
      return Number(value).toLocaleString('en-GB')
    default:
      return String(value)
  }
}

export default function MetricCard({ label, value, type, colorRule, target, subtitle }) {
  const formatted = formatValue(value, type)
  const hasValue = value !== null && value !== undefined && !isNaN(value)

  let colorClass = ''
  let glowStyle = {}

  if (hasValue && colorRule === 'cpl' && target) {
    if (value <= target) {
      colorClass = 'text-green'
      glowStyle = { borderColor: 'var(--border-glow-green)', boxShadow: 'var(--shadow-glow-green)' }
    } else {
      colorClass = 'text-red'
      glowStyle = { borderColor: 'var(--border-glow-red)', boxShadow: 'var(--shadow-glow-red)' }
    }
  } else if (hasValue && colorRule === 'click_to_lead') {
    if (value >= 4) {
      colorClass = 'text-green'
      glowStyle = { borderColor: 'var(--border-glow-green)', boxShadow: 'var(--shadow-glow-green)' }
    } else if (value >= 2) {
      colorClass = 'text-amber'
    } else {
      colorClass = 'text-red'
      glowStyle = { borderColor: 'var(--border-glow-red)', boxShadow: 'var(--shadow-glow-red)' }
    }
  }

  return (
    <div className="metric-card card fade-up" style={glowStyle}>
      <div className="metric-label">{label}</div>
      <div className={`metric-value mono ${colorClass}`}>
        {formatted}
      </div>
      {subtitle && (
        <div className="metric-subtitle">{subtitle}</div>
      )}
    </div>
  )
}
