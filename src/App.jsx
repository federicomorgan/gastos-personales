import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Movimientos from './pages/Movimientos'
import NuevoMovimiento from './pages/NuevoMovimiento'
import Presupuesto from './pages/Presupuesto'
import Metas from './pages/Metas'
import Recurrentes from './pages/Recurrentes'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import FavalLogo from './components/FavalLogo'

function MobileHeader({ onMenuClick }) {
  const { isDark, toggleDark } = useTheme()
  return (
    <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#0f0f0f', borderBottom: '1px solid #1f1f1f' }}>
      <button className="hamburger-btn" onClick={onMenuClick} aria-label="Menú">☰</button>
      <button onClick={toggleDark} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title={isDark ? 'Modo claro' : 'Modo oscuro'}>
        {isDark ? '☀️' : '🌙'}
      </button>
    </header>
  )
}

function ProtectedLayout({ session, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  if (!session) return <Navigate to="/login" replace />
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar session={session} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 main-content pb-20 md:pb-0">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        {children}
        <footer style={{
          marginTop: '48px',
          padding: '28px 16px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          borderTop: '1px solid var(--border)',
        }}>
          <FavalLogo height={28} />
          <span style={{
            fontFamily: "'Space Mono', monospace",
            color: 'var(--text-2)',
            fontSize: '12px',
            letterSpacing: '0.08em',
            fontWeight: '600',
          }}>
            Hecho por{' '}
            <span style={{ color: '#E63946' }}>Agencia Faval</span>
          </span>
        </footer>
      </main>
      <BottomNav />
    </div>
  )
}

function AppRoutes() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#E63946' }} />
    </div>
  )

  const protect = (El, props = {}) => (
    <ProtectedLayout session={session}><El session={session} {...props} /></ProtectedLayout>
  )

  return (
    <Routes>
      <Route path="/login"      element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register"   element={session ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/dashboard"  element={protect(Dashboard)} />
      <Route path="/movimientos" element={protect(Movimientos)} />
      <Route path="/nuevo"      element={protect(NuevoMovimiento)} />
      <Route path="/editar/:id" element={protect(NuevoMovimiento)} />
      <Route path="/presupuesto" element={protect(Presupuesto)} />
      <Route path="/metas"      element={protect(Metas)} />
      <Route path="/recurrentes" element={protect(Recurrentes)} />
      <Route path="*"           element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  )
}
