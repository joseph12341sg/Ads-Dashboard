// ─── Supabase persistence layer ───────────────────────────────────
// All data is stored in Supabase, tied to the logged-in user.
// Row Level Security ensures users only ever see their own data.

import { supabase } from './supabase'

// ─── Helpers ──────────────────────────────────────────────────────

function computeMetrics(entry) {
  return {
    ...entry,
    cpl: entry.leads > 0 ? entry.amount_spent / entry.leads : null,
    cost_per_call: entry.calls > 0 ? entry.amount_spent / entry.calls : null,
    click_to_lead_rate:
      entry.link_clicks > 0 ? (entry.leads / entry.link_clicks) * 100 : null
  }
}

function aggregateEntries(rows) {
  const totals = rows.reduce(
    (acc, row) => {
      acc.amount_spent += row.amount_spent || 0
      acc.link_clicks += row.link_clicks || 0
      acc.leads += row.leads || 0
      acc.calls += row.calls || 0
      return acc
    },
    { amount_spent: 0, link_clicks: 0, leads: 0, calls: 0 }
  )
  return {
    ...totals,
    cpl: totals.leads > 0 ? totals.amount_spent / totals.leads : null,
    cost_per_call: totals.calls > 0 ? totals.amount_spent / totals.calls : null,
    click_to_lead_rate:
      totals.link_clicks > 0 ? (totals.leads / totals.link_clicks) * 100 : null,
    entry_count: rows.length,
    entries: rows
  }
}

function throwIfError(error) {
  if (error) throw new Error(error.message)
}

// ─── Entries ──────────────────────────────────────────────────────

export async function getEntries() {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('date', { ascending: false })
  throwIfError(error)
  return (data || []).map(computeMetrics)
}

export async function getEntryByDate(date) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('date', date)
    .maybeSingle()
  throwIfError(error)
  return data ? computeMetrics(data) : null
}

export async function createEntry({ date, amount_spent, link_clicks, leads, calls }) {
  const { data, error } = await supabase
    .from('entries')
    .insert({ date, amount_spent, link_clicks, leads, calls })
    .select()
    .single()
  throwIfError(error)
  return computeMetrics(data)
}

export async function updateEntry(date, { amount_spent, link_clicks, leads, calls }) {
  const { data, error } = await supabase
    .from('entries')
    .update({ amount_spent, link_clicks, leads, calls })
    .eq('date', date)
    .select()
    .single()
  throwIfError(error)
  return computeMetrics(data)
}

export async function deleteEntry(date) {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('date', date)
  throwIfError(error)
}

// ─── Summary ──────────────────────────────────────────────────────

export async function getMonthlySummary(month) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .like('date', `${month}%`)
  throwIfError(error)
  return aggregateEntries(data || [])
}

export async function getWeeklySummary() {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 6)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .gte('date', weekAgoStr)
  throwIfError(error)
  return aggregateEntries(data || [])
}

// ─── Settings ─────────────────────────────────────────────────────

export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
  throwIfError(error)
  const settings = {}
  for (const row of (data || [])) {
    try { settings[row.key] = JSON.parse(row.value) } catch { settings[row.key] = row.value }
  }
  return settings
}

export async function saveSetting(key, value) {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value: JSON.stringify(value) }, { onConflict: 'user_id,key' })
  throwIfError(error)
  return { key, value }
}
