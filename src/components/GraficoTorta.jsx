import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getCategoryColors, setCategoryColor, FALLBACK_COLORS } from '../utils/categoryColors'
import { fmtMoney as fmtFull } from '../utils/formatters'

function CustomLegend({ payload, colors, onColorChange, isDark }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', paddingTop: '10px' }}>
      {payload.map(entry => (
        <label
          key={entry.value}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
          title={`Clic para cambiar color de "${entry.value}"`}
        >
          <input
            type="color"
            value={colors[entry.value] || entry.color}
            onChange={e => onColorChange(entry.value, e.target.value)}
            style={{ width: '14px', height: '14px', padding: '1px', border: '1.5px solid rgba(128,128,128,0.3)', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
          />
          <span style={{ fontSize: '11px', color: isDark ? '#9ca3af' : '#6b7280' }}>{entry.value}</span>
        </label>
      ))}
    </div>
  )
}

export default function GraficoTorta({ movimientos, isDark = false }) {
  const [colors, setColors] = useState(() => getCategoryColors())

  const ahora = new Date()
  const egresos = movimientos.filter(m => {
    const f = new Date(m.fecha + 'T00:00:00')
    return m.tipo === 'egreso' && f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear()
  })

  const porCategoria = egresos.reduce((acc, m) => {
    acc[m.categoria] = (acc[m.categoria] || 0) + Number(m.monto)
    return acc
  }, {})

  const data = Object.entries(porCategoria).map(([name, value]) => ({ name, value }))

  if (data.length === 0) {
    return (
      <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '14px' }}>
        Sin egresos este mes
      </div>
    )
  }

  const handleColorChange = (category, color) => {
    setCategoryColor(category, color)
    setColors(prev => ({ ...prev, [category]: color }))
  }

  const ttBg   = isDark ? '#1a1a1a' : '#fff'
  const ttBdr  = isDark ? '#2a2a2a' : '#f0f0f0'
  const ttText = isDark ? '#f9fafb' : '#111827'

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="44%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
          {data.map((entry, i) => (
            <Cell key={i} fill={colors[entry.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: ttBg, border: `1px solid ${ttBdr}`, borderRadius: '10px', fontSize: '13px', color: ttText, fontFamily: 'Inter, sans-serif' }}
          formatter={(v) => [fmtFull(v)]}
        />
        <Legend
          iconSize={0}
          content={(props) => (
            <CustomLegend {...props} colors={colors} onColorChange={handleColorChange} isDark={isDark} />
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
