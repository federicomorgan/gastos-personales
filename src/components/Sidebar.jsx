import { useRef, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useTheme } from '../context/ThemeContext'

const MIN_W = 180
const MAX_W = 420
const DEFAULT_W = 256

const IconDashboard = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>
  </svg>
)

const IconMovimientos = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
)

const IconNuevo = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
)

const IconPresupuesto = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
    <circle cx="7" cy="15" r="1" fill="currentColor" stroke="none"/>
    <line x1="11" y1="15" x2="15" y2="15"/>
  </svg>
)

const IconMetas = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)

const IconRecurrentes = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
)

const IconSun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const IconMoon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const NAV_LINKS = [
  { to: '/dashboard',   label: 'Dashboard',       Icon: IconDashboard },
  { to: '/movimientos', label: 'Movimientos',      Icon: IconMovimientos },
  { to: '/nuevo',       label: 'Nuevo movimiento', Icon: IconNuevo },
  { to: '/presupuesto', label: 'Presupuesto',      Icon: IconPresupuesto },
  { to: '/metas',       label: 'Metas',            Icon: IconMetas },
  { to: '/recurrentes', label: 'Recurrentes',      Icon: IconRecurrentes, badge: true },
]

export default function Sidebar({ session, open, onClose }) {
  const location = useLocation()
  const { isDark, toggleDark } = useTheme()

  const [width, setWidth] = useState(() => {
    const saved = parseInt(localStorage.getItem('sidebarWidth') || '', 10)
    return saved >= MIN_W && saved <= MAX_W ? saved : DEFAULT_W
  })
  const [hoverHandle, setHoverHandle] = useState(false)
  const [vencimientos, setVencimientos] = useState(0)

  const isResizing = useRef(false)
  const startX    = useRef(0)
  const startW    = useRef(0)

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', width + 'px')
    localStorage.setItem('sidebarWidth', width)
  }, [width])

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', width + 'px')
  }, [])

  useEffect(() => {
    if (!session) return
    const fetchVencimientos = async () => {
      const hoy = new Date().toISOString().split('T')[0]
      const en7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const { data } = await supabase
        .from('recurrentes')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('activo', true)
        .gte('proxima_fecha', hoy)
        .lte('proxima_fecha', en7)
      setVencimientos(data?.length || 0)
    }
    fetchVencimientos()
  }, [session])

  useEffect(() => {
    const onMove = (e) => {
      if (!isResizing.current) return
      const newW = Math.min(Math.max(startW.current + (e.clientX - startX.current), MIN_W), MAX_W)
      setWidth(newW)
    }
    const onUp = () => {
      if (!isResizing.current) return
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const onHandleMouseDown = (e) => {
    e.preventDefault()
    isResizing.current = true
    startX.current = e.clientX
    startW.current = width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onClose?.()
  }

  const nombre =
    session.user.user_metadata?.full_name ||
    session.user.user_metadata?.name ||
    session.user.email.split('@')[0]

  const inicial = nombre.charAt(0).toUpperCase()
  const collapsed = width <= 210

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`flex flex-col fixed top-0 left-0 h-screen z-40 transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ backgroundColor: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.06)', width: width + 'px' }}
      >

        {/* ── Perfil ── */}
        <div style={{
          padding: collapsed ? '20px 10px 18px' : '20px 16px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
              background: 'linear-gradient(135deg, #E63946, #9b1c2a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: '800', fontSize: '15px',
              boxShadow: '0 4px 14px rgba(230,57,70,0.35)',
            }}>
              {inicial}
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <p style={{ color: '#f9fafb', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                  {nombre}
                </p>
                <p style={{ color: '#3d4451', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                  {session.user.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Nav ── */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {!collapsed && (
            <p style={{ fontSize: '10px', fontWeight: '700', color: '#2d3340', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '6px 10px 10px' }}>
              Navegación
            </p>
          )}

          {NAV_LINKS.map(({ to, label, Icon, badge }) => {
            const isActive = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                title={collapsed ? label : undefined}
                className="sidebar-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: collapsed ? '11px' : '10px 12px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  position: 'relative',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: isActive ? '#f9fafb' : '#5a6070',
                  background: isActive ? 'rgba(230,57,70,0.15)' : 'transparent',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '13.5px',
                  fontFamily: 'inherit',
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '22%', bottom: '22%',
                    width: '3px', borderRadius: '0 3px 3px 0',
                    background: '#E63946',
                  }} />
                )}

                <span style={{ display: 'flex', flexShrink: 0, position: 'relative', color: isActive ? '#E63946' : 'inherit' }}>
                  <Icon />
                  {badge && vencimientos > 0 && (
                    <span style={{
                      position: 'absolute', top: '-5px', right: '-7px',
                      background: '#E63946', color: '#fff', borderRadius: '50%',
                      width: '15px', height: '15px', fontSize: '9px', fontWeight: '800',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {vencimientos}
                    </span>
                  )}
                </span>

                {!collapsed && <span style={{ flex: 1 }}>{label}</span>}

                {!collapsed && badge && vencimientos > 0 && (
                  <span style={{
                    background: '#E63946', color: '#fff', borderRadius: '6px',
                    padding: '1px 7px', fontSize: '10px', fontWeight: '700',
                  }}>
                    {vencimientos}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* ── Bottom ── */}
        <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={toggleDark}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
            className="sidebar-bottom-btn"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: collapsed ? '11px' : '9px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '10px', cursor: 'pointer',
              color: '#5a6070', fontSize: '13px', fontFamily: 'inherit', fontWeight: '600',
            }}
          >
            <span style={{ display: 'flex', flexShrink: 0 }}>
              {isDark ? <IconSun /> : <IconMoon />}
            </span>
            {!collapsed && (isDark ? 'Modo claro' : 'Modo oscuro')}
          </button>

          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="sidebar-logout-btn"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: collapsed ? '11px' : '9px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'transparent', border: 'none',
              borderRadius: '10px', cursor: 'pointer',
              color: '#5a6070', fontSize: '13px', fontFamily: 'inherit', fontWeight: '600',
            }}
          >
            <span style={{ display: 'flex', flexShrink: 0 }}><IconLogout /></span>
            {!collapsed && 'Cerrar sesión'}
          </button>
        </div>

        {/* ── Drag handle ── */}
        <div
          onMouseDown={onHandleMouseDown}
          onMouseEnter={() => setHoverHandle(true)}
          onMouseLeave={() => setHoverHandle(false)}
          style={{
            position: 'absolute', top: 0, right: 0, width: '4px', height: '100%',
            cursor: 'col-resize',
            background: hoverHandle ? 'rgba(230,57,70,0.7)' : 'transparent',
            transition: 'background 0.2s', zIndex: 10,
          }}
        />
      </aside>
    </>
  )
}
