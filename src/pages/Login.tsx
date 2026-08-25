import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
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

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            marginTop: 6,
            width: '100%',
            padding: '14px 0',
            background: loading
              ? 'rgba(255,255,255,0.15)'
              : '#ffffff',
            border: 'none',
            borderRadius: 13,
            color: '#1f2937',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '0.02em',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 8px 24px rgba(0,0,0,0.35)',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          }}
          onMouseEnter={e => {
            if (!loading) {
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(16,185,129,0.35)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {loading ? (
            <>
              <span style={{
                width: 18, height: 18, border: '2.5px solid rgba(31,41,55,0.25)',
                borderTopColor: '#1f2937', borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
              }} />
              Signing in...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>

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
