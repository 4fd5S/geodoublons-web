import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [qr, setQr] = useState(null);
  const [code, setCode] = useState('');
  const [step, setStep] = useState('idle'); // idle | setup | confirm | done
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const setup2FA = async () => {
    setLoading(true);
    try {
      const r = await axios.post('/api/auth/setup-2fa');
      setQr(r.data.qr);
      setStep('setup');
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur', 'error');
    } finally { setLoading(false); }
  };

  const confirm2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/auth/confirm-2fa', { code });
      setStep('done');
      showToast('Double authentification activée avec succès !');
    } catch (err) {
      showToast(err.response?.data?.error || 'Code incorrect', 'error');
    } finally { setLoading(false); }
  };

  const disable2FA = async () => {
    if (!window.confirm('Désactiver la double authentification ?')) return;
    setLoading(true);
    try {
      await axios.post('/api/auth/disable-2fa');
      setStep('idle'); setQr(null); setCode('');
      showToast('2FA désactivé');
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      {toast && <div style={{ ...s.toast, background: toast.type === 'error' ? '#DC2626' : '#16A34A' }}>{toast.msg}</div>}

      <div style={s.header}>
        <h1 style={s.title}>👤 Mon Profil</h1>
        <p style={s.subtitle}>Informations du compte et sécurité</p>
      </div>

      <div style={s.grid}>
        {/* Profile card */}
        <div style={s.card}>
          <div style={s.cardHead}>Informations du compte</div>
          <div style={s.avatarRow}>
            <div style={s.avatar}>{user?.prenom?.[0]}{user?.nom?.[0]}</div>
            <div>
              <div style={s.name}>{user?.prenom} {user?.nom}</div>
              <div style={s.email}>{user?.email}</div>
              <span style={user?.role === 'admin' ? s.badgeAdmin : s.badgeUser}>{user?.role?.toUpperCase()}</span>
            </div>
          </div>
          <div style={s.infoGrid}>
            {[
              ['Pseudo', user?.pseudo],
              ['Email', user?.email],
              ['Rôle', user?.role],
              ['Statut', user?.actif ? '✅ Actif' : '⛔ Inactif'],
            ].map(([k, v]) => (
              <div key={k} style={s.infoRow}>
                <span style={s.infoKey}>{k}</span>
                <span style={s.infoVal}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2FA card */}
        <div style={s.card}>
          <div style={s.cardHead}>🔐 Double Authentification (2FA)</div>

          {step === 'idle' && (
            <div>
              <div style={s.twoFaDesc}>
                Ajoutez une couche de sécurité supplémentaire. À chaque connexion, vous devrez entrer un code à 6 chiffres généré par votre application d'authentification.
              </div>
              <div style={s.appList}>
                <span style={s.appChip}>Google Authenticator</span>
                <span style={s.appChip}>Authy</span>
                <span style={s.appChip}>Microsoft Authenticator</span>
              </div>
              <button style={s.btn} onClick={setup2FA} disabled={loading}>
                {loading ? '⏳ Chargement…' : '🔐 Activer la 2FA'}
              </button>
            </div>
          )}

          {step === 'setup' && qr && (
            <div>
              <div style={s.stepInfo}>
                <div style={s.stepNum}>1</div>
                <span>Scannez ce QR code avec votre application d'authentification</span>
              </div>
              <div style={s.qrWrap}>
                <img src={qr} alt="QR Code 2FA" style={s.qr} />
              </div>
              <div style={s.stepInfo}>
                <div style={s.stepNum}>2</div>
                <span>Entrez le code à 6 chiffres généré</span>
              </div>
              <form onSubmit={confirm2FA} style={s.codeForm}>
                <input style={s.codeInput} type="text" value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" maxLength={6} required autoFocus />
                <button style={s.btn} type="submit" disabled={loading || code.length !== 6}>
                  {loading ? '⏳…' : '✅ Confirmer'}
                </button>
              </form>
            </div>
          )}

          {step === 'done' && (
            <div>
              <div style={s.successBox}>
                <div style={s.successIcon}>🛡️</div>
                <div style={s.successText}>Double authentification activée</div>
                <div style={s.successDesc}>Votre compte est maintenant protégé par 2FA.</div>
              </div>
              <button style={{ ...s.btn, background: '#DC2626' }} onClick={disable2FA} disabled={loading}>
                {loading ? '⏳…' : '🔓 Désactiver la 2FA'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { padding: '28px 32px', minHeight: '100vh', position: 'relative' },
  header: { marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#0F172A', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748B', marginTop: '4px' },
  toast: { position: 'fixed', top: '24px', right: '24px', zIndex: 9999, padding: '12px 20px', borderRadius: '10px', color: '#ffffff', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' },
  card: { background: '#ffffff', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' },
  cardHead: { padding: '16px 24px', background: '#1B2A4A', color: '#ffffff', fontSize: '14px', fontWeight: '600' },
  avatarRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '24px 24px 16px' },
  avatar: { width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#7C3AED)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', flexShrink: 0 },
  name: { fontSize: '17px', fontWeight: '700', color: '#0F172A' },
  email: { fontSize: '13px', color: '#64748B', margin: '2px 0 6px' },
  badgeAdmin: { background: '#EDE9FE', color: '#7C3AED', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '5px' },
  badgeUser: { background: '#DCFCE7', color: '#16A34A', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '5px' },
  infoGrid: { padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '10px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' },
  infoKey: { color: '#64748B', fontWeight: '500' },
  infoVal: { color: '#0F172A', fontWeight: '600' },
  twoFaDesc: { padding: '20px 24px 12px', fontSize: '13px', color: '#475569', lineHeight: '1.7' },
  appList: { display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0 24px 20px' },
  appChip: { background: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' },
  btn: { display: 'block', width: 'calc(100% - 48px)', margin: '0 24px 24px', padding: '12px', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  stepInfo: { display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 24px 8px', fontSize: '13px', color: '#374151' },
  stepNum: { width: '24px', height: '24px', borderRadius: '50%', background: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
  qrWrap: { display: 'flex', justifyContent: 'center', padding: '12px 24px' },
  qr: { width: '180px', height: '180px', borderRadius: '12px', border: '3px solid #E2E8F0' },
  codeForm: { padding: '0 24px 8px', display: 'flex', flexDirection: 'column', gap: '10px' },
  codeInput: { width: '100%', padding: '12px', border: '2px solid #E2E8F0', borderRadius: '8px', fontSize: '24px', textAlign: 'center', letterSpacing: '8px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' },
  successBox: { textAlign: 'center', padding: '28px 24px 20px' },
  successIcon: { fontSize: '40px', marginBottom: '10px' },
  successText: { fontSize: '16px', fontWeight: '700', color: '#15803D' },
  successDesc: { fontSize: '13px', color: '#64748B', marginTop: '6px' },
};
