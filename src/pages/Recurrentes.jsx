import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useTheme } from '../context/ThemeContext'
import { fmtMoney as fmt } from '../utils/formatters'

const CATEGORIAS = {
  ingreso: ['Sueldo', 'Freelance', 'Inversiones', 'Otro'],
  egreso: ['Comida', 'Alquiler', 'Transporte', 'Salud', 'Educación', 'Entretenimiento', 'Ropa', 'Servicios', 'Otro'],
}

const addDias = (fecha, dias) => {
  const d = new Date(fecha + 'T00:00:00')
  d.setDate(d.getDate() + dias)
  return d.toISOString().split('T')[0]
}
const addMes = (fecha) => {
  const d = new Date(fecha + 'T00:00:00')
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().split('T')[0]
}

export default function Recurrentes({ session }) {
  const { isDark } = useTheme()
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [tipo, setTipo] = useState('egreso')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [frecuencia, setFrecuencia] = useState('mensual')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAndGenerate() }, [])

  const fetchAndGenerate = async () => {
    const { data, error } = await supabase.from('recurrentes').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    if (error) { setDbError(true); setLoading(false); return }
    setLista(data || [])
    await generarPendientes(data || [])
    setLoading(false)
  }

  const generarPendientes = async (recs) => {
    const hoy = new Date().toISOString().split('T')[0]
    for (const rec of recs) {
      if (!rec.activo || rec.proxima_fecha > hoy) continue
      await supabase.from('movimientos').insert({
        user_id: session.user.id,
        tipo: rec.tipo,
        categoria: rec.categoria,
        descripcion: rec.descripcion ? `[Recurrente] ${rec.descripcion}` : '[Recurrente]',
        monto: rec.monto,
        fecha: rec.proxima_fecha,
      })
      const sig = rec.frecuencia === 'semanal' ? addDias(rec.proxima_fecha, 7) : rec.frecuencia === 'quincenal' ? addDias(rec.proxima_fecha, 15) : addMes(rec.proxima_fecha)
      await supabase.from('recurrentes').update({ proxima_fecha: sig }).eq('id', rec.id)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    const proxima = frecuencia === 'semanal' ? addDias(fechaInicio, 7) : frecuencia === 'quincenal' ? addDias(fechaInicio, 15) : addMes(fechaInicio)
    const { error: err } = await supabase.from('recurrentes').insert({
      user_id: session.user.id, tipo, monto: Number(monto), categoria, descripcion: descripcion || null, frecuencia, fecha_inicio: fechaInicio, proxima_fecha: proxima, activo: true,
    })
    setSaving(false)
    if (err) { alert('Error al guardar: ' + err.message); return }
    setShowForm(false)
    setMonto(''); setCategoria(''); setDescripcion(''); setFrecuencia('mensual')
    fetchAndGenerate()
  }

  const setFecuencia = setFrecuencia

  const toggleActivo = async (id, activo) => {
    await supabase.from('recurrentes').update({ activo: !activo }).eq('id', id)
    fetchAndGenerate()
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este movimiento recurrente?')) return
    await supabase.from('recurrentes').delete().eq('id', id)
    fetchAndGenerate()
  }

  const card = { background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', padding: '20px' }
  const inputCls = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border-mid)', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#E63946' }} /></div>

  if (dbError) return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div style={{ ...card, borderLeft: '4px solid #E63946' }}>
        <h2 style={{ color: 'var(--text)', fontWeight: '700', marginBottom: '8px' }}>⚠️ Tabla no encontrada</h2>
        <p style={{ color: 'var(--text-2)', fontSize: '14px', marginBottom: '12px' }}>Ejecutá este SQL en Supabase:</p>
        <pre style={{ background: isDark ? '#111' : '#f4f4f4', padding: '12px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', color: 'var(--text)' }}>
{`CREATE TABLE recurrentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  monto NUMERIC NOT NULL,
  frecuencia TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  proxima_fecha DATE NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE recurrentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON recurrentes FOR ALL USING (auth.uid() = user_id);`}
        </pre>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text)' }}>Movimientos Recurrentes</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>Se generan automáticamente según su frecuencia</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ background: '#E63946', color: '#fff', border: 'none', borderRadius: '12px', padding: '8px 18px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(230,57,70,0.35)', transition: 'all 0.2s' }}>
          {showForm ? '✕ Cancelar' : '+ Nuevo recurrente'}
        </button>
      </div>

      {showForm && (
        <div style={{ ...card, marginBottom: '24px', borderLeft: '4px solid #E63946' }}>
          <h2 style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '16px' }}>Nuevo movimiento recurrente</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Tipo</label>
              <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid var(--border-mid)' }}>
                {['ingreso', 'egreso'].map(t => (
                  <button key={t} type="button" onClick={() => { setTipo(t); setCategoria('') }}
                    style={{ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', background: tipo === t ? (t === 'ingreso' ? '#16a34a' : '#E63946') : 'var(--surface)', color: tipo === t ? '#fff' : 'var(--text-2)', transition: 'all 0.2s' }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div><label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Monto ($)</label><input style={inputCls} type="number" min="1" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0" required /></div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Categoría</label>
              <select style={inputCls} value={categoria} onChange={e => setCategoria(e.target.value)} required>
                <option value="">Seleccioná</option>
                {CATEGORIAS[tipo].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Descripción (opcional)</label><input style={inputCls} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Ej: Netflix" /></div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Frecuencia</label>
              <select style={inputCls} value={frecuencia} onChange={e => setFrecuencia(e.target.value)}>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
            <div><label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Fecha de inicio</label><input style={inputCls} type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} required /></div>
            <button type="submit" disabled={saving} style={{ width: '100%', background: '#E63946', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Guardando...' : 'Crear recurrente'}
            </button>
          </form>
        </div>
      )}

      {lista.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔄</p>
          <p style={{ color: 'var(--text)', fontWeight: '700', marginBottom: '6px' }}>Sin movimientos recurrentes</p>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>Automatizá tus movimientos fijos como alquiler, sueldo, suscripciones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map(rec => (
            <div key={rec.id} style={{ ...card, opacity: rec.activo ? 1 : 0.6 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: rec.tipo === 'ingreso' ? '#22c55e' : '#E63946', flexShrink: 0 }} />
                  <div className="min-w-0">
                    <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '14px' }}>{rec.categoria} {rec.descripcion && <span style={{ color: 'var(--text-3)', fontWeight: '400' }}>· {rec.descripcion}</span>}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                      {rec.frecuencia.charAt(0).toUpperCase() + rec.frecuencia.slice(1)} · Próximo: {new Date(rec.proxima_fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span style={{ fontWeight: '800', fontSize: '15px', color: rec.tipo === 'ingreso' ? '#16a34a' : '#E63946' }}>
                    {rec.tipo === 'ingreso' ? '+' : '-'}{fmt(rec.monto)}
                  </span>
                  <button onClick={() => toggleActivo(rec.id, rec.activo)} style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${rec.activo ? '#22c55e' : 'var(--border)'}`, background: 'transparent', color: rec.activo ? '#22c55e' : 'var(--text-3)', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {rec.activo ? 'Activo' : 'Pausado'}
                  </button>
                  <button onClick={() => eliminar(rec.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '16px' }}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
