import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { supabase } from '../supabaseClient'
import MovimientoCard from '../components/MovimientoCard'
import { useTheme } from '../context/ThemeContext'
import { fmtMoney as fmtARS } from '../utils/formatters'

const CATEGORIAS_INGRESO = ['Sueldo', 'Freelance', 'Inversiones', 'Otro']
const CATEGORIAS_EGRESO  = ['Comida', 'Alquiler', 'Transporte', 'Salud', 'Educación', 'Entretenimiento', 'Ropa', 'Servicios', 'Otro']

export default function Movimientos({ session }) {
  const { isDark } = useTheme()
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading]         = useState(true)

  // Filtros
  const [busqueda,       setBusqueda]       = useState('')
  const [filtroMes,      setFiltroMes]      = useState('')
  const [filtroTipo,     setFiltroTipo]     = useState('')
  const [filtroCategoria,setFiltroCategoria]= useState('')
  const [montoMin,       setMontoMin]       = useState('')
  const [montoMax,       setMontoMax]       = useState('')

  useEffect(() => { fetchMovimientos() }, [])

  const fetchMovimientos = async () => {
    const { data } = await supabase
      .from('movimientos').select('*')
      .eq('user_id', session.user.id)
      .order('fecha', { ascending: false })
    setMovimientos(data || [])
    setLoading(false)
  }

  const categorias = filtroTipo === 'ingreso'
    ? CATEGORIAS_INGRESO
    : filtroTipo === 'egreso'
    ? CATEGORIAS_EGRESO
    : [...CATEGORIAS_INGRESO, ...CATEGORIAS_EGRESO]

  const filtrados = movimientos.filter(m => {
    const fecha  = new Date(m.fecha)
    const mesStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    if (filtroMes      && mesStr !== filtroMes)           return false
    if (filtroTipo     && m.tipo !== filtroTipo)          return false
    if (filtroCategoria && m.categoria !== filtroCategoria) return false
    if (montoMin && Number(m.monto) < Number(montoMin))   return false
    if (montoMax && Number(m.monto) > Number(montoMax))   return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      const enDesc = m.descripcion?.toLowerCase().includes(q)
      const enCat  = m.categoria.toLowerCase().includes(q)
      if (!enDesc && !enCat) return false
    }
    return true
  })

  const meses = []
  const hoy = new Date()
  for (let i = 0; i < 12; i++) {
    const d   = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    meses.push({ val, label })
  }

  const exportarExcel = () => {
    const filas = filtrados.map(m => ({
      Fecha:       new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-AR'),
      Tipo:        m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
      Categoría:   m.categoria,
      Descripción: m.descripcion || '',
      Monto:       m.tipo === 'ingreso' ? Number(m.monto) : -Number(m.monto),
    }))

    const ws = XLSX.utils.json_to_sheet(filas)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')

    const ref = filtroMes || `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
    const [anio, mes] = ref.split('-')
    XLSX.writeFile(wb, `GastosPersonales_${mes}_${anio}.xlsx`)
  }

  // Estilos reutilizables
  const sel = {
    border: '1px solid var(--border-mid)',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '13px',
    background: 'var(--surface)',
    color: 'var(--text)',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text)' }}>Movimientos</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportarExcel} className="btn-pdf" style={{ fontSize: '12px', padding: '7px 12px' }}>
            📊 Excel
          </button>
          <Link to="/nuevo" className="btn-nuevo">+ Nuevo</Link>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', marginBottom: '20px' }}>

        {/* Búsqueda */}
        <div style={{ marginBottom: '12px' }}>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="🔍 Buscar por descripción o categoría…"
            style={{ ...sel, padding: '10px 14px' }}
          />
        </div>

        {/* Filtros fila 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} style={sel}>
            <option value="">Todos los meses</option>
            {meses.map(m => <option key={m.val} value={m.val} className="capitalize">{m.label}</option>)}
          </select>

          <select value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); setFiltroCategoria('') }} style={sel}>
            <option value="">Todos los tipos</option>
            <option value="ingreso">Ingresos</option>
            <option value="egreso">Egresos</option>
          </select>

          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={sel}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Filtros fila 2 – montos */}
        <div className="grid grid-cols-2 gap-3">
          <input type="number" value={montoMin} onChange={e => setMontoMin(e.target.value)} placeholder="Monto mínimo $" min="0" style={sel} />
          <input type="number" value={montoMax} onChange={e => setMontoMax(e.target.value)} placeholder="Monto máximo $" min="0" style={sel} />
        </div>

        {/* Info resultados + limpiar */}
        <div className="flex items-center justify-between mt-3">
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
            {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
          </span>
          {(busqueda || filtroMes || filtroTipo || filtroCategoria || montoMin || montoMax) && (
            <button
              onClick={() => { setBusqueda(''); setFiltroMes(''); setFiltroTipo(''); setFiltroCategoria(''); setMontoMin(''); setMontoMax('') }}
              style={{ fontSize: '12px', color: '#E63946', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#E63946' }} />
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
          <p style={{ fontSize: '18px', marginBottom: '6px' }}>Sin movimientos</p>
          <p style={{ fontSize: '14px' }}>Cambiá los filtros o agregá uno nuevo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(m => (
            <MovimientoCard key={m.id} movimiento={m} onDelete={fetchMovimientos} showEdit />
          ))}
        </div>
      )}
    </div>
  )
}
