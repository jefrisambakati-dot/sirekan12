import { useState } from 'react';
import { supabase, isConfigured } from '../lib/supabaseClient';
import { LogIn, ShieldAlert, CheckCircle, Zap, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  async function handleAuth(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.hash = '#/dashboard';
    } catch (err) {
      const msg = err.message || 'Terjadi kesalahan sistem.';
      if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        setErrorMsg('Tidak dapat terhubung ke server. Pastikan Environment Variables (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) sudah diatur di Vercel dan sudah di-redeploy.');
      } else if (msg.includes('Invalid login')) {
        setErrorMsg('Email atau password salah. Silakan coba lagi.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-glow" />
      <div style={{
        position: 'absolute', width: '280px', height: '280px',
        background: 'radial-gradient(circle, rgba(107,98,242,0.07) 0%, transparent 70%)',
        bottom: '8%', right: '12%', pointerEvents: 'none',
        animation: 'pulseGlow 9s ease-in-out infinite', animationDelay: '3s',
      }} />

      <div className="login-card glass-card">
        <div className="login-card__header">
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #6b62f2 0%, #9b8ff7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(107, 98, 242, 0.4)',
          }}>
            <Zap size={24} color="white" strokeWidth={2.5} />
          </div>
          <h2 className="login-card__title">SIREKAN</h2>
          <p className="login-card__subtitle">COMMAND CENTER DECK</p>
        </div>

        {!isConfigured && (
          <div className="login-alert login-alert--error" style={{ background: 'rgba(255, 170, 0, 0.12)', borderColor: 'rgba(255, 170, 0, 0.3)' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, color: '#ffaa00' }} />
            <span style={{ color: '#ffcc44' }}>Supabase belum dikonfigurasi. Set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di Vercel Environment Variables, lalu Redeploy.</span>
          </div>
        )}

        {errorMsg && (
          <div className="login-alert login-alert--error">
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="login-alert login-alert--success">
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="login-form" style={{ marginTop: '20px' }}>
          <div className="login-form__group">
            <label className="login-form__label">Email</label>
            <input type="email" className="login-form__input" placeholder="admin@sirekan.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="login-form__group">
            <label className="login-form__label">Password</label>
            <input type="password" className="login-form__input" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="login-form__submit-btn" disabled={loading}>
            {loading ? 'Memproses...' : <><LogIn size={16} />Masuk ke Deck</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#686868', marginTop: '20px', lineHeight: 1.5 }}>
          Sistem Pemantauan Armada &amp; Deteksi Kecurangan Solar
        </p>
      </div>
    </div>
  );
}
