import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../supabaseClient'
import { fmtMoney as fmt } from '../utils/formatters'

const CATEGORIAS_VALIDAS = ['Comida', 'Alquiler', 'Transporte', 'Salud', 'Educación', 'Entretenimiento', 'Ropa', 'Servicios', 'Sueldo', 'Freelance', 'Inversiones', 'Otro']

const TIPOS_INGRESO = new Set(['ingreso', 'income', 'credito', 'crédito', 'credit', 'entrada', 'haber', '+'])
const TIPOS_EGRESO  = new Set(['egreso', 'expense', 'gasto', 'debito', 'débito', 'debit', 'salida', 'debe', 'cargo', '-'])

const norm = s => String(s).toLowerCase().trim().replace(/[^a-záéíóúñü\s]/g, '')

const detectCol = (headers, candidates) => {
  const h = headers.map(norm)
  for (const c of candidates) {
    const idx = h.findIndex(hh => hh.includes(c))
    if (idx !== -1) return idx
  }
  return -1
}

const parseDate = (val) => {
  if (val === null || val === undefined || val === '') return null
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  const n = Number(val)
  if (!isNaN(n) && n > 40000) {
    try {
      const d = XLSX.SSF.parse_date_code(n)
      if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
    } catch {}
  }
  return null
}

const parseTipo = (val) => {
  if (val === null || val === undefined) return null
  const s = String(val).toLowerCase().trim()
  if (TIPOS_INGRESO.has(s) || s.includes('ingreso') || s.includes('credit') || s.includes('haber')) return 'ingreso'
  if (TIPOS_EGRESO.has(s) || s.includes('egreso') || s.includes('gasto') || s.includes('debit') || s.includes('debe')) return 'egreso'
  return null
}

const parseCategoria = (val) => {
  if (!val) return 'Otro'
  const s = String(val).trim()
  return CATEGORIAS_VALIDAS.find(c => c.toLowerCase() === s.toLowerCase()) || 'Otro'
}

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  const sep = lines[0]?.includes(';') ? ';' : ','
  return lines.map(line => {
    const cells = []
    let cell = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === sep && !inQ) { cells.push(cell); cell = '' }
      else { cell += ch }
    }
    cells.push(cell)
    return cells.map(c => c.trim())
  })
}

