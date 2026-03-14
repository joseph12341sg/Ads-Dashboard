import React, { useState, useEffect } from 'react'
import { saveSetting } from '../api'

export default function SettingsPanel({ settings, onClose, onSaved }) {
  const [form, setForm] = useState({
    monthly_budget: '',
    target_cpl: '',
    target_cost_per_call: ''
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (settings) {
      setForm({
        monthly_budget: settings.monthly_budget ?? '',
        target_cpl: settings.target_cpl ?? '',
        target_cost_per_call: settings.target_cost_per_call ?? ''
      })
    }
  }, [settings])

  function validate() {
    const errs = {}
    if (form.monthly_budget !== '' && Number(form.monthly_budget) < 0) {
      errs.monthly_budget = 'Must be ≥ 0'
    }
    if (form.target_cpl !== '' && Number(form.target_cpl) < 0) {
      errs.target_cpl = 'Must be ≥ 0'
    }
    if (form.target_cost_per_call !== '' && Number(form.target_cost_per_call) < 0) {
      errs.target_cost_per_call = 'Must be ≥ 0'
    }
    return errs
  }

  async function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSaving(true)
    try {
      const tasks = []
      if (form.monthly_budget !== '') {
        tasks.push(saveSetting('monthly_budget', Number(form.monthly_budget)))
      }
      if (form.target_cpl !== '') {
        tasks.push(saveSetting('target_cpl', Number(form.target_cpl)))
      }
      if (form.target_cost_per_call !== '') {
        tasks.push(saveSetting('target_cost_per_call', Number(form.target_cost_per_call)))
      }
      await Promise.all(tasks)
      onSaved()
    } catch (err) {
      setErrors({ general: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="settings-panel">
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="btn btn-ghost" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="settings-body">
          <p className="settings-description text-secondary">
            Configure your budget and performance targets. These are used across the dashboard for tracking and pacing.
          </p>

          <div className="settings-section">
            <div className="settings-section-title">Budget</div>
            <div className="form-group">
              <label htmlFor="monthly-budget">Monthly Budget (£)</label>
              <input
                id="monthly-budget"
                type="number"
                min="0"
                step="1"
                value={form.monthly_budget}
                onChange={e => {
                  setForm(p => ({ ...p, monthly_budget: e.target.value }))
                  setErrors(p => ({ ...p, monthly_budget: undefined }))
                }}
                placeholder="e.g. 5000"
              />
              {errors.monthly_budget && <span className="form-error">{errors.monthly_budget}</span>}
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">Performance Targets</div>
            <div className="form-group">
              <label htmlFor="target-cpl">Target CPL — Cost per Lead (£)</label>
              <input
                id="target-cpl"
                type="number"
                min="0"
                step="0.01"
                value={form.target_cpl}
                onChange={e => {
                  setForm(p => ({ ...p, target_cpl: e.target.value }))
                  setErrors(p => ({ ...p, target_cpl: undefined }))
                }}
                placeholder="e.g. 25.00"
              />
              {errors.target_cpl && <span className="form-error">{errors.target_cpl}</span>}
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label htmlFor="target-cost-per-call">Target Cost per Call (£)</label>
              <input
                id="target-cost-per-call"
                type="number"
                min="0"
                step="0.01"
                value={form.target_cost_per_call}
                onChange={e => {
                  setForm(p => ({ ...p, target_cost_per_call: e.target.value }))
                  setErrors(p => ({ ...p, target_cost_per_call: undefined }))
                }}
                placeholder="e.g. 50.00"
              />
              {errors.target_cost_per_call && <span className="form-error">{errors.target_cost_per_call}</span>}
            </div>
          </div>

          {errors.general && <div className="form-error">{errors.general}</div>}
        </div>

        <div className="settings-footer">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
