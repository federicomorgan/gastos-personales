import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/dashboard',   label: 'Inicio',   icon: '📊' },
  { to: '/movimientos', label: 'Historial', icon: '📋' },
  { to: '/presupuesto', label: 'Budget',    icon: '💰' },
  { to: '/nuevo',       label: 'Nuevo',     icon: '➕' },
]

export default function BottomNav() {
  const location = useLocation()
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex md:hidden z-10" style={{ backgroundColor: '#0f0f0f', borderTop: '1px solid #1f1f1f' }}>
      {links.map(link => (
        <Link key={link.to} to={link.to}
          className="flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors"
          style={{ color: location.pathname === link.to ? '#E63946' : '#6b7280' }}
        >
          <span className="text-xl mb-0.5">{link.icon}</span>
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