export default function ImportModal({ session, onClose, onImported }) {
  const [step, setStep] = useState('upload')
  const [headers, setHeaders] = useState([])
  const [rawData, setRawData] = useState([])
  const [colMap, setColMap] = useState({ fecha: -1, tipo: -1, monto: -1, categoria: -1, descripcion: -1 })
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        let data
        if (file.name.toLowerCase().endsWith('.csv')) {
          data = parseCSV(e.target.result)
        } else {
          const wb = XLSX.read(e.target.result, { type: 'array' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true })
        }

        if (!data || data.length < 2) { alert('El archivo no tiene datos suficientes.'); return }

        const hdrs = data[0].map(h => String(h || ''))
        const body = data.slice(1).filter(row => row.some(c => c !== null && c !== undefined && c !== ''))

        const map = {
          fecha:       detectCol(hdrs, ['fecha', 'date', 'dia', 'f. op', 'fecha op', 'fecha_op']),
          tipo:        detectCol(hdrs, ['tipo', 'type', 'clase', 'movimiento', 'tipo_mov']),
          monto:       detectCol(hdrs, ['monto', 'importe', 'amount', 'valor', 'total']),
          categoria:   detectCol(hdrs, ['categoria', 'categoría', 'category', 'rubro']),
          descripcion: detectCol(hdrs, ['descripcion', 'descripción', 'description', 'detalle', 'concepto', 'comentario', 'obs']),
        }

        setHeaders(hdrs)
        setRawData(body)
        setColMap(map)
        setStep('preview')
      } catch (err) {
        alert('Error al leer el archivo: ' + err.message)
      }
    }
    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8')
    } else {
      reader.readAsArrayBuffer(file)
    }
  }

  const mapRow = (row) => {
    const fecha = colMap.fecha >= 0 ? parseDate(row[colMap.fecha]) : null
    const rawMonto = colMap.monto >= 0 ? String(row[colMap.monto] ?? '').replace(',', '.') : ''
    const monto = rawMonto ? Math.abs(Number(rawMonto)) : null
    const tipo = colMap.tipo >= 0 ? parseTipo(row[colMap.tipo]) : null
    const categoria = colMap.categoria >= 0 ? parseCategoria(row[colMap.categoria]) : 'Otro'
    const descripcion = colMap.descripcion >= 0 ? String(row[colMap.descripcion] || '') : ''
    const valid = !!(fecha && monto && monto > 0 && tipo)
    return { fecha, monto, tipo, categoria, descripcion: descripcion || null, valid }
  }

  const previewRows = rawData.slice(0, 5).map(mapRow)
  const validTotal = rawData.map(mapRow).filter(r => r.valid).length

  const handleImport = async () => {
    const toImport = rawData.map(mapRow).filter(r => r.valid).map(r => ({
      user_id: session.user.id,
      tipo: r.tipo,
      monto: r.monto,
      categoria: r.categoria,
      descripcion: r.descripcion,
      fecha: r.fecha,
    }))

    if (toImport.length === 0) { alert('No hay filas válidas para importar.'); return }
    setImporting(true)

    let count = 0
    for (let i = 0; i < toImport.length; i += 50) {
      const { error } = await supabase.from('movimientos').insert(toImport.slice(i, i + 50))
      if (!error) count += Math.min(50, toImport.length - i)
    }

    setImportedCount(count)
    setImporting(false)
    setStep('done')
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['fecha', 'tipo', 'monto', 'categoria', 'descripcion'],
      ['2024-04-15', 'egreso', '5000', 'Comida', 'Supermercado Coto'],
      ['2024-04-20', 'ingreso', '150000', 'Sueldo', 'Abril 2024'],
      ['2024-04-22', 'egreso', '12000', 'Transporte', 'SUBE #transporte'],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'template_importacion.xlsx')
  }

  const card = { background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }
  const inp = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border-mid)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }

  return (
    <div className="modal-backdrop">
      <div className="modal-inner" style={{ background: 'var(--surface)', maxWidth: '640px' }}>
        <div style={{ padding: '24px' }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text)' }}>Importar movimientos</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '2px' }}>CSV o Excel (.xlsx)</p>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-2)', lineHeight: 1 }}>✕</button>
          </div>

          {/* ── PASO: upload ── */}
          {step === 'upload' && (
            <div>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ border: '2px dashed var(--border-mid)', borderRadius: '14px', padding: '40px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#E63946'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#E63946' }}
                onDragLeave={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
              >
                <p style={{ fontSize: '32px', marginBottom: '10px' }}>📂</p>
                <p style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>Arrastrá tu archivo o hacé clic</p>
                <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>Formatos: .csv, .xlsx, .xls</p>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
              </div>

              <div style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Formato esperado</p>
                <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '10px' }}>
                  El archivo debe tener columnas: <strong>fecha</strong>, <strong>tipo</strong> (ingreso/egreso), <strong>monto</strong>, <strong>categoria</strong>, <strong>descripcion</strong>
                </p>
                <button onClick={downloadTemplate} style={{ fontSize: '12px', color: '#E63946', background: 'transparent', border: '1px solid #E63946', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}>
                  ⬇ Descargar template
                </button>
              </div>
            </div>
          )}

          {/* ── PASO: preview ── */}
          {step === 'preview' && (
            <div>
              {/* Mapeo de columnas */}
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '10px' }}>
                Columnas detectadas <span style={{ fontWeight: '400', color: 'var(--text-3)' }}>(ajustá si es necesario)</span>
              </p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { key: 'fecha', label: 'Fecha' },
                  { key: 'tipo', label: 'Tipo (ingreso/egreso)' },
                  { key: 'monto', label: 'Monto' },
                  { key: 'categoria', label: 'Categoría' },
                  { key: 'descripcion', label: 'Descripción (opcional)' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-3)', display: 'block', marginBottom: '4px' }}>{label}</label>
                    <select
                      style={inp}
                      value={colMap[key]}
                      onChange={e => setColMap(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    >
                      <option value={-1}>— Sin columna —</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview tabla */}
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>
                Vista previa (primeras 5 filas)
              </p>
              <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      {['Fecha', 'Tipo', 'Monto', 'Categoría', 'Descripción', ''].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border)', background: row.valid ? 'transparent' : 'rgba(230,57,70,0.04)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--text)' }}>{row.fecha || <span style={{ color: '#E63946' }}>—</span>}</td>
                        <td style={{ padding: '8px 12px', color: row.tipo === 'ingreso' ? '#16a34a' : row.tipo === 'egreso' ? '#E63946' : 'var(--text-3)' }}>
                          {row.tipo || <span style={{ color: '#E63946' }}>—</span>}
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text)' }}>{row.monto ? fmt(row.monto) : <span style={{ color: '#E63946' }}>—</span>}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-2)' }}>{row.categoria}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-3)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.descripcion || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          {row.valid
                            ? <span style={{ color: '#16a34a', fontSize: '14px' }}>✓</span>
                            : <span style={{ color: '#E63946', fontSize: '14px' }} title="Faltan datos requeridos">✕</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                  <strong style={{ color: 'var(--text)' }}>{validTotal}</strong> de <strong style={{ color: 'var(--text)' }}>{rawData.length}</strong> filas válidas para importar
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setStep('upload')} style={{ padding: '10px 18px', borderRadius: '10px', border: '1.5px solid var(--border-mid)', background: 'transparent', color: 'var(--text-2)', fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    ← Volver
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={validTotal === 0 || importing}
                    style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#E63946', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', opacity: (validTotal === 0 || importing) ? 0.5 : 1, boxShadow: '0 4px 12px rgba(230,57,70,0.3)' }}
                  >
                    {importing ? 'Importando...' : `Importar ${validTotal} movimientos`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── PASO: done ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: '48px', marginBottom: '12px' }}>✅</p>
              <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text)', marginBottom: '6px' }}>
                ¡Importación exitosa!
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-3)', marginBottom: '24px' }}>
                Se importaron <strong style={{ color: 'var(--text)' }}>{importedCount} movimientos</strong> correctamente.
              </p>
              <button
                onClick={() => { onClose(); onImported?.() }}
                style={{ background: '#E63946', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 28px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(230,57,70,0.35)' }}
              >
                Ver movimientos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
