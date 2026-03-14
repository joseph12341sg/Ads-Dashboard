import React, { useState } from 'react'

function safeDiv(a, b) {
  if (!a || !b || b === 0) return null
  return a / b
}

function fmtCurrency(v) {
  if (v === null || v === undefined || isNaN(v)) return '—'
  return `£${Number(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtNumber(v, decimals = 0) {
  if (v === null || v === undefined || isNaN(v)) return '—'
  return Number(v).toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function ResultRow({ label, value }) {
  return (
    <div className="calc-result-row">
      <span className="calc-result-label text-secondary">{label}</span>
      <span className="calc-result-value mono text-green">{value}</span>
    </div>
  )
}

function ForwardCalculator({ settings }) {
  const [f, setF] = useState({
    budget: '',
    cpl: '',
    cost_per_call: '',
    click_to_lead: '',
    cpc: ''
  })

  const budget = Number(f.budget) || 0
  const cpl = Number(f.cpl) || 0
  const costPerCall = Number(f.cost_per_call) || 0
  const convRate = Number(f.click_to_lead) || 0
  const cpc = Number(f.cpc) || 0

  const estLeads = cpl > 0 ? budget / cpl : null
  const estCalls = costPerCall > 0 ? budget / costPerCall : null
  const estClicks = cpc > 0 ? budget / cpc : null
  const impliedConv = estClicks && estLeads ? (estLeads / estClicks) * 100 : null

  return (
    <div className="calc-mode">
      <div className="calc-inputs">
        <div className="calc-input-grid">
          {[
            { id: 'fwd-budget', label: 'Budget (£)', key: 'budget', placeholder: '1000.00' },
            { id: 'fwd-cpl', label: 'Expected CPL (£)', key: 'cpl', placeholder: '25.00' },
            { id: 'fwd-cost-call', label: 'Expected Cost per Call (£)', key: 'cost_per_call', placeholder: '50.00' },
            { id: 'fwd-conv', label: 'Expected Click-to-Lead Rate (%)', key: 'click_to_lead', placeholder: '4.0' },
            { id: 'fwd-cpc', label: 'Expected CPC (£)', key: 'cpc', placeholder: '1.50' }
          ].map(field => (
            <div key={field.key} className="form-group">
              <label htmlFor={field.id}>{field.label}</label>
              <input
                id={field.id}
                type="number"
                min="0"
                step="0.01"
                value={f[field.key]}
                onChange={e => setF(p => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="calc-results">
        <div className="calc-results-title section-title">Estimated Results</div>
        <ResultRow label="Estimated Leads" value={fmtNumber(estLeads, 1)} />
        <ResultRow label="Estimated Calls" value={fmtNumber(estCalls, 1)} />
        <ResultRow label="Estimated Clicks" value={fmtNumber(estClicks, 0)} />
        <ResultRow label="Implied Conv. Rate" value={impliedConv !== null ? `${fmtNumber(impliedConv, 2)}%` : '—'} />
      </div>
    </div>
  )
}

function ReverseCalculator({ settings }) {
  const [f, setF] = useState({
    target_leads: '',
    cpl: settings?.target_cpl ?? '',
    target_calls: '',
    cost_per_call: settings?.target_cost_per_call ?? '',
    click_to_lead: ''
  })

  // Update from settings if they change
  const cpl = Number(f.cpl) || 0
  const targetLeads = Number(f.target_leads) || 0
  const costPerCall = Number(f.cost_per_call) || 0
  const targetCalls = Number(f.target_calls) || 0
  const convRate = Number(f.click_to_lead) || 0

  const budgetForLeads = cpl > 0 && targetLeads > 0 ? targetLeads * cpl : null
  const budgetForCalls = costPerCall > 0 && targetCalls > 0 ? targetCalls * costPerCall : null
  const clicksNeeded = convRate > 0 && targetLeads > 0 ? (targetLeads / (convRate / 100)) : null

  return (
    <div className="calc-mode">
      <div className="calc-inputs">
        <div className="calc-input-grid">
          {[
            { id: 'rev-leads', label: 'Target Leads', key: 'target_leads', placeholder: '100', step: '1' },
            { id: 'rev-cpl', label: 'Your CPL (£)', key: 'cpl', placeholder: '25.00', hint: settings?.target_cpl ? `From settings: £${settings.target_cpl}` : null },
            { id: 'rev-calls', label: 'Target Calls', key: 'target_calls', placeholder: '50', step: '1' },
            { id: 'rev-cpc', label: 'Your Cost per Call (£)', key: 'cost_per_call', placeholder: '50.00', hint: settings?.target_cost_per_call ? `From settings: £${settings.target_cost_per_call}` : null },
            { id: 'rev-conv', label: 'Click-to-Lead Rate (%)', key: 'click_to_lead', placeholder: '4.0' }
          ].map(field => (
            <div key={field.key} className="form-group">
              <label htmlFor={field.id}>{field.label}</label>
              <input
                id={field.id}
                type="number"
                min="0"
                step={field.step || '0.01'}
                value={f[field.key]}
                onChange={e => setF(p => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
              />
              {field.hint && <span className="form-hint text-secondary">{field.hint}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="calc-results">
        <div className="calc-results-title section-title">Budget Required</div>
        <ResultRow label="Budget for Leads" value={fmtCurrency(budgetForLeads)} />
        <ResultRow label="Budget for Calls" value={fmtCurrency(budgetForCalls)} />
        <ResultRow label="Clicks Needed" value={fmtNumber(clicksNeeded, 0)} />
      </div>
    </div>
  )
}

export default function Calculator({ settings }) {
  const [mode, setMode] = useState('forward')

  return (
    <div className="card calculator-card">
      <div className="section-header">
        <span className="section-title">Ads Calculator</span>
        <div className="tab-group">
          <button
            className={`tab-btn ${mode === 'forward' ? 'active' : ''}`}
            onClick={() => setMode('forward')}
          >
            Forward
          </button>
          <button
            className={`tab-btn ${mode === 'reverse' ? 'active' : ''}`}
            onClick={() => setMode('reverse')}
          >
            Reverse
          </button>
        </div>
      </div>

      <div className="calc-description text-secondary">
        {mode === 'forward'
          ? 'Given a budget, calculate what results you can expect.'
          : 'Given target results, calculate how much budget you need.'}
      </div>

      {mode === 'forward'
        ? <ForwardCalculator settings={settings} />
        : <ReverseCalculator settings={settings} />
      }
    </div>
  )
}
