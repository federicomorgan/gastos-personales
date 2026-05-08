import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import GraficoTorta from '../components/GraficoTorta'
import GraficoBarras from '../components/GraficoBarras'
import GraficoLinea from '../components/GraficoLinea'
import MovimientoCard from '../components/MovimientoCard'
import AnimatedNumber from '../components/AnimatedNumber'
import { useTheme } from '../context/ThemeContext'
import { getColor } from '../utils/categoryColors'
import { fmtMoney } from '../utils/formatters'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function DeltaBadge({ pct, goodIfPositive = true }) {
  if (pct === 0 || pct === null) return <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '8px' }}>Sin datos del mes anterior</p>
  const isGood = goodIfPositive ? pct >= 0 : pct <= 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
      <span style={{ fontSize: '12px', fontWeight: '700', color: isGood ? '#16a34a' : '#E63946' }}>
        {pct > 0 ? '▲' : '▼'} {Math.abs(pct)}%
      </span>
      <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>vs mes anterior</span>
    </div>
  )
}

// Nombres comunes hispanohablantes, ordenados de mayor a menor longitud
// para que "maximiliano" matchee antes que "maxi" o "max"
const NOMBRES = [
  'maximiliano','alejandro','sebastián','sebastian','valentina','florencia',
  'alejandra','francisco','christian','cristian','mariangel','mariana',
  'federico','mauricio','leandro','gonzalo','rodrigo','andres','andrés',
  'agustin','agustín','ignacio','gabriel','nicolas','nicolás','facundo',
  'ezequiel','damian','damián','esteban','matias','matías','marcos',
  'carlos','miguel','manuel','hernan','hernán','gaston','gastón',
  'sergio','martin','martín','javier','daniel','franco','diego',
  'mario','pablo','jorge','oscar','julio','ruben','rubén','pedro',
  'ramón','ramon','raul','raúl','hugo','luis','ivan','iván','alan',
  'leonel','lautaro','thiago','bautista','emiliano','mateo','tomas','tomás',
  'walter','claudio','alberto','roberto','victor','víctor','adrian','adrián',
  'gustavo','emilio','ricardo','ramiro','maximo','máximo','fabian','fabián',
  'brian','kevin','mariano','leandro','pablo','leo',
  'maria','maría','sofia','sofía','lucia','lucía','laura','paula','silvia',
  'monica','mónica','andrea','cecilia','valeria','natalia','romina','paola',
  'lorena','sabrina','melina','micaela','brenda','gisela','viviana','susana',
  'graciela','marcela','daniela','miriam','norma','liliana','carolina',
  'camila','martina','julieta','rocio','rocío','belen','belén','pilar',
  'vanesa','claudia','patricia','florencia','mirna','ruth','ana','eva',
  'juan',
].sort((a, b) => b.length - a.length)

