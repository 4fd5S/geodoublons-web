import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const [view, setView]               = useState('login');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [code2fa, setCode2fa]         = useState('');
  const [partialToken, setPartialToken] = useState(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotDone, setForgotDone]   = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  /* ── Login ─────────────────────────────────────────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const r = await axios.post('/api/auth/login', { email, password });
      if (r.data.requires2fa) {
        setPartialToken(r.data.partial_token);
        setView('2fa');
      } else {
        login(r.data.token, r.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally { setLoading(false); }
  };

  /* ── 2FA ────────────────────────────────────────────────────────── */
  const handle2FA = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const r = await axios.post('/api/auth/verify-2fa',
        { partial_token: partialToken, code: code2fa });
      login(r.data.token, r.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Code incorrect');
    } finally { setLoading(false); }
  };

  /* ── Mot de passe oublié ────────────────────────────────────────── */
  const handleForgot = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await axios.post('/api/users/reset-request', { email: forgotEmail });
      setForgotDone(true);
    } catch {
      setForgotDone(true);
    } finally { setLoading(false); }
  };

  const goLogin = () => {
    setView('login'); setError('');
    setForgotDone(false); setForgotEmail('');
    setPartialToken(null); setCode2fa('');
  };

  return (
    <div style={s.page}>
      <div style={s.bg} />
      <div style={s.card}>

        {/* LOGO SANS TEXTE DE DOUBLON EN DEHORS */}
        <div style={s.logo}>
          <img 
            src="/logo.png" 
            alt="GeoDoublons" 
            style={s.logoImg} 
          />
          <div>
            <div style={s.logoName}>GeoDoublons</div>
            <div style={s.logoSub}>Système de gestion géographique</div>
          </div>
        </div>

        {/* ── VUE : LOGIN ── */}
        {view === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={s.formTitle}>Connexion administrateur</div>
            {error && <div style={s.error}>{error}</div>}

            <label style={s.label}>Adresse e-mail</label>
            {/* CORRECTION : placeholder="" pour laisser la case vide (fergha) */}
            <input style={s.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="" required autoFocus />

            <label style={s.label}>Mot de passe</label>
            {/* CORRECTION : case de mot de passe également vide pour un maximum de sécurité */}
            <input style={s.input} type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="" required />

            <div style={s.forgotRow}>
              <button type="button" style={s.forgotLink}
                onClick={() => { setView('forgot'); setError(''); }}>
                Mot de passe oublié ?
              </button>
            </div>

            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              type="submit" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter →'}
            </button>
          </form>
        )}

        {/* ── VUE : 2FA ── */}
        {view === '2fa' && (
          <form onSubmit={handle2FA}>
            <div style={s.formTitle}>Double authentification</div>
            <div style={s.hint}>
              Entrez le code de votre application (Google Authenticator / Authy)
            </div>
            {error && <div style={s.error}>{error}</div>}

            <label style={s.label}>Code à 6 chiffres</label>
            <input style={{ ...s.input, textAlign: 'center', letterSpacing: '6px',
                            fontSize: '22px', fontFamily: 'monospace' }}
              type="text" value={code2fa}
              onChange={e => setCode2fa(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000" maxLength={6} required autoFocus />

            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              type="submit" disabled={loading}>
              {loading ? 'Vérification…' : 'Valider le code'}
            </button>
            <button type="button" style={s.backBtn} onClick={goLogin}>
              ← Retour à la connexion
            </button>
          </form>
        )}

        {/* ── VUE : MOT DE PASSE OUBLIÉ ── */}
        {view === 'forgot' && !forgotDone && (
          <form onSubmit={handleForgot}>
            <div style={s.sectionHeader}>
              <div style={s.sectionIconWrap}>
                <span style={{ fontSize: '22px' }}>🔑</span>
              </div>
              <div style={s.formTitle}>Réinitialiser mon mot de passe</div>
              <p style={s.sectionDesc}>
                Saisissez votre adresse e-mail. Votre demande sera envoyée à
                l'administrateur, qui vous fera parvenir un mot de passe temporaire.
              </p>
            </div>

            {error && <div style={s.error}>{error}</div>}

            <label style={s.label}>Adresse e-mail</label>
            <input style={s.input} type="email" value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              placeholder="" required autoFocus />

            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              type="submit" disabled={loading}>
              {loading ? 'Envoi en cours…' : 'Envoyer la demande →'}
            </button>
            <button type="button" style={s.backBtn} onClick={goLogin}>
              ← Retour à la connexion
            </button>
          </form>
        )}

        {/* ── VUE : CONFIRMATION DEMANDE ENVOYÉE ── */}
        {view === 'forgot' && forgotDone && (
          <div style={s.successBox}>
            <div style={s.successIcon}>✅</div>
            <div style={s.successTitle}>Demande envoyée !</div>
            <p style={s.successMsg}>
              Votre demande de réinitialisation a été enregistrée.
              <br /><br />
              L'administrateur recevra une notification et vous enverra
              un <strong>mot de passe temporaire par email</strong>.
              <br /><br />
              Connectez-vous ensuite avec ce mot de passe — vous serez
              invité à en définir un nouveau immédiatement.
            </p>
            <div style={s.emailBadge}>{forgotEmail}</div>
            <button style={s.btn} onClick={goLogin}>
              ← Retour à la connexion
            </button>
          </div>
        )}

        <div style={s.footer}>© 2026 GeoDoublons — Accès sécurisé</div>
      </div>
    </div>
  );
}

/* ── STYLE DE LA CARTE DE LOGIN ── */
const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(135deg, #1B2A4A 0%, #0F1829 50%, #162036 100%)',
  },
  bg: {
    position: 'absolute', inset: 0,
    backgroundImage:
      'radial-gradient(circle at 20% 50%, rgba(37,99,235,0.15) 0%, transparent 50%),' +
      'radial-gradient(circle at 80% 20%, rgba(124,58,237,0.1) 0%, transparent 40%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative', zIndex: 1, background: '#ffffff',
    borderRadius: '16px', padding: '44px 48px', width: '100%', maxWidth: '440px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '14px',
    marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #E2E8F0',
  },
  logoImg: {
    width: '38px',
    height: '38px',
    objectFit: 'contain'
  },
  logoName: { fontSize: '20px', fontWeight: '700', color: '#0F172A' },
  logoSub:  { fontSize: '12px', color: '#94A3B8', marginTop: '2px' },

  formTitle: { fontSize: '17px', fontWeight: '600', color: '#0F172A', marginBottom: '18px' },
  hint: {
    fontSize: '13px', color: '#64748B', marginBottom: '18px', lineHeight: '1.5',
    background: '#F0F9FF', padding: '12px 14px', borderRadius: '8px',
    borderLeft: '3px solid #0891B2',
  },
  label:  { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' },
  input:  {
    width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0',
    borderRadius: '8px', fontSize: '14px', outline: 'none', marginBottom: '16px',
    background: '#FAFAFA', boxSizing: 'border-box', transition: 'border 0.2s',
  },
  error:  {
    background: '#FEE2E2', color: '#DC2626', padding: '10px 14px',
    borderRadius: '8px', fontSize: '13px', marginBottom: '16px',
    borderLeft: '3px solid #DC2626',
  },
  btn: {
    width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
    background: 'linear-gradient(135deg,#2563EB,#1D4ED8)',
    color: '#fff', fontSize: '14px', fontWeight: '600',
    cursor: 'pointer', marginTop: '4px',
  },
  backBtn: {
    width: '100%', padding: '10px', background: 'transparent', color: '#64748B',
    border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px',
    cursor: 'pointer', marginTop: '10px',
  },
  forgotRow: { display: 'flex', justifyContent: 'flex-end', marginTop: '-8px', marginBottom: '16px' },
  forgotLink: {
    background: 'none', border: 'none', color: '#2563EB', fontSize: '13px',
    fontWeight: '500', cursor: 'pointer', padding: 0, textDecoration: 'underline',
  },
  sectionHeader: { textAlign: 'center', marginBottom: '4px' },
  sectionIconWrap: {
    width: '52px', height: '52px', borderRadius: '50%',
    background: '#EFF6FF', display: 'flex', alignItems: 'center',
    justifyContent: 'center', margin: '0 auto 14px',
  },
  sectionDesc: {
    fontSize: '13px', color: '#64748B', lineHeight: '1.6',
    marginBottom: '22px', textAlign: 'center',
  },
  successBox: { textAlign: 'center', padding: '8px 0' },
  successIcon: { fontSize: '44px', marginBottom: '12px' },
  successTitle: { fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '12px' },
  successMsg: {
    fontSize: '13px', color: '#475569', lineHeight: '1.7',
    marginBottom: '18px', textAlign: 'left',
  },
  emailBadge: {
    background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px',
    padding: '10px 14px', fontSize: '13px', fontWeight: '600', color: '#2563EB',
    marginBottom: '22px', wordBreak: 'break-all', textAlign: 'center',
  },
  footer: {
    textAlign: 'center', fontSize: '11px', color: '#94A3B8',
    marginTop: '28px', paddingTop: '18px', borderTop: '1px solid #F1F5F9',
  },
};