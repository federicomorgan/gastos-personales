import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/dashboard')
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
            Nueva contraseña
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Elegí una contraseña segura para tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '7px' }}>Nueva contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                style={{ ...inp, paddingRight: '44px' }}
                onFocus={e => { e.target.style.borderColor = '#E63946'; e.target.style.boxShadow = '0 0 0 3px rgba(230,57,70,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '16px', padding: '4px' }}>
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
            {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