function extraerPrimerNombre(metadata, email) {
  const fullName = (metadata?.full_name || metadata?.name || '').trim()
  if (fullName) {
    const first = fullName.split(' ')[0]
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  }
  const user = email.split('@')[0].split(/[._\-]/)[0].toLowerCase().replace(/\d+$/, '')
  const match = NOMBRES.find(n => user.startsWith(n.toLowerCase()))
  const raw = match ? match.replace(/[áéíóúü]/g, c => ({ á:'a',é:'e',í:'i',ó:'o',ú:'u',ü:'u' })[c]) : user
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

// Retorna [inicio lunes, fin domingo] de la semana que contiene `date`
function getWeekBounds(date) {
  const d = new Date(date)
  const day = d.getDay() // 0=Dom
  const diff = day === 0 ? -6 : 1 - day
  const start = new Date(d)
  start.setDate(d.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return [start, end]
}

export default function Dashboard({ session }) {
  const { isDark } = useTheme()
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchMovimientos() }, [])

  const fetchMovimientos = async () => {
    const { data } = await supabase
      .from('movimientos')
      .select('*')
      .eq('user_id', session.user.id)
      .order('fecha', { ascending: false })
    setMovimientos(data || [])
    setLoading(false)
  }

  const ahora = new Date()
  const primerNombre = extraerPrimerNombre(session.user.user_metadata, session.user.email)
  const hora = ahora.getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  // ── Mes actual ──
  const mesActual = movimientos.filter(m => {
    const f = new Date(m.fecha + 'T00:00:00')
    return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear()
  })
  const totalIngresos = mesActual.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.monto), 0)
  const totalEgresos  = mesActual.filter(m => m.tipo === 'egreso').reduce((s, m) => s + Number(m.monto), 0)

  // ── Saldo arrastrado de meses anteriores ──
  const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const mesesAnteriores = movimientos.filter(m => new Date(m.fecha + 'T00:00:00') < inicioMesActual)
  const saldoArrastrado = mesesAnteriores.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.monto), 0)
                        - mesesAnteriores.filter(m => m.tipo === 'egreso').reduce((s, m) => s + Number(m.monto), 0)

  const balance = saldoArrastrado + totalIngresos - totalEgresos

  // ── Mes anterior ──
  const prevDate = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
  const mesPasado = movimientos.filter(m => {
    const f = new Date(m.fecha + 'T00:00:00')
    return f.getMonth() === prevDate.getMonth() && f.getFullYear() === prevDate.getFullYear()
  })
  const ingPasado = mesPasado.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.monto), 0)
  const egPasado  = mesPasado.filter(m => m.tipo === 'egreso').reduce((s, m) => s + Number(m.monto), 0)

  // ── Tasa de ahorro ──
  const tasaAhorro = totalIngresos > 0
    ? Math.round(((totalIngresos - totalEgresos) / totalIngresos) * 100)
    : null

  // ── Resumen semanal ──
  const [semActStart, semActEnd] = getWeekBounds(ahora)
  const prevWeekDate = new Date(ahora)
  prevWeekDate.setDate(prevWeekDate.getDate() - 7)
  const [semPasStart, semPasEnd] = getWeekBounds(prevWeekDate)

  const gastoSemActual = movimientos
    .filter(m => {
      const f = new Date(m.fecha + 'T00:00:00')
      return m.tipo === 'egreso' && f >= semActStart && f <= semActEnd
    })
    .reduce((s, m) => s + Number(m.monto), 0)

  const gastoSemPasada = movimientos
    .filter(m => {
      const f = new Date(m.fecha + 'T00:00:00')
      return m.tipo === 'egreso' && f >= semPasStart && f <= semPasEnd
    })
    .reduce((s, m) => s + Number(m.monto), 0)

  const difSemanal = gastoSemPasada > 0
    ? Math.round(((gastoSemActual - gastoSemPasada) / gastoSemPasada) * 100)
    : null

  // ── Top 3 categorías de egreso ──
  const porCategoria = mesActual
    .filter(m => m.tipo === 'egreso')
    .reduce((acc, m) => {
      acc[m.categoria] = (acc[m.categoria] || 0) + Number(m.monto)
      return acc
    }, {})
  const top3 = Object.entries(porCategoria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  const maxTop = top3[0]?.[1] || 1

  const pct = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0
    return Math.round(((curr - prev) / Math.abs(prev)) * 100)
  }

  const formatARS = fmtMoney

  const generarPDF = () => {
    const doc = new jsPDF()
    const mesLabel = ahora.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    const mesCapitalizado = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)

    const logoCanvas = document.createElement('canvas')
    logoCanvas.width = 540; logoCanvas.height = 120
    const lc = logoCanvas.getContext('2d')
    lc.scale(2, 2)
    lc.strokeStyle = '#E63946'; lc.lineCap = 'round'; lc.lineJoin = 'round'; lc.lineWidth = 2
    lc.beginPath(); lc.moveTo(8, 30); lc.lineTo(40, 30); lc.stroke()
    lc.beginPath(); lc.arc(56, 30, 16, Math.PI, 0, true); lc.stroke()
    lc.beginPath(); lc.moveTo(72, 30); lc.lineTo(90, 30); lc.stroke()
    lc.lineWidth = 2.5
    lc.beginPath()
    lc.moveTo(90, 30); lc.lineTo(102, 30); lc.lineTo(118, 4)
    lc.lineTo(126, 56); lc.lineTo(136, 30); lc.lineTo(158, 30)
    lc.stroke()
    lc.lineWidth = 2
    lc.beginPath(); lc.moveTo(158, 30); lc.lineTo(210, 30); lc.stroke()
    lc.fillStyle = '#E63946'; lc.font = 'bold 14px monospace'; lc.fillText('</>', 215, 37)
    const logoImg = logoCanvas.toDataURL('image/png')

    doc.setFillColor(15, 15, 15)
    doc.rect(0, 0, 210, 44, 'F')
    doc.addImage(logoImg, 'PNG', 12, 7, 35, 35 * 60 / 270)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(255, 255, 255)
    doc.text('FAVAL', 51, 17)
    doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(9); doc.setTextColor(230, 57, 70)
    doc.text('agencia', 51, 24)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(255, 255, 255)
    doc.text('Gastos Personales', 198, 16, { align: 'right' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120)
    doc.text(mesCapitalizado, 198, 24, { align: 'right' })
    doc.setDrawColor(35, 35, 35); doc.setLineWidth(0.3); doc.line(12, 35, 198, 35)

    const cardY = 50; const cardH = 27
    doc.setFillColor(240, 253, 244); doc.roundedRect(12, cardY, 59, cardH, 3, 3, 'F')
    doc.setDrawColor(22, 163, 74); doc.setLineWidth(1.5); doc.line(12, cardY, 12, cardY + cardH)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(22, 101, 52)
    doc.text('Ingresos del mes', 16, cardY + 9)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(21, 128, 61)
    doc.text(formatARS(totalIngresos), 16, cardY + 21)

    doc.setFillColor(255, 241, 242); doc.roundedRect(77, cardY, 59, cardH, 3, 3, 'F')
    doc.setDrawColor(230, 57, 70); doc.setLineWidth(1.5); doc.line(77, cardY, 77, cardY + cardH)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(159, 18, 57)
    doc.text('Egresos del mes', 81, cardY + 9)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(230, 57, 70)
    doc.text(formatARS(totalEgresos), 81, cardY + 21)

    if (balance >= 0) {
      doc.setFillColor(239, 246, 255); doc.roundedRect(142, cardY, 59, cardH, 3, 3, 'F')
      doc.setDrawColor(59, 130, 246); doc.setLineWidth(1.5); doc.line(142, cardY, 142, cardY + cardH)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(30, 58, 138)
      doc.text('Balance', 146, cardY + 9)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(37, 99, 235)
      doc.text(formatARS(balance), 146, cardY + 21)
    } else {
      doc.setFillColor(255, 241, 242); doc.roundedRect(142, cardY, 59, cardH, 3, 3, 'F')
      doc.setDrawColor(230, 57, 70); doc.setLineWidth(1.5); doc.line(142, cardY, 142, cardY + cardH)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(159, 18, 57)
      doc.text('Balance', 146, cardY + 9)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(230, 57, 70)
      doc.text(formatARS(balance), 146, cardY + 21)
    }

    const tableStartY = cardY + cardH + 13
    doc.setDrawColor(230, 57, 70); doc.setLineWidth(2); doc.line(12, tableStartY, 12, tableStartY + 8)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(17, 24, 39)
    doc.text('Movimientos del mes', 17, tableStartY + 6)

    const filas = mesActual.map(m => [
      new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-AR'),
      m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
      m.categoria, m.descripcion || '—',
      (m.tipo === 'ingreso' ? '+' : '-') + formatARS(m.monto),
    ])

    autoTable(doc, {
      startY: tableStartY + 10,
      head: [['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto']],
      body: filas.length > 0 ? filas : [['—', '—', '—', 'Sin movimientos este mes', '—']],
      styles: { fontSize: 9, cellPadding: 3.5, font: 'helvetica' },
      headStyles: { fillColor: [230, 57, 70], textColor: 255, fontStyle: 'bold', halign: 'left' },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 20 }, 2: { cellWidth: 35 }, 3: { cellWidth: 65 }, 4: { cellWidth: 35, halign: 'right' } },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const raw = String(data.cell.raw)
          data.cell.styles.textColor = raw.startsWith('+') ? [22, 163, 74] : [230, 57, 70]
          data.cell.styles.fontStyle = 'bold'
        }
        if (data.section === 'body' && data.column.index === 1) {
          const raw = String(data.cell.raw)
          data.cell.styles.textColor = raw === 'Ingreso' ? [22, 163, 74] : [230, 57, 70]
        }
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    })

    const afterTable = doc.lastAutoTable.finalY + 14
    doc.setDrawColor(230, 57, 70); doc.setLineWidth(2); doc.line(12, afterTable, 12, afterTable + 8)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(17, 24, 39)
    doc.text('Egresos por categoría', 17, afterTable + 6)

    const egresosDelMes = mesActual.filter(m => m.tipo === 'egreso')
    const pc2 = egresosDelMes.reduce((acc, m) => { acc[m.categoria] = (acc[m.categoria] || 0) + Number(m.monto); return acc }, {})
    const filasCategoria = Object.entries(pc2).sort((a, b) => b[1] - a[1]).map(([cat, monto]) => [cat, formatARS(monto)])

    autoTable(doc, {
      startY: afterTable + 10,
      head: [['Categoría', 'Total']],
      body: filasCategoria.length > 0 ? filasCategoria : [['Sin egresos este mes', '—']],
      styles: { fontSize: 9, cellPadding: 3.5 },
      headStyles: { fillColor: [230, 57, 70], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' } },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    })

    const pageH = doc.internal.pageSize.height
    doc.setDrawColor(230, 57, 70); doc.setLineWidth(0.5); doc.line(12, pageH - 18, 198, pageH - 18)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(230, 57, 70)
    doc.text('Gastos Personales', 12, pageH - 10)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150)
    doc.text('· Desarrollado por FAVAL agencia', 51, pageH - 10)
    doc.setTextColor(160, 160, 160)
    doc.text(`Generado el ${new Date().toLocaleDateString('es-AR')}`, 198, pageH - 10, { align: 'right' })

    const nombreArchivo = `gastos-${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}.pdf`
    doc.save(nombreArchivo)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ background: 'var(--bg)' }}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#E63946' }} />
    </div>
  )

  const cardS = { background: 'var(--surface)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#E63946', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
            {saludo}, {primerNombre}
          </p>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text)', lineHeight: '1.1', letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
          <p className="capitalize" style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '6px' }}>
            {ahora.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3" style={{ flexShrink: 0, paddingTop: '4px' }}>
          <button onClick={generarPDF} className="btn-pdf">📄 PDF</button>
          <Link to="/nuevo" className="btn-nuevo">+ Nuevo</Link>
        </div>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="metric-card" style={{ background: 'var(--surface)', borderRadius: '20px', padding: '28px 24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', borderTop: '3px solid #16a34a', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(180deg,rgba(22,163,74,0.09) 0%,transparent 100%)', pointerEvents: 'none' }} />
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>Ingresos del mes</p>
          <p style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text)', lineHeight: '1', letterSpacing: '-0.02em' }}>
            <AnimatedNumber value={totalIngresos} />
          </p>
          <DeltaBadge pct={pct(totalIngresos, ingPasado)} goodIfPositive />
        </div>

        <div className="metric-card" style={{ background: 'var(--surface)', borderRadius: '20px', padding: '28px 24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', borderTop: '3px solid #E63946', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(180deg,rgba(230,57,70,0.09) 0%,transparent 100%)', pointerEvents: 'none' }} />
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#E63946', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>Egresos del mes</p>
          <p style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text)', lineHeight: '1', letterSpacing: '-0.02em' }}>
            <AnimatedNumber value={totalEgresos} />
          </p>
          <DeltaBadge pct={pct(totalEgresos, egPasado)} goodIfPositive={false} />
        </div>

        <div className="metric-card" style={{ background: 'var(--surface)', borderRadius: '20px', padding: '28px 24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', borderTop: `3px solid ${balance >= 0 ? '#3b82f6' : '#E63946'}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px', background: `linear-gradient(180deg,${balance >= 0 ? 'rgba(59,130,246,0.09)' : 'rgba(230,57,70,0.09)'} 0%,transparent 100%)`, pointerEvents: 'none' }} />
          <p style={{ fontSize: '11px', fontWeight: '700', color: balance >= 0 ? '#3b82f6' : '#E63946', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>Balance</p>
          <p style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text)', lineHeight: '1', letterSpacing: '-0.02em' }}>
            <AnimatedNumber value={balance} />
          </p>
          {saldoArrastrado !== 0 && (
            <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px' }}>
              {saldoArrastrado >= 0 ? '+' : ''}{formatARS(saldoArrastrado)} arrastrado de meses anteriores
            </p>
          )}
          <DeltaBadge pct={pct(balance, ingPasado - egPasado)} goodIfPositive />
        </div>
      </div>

      {/* ── Nuevos widgets: ahorro + semanal + top 3 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

        {/* Tasa de ahorro */}
        <div className="hover-card" style={{ ...cardS, padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: '14px' }}>Tasa de ahorro</h3>
          {tasaAhorro === null ? (
            <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Sin ingresos registrados</p>
          ) : (
            <>
              <p style={{
                fontSize: '2.25rem', fontWeight: '800', lineHeight: 1,
                color: tasaAhorro >= 20 ? '#16a34a' : tasaAhorro >= 0 ? '#d97706' : '#E63946',
              }}>
                {tasaAhorro}%
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '6px' }}>
                {tasaAhorro >= 20
                  ? '¡Excelente! Estás ahorrando bien'
                  : tasaAhorro >= 0
                  ? 'Podés mejorar tu tasa de ahorro'
                  : 'Este mes gastaste más de lo que ingresó'}
              </p>
              {/* barra de progreso */}
              <div style={{ marginTop: '10px', height: '6px', borderRadius: '99px', background: 'var(--border-mid)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '99px',
                  width: `${Math.max(0, Math.min(100, tasaAhorro))}%`,
                  background: tasaAhorro >= 20 ? '#16a34a' : tasaAhorro >= 0 ? '#d97706' : '#E63946',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </>
          )}
        </div>

        {/* Resumen semanal */}
        <div className="hover-card" style={{ ...cardS, padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: '14px' }}>Esta semana</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text)', lineHeight: 1 }}>
            {formatARS(gastoSemActual)}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>en egresos esta semana</p>
          {difSemanal !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: difSemanal <= 0 ? '#16a34a' : '#E63946' }}>
                {difSemanal > 0 ? '▲' : '▼'} {Math.abs(difSemanal)}%
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>vs semana anterior ({formatARS(gastoSemPasada)})</span>
            </div>
          ) : (
            <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '8px' }}>Sin datos semana anterior</p>
          )}
        </div>

        {/* Top 3 categorías */}
        <div className="hover-card" style={{ ...cardS, padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: '14px' }}>Top 3 egresos</h3>
          {top3.length === 0 ? (
            <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Sin egresos este mes</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {top3.map(([cat, monto]) => (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>{cat}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-2)' }}>{formatARS(monto)}</span>
                  </div>
                  <div style={{ height: '5px', borderRadius: '99px', background: 'var(--border-mid)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '99px',
                      width: `${(monto / maxTop) * 100}%`,
                      background: getColor(cat),
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="hover-card" style={cardS}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.01em' }}>Egresos por categoría</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '3px' }}>Clic en color para personalizar</p>
          </div>
          <GraficoTorta movimientos={movimientos} isDark={isDark} />
        </div>
        <div className="hover-card" style={cardS}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: '20px' }}>Ingresos vs Egresos (6 meses)</h2>
          <GraficoBarras movimientos={movimientos} isDark={isDark} />
        </div>
      </div>

      {/* ── Evolución del balance ── */}
      <div className="hover-card" style={{ ...cardS, marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: '8px' }}>Evolución del balance</h2>
        <GraficoLinea movimientos={movimientos} isDark={isDark} />
      </div>

      {/* ── Últimos movimientos ── */}
      <div style={cardS}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.01em' }}>Últimos movimientos</h2>
          <Link to="/movimientos" style={{ color: '#E63946', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>Ver todos →</Link>
        </div>
        {movimientos.length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
            Aún no hay movimientos. ¡Agregá el primero!
          </p>
        ) : (
          <div className="space-y-2">
            {movimientos.slice(0, 5).map(m => (
              <MovimientoCard key={m.id} movimiento={m} onDelete={fetchMovimientos} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
