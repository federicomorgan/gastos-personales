import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setError(error.message)
    else setSent(true)
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Ícono */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #E63946, #c1121f)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(230,57,70,0.35)' }}>
            <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
              <rect x="8" y="18" width="24" height="18" rx="3" stroke="white" strokeWidth="2.2" fill="none"/>
              <path d="M13 18V13a7 7 0 0 1 14 0v5" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="20" cy="27" r="2.5" fill="white"/>
              <line x1="20" y1="29.5" x2="20" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px', marginBottom: '6px' }}>
            {sent ? 'Revisá tu mail' : 'Recuperar contraseña'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.5' }}>
            {sent
              ? `Te enviamos un link a ${email}. Hacé clic en el link para crear una nueva contraseña.`
              : 'Ingresá tu email y te mandamos un link para restablecer tu contraseña.'
            }
          </p>
        </div>

        {sent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <p style={{ color: '#16a34a', fontSize: '14px', fontWeight: '600' }}>✓ Email enviado correctamente</p>
              <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>No olvides revisar la carpeta de spam</p>
            </div>
            <Link to="/login" style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #E63946, #c1121f)', color: '#fff', borderRadius: '12px', padding: '14px', fontWeight: '700', fontSize: '15px', textDecoration: 'none', boxShadow: '0 4px 14px rgba(230,57,70,0.4)' }}>
              Volver al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
              {loading ? 'Enviando…' : 'Enviar link de recuperación'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
              <Link to="/login" style={{ color: '#E63946', fontWeight: '700', textDecoration: 'none' }}>← Volver al login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
