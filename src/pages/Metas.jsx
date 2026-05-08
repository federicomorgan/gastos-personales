import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useTheme } from '../context/ThemeContext'
import { fmtMoney as fmt } from '../utils/formatters'

export default function Metas({ session }) {
  const { isDark } = useTheme()
  const [metas, setMetas] = useState([])
  const [contribuciones, setContribuciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [plazo, setPlazo] = useState('')
  const [saving, setSaving] = useState(false)
  const [aportandoId, setAportandoId] = useState(null)
  const [montoAporte, setMontoAporte] = useState('')
  const [notaAporte, setNotaAporte] = useState('')
  const [fechaAporte, setFechaAporte] = useState(new Date().toISOString().split('T')[0])
  const [savingAporte, setSavingAporte] = useState(false)
  const [expandedMeta, setExpandedMeta] = useState(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [metasRes, contribRes] = await Promise.all([
      supabase.from('metas').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('contribuciones').select('*').eq('user_id', session.user.id).order('fecha', { ascending: false }),
    ])
    const { data: metasData, error: metasErr } = metasRes
    const { data: contribData, error: contribErr } = contribRes
    if (metasErr || contribErr) { setDbError(true); setLoading(false); return }
    setMetas(metasData || [])
    setContribuciones(contribData || [])
    setLoading(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error: err } = await supabase.from('metas').insert({
      user_id: session.user.id,
      nombre,
      objetivo: Number(objetivo),
      plazo: plazo || null,
    })
    setSaving(false)
    if (err) { alert('Error al guardar: ' + err.message); return }
    setNombre(''); setObjetivo(''); setPlazo(''); setShowForm(false)
    fetchAll()
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta meta?')) return
    await supabase.from('metas').delete().eq('id', id)
    fetchAll()
  }

  const handleAporte = async (e, metaId) => {
    e.preventDefault()
    setSavingAporte(true)
    const { error: err } = await supabase.from('contribuciones').insert({
      user_id: session.user.id,
      meta_id: metaId,
      monto: Number(montoAporte),
      nota: notaAporte || null,
      fecha: fechaAporte,
    })
    setSavingAporte(false)
    if (err) { alert('Error: ' + err.message); return }
    setAportandoId(null)
    setMontoAporte('')
    setNotaAporte('')
    setFechaAporte(new Date().toISOString().split('T')[0])
    fetchAll()
  }

  const eliminarAporte = async (id) => {
    if (!confirm('¿Eliminar este aporte?')) return
    await supabase.from('contribuciones').delete().eq('id', id)
    fetchAll()
  }

  const card = { background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', padding: '20px' }
  const inputCls = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border-mid)', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#E63946' }} />
    </div>
  )

  if (dbError) return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div style={{ ...card, borderLeft: '4px solid #E63946' }}>
        <h2 style={{ color: 'var(--text)', fontWeight: '700', marginBottom: '8px' }}>⚠️ Tabla no encontrada</h2>
        <p style={{ color: 'var(--text-2)', fontSize: '14px', marginBottom: '12px' }}>Ejecutá este SQL en Supabase:</p>
        <pre style={{ background: isDark ? '#111' : '#f4f4f4', padding: '12px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', color: 'var(--text)' }}>
{`CREATE TABLE IF NOT EXISTS metas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  objetivo NUMERIC NOT NULL,
  plazo DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON metas FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS contribuciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meta_id UUID NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
  monto NUMERIC NOT NULL,
  nota TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE contribuciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON contribuciones FOR ALL USING (auth.uid() = user_id);`}
        </pre>
      </div>
    </div>
  )

  const totalAhorrado = contribuciones.reduce((s, c) => s + Number(c.monto), 0)

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text)' }}>Metas de Ahorro</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            {contribuciones.length > 0
              ? <>Total ahorrado: <strong style={{ color: '#22c55e' }}>{fmt(totalAhorrado)}</strong></>
              : 'Registrá tus aportes en cada meta'
            }
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '8px 18px', background: '#E63946', color: '#fff', borderRadius: '12px', fontWeight: '700', fontSize: '13px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(230,57,70,0.35)', transition: 'all 0.2s' }}
        >
          {showForm ? '✕ Cancelar' : '+ Nueva meta'}
        </button>
      </div>

      {showForm && (
        <div style={{ ...card, marginBottom: '24px', borderLeft: '4px solid #E63946' }}>
          <h2 style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '16px' }}>Nueva meta</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Nombre</label>
              <input style={inputCls} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Ahorrar para vacaciones" required />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Objetivo ($)</label>
              <input style={inputCls} type="number" min="1" value={objetivo} onChange={e => setObjetivo(e.target.value)} placeholder="50000" required />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Plazo (opcional)</label>
              <input style={inputCls} type="date" value={plazo} onChange={e => setPlazo(e.target.value)} />
            </div>
            <button type="submit" disabled={saving} style={{ width: '100%', background: '#E63946', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Guardando...' : 'Crear meta'}
            </button>
          </form>
        </div>
      )}

      {metas.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</p>
          <p style={{ color: 'var(--text)', fontWeight: '700', marginBottom: '6px' }}>Sin metas aún</p>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>Creá una meta de ahorro y seguí tu progreso</p>
        </div>
      ) : (
        <div className="space-y-4">
          {metas.map(meta => {
            const aportes = contribuciones.filter(c => c.meta_id === meta.id)
            const ahorrado = aportes.reduce((s, c) => s + Number(c.monto), 0)
            const progreso = Math.min((ahorrado / meta.objetivo) * 100, 100)
            const completada = ahorrado >= meta.objetivo
            const onTrack = ahorrado > 0 && ahorrado >= meta.objetivo * 0.3
            const isExpanded = expandedMeta === meta.id
            const isAportando = aportandoId === meta.id

            return (
              <div key={meta.id} style={card}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '15px' }}>{meta.nombre}</p>
                    {meta.plazo && (
                      <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                        Plazo: {new Date(meta.plazo + 'T00:00:00').toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '12px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', background: completada ? 'rgba(34,197,94,0.15)' : onTrack ? 'rgba(59,130,246,0.1)' : 'rgba(100,100,100,0.1)', color: completada ? '#16a34a' : onTrack ? '#3b82f6' : 'var(--text-3)' }}>
                      {completada ? '✓ Completada' : onTrack ? '📈 En camino' : '🎯 Sin aportes'}
                    </span>
                    <button onClick={() => eliminar(meta.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '16px' }}>🗑</button>
                  </div>
                </div>

                <div className="flex justify-between mb-2" style={{ fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-2)' }}>Ahorrado: <strong style={{ color: ahorrado > 0 ? '#22c55e' : 'var(--text-3)' }}>{fmt(ahorrado)}</strong></span>
                  <span style={{ color: 'var(--text-2)' }}>Meta: <strong style={{ color: 'var(--text)' }}>{fmt(meta.objetivo)}</strong></span>
                </div>

                <div style={{ height: '10px', background: 'var(--border)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '5px', width: `${Math.max(progreso, 0)}%`, background: completada ? '#22c55e' : '#3b82f6', transition: 'width 0.7s ease' }} />
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '6px' }}>
                  {completada
                    ? '🎉 ¡Meta alcanzada!'
                    : ahorrado > 0
                      ? `Falta ${fmt(Math.max(meta.objetivo - ahorrado, 0))} · ${Math.max(progreso, 0).toFixed(0)}%`
                      : 'Registrá tu primer aporte para empezar a seguir el progreso'
                  }
                </p>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { setAportandoId(isAportando ? null : meta.id); setExpandedMeta(null) }}
                    style={{ flex: 1, padding: '8px', background: isAportando ? 'rgba(230,57,70,0.1)' : 'rgba(59,130,246,0.1)', color: isAportando ? '#E63946' : '#3b82f6', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                  >
                    {isAportando ? '✕ Cancelar' : '+ Aportar'}
                  </button>
                  {aportes.length > 0 && (
                    <button
                      onClick={() => { setExpandedMeta(isExpanded ? null : meta.id); setAportandoId(null) }}
                      style={{ flex: 1, padding: '8px', background: 'var(--border)', color: 'var(--text-2)', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                    >
                      {isExpanded ? 'Ocultar' : `Ver aportes (${aportes.length})`}
                    </button>
                  )}
                </div>

                {isAportando && (
                  <form onSubmit={e => handleAporte(e, meta.id)} className="mt-4 space-y-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>Nuevo aporte</p>
                    <div className="flex gap-2">
                      <input
                        style={{ ...inputCls, flex: 1 }}
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="Monto"
                        value={montoAporte}
                        onChange={e => setMontoAporte(e.target.value)}
                        required
                      />
                      <input
                        style={{ ...inputCls, flex: 1 }}
                        type="date"
                        value={fechaAporte}
                        onChange={e => setFechaAporte(e.target.value)}
                        required
                      />
                    </div>
                    <input
                      style={inputCls}
                      placeholder="Nota (opcional)"
                      value={notaAporte}
                      onChange={e => setNotaAporte(e.target.value)}
                    />
                    <button type="submit" disabled={savingAporte} style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', opacity: savingAporte ? 0.6 : 1 }}>
                      {savingAporte ? 'Guardando...' : 'Registrar aporte'}
                    </button>
                  </form>
                )}

                {isExpanded && aportes.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>Historial de aportes</p>
                    <div className="space-y-2">
                      {aportes.map(aporte => (
                        <div key={aporte.id} className="flex items-center justify-between" style={{ padding: '8px 12px', background: 'var(--border)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <span style={{ fontWeight: '700', color: '#22c55e', fontSize: '14px', whiteSpace: 'nowrap' }}>{fmt(aporte.monto)}</span>
                            {aporte.nota && <span style={{ fontSize: '12px', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{aporte.nota}</span>}
                          </div>
                          <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                              {new Date(aporte.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                            </span>
                            <button onClick={() => eliminarAporte(aporte.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '14px', padding: '0' }}>🗑</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
