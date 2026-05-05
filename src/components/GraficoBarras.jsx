import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { fmtMoney as fmtFull, fmtMoneyCompact as fmt } from '../utils/formatters'

export default function GraficoBarras({ movimientos, isDark = false }) {
  const hoy = new Date()
  const data = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1)
    const month = d.getMonth(), year = d.getFullYear()
    const mes = d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')
    const filtro = (tipo) => movimientos.filter(m => {
      const f = new Date(m.fecha + 'T00:00:00')
      return m.tipo === tipo && f.getMonth() === month && f.getFullYear() === year
    }).reduce((s, m) => s + Number(m.monto), 0)
    return { mes, ingresos: filtro('ingreso'), egresos: filtro('egreso') }
  })

  const grid = isDark ? '#2a2a2a' : '#f4f4f4'
  const tick = isDark ? '#6b7280' : '#9ca3af'
  const ttBg = isDark ? '#1a1a1a' : '#fff'
  const ttBdr = isDark ? '#2a2a2a' : '#f0f0f0'
  const ttText = isDark ? '#f9fafb' : '#111827'

  return (
    <div className="chart-scroll">
      <div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fontFamily: 'Inter, sans-serif', fill: tick }} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fontFamily: 'Inter, sans-serif', fill: tick }} width={65} />
            <Tooltip
              contentStyle={{ background: ttBg, border: `1px solid ${ttBdr}`, borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: ttText }}
              formatter={(v) => [fmtFull(v)]}
            />
            <Legend wrapperStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: tick }} />
            <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[5, 5, 0, 0]} />
            <Bar dataKey="egresos"  name="Egresos"  fill="#E63946" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
