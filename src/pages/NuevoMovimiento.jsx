import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useTheme } from '../context/ThemeContext'

const CATEGORIAS = {
  ingreso: ['Sueldo', 'Freelance', 'Inversiones', 'Otro'],
  egreso:  ['Comida', 'Alquiler', 'Transporte', 'Salud', 'Educación', 'Entretenimiento', 'Ropa', 'Servicios', 'Otro'],
}

const addDias = (fecha, dias) => {
  const d = new Date(fecha + 'T00:00:00'); d.setDate(d.getDate() + dias)
  return d.toISOString().split('T')[0]
}
const addMes = (fecha) => {
  const d = new Date(fecha + 'T00:00:00'); d.setMonth(d.getMonth() + 1)
  return d.toISOString().split('T')[0]
}

export default function NuevoMovimiento({ session }) {
  const { isDark } = useTheme()
  const { id }     = useParams()
  const navigate   = useNavigate()

  const [tipo,       setTipo]       = useState('egreso')
  const [monto,      setMonto]      = useState('')
  const [categoria,  setCategoria]  = useState('')
  const [fecha,      setFecha]      = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })
  const [descripcion,setDescripcion]= useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  // Recurrente
  const [esRecurrente,  setEsRecurrente]  = useState(false)
  const [frecuencia,    setFrecuencia]    = useState('mensual')

  useEffect(() => { if (id) fetchMovimiento() }, [id])

  const fetchMovimiento = async () => {
    const { data } = await supabase.from('movimientos').select('*').eq('id', id).single()
    if (data) {
      setTipo(data.tipo); setMonto(String(data.monto))
      setCategoria(data.categoria); setFecha(data.fecha)
      setDescripcion(data.descripcion || '')
    }
  }

  const handleTipoChange = (t) => { setTipo(t); setCategoria('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')

    const datos = { user_id: session.user.id, tipo, monto: Number(monto), categoria, fecha, descripcion: descripcion || null }

    let err
    if (id) {
      ;({ error: err } = await supabase.from('movimientos').update(datos).eq('id', id))
    } else {
      ;({ error: err } = await supabase.from('movimientos').insert(datos))

      // Guardar como recurrente si corresponde
      if (!err && esRecurrente) {
        const proxima = frecuencia === 'semanal' ? addDias(fecha, 7) : frecuencia === 'quincenal' ? addDias(fecha, 15) : addMes(fecha)
        await supabase.from('recurrentes').insert({
          user_id: session.user.id, tipo, monto: Number(monto), categoria,
          descripcion: descripcion || null, frecuencia, fecha_inicio: fecha, proxima_fecha: proxima, activo: true,
        })
      }
    }

    if (err) { setError(err.message); setLoading(false) }
    else navigate('/movimientos')
  }

  // ─── Estilos ───
  const inp = {
    width: '100%', border: '1.5px solid var(--border-mid)', borderRadius: '12px',
    padding: '12px 16px', fontSize: '14px', background: 'var(--surface)',
    color: 'var(--text)', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
  }
  const lbl = { display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', marginBottom: '6px' }

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} style={{ color: 'var(--text-3)', background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontFamily: 'inherit' }}>
        ← Volver
      </button>

      <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text)', marginBottom: '24px' }}>
        {id ? 'Editar movimiento' : 'Nuevo movimiento'}
      </h1>

      <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Tipo */}
          <div>
            <label style={lbl}>Tipo</label>
            <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid var(--border-mid)' }}>
              {['ingreso', 'egreso'].map(t => (
                <button key={t} type="button" onClick={() => handleTipoChange(t)}
                  style={{ flex: 1, padding: '12px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit', transition: 'all 0.2s',
                    background: tipo === t ? (t === 'ingreso' ? '#16a34a' : '#E63946') : 'var(--surface)',
                    color: tipo === t ? '#fff' : 'var(--text-2)',
                  }}
                >
                  {t === 'ingreso' ? 'Ingreso' : 'Egreso'}
                </button>
              ))}
            </div>
          </div>

          {/* Monto */}
          <div>
            <label style={lbl}>Monto ($)</label>
            <input style={inp} type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0" min="0" step="0.01" required
              onFocus={e => e.target.style.borderColor = '#E63946'}
              onBlur={e  => e.target.style.borderColor = 'var(--border-mid)'}
            />
          </div>

          {/* Categoría */}
          <div>
            <label style={lbl}>Categoría</label>
            <select style={inp} value={categoria} onChange={e => setCategoria(e.target.value)} required>
              <option value="">Seleccioná una categoría</option>
              {CATEGORIAS[tipo].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label style={lbl}>Fecha</label>
            <input style={inp} type="date" value={fecha} onChange={e => setFecha(e.target.value)} required
              onFocus={e => e.target.style.borderColor = '#E63946'}
              onBlur={e  => e.target.style.borderColor = 'var(--border-mid)'}
            />
          </div>

          {/* Descripción */}
          <div>
            <label style={{ ...lbl }}>
              Descripción <span style={{ fontWeight: '400', color: 'var(--text-3)' }}>(opcional)</span>
            </label>
            <input style={inp} type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Ej: Supermercado Coto #comida"
              onFocus={e => e.target.style.borderColor = '#E63946'}
              onBlur={e  => e.target.style.borderColor = 'var(--border-mid)'}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '5px' }}>
              Podés agregar etiquetas con # — Ej: <span style={{ color: '#E63946', fontWeight: '600' }}>#supermercado</span> <span style={{ color: '#2563eb', fontWeight: '600' }}>#trabajo</span>
            </p>
          </div>

          {/* Recurrente (solo en modo crear) */}
          {!id && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={esRecurrente}
                  onChange={e => setEsRecurrente(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#E63946', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                  🔄 Marcar como recurrente
                </span>
              </label>

              {esRecurrente && (
                <div style={{ marginTop: '12px' }}>
                  <label style={lbl}>Frecuencia</label>
                  <select style={inp} value={frecuencia} onChange={e => setFrecuencia(e.target.value)}>
                    <option value="semanal">Semanal (cada 7 días)</option>
                    <option value="quincenal">Quincenal (cada 15 días)</option>
                    <option value="mensual">Mensual (cada 1 mes)</option>
                  </select>
                  <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>
                    Se generará automáticamente en cada período. Podés gestionarlo en <strong>Recurrentes</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <p style={{ color: '#E63946', fontSize: '14px', background: 'rgba(230,57,70,0.1)', padding: '12px 16px', borderRadius: '10px' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', background: '#E63946', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1, boxShadow: '0 4px 14px rgba(230,57,70,0.35)', transition: 'all 0.2s' }}
          >
            {loading ? 'Guardando…' : id ? 'Guardar cambios' : 'Agregar movimiento'}
          </button>
        </form>
      </div>
    </div>
  )
}
