import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useTheme } from '../context/ThemeContext'
import { fmtMoney as fmt } from '../utils/formatters'

const CATEGORIAS = ['Comida', 'Alquiler', 'Transporte', 'Salud', 'Educación', 'Entretenimiento', 'Ropa', 'Servicios', 'Otro']

export default function Presupuesto({ session }) {
  const { isDark } = useTheme()
  const [movimientos, setMovimientos] = useState([])
  const [presupuestos, setPresupuestos] = useState({})
  const [editando, setEditando] = useState(null)
  const [inputVal, setInputVal] = useState('')
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(false)

  const ahora = new Date()
  const mes = ahora.getMonth() + 1
  const anio = ahora.getFullYear()

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const [movsRes, presuRes] = await Promise.all([
      supabase.from('movimientos').select('*').eq('user_id', session.user.id),
      supabase.from('presupuestos').select('*').eq('user_id', session.user.id).eq('mes', mes).eq('anio', anio),
    ])
    if (presuRes.error) { setDbError(true); setLoading(false); return }
    setMovimientos(movsRes.data || [])
    const map = {}
    for (const p of presuRes.data || []) map[p.categoria] = { id: p.id, limite: p.limite }
    setPresupuestos(map)
    setLoading(false)
  }

  const gastoPorCat = (cat) => {
    return movimientos
      .filter(m => {
        const f = new Date(m.fecha)
        return m.tipo === 'egreso' && m.categoria === cat &&
          f.getMonth() + 1 === mes && f.getFullYear() === anio
      })
      .reduce((s, m) => s + Number(m.monto), 0)
  }

  const guardar = async (cat) => {
    const limite = Number(inputVal)
    if (!limite || limite <= 0) return
    const existing = presupuestos[cat]
    let err
    if (existing) {
      ;({ error: err } = await supabase.from('presupuestos').update({ limite }).eq('id', existing.id))
    } else {
      ;({ error: err } = await supabase.from('presupuestos').insert({ user_id: session.user.id, categoria: cat, limite, mes, anio }))
    }
    if (err) { alert('Error al guardar: ' + err.message); return }
    setEditando(null)
    fetchAll()
  }

  const eliminar = async (cat) => {
    const existing = presupuestos[cat]
    if (!existing) return
    await supabase.from('presupuestos').delete().eq('id', existing.id)
    fetchAll()
  }

  const card = { background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', padding: '20px' }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#E63946' }} />
    </div>
  )

  if (dbError) return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div style={{ ...card, borderLeft: '4px solid #E63946' }}>
        <h2 style={{ color: 'var(--text)', fontWeight: '700', marginBottom: '8px' }}>⚠️ Tabla no encontrada</h2>
        <p style={{ color: 'var(--text-2)', fontSize: '14px', marginBottom: '12px' }}>
          Necesitás crear la tabla <code>presupuestos</code> en Supabase. Ejecutá este SQL:
        </p>
        <pre style={{ background: isDark ? '#111' : '#f4f4f4', padding: '12px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', color: 'var(--text)' }}>
{`CREATE TABLE presupuestos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  limite NUMERIC NOT NULL,
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, categoria, mes, anio)
);
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON presupuestos FOR ALL USING (auth.uid() = user_id);`}
        </pre>
      </div>
    </div>
  )

  const mesLabel = ahora.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text)' }}>Presupuesto</h1>
        <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px', textTransform: 'capitalize' }}>{mesLabel}</p>
      </div>

      <div className="space-y-4">
        {CATEGORIAS.map(cat => {
          const gasto = gastoPorCat(cat)
          const presu = presupuestos[cat]
          const limite = presu?.limite || 0
          const pct = limite > 0 ? Math.min((gasto / limite) * 100, 100) : 0
          const over80 = limite > 0 && gasto >= limite * 0.8
          const over100 = limite > 0 && gasto >= limite

          return (
            <div key={cat} style={card}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '15px' }}>{cat}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '2px' }}>
                    Gastado: <strong style={{ color: over100 ? '#E63946' : over80 ? '#f59e0b' : '#16a34a' }}>{fmt(gasto)}</strong>
                    {limite > 0 && <span style={{ color: 'var(--text-3)' }}> / {fmt(limite)}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {editando === cat ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number" value={inputVal} onChange={e => setInputVal(e.target.value)}
                        placeholder="Límite $" min="0"
                        style={{ width: '110px', padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #E63946', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', outline: 'none' }}
                        autoFocus
                      />
                      <button onClick={() => guardar(cat)} style={{ background: '#E63946', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>✓</button>
                      <button onClick={() => setEditando(null)} style={{ background: 'var(--surface-alt)', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => { setEditando(cat); setInputVal(limite ? String(limite) : '') }}
                        style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', color: 'var(--text-2)', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        {limite > 0 ? 'Editar' : 'Setear límite'}
                      </button>
                      {limite > 0 && (
                        <button onClick={() => eliminar(cat)} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '16px' }}>🗑</button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {limite > 0 && (
                <>
                  <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '4px',
                      width: `${pct}%`,
                      background: over100 ? '#E63946' : over80 ? '#f59e0b' : '#22c55e',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{pct.toFixed(0)}% usado</span>
                    {over100 && <span style={{ fontSize: '11px', color: '#E63946', fontWeight: '700' }}>⚠️ Límite superado</span>}
                    {!over100 && over80 && <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '700' }}>⚠️ Cerca del límite (80%)</span>}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
