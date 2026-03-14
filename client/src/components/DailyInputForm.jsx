import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { createEntry, updateEntry, getEntryByDate } from '../api'

const today = dayjs().format('YYYY-MM-DD')

const emptyForm = {
  date: today,
  amount_spent: '',
  link_clicks: '',
  leads: '',
  calls: ''
}

export default function DailyInputForm({ onSaved, editEntry, onCancelEdit }) {
  const [form, setForm] = useState(emptyForm)
  const [isUpdate, setIsUpdate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingDate, setCheckingDate] = useState(false)
  const [errors, setErrors] = useState({})

  // When editEntry prop changes (from table row click), populate the form
  useEffect(() => {
    if (editEntry) {
      setForm({
        date: editEntry.date,
        amount_spent: editEntry.amount_spent ?? '',
        link_clicks: editEntry.link_clicks ?? '',
        leads: editEntry.leads ?? '',
        calls: editEntry.calls ?? ''
      })
      setIsUpdate(true)
    }
  }, [editEntry])

  // Check if entry exists for selected date (only when not in edit mode from table)
  useEffect(() => {
    if (editEntry) return
    const checkDate = async () => {
      if (!form.date) return
      setCheckingDate(true)
      try {
        const entry = await getEntryByDate(form.date)
        if (entry) {
          setIsUpdate(true)
          setForm(prev => ({
            ...prev,
            amount_spent: entry.amount_spent ?? '',
            link_clicks: entry.link_clicks ?? '',
            leads: entry.leads ?? '',
            calls: entry.calls ?? ''
          }))
        } else {
          setIsUpdate(false)
        }
      } catch {
        setIsUpdate(false)
      } finally {
        setCheckingDate(false)
      }
    }
    checkDate()
  }, [form.date, editEntry])

  function validate() {
    const errs = {}
    if (!form.date) errs.date = 'Date is required'
    const hasMetric =
      form.amount_spent !== '' ||
      form.link_clicks !== '' ||
      form.leads !== '' ||
      form.calls !== ''
    if (!hasMetric) errs.general = 'At least one metric field must be filled'
    if (form.amount_spent !== '' && Number(form.amount_spent) < 0) errs.amount_spent = 'Must be ≥ 0'
    if (form.link_clicks !== '' && Number(form.link_clicks) < 0) errs.link_clicks = 'Must be ≥ 0'
    if (form.leads !== '' && Number(form.leads) < 0) errs.leads = 'Must be ≥ 0'
    if (form.calls !== '' && Number(form.calls) < 0) errs.calls = 'Must be ≥ 0'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)

    const payload = {
      date: form.date,
      amount_spent: form.amount_spent !== '' ? Number(form.amount_spent) : null,
      link_clicks: form.link_clicks !== '' ? Number(form.link_clicks) : null,
      leads: form.leads !== '' ? Number(form.leads) : null,
      calls: form.calls !== '' ? Number(form.calls) : null
    }

    try {
      if (isUpdate) {
        await updateEntry(form.date, payload)
      } else {
        await createEntry(payload)
      }
      onSaved(isUpdate ? 'updated' : 'created')
      if (!editEntry) {
        setForm({ ...emptyForm, date: today })
        setIsUpdate(false)
      }
    } catch (err) {
      setErrors({ general: err.message })
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    setForm(emptyForm)
    setIsUpdate(false)
    setErrors({})
    onCancelEdit?.()
  }

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  return (
    <div className="card daily-input-form">
      <div className="section-header">
        <span className="section-title">
          {isUpdate ? 'Update Entry' : 'Add Entry'}
        </span>
        {isUpdate && editEntry && (
          <button className="btn btn-ghost btn-sm" onClick={handleCancel}>
            Cancel
          </button>
        )}
      </div>

      {checkingDate && (
        <div className="checking-date">Checking existing entry…</div>
      )}

      {isUpdate && !checkingDate && (
        <div className="form-notice">
          <span className="text-amber">⚠ Entry exists for this date — updating</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="form-group form-group-date">
            <label htmlFor="entry-date">Date</label>
            <input
              id="entry-date"
              type="date"
              value={form.date}
              onChange={e => setField('date', e.target.value)}
              disabled={!!editEntry}
              placeholder="YYYY-MM-DD"
            />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="amount-spent">Amount Spent (£)</label>
            <input
              id="amount-spent"
              type="number"
              min="0"
              step="0.01"
              value={form.amount_spent}
              onChange={e => setField('amount_spent', e.target.value)}
              placeholder="0.00"
            />
            {errors.amount_spent && <span className="form-error">{errors.amount_spent}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="link-clicks">Link Clicks</label>
            <input
              id="link-clicks"
              type="number"
              min="0"
              step="1"
              value={form.link_clicks}
              onChange={e => setField('link_clicks', e.target.value)}
              placeholder="0"
            />
            {errors.link_clicks && <span className="form-error">{errors.link_clicks}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="total-leads">Total Leads</label>
            <input
              id="total-leads"
              type="number"
              min="0"
              step="1"
              value={form.leads}
              onChange={e => setField('leads', e.target.value)}
              placeholder="0"
            />
            {errors.leads && <span className="form-error">{errors.leads}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="calls">Calls Booked</label>
            <input
              id="calls"
              type="number"
              min="0"
              step="1"
              value={form.calls}
              onChange={e => setField('calls', e.target.value)}
              placeholder="0"
            />
            {errors.calls && <span className="form-error">{errors.calls}</span>}
          </div>
        </div>

        {errors.general && (
          <div className="form-error form-error-general">{errors.general}</div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving…' : isUpdate ? 'Update Entry' : 'Save Entry'}
          </button>
          {(isUpdate || editEntry) && (
            <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
