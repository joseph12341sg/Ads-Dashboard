import React, { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import dayjs from 'dayjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const METRICS = [
  { key: 'cpl', label: 'CPL', format: v => `£${v?.toFixed(2) ?? '—'}` },
  { key: 'cost_per_call', label: 'Cost/Call', format: v => `£${v?.toFixed(2) ?? '—'}` },
  { key: 'amount_spent', label: 'Spend', format: v => `£${v?.toFixed(2) ?? '—'}` },
  { key: 'link_clicks', label: 'Clicks', format: v => v?.toLocaleString() ?? '—' },
  { key: 'leads', label: 'Leads', format: v => v?.toLocaleString() ?? '—' }
]

export default function TrendChart({ entries, settings }) {
  const [activeMetric, setActiveMetric] = useState('cpl')

  const last14 = useMemo(() => {
    const sorted = [...(entries || [])].sort((a, b) => a.date.localeCompare(b.date))
    return sorted.slice(-14)
  }, [entries])

  const metricDef = METRICS.find(m => m.key === activeMetric)

  const labels = last14.map(e => dayjs(e.date).format('MMM D'))
  const values = last14.map(e => {
    const v = e[activeMetric]
    return v !== null && v !== undefined ? v : null
  })

  // Show target line only for CPL and cost_per_call
  const targetValue =
    activeMetric === 'cpl'
      ? settings?.target_cpl ?? null
      : activeMetric === 'cost_per_call'
      ? settings?.target_cost_per_call ?? null
      : null

  const targetData = targetValue !== null ? labels.map(() => targetValue) : null

  const datasets = [
    {
      label: metricDef.label,
      data: values,
      borderColor: '#00e5a0',
      backgroundColor: 'rgba(0, 229, 160, 0.08)',
      borderWidth: 2,
      pointBackgroundColor: '#00e5a0',
      pointBorderColor: '#0d0f14',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: true,
      tension: 0.4,
      spanGaps: true
    }
  ]

  if (targetData) {
    datasets.push({
      label: `Target ${metricDef.label}`,
      data: targetData,
      borderColor: '#ff4d6d',
      borderWidth: 1.5,
      borderDash: [6, 4],
      pointRadius: 0,
      fill: false,
      tension: 0
    })
  }

  const chartData = { labels, datasets }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: targetData !== null,
        labels: {
          color: '#8892a4',
          font: { family: 'Inter', size: 12 },
          boxWidth: 20,
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: '#1c2130',
        borderColor: '#2a3147',
        borderWidth: 1,
        titleColor: '#e8eaf0',
        bodyColor: '#8892a4',
        padding: 12,
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex
            const entry = last14[idx]
            return entry ? dayjs(entry.date).format('ddd, MMM D YYYY') : ''
          },
          afterBody: (items) => {
            const idx = items[0]?.dataIndex
            const entry = last14[idx]
            if (!entry) return []
            return [
              `Spend: £${entry.amount_spent?.toFixed(2) ?? '—'}`,
              `Leads: ${entry.leads ?? '—'}`,
              `CPL: ${entry.cpl != null ? `£${entry.cpl.toFixed(2)}` : '—'}`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(42, 49, 71, 0.5)' },
        ticks: { color: '#8892a4', font: { family: 'Inter', size: 11 } }
      },
      y: {
        grid: { color: 'rgba(42, 49, 71, 0.5)' },
        ticks: {
          color: '#8892a4',
          font: { family: 'DM Mono', size: 11 },
          callback: (v) => metricDef.format(v)
        }
      }
    }
  }

  if (!last14.length) {
    return (
      <div className="card trend-chart-card">
        <div className="section-header">
          <span className="section-title">Performance Trend</span>
        </div>
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <p>No data yet. Add entries to see your performance trend.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card trend-chart-card">
      <div className="section-header">
        <span className="section-title">Performance Trend (Last 14 Days)</span>
        <div className="tab-group">
          {METRICS.map(m => (
            <button
              key={m.key}
              className={`tab-btn ${activeMetric === m.key ? 'active' : ''}`}
              onClick={() => setActiveMetric(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-wrapper">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
