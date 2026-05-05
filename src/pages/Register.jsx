import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else navigate('/dashboard')
    setLoading(false)
  }

  const inp = {
    width: '100%',
    border: '1.5px solid #e5e7eb',
    borderRadius: '12px',
    padding: '13px 16px',
    fontSize: '14px',
    background: '#fff',
    color: '#111827',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8f9fa' }}>

      {/* Panel izquierdo — solo desktop */}
      <div style={{
        display: 'none',
        flex: '1',
        background: 'linear-gradient(135deg, #E63946 0%, #c1121f 100%)',
        padding: '60px',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }} className="login-panel-left">

        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: '140px', right: '40px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
              <rect x="4" y="24" width="8" height="12" rx="2.5" fill="white"/>
              <rect x="16" y="16" width="8" height="20" rx="2.5" fill="white" opacity="0.85"/>
              <rect x="28" y="8" width="8" height="28" rx="2.5" fill="white"/>
              <polyline points="6,18 16,12 26,6 34,2" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
              <polyline points="30,2 34,2 34,6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            </svg>
          </div>
          <span style={{ color: '#fff', fontWeight: '800', fontSize: '20px', letterSpacing: '-0.3px' }}>Mis Gastos</span>
        </div>

        <div>
          <h2 style={{ color: '#fff', fontSize: '36px', fontWeight: '800', lineHeight: '1.2', marginBottom: '16px', letterSpacing: '-0.5px' }}>
            Empezá a tomar<br />control de tu<br />dinero hoy
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: '1.6' }}>
            Creá tu cuenta gratis y empezá a registrar tus ingresos, egresos y metas de ahorro.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          {[{ label: 'Categorías', value: '13' }, { label: 'Gráficos', value: '4' }, { label: 'Reportes', value: 'PDF' }].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '14px 18px', backdropFilter: 'blur(10px)' }}>
              <p style={{ color: '#fff', fontWeight: '800', fontSize: '22px' }}>{s.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', marginTop: '2px' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #E63946, #c1121f)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(230,57,70,0.35)' }}>
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <rect x="4" y="24" width="8" height="12" rx="2.5" fill="white"/>
                <rect x="16" y="16" width="8" height="20" rx="2.5" fill="white" opacity="0.85"/>
                <rect x="28" y="8" width="8" height="28" rx="2.5" fill="white"/>
                <polyline points="6,18 16,12 26,6 34,2" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                <polyline points="30,2 34,2 34,6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
              </svg>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px', marginBottom: '6px' }}>
              Crear cuenta
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Gratis, sin tarjeta de crédito</p>
          </div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '7px' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                style={inp}
                onFocus={e => { e.target.style.borderColor = '#E63946'; e.target.style.boxShadow = '0 0 0 3px rgba(230,57,70,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '7px' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                  style={{ ...inp, paddingRight: '44px' }}
                  onFocus={e => { e.target.style.borderColor = '#E63946'; e.target.style.boxShadow = '0 0 0 3px rgba(230,57,70,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '16px', padding: '4px', lineHeight: 1 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '7px' }}>Confirmar contraseña</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repetí la contraseña"
                required
                style={inp}
                onFocus={e => { e.target.style.borderColor = '#E63946'; e.target.style.boxShadow = '0 0 0 3px rgba(230,57,70,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.2)', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>⚠️</span>
                <p style={{ color: '#E63946', fontSize: '13px', fontWeight: '500', margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: loading ? '#f87171' : 'linear-gradient(135deg, #E63946, #c1121f)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: '700', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: loading ? 'none' : '0 4px 14px rgba(230,57,70,0.4)', transition: 'all 0.2s', marginTop: '4px' }}
            >
              {loading ? 'Creando cuenta…' : 'Crear cuenta gratis'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '28px' }}>
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" style={{ color: '#E63946', fontWeight: '700', textDecoration: 'none' }}>
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .login-panel-left { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
