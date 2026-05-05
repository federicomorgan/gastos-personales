import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { fmtMoney as fmt } from '../utils/formatters'

const CATEGORIAS = {
  ingreso: ['Sueldo', 'Freelance', 'Inversiones', 'Otro'],
  egreso: ['Comida', 'Alquiler', 'Transporte', 'Salud', 'Educación', 'Entretenimiento', 'Ropa', 'Servicios', 'Otro'],
}

// Extrae hashtags de la descripción y retorna texto limpio + array de tags
function parseTags(desc) {
  if (!desc) return { text: '', tags: [] }
  const tags = (desc.match(/#[\wÀ-ɏ]+/g) || []).map(t => t.slice(1))
  const text = desc.replace(/#[\wÀ-ɏ]+/g, '').replace(/\s+/g, ' ').trim()
  return { text, tags }
}

const TAG_COLORS = ['#E63946', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#c2410c']

export default function MovimientoCard({ movimiento: m, onDelete, showEdit = false }) {
  const [editOpen, setEditOpen] = useState(false)
  const [editTipo, setEditTipo] = useState(m.tipo)
  const [editMonto, setEditMonto] = useState(String(m.monto))
  const [editCat, setEditCat] = useState(m.categoria)
  const [editFecha, setEditFecha] = useState(m.fecha)
  const [editDesc, setEditDesc] = useState(m.descripcion || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editOpen) {
      setEditTipo(m.tipo); setEditMonto(String(m.monto))
      setEditCat(m.categoria); setEditFecha(m.fecha); setEditDesc(m.descripcion || '')
    }
  }, [editOpen])

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este movimiento?')) return
    await supabase.from('movimientos').delete().eq('id', m.id)
    onDelete()
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('movimientos').update({
      tipo: editTipo, monto: Number(editMonto), categoria: editCat, fecha: editFecha, descripcion: editDesc || null,
    }).eq('id', m.id)
    setSaving(false)
    setEditOpen(false)
    onDelete()
  }

  const inputCls = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1.5px solid var(--border-mid)', background: 'var(--surface)',
    color: 'var(--text)', fontSize: '14px', outline: 'none', fontFamily: 'inherit',
  }

  const { text: descText, tags } = parseTags(m.descripcion)

  return (
    <>
      <div
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', transition: 'all 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
      >
        <div className="flex items-start gap-3 min-w-0" style={{ flex: 1 }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, background: m.tipo === 'ingreso' ? '#22c55e' : '#E63946', marginTop: '4px' }} />
          <div className="min-w-0" style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{m.categoria}</p>
            {descText && (
              <p style={{ fontSize: '12px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {descText}
              </p>
            )}
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                {tags.map((tag, i) => (
                  <span key={tag} style={{
                    fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '99px',
                    background: TAG_COLORS[i % TAG_COLORS.length] + '20',
                    color: TAG_COLORS[i % TAG_COLORS.length],
                    border: `1px solid ${TAG_COLORS[i % TAG_COLORS.length]}40`,
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
              {new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span style={{ fontWeight: '700', fontSize: '14px', color: m.tipo === 'ingreso' ? '#16a34a' : '#E63946' }}>
            {m.tipo === 'ingreso' ? '+' : '-'}{fmt(m.monto)}
          </span>
          {showEdit && (
            <div className="flex gap-1">
              <button onClick={() => setEditOpen(true)} style={{ color: 'var(--text-3)', fontSize: '12px', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' }}
              >Editar</button>
              <button onClick={handleDelete} style={{ color: 'var(--text-3)', fontSize: '12px', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#E63946'; e.currentTarget.style.color = '#E63946' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' }}
              >Eliminar</button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className="modal-backdrop">
          <div className="modal-inner" style={{ background: 'var(--surface)' }}>
            <div style={{ padding: '24px' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text)' }}>Editar movimiento</h2>
                <button onClick={() => setEditOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-2)', lineHeight: 1 }}>✕</button>
              </div>
              <form onSubmit={handleEdit} className="space-y-5">
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Tipo</label>
                  <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid var(--border-mid)' }}>
                    {['ingreso', 'egreso'].map(t => (
                      <button key={t} type="button" onClick={() => { setEditTipo(t); setEditCat('') }}
                        style={{ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit', background: editTipo === t ? (t === 'ingreso' ? '#16a34a' : '#E63946') : 'var(--surface)', color: editTipo === t ? '#fff' : 'var(--text-2)', transition: 'all 0.2s' }}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Monto ($)</label>
                  <input style={inputCls} type="number" min="0" step="0.01" value={editMonto} onChange={e => setEditMonto(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Categoría</label>
                  <select style={inputCls} value={editCat} onChange={e => setEditCat(e.target.value)} required>
                    <option value="">Seleccioná</option>
                    {CATEGORIAS[editTipo].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Fecha</label>
                  <input style={inputCls} type="date" value={editFecha} onChange={e => setEditFecha(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Descripción (opcional)</label>
                  <input style={inputCls} value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Ej: Supermercado #comida" />
                  <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
                    Podés agregar etiquetas: #supermercado #trabajo
                  </p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border-mid)', background: 'transparent', color: 'var(--text-2)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: '#E63946', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1, transition: 'all 0.2s' }}>
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
