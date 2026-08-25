import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0a0f0d]">

      {/* ── Animated gradient orbs ── */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-15%', left: '-10%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
          animation: 'floatOrb 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(5,150,105,0.14) 0%, transparent 70%)',
          animation: 'floatOrb 10s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '55%',
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52,211,153,0.09) 0%, transparent 70%)',
          animation: 'floatOrb 12s ease-in-out infinite 2s',
        }} />
      </div>

      {/* ── Grid pattern overlay ── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* ── Card ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 440,
        margin: '0 16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 24,
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.08) inset',
        padding: '44px 40px',
        animation: 'slideUp 0.55s cubic-bezier(0.16,1,0.3,1) both',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: '0 0 32px rgba(16,185,129,0.45)',
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1 }}>C</span>
          </div>
          <h1 style={{
            fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px',
            color: '#fff', margin: 0,
          }}>
            ChaloJi <span style={{ color: '#34d399' }}>Admin</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 6 }}>
            Secure access · Operations Panel
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'slideUp 0.3s ease both',
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ color: '#fca5a5', fontSize: 13.5, fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Email */}
          <div>
            <label style={{
              display: 'block', fontSize: 12.5, fontWeight: 600,
              color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em',
              textTransform: 'uppercase', marginBottom: 8,
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                fontSize: 16, opacity: 0.4, pointerEvents: 'none',
              }}>✉</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@chalojii.in"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  paddingLeft: 42, paddingRight: 16,
                  paddingTop: 13, paddingBottom: 13,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, outline: 'none',
                  color: '#fff', fontSize: 14.5,
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(16,185,129,0.6)';
                  e.target.style.background = 'rgba(16,185,129,0.08)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.background = 'rgba(255,255,255,0.06)';
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: 'block', fontSize: 12.5, fontWeight: 600,
              color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em',
              textTransform: 'uppercase', marginBottom: 8,
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                fontSize: 16, opacity: 0.4, pointerEvents: 'none',
              }}>🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  paddingLeft: 42, paddingRight: 48,
                  paddingTop: 13, paddingBottom: 13,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, outline: 'none',
                  color: '#fff', fontSize: 14.5,
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(16,185,129,0.6)';
                  e.target.style.background = 'rgba(16,185,129,0.08)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.background = 'rgba(255,255,255,0.06)';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 16, opacity: 0.45, padding: '4px 6px',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.45')}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              width: '100%',
              padding: '14px 0',
              background: loading
                ? 'rgba(16,185,129,0.5)'
                : 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: 13,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '0.02em',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(16,185,129,0.35)',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(16,185,129,0.5)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,0.35)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Signing in...
              </>
            ) : (
              <>
                <span>🚀</span>
                Sign In to Dashboard
              </>
            )}
          </button>

        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
            ChaloJi Admin © 2026 · Authorized Access Only
          </p>
          <p style={{ fontSize: 11, color: 'rgba(16,185,129,0.4)', marginTop: 6 }}>
            🔐 Secured with Firebase Auth
          </p>
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.04); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder { color: rgba(255,255,255,0.22); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #0f1f19 inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>
    </div>
  );
}
