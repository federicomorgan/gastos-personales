import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { fmtMoney, fmtMoneyCompact as fmt } from '../utils/formatters'

export default function GraficoLinea({ movimientos, isDark }) {
  const [vista, setVista] = useState('mes')
  const hoy = new Date()

  const dataMes = () => {
    const diasHoy = hoy.getDate()
    let acum = 0
    return Array.from({ length: diasHoy }, (_, i) => {
      const dia = i + 1
      const str = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
      const del = movimientos.filter(m => m.fecha === str)
      acum += del.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.monto), 0)
      acum -= del.filter(m => m.tipo === 'egreso').reduce((s, m) => s + Number(m.monto), 0)
      return { label: `${dia}`, balance: acum }
    })
  }

  const data6 = () =>
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1)
      const mes = d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')
      const mm = movimientos.filter(m => {
        const f = new Date(m.fecha + 'T00:00:00')
        return f.getMonth() === d.getMonth() && f.getFullYear() === d.getFullYear()
      })
      const ing = mm.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.monto), 0)
      const eg  = mm.filter(m => m.tipo === 'egreso').reduce((s, m) => s + Number(m.monto), 0)
      return { label: mes, balance: ing - eg }
    })

  const data = vista === 'mes' ? dataMes() : data6()
  const positive = data.length > 0 && data[data.length - 1].balance >= 0

  const grid   = isDark ? '#2a2a2a' : '#f4f4f4'
  const tick   = isDark ? '#6b7280' : '#9ca3af'
  const ttBg   = isDark ? '#1a1a1a' : '#fff'
  const ttBdr  = isDark ? '#2a2a2a' : '#f0f0f0'
  const ttText = isDark ? '#f9fafb' : '#111827'

  const btnStyle = (active) => ({
    padding: '4px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: active ? '#E63946' : 'transparent',
    color: active ? '#fff' : 'var(--text-3)',
  })

  return (
    <>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        <button style={btnStyle(vista === 'mes')} onClick={() => setVista('mes')}>Este mes</button>
        <button style={btnStyle(vista === '6meses')} onClick={() => setVista('6meses')}>6 meses</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '300px' }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: tick }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: tick }} width={60} />
              <Tooltip
                contentStyle={{ background: ttBg, border: `1px solid ${ttBdr}`, borderRadius: '10px', fontSize: '13px', color: ttText }}
                formatter={(v) => [fmtMoney(v), 'Balance']}
              />
              <ReferenceLine y={0} stroke={isDark ? '#444' : '#e5e7eb'} />
              <Line
                type="monotone" dataKey="balance"
                stroke={positive ? '#22c55e' : '#E63946'}
                strokeWidth={2.5} dot={false}
                activeDot={{ r: 5, fill: positive ? '#22c55e' : '#E63946' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
