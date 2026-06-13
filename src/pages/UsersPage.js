import React, { useEffect, useState, useCallback } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import axios from 'axios';

export default function UsersPage() {
  const [users, setUsers]       = useState([]);
  const [stats, setStats]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [toast, setToast]       = useState(null);
  const [filter, setFilter]     = useState('all');
  const [resetRequests, setResetRequests] = useState([]);
  const [showResetPanel, setShowResetPanel] = useState(false);
  const [dialog, setDialog] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/users/stats/summary'),
      ]);
      setUsers(uRes.data);
      setStats(sRes.data);
      // Charger les demandes de réinitialisation en attente
      try {
        const rRes = await axios.get('/api/users/reset-requests');
        setResetRequests(rRes.data);
      } catch (_) { setResetRequests([]); }
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur de chargement', 'error');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const ok = !q || [u.nom, u.prenom, u.email, u.pseudo]
      .some(v => v?.toLowerCase().includes(q));
    const fok = filter === 'all'
      || (filter === 'actif'   &&  u.actif)
      || (filter === 'inactif' && !u.actif)
      || (filter === 'admin'   &&  u.role === 'admin')
      || (filter === 'premier' &&  u.premier_login);
    return ok && fok;
  });

  const toggleActive = (u) => {
    const activer = !u.actif;
    setDialog({
      icon: activer ? '✅' : '⛔',
      title: activer ? "Activer le compte" : "Désactiver le compte",
      message: activer
        ? "L'utilisateur pourra accéder au logiciel GeoDoublons."
        : "L'utilisateur ne pourra plus se connecter au logiciel.",
      detail: `${u.prenom} ${u.nom} — ${u.email}`,
      confirmLabel: activer ? "Activer" : "Désactiver",
      confirmDanger: !activer,
      onConfirm: async () => {
        try {
          await axios.patch(`/api/users/${encodeURIComponent(u.email)}`, { actif: activer });
          showToast(`Compte ${activer ? 'activé' : 'désactivé'}`);
          fetchUsers();
        } catch (err) { showToast(err.response?.data?.error || 'Erreur', 'error'); }
      }
    });
  };

  const toggleRole = (u) => {
    if (u.email === 'admin@admin.com')
      return showToast('Impossible de modifier le super admin', 'error');
    const nr = u.role === 'admin' ? 'user' : 'admin';
    setDialog({
      icon: '🔄',
      title: 'Modifier le rôle',
      message: `Le rôle sera changé en ${nr.toUpperCase()}.`,
      detail: `${u.prenom} ${u.nom} — ${u.email}`,
      confirmLabel: `Passer en ${nr.toUpperCase()}`,
      confirmDanger: false,
      onConfirm: async () => {
        try {
          await axios.patch(`/api/users/${encodeURIComponent(u.email)}`, { role: nr });
          showToast('Rôle modifié');
          fetchUsers();
        } catch (err) { showToast(err.response?.data?.error || 'Erreur', 'error'); }
      }
    });
  };

  const deleteUser = (u) => {
    if (u.email === 'admin@admin.com')
      return showToast('Impossible de supprimer le super admin', 'error');
      setDialog({
        icon: '🗑️',
        title: "Supprimer l'utilisateur",
        message: "Cette action est irréversible. Toutes les données du compte seront supprimées définitivement.",
        detail: `${u.prenom} ${u.nom} — ${u.email}`,
        confirmLabel: "Supprimer définitivement",
      confirmDanger: true,
      onConfirm: async () => {
        try {
          await axios.delete(`/api/users/${encodeURIComponent(u.email)}`);
          showToast('Utilisateur supprimé');
          fetchUsers();
        } catch (err) { showToast(err.response?.data?.error || 'Erreur', 'error'); }
      }
    });
  };

  const reinitPassword = (u) => {
  setDialog({
    icon: '🔑',
    title: 'Réinitialiser le mot de passe',
    // ⬇️ Hna tsalla7 l-guillemets b-Double Quotes (")
    message: "Un mot de passe temporaire sera généré et envoyé par email. L'utilisateur devra le changer à sa prochaine connexion.",
    detail: `${u.prenom} ${u.nom} — ${u.email}`,
    confirmLabel: 'Réinitialiser et envoyer email',
    confirmDanger: false,
    onConfirm: async () => {
      try {
        const r = await axios.post(`/api/users/${encodeURIComponent(u.email)}/reinit`);
        showToast(r.data.emailSent ? '✅ Mot de passe réinitialisé et email envoyé' : '⚠️ Réinitialisé — email non envoyé');
        fetchUsers();
      } catch (err) { showToast(err.response?.data?.error || 'Erreur', 'error'); }
    }
  });
};

  const fmtDate = (v) => {
    if (!v) return '—';
    try { return new Date(v).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
    catch { return v?.slice(0, 10) || '—'; }
  };

  return (
    <div style={styles.page}>
      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === 'error' ? '#DC2626' : '#16A34A' }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>👥 Gestion des Utilisateurs</h1>
          <p style={styles.subtitle}>Administration des comptes — synchronisé avec MongoDB</p>
        </div>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          {resetRequests.length > 0 && (
            <button style={styles.resetAlertBtn} onClick={() => setShowResetPanel(v => !v)}>
              🔑 {resetRequests.length} demande{resetRequests.length > 1 ? 's' : ''} de réinitialisation
            </button>
          )}
          <button style={styles.createBtn} onClick={() => { setEditUser(null); setShowModal(true); }}>
            ✚ Créer un utilisateur
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { label:'Total',         value: stats.total    || 0, color:'#2563EB', icon:'👥' },
          { label:'Actifs',        value: stats.actifs   || 0, color:'#16A34A', icon:'✅' },
          { label:'Inactifs',      value: stats.inactifs || 0, color:'#DC2626', icon:'⛔' },
          { label:'Admins',        value: stats.admins   || 0, color:'#7C3AED', icon:'🛡️' },
          { label:'Ce mois',       value: stats.recent   || 0, color:'#0891B2', icon:'🆕' },
        ].map(s => (
          <div key={s.label} style={{ ...styles.statCard, borderTop:`3px solid ${s.color}` }}>
            <div style={styles.statIcon}>{s.icon}</div>
            <div style={{ ...styles.statValue, color:s.color }}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <input style={styles.search} value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Rechercher par nom, email, pseudo…" />
        <div style={styles.filters}>
          {[['all','Tous'],['actif','Actifs'],['inactif','Inactifs'],['admin','Admins'],['premier','1er login']].map(([f,l]) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}>
              {l}
            </button>
          ))}
        </div>
        <button style={styles.refreshBtn} onClick={fetchUsers} title="Actualiser">🔄</button>
      </div>

      {/* Panneau demandes de réinitialisation */}
      {showResetPanel && resetRequests.length > 0 && (
        <div style={styles.resetPanel}>
          <div style={styles.resetPanelHeader}>
            🔑 Demandes de réinitialisation en attente ({resetRequests.length})
            <button onClick={() => setShowResetPanel(false)} style={styles.resetCloseBtn}>✕</button>
          </div>
          {resetRequests.map(u => (
            <div key={u.email} style={styles.resetRow}>
              <div style={styles.resetInfo}>
                <strong style={{ color:'#0F172A' }}>{u.prenom} {u.nom}</strong>
                <span style={{ color:'#64748B', fontSize:'13px', marginLeft:'10px' }}>{u.email}</span>
                <span style={{ color:'#94A3B8', fontSize:'12px', marginLeft:'10px' }}>
                  {u.reset_request_date ? new Date(u.reset_request_date).toLocaleDateString('fr-FR') : ''}
                </span>
              </div>
              <button style={styles.reinitBtn} onClick={() => reinitPassword(u)}>
                🔄 Valider et envoyer un nouveau mot de passe
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.emptyState}>⏳ Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>Aucun utilisateur trouvé</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Utilisateur</th>
                <th style={styles.th}>Email</th>
                <th style={{ ...styles.th, textAlign:'center' }}>Pseudo</th>
                <th style={{ ...styles.th, textAlign:'center' }}>Rôle</th>
                <th style={{ ...styles.th, textAlign:'center' }}>Statut</th>
                <th style={{ ...styles.th, textAlign:'center' }}>Dét.</th>
                <th style={{ ...styles.th, textAlign:'center' }}>Créé le</th>
                <th style={{ ...styles.th, textAlign:'center' }}>Dernière connexion</th>
                <th style={{ ...styles.th, textAlign:'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.email}
                  style={{ ...styles.tr, background: i % 2 === 0 ? '#ffffff' : '#FAFAFA' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#ffffff' : '#FAFAFA'}>

                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <div style={{ ...styles.avatar, background: u.role === 'admin' ? 'linear-gradient(135deg,#7C3AED,#2563EB)' : 'linear-gradient(135deg,#0891B2,#16A34A)' }}>
                        {u.prenom?.[0]}{u.nom?.[0]}
                      </div>
                      <div>
                        <div style={styles.userName}>{u.prenom} {u.nom}</div>
                        <div style={styles.userId}>ID: {u.id?.slice(0,8)}</div>
                        {u.premier_login && (
                          <span style={styles.premierTag}>🔑 1er login</span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td style={styles.td}>
                    <span style={styles.emailTxt}>{u.email}</span>
                  </td>

                  <td style={{ ...styles.td, textAlign:'center' }}>
                    <span style={styles.pseudo}>{u.pseudo}</span>
                  </td>

                  <td style={{ ...styles.td, textAlign:'center' }}>
                    <button onClick={() => toggleRole(u)}
                      style={{ ...styles.badge, ...(u.role === 'admin' ? styles.badgeAdmin : styles.badgeUser) }}>
                      {u.role === 'admin' ? '🛡️ ADMIN' : '◯ USER'}
                    </button>
                  </td>

                  <td style={{ ...styles.td, textAlign:'center' }}>
                    <button onClick={() => toggleActive(u)}
                      style={{ ...styles.badge, ...(u.actif ? styles.badgeActive : styles.badgeInactive) }}>
                      {u.actif ? '✅ Actif' : '⛔ Inactif'}
                    </button>
                  </td>

                  <td style={{ ...styles.td, textAlign:'center' }}>
                    <span style={styles.detNum}>{u.nb_detections ?? 0}</span>
                  </td>

                  <td style={{ ...styles.td, textAlign:'center', fontSize:'11px', color:'#64748B' }}>
                    {u.date_creation ? new Date(u.date_creation).toLocaleDateString('fr-FR') : '—'}
                  </td>

                  <td style={{ ...styles.td, textAlign:'center', fontSize:'11px', color:'#64748B' }}>
                    {u.derniere_connexion ? fmtDate(u.derniere_connexion) : <span style={{ color:'#94A3B8' }}>Jamais</span>}
                  </td>

                  <td style={{ ...styles.td, textAlign:'center' }}>
                    <div style={styles.actions}>
                      <button style={styles.actionBtn}
                        onClick={() => { setEditUser(u); setShowModal(true); }} title="Modifier">✏️</button>
                      <button style={{ ...styles.actionBtn, ...styles.actionReset }}
                        onClick={() => reinitPassword(u)} title="Réinitialiser mot de passe">🔑</button>
                      <button style={{ ...styles.actionBtn, ...styles.actionDelete }}
                        onClick={() => deleteUser(u)} title="Supprimer">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Dialogue de confirmation */}
      {dialog && (
        <ConfirmDialog
          {...dialog}
          onClose={() => setDialog(null)}
        />
      )}

      {/* Modal */}
      {showModal && (
        <UserModal
          user={editUser}
          onClose={() => { setShowModal(false); setEditUser(null); }}
          onSuccess={(msg) => { showToast(msg); fetchUsers(); setShowModal(false); setEditUser(null); }}
        />
      )}
    </div>
  );
}

// ── MODAL CRÉATION / MODIFICATION ────────────────────────────────────────────
function UserModal({ user, onClose, onSuccess }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    nom:    user?.nom    || '',
    prenom: user?.prenom || '',
    pseudo: user?.pseudo || '',
    email:  user?.email  || '',
  });
  const [pseudoStatus, setPseudoStatus] = useState(null); // null|'checking'|'ok'|'taken'
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [pseudoTimer, setPseudoTimer]   = useState(null);

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setError('');

    if (field === 'pseudo') {
      setPseudoStatus('checking');
      clearTimeout(pseudoTimer);
      const t = setTimeout(async () => {
        const up = value.toUpperCase().trim();
        if (!up) { setPseudoStatus(null); return; }
        // Si édition et pseudo inchangé → disponible
        if (isEdit && up === user.pseudo.toUpperCase()) { setPseudoStatus('ok'); return; }
        try {
          const excludeParam = isEdit ? `?exclude=${encodeURIComponent(user.email)}` : '';
          const r = await axios.get(`/api/users/check-pseudo/${encodeURIComponent(up)}${excludeParam}`);
          setPseudoStatus(r.data.taken ? 'taken' : 'ok');
        } catch { setPseudoStatus(null); }
      }, 400);
      setPseudoTimer(t);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pseudoStatus === 'taken') return setError('Le pseudo est déjà utilisé — choisissez-en un autre.');
    setError(''); setLoading(true);
    try {
      if (isEdit) {
        await axios.patch(`/api/users/${encodeURIComponent(user.email)}`,
          { nom: form.nom, prenom: form.prenom, pseudo: form.pseudo });
        onSuccess('✅ Utilisateur modifié avec succès');
      } else {
        const r = await axios.post('/api/users', form);
        onSuccess(r.data.emailSent
          ? '✅ Utilisateur créé et email envoyé !'
          : '⚠️ Utilisateur créé — email non envoyé (vérifiez la config SMTP)');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur';
      setError(msg);
      // Si erreur de pseudo → marquer le champ
      if (err.response?.data?.field === 'pseudo') setPseudoStatus('taken');
    } finally { setLoading(false); }
  };

  return (
    <div style={modal.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal.box}>
        <div style={modal.header}>
          <div style={modal.headerTitle}>
            {isEdit ? '✏️ Modifier l\'utilisateur' : '✚ Créer un utilisateur'}
          </div>
          <button style={modal.closeBtn} onClick={onClose}>✕</button>
        </div>

        {!isEdit && (
          <div style={modal.infoBox}>
            <span>📧</span>
            <span>
              Un email contenant les identifiants et le lien de téléchargement
              du logiciel sera envoyé automatiquement à l'utilisateur.
              <br /><strong>L'utilisateur devra changer son mot de passe lors de son premier accès au logiciel.</strong>
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={modal.form}>
          {error && <div style={modal.error}>⚠️ {error}</div>}

          <div style={modal.row}>
            <div style={modal.field}>
              <label style={modal.label}>Prénom *</label>
              <input style={modal.input} value={form.prenom}
                onChange={e => handleChange('prenom', e.target.value)}
                placeholder="ex: Jean" required />
            </div>
            <div style={modal.field}>
              <label style={modal.label}>Nom *</label>
              <input style={modal.input} value={form.nom}
                onChange={e => handleChange('nom', e.target.value)}
                placeholder="ex: Dupont" required />
            </div>
          </div>

          <div style={modal.field}>
            <label style={modal.label}>
              Pseudo *&nbsp;
              {pseudoStatus === 'checking' && <span style={modal.hint}>⏳ Vérification…</span>}
              {pseudoStatus === 'ok'       && <span style={{ ...modal.hint, color:'#16A34A' }}>✅ Disponible</span>}
              {pseudoStatus === 'taken'    && <span style={{ ...modal.hint, color:'#DC2626' }}>❌ Déjà utilisé</span>}
            </label>
            <input
              style={{ ...modal.input,
                borderColor: pseudoStatus === 'taken' ? '#DC2626'
                           : pseudoStatus === 'ok'    ? '#16A34A' : '#E2E8F0',
                textTransform:'uppercase' }}
              value={form.pseudo}
              onChange={e => handleChange('pseudo', e.target.value)}
              placeholder="ex: JD" maxLength={6} required />
            <div style={modal.fieldHint}>Le pseudo doit être unique pour chaque utilisateur.</div>
          </div>

          {!isEdit && (
            <div style={modal.field}>
              <label style={modal.label}>Email *</label>
              <input style={modal.input} type="email" value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="jean.dupont@email.com" required />
              <div style={modal.fieldHint}>L'email de bienvenue sera envoyé à cette adresse.</div>
            </div>
          )}

          {!isEdit && (
            <div style={modal.autoPass}>
              <span style={modal.autoPassIcon}>🔑</span>
              <div>
                <div style={modal.autoPassTitle}>Mot de passe auto-généré</div>
                <div style={modal.autoPassDesc}>
                  Un mot de passe sécurisé est généré et envoyé par email.
                  L'utilisateur le changera lors de son premier accès au logiciel.
                </div>
              </div>
            </div>
          )}

          <div style={modal.footer}>
            <button type="button" style={modal.cancelBtn} onClick={onClose}>Annuler</button>
            <button type="submit"
              style={{ ...modal.submitBtn, opacity: (loading || pseudoStatus === 'taken') ? 0.6 : 1 }}
              disabled={loading || pseudoStatus === 'taken'}>
              {loading ? '⏳ Traitement…' : isEdit ? '💾 Enregistrer' : '✚ Créer & Envoyer email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = {
  page:        { padding:'28px 32px', minHeight:'100vh', position:'relative' },
  header:      { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px' },
  title:       { fontSize:'24px', fontWeight:'700', color:'#0F172A', margin:0 },
  subtitle:    { fontSize:'13px', color:'#64748B', marginTop:'4px' },
  createBtn:   { padding:'11px 22px', background:'linear-gradient(135deg,#16A34A,#15803D)', color:'#fff', border:'none', borderRadius:'9px', fontSize:'14px', fontWeight:'600', cursor:'pointer' },
  statsRow:    { display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'14px', marginBottom:'22px' },
  statCard:    { background:'#fff', borderRadius:'12px', padding:'18px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  statIcon:    { fontSize:'20px', marginBottom:'8px' },
  statValue:   { fontSize:'28px', fontWeight:'700' },
  statLabel:   { fontSize:'12px', color:'#64748B', marginTop:'2px', fontWeight:'500' },
  toolbar:     { display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' },
  search:      { flex:1, padding:'10px 16px', border:'1.5px solid #E2E8F0', borderRadius:'9px', fontSize:'14px', outline:'none', maxWidth:'380px' },
  filters:     { display:'flex', gap:'6px' },
  filterBtn:   { padding:'8px 14px', border:'1.5px solid #E2E8F0', borderRadius:'7px', background:'#fff', color:'#64748B', fontSize:'12px', fontWeight:'500', cursor:'pointer' },
  filterActive:{ background:'#EFF6FF', border:'1.5px solid #2563EB', color:'#2563EB' },
  refreshBtn:  { padding:'9px 12px', border:'1.5px solid #E2E8F0', borderRadius:'8px', background:'#fff', cursor:'pointer', fontSize:'16px' },
  tableCard:   { background:'#fff', borderRadius:'14px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'auto' },
  emptyState:  { padding:'48px', textAlign:'center', color:'#94A3B8', fontSize:'15px' },
  table:       { width:'100%', borderCollapse:'collapse', minWidth:'900px' },
  thead:       { background:'#F8FAFC' },
  th:          { padding:'12px 14px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'0.7px', textTransform:'uppercase', borderBottom:'1px solid #F1F5F9' },
  tr:          { transition:'background 0.1s' },
  td:          { padding:'12px 14px', fontSize:'13px', color:'#374151', borderBottom:'1px solid #F7F9FC', verticalAlign:'middle' },
  userCell:    { display:'flex', alignItems:'center', gap:'10px' },
  avatar:      { width:'34px', height:'34px', borderRadius:'50%', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', flexShrink:0 },
  userName:    { fontSize:'13px', fontWeight:'600', color:'#0F172A' },
  userId:      { fontSize:'11px', color:'#94A3B8', fontFamily:'monospace' },
  premierTag:  { display:'inline-block', fontSize:'10px', background:'#FEF9C3', color:'#854D0E', padding:'1px 6px', borderRadius:'4px', marginTop:'3px', fontWeight:'600' },
  emailTxt:    { color:'#2563EB', fontSize:'12px' },
  pseudo:      { background:'#EDE9FE', color:'#7C3AED', padding:'3px 8px', borderRadius:'5px', fontSize:'12px', fontWeight:'700', fontFamily:'monospace' },
  badge:       { border:'none', padding:'4px 10px', borderRadius:'5px', fontSize:'11px', fontWeight:'600', cursor:'pointer' },
  badgeAdmin:  { background:'#EDE9FE', color:'#7C3AED' },
  badgeUser:   { background:'#F0F9FF', color:'#0891B2' },
  badgeActive: { background:'#DCFCE7', color:'#16A34A' },
  badgeInactive:{ background:'#FEE2E2', color:'#DC2626' },
  detNum:      { background:'#F1F5F9', padding:'3px 8px', borderRadius:'5px', fontSize:'12px', fontWeight:'600', color:'#475569' },
  actions:     { display:'flex', gap:'6px', justifyContent:'center' },
  actionBtn:   { border:'1px solid #E2E8F0', background:'#fff', padding:'5px 8px', borderRadius:'6px', cursor:'pointer', fontSize:'14px' },
  actionDelete:{ borderColor:'#FEE2E2', background:'#FFF5F5' },
  toast:       { position:'fixed', top:'24px', right:'24px', zIndex:9999, padding:'12px 20px', borderRadius:'10px', color:'#fff', fontSize:'14px', fontWeight:'600', boxShadow:'0 4px 16px rgba(0,0,0,0.2)', maxWidth:'400px' },
  resetAlertBtn: { padding:'10px 18px', background:'#FEF3C7', border:'1.5px solid #F59E0B', borderRadius:'9px', color:'#92400E', fontSize:'13px', fontWeight:'700', cursor:'pointer' },
  resetPanel:  { background:'#FFFBEB', border:'1.5px solid #F59E0B', borderRadius:'12px', padding:'18px 22px', marginBottom:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  resetPanelHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'14px', fontWeight:'700', color:'#92400E', marginBottom:'14px' },
  resetCloseBtn: { background:'none', border:'none', cursor:'pointer', fontSize:'16px', color:'#94A3B8' },
  resetRow:    { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderTop:'1px solid #FDE68A' },
  resetInfo:   { display:'flex', alignItems:'center', flexWrap:'wrap', gap:'4px' },
  reinitBtn:   { padding:'8px 16px', background:'#F59E0B', border:'none', borderRadius:'8px', color:'#fff', fontSize:'12px', fontWeight:'600', cursor:'pointer', whiteSpace:'nowrap' },
  actionReset: { borderColor:'#FEF3C7', background:'#FFFBEB' },
};

const modal = {
  overlay:      { position:'fixed', inset:0, background:'rgba(15,23,42,0.65)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(4px)' },
  box:          { background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'520px', boxShadow:'0 24px 64px rgba(0,0,0,0.3)', overflow:'hidden' },
  header:       { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', background:'#1B2A4A' },
  headerTitle:  { fontSize:'16px', fontWeight:'700', color:'#fff' },
  closeBtn:     { background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', width:'28px', height:'28px', borderRadius:'6px', cursor:'pointer', fontSize:'14px' },
  infoBox:      { display:'flex', gap:'10px', alignItems:'flex-start', background:'#EFF6FF', padding:'14px 24px', fontSize:'13px', color:'#1D4ED8', borderBottom:'1px solid #BFDBFE', lineHeight:'1.6' },
  form:         { padding:'24px' },
  error:        { background:'#FEE2E2', color:'#DC2626', padding:'10px 14px', borderRadius:'8px', fontSize:'13px', marginBottom:'16px', borderLeft:'3px solid #DC2626' },
  row:          { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' },
  field:        { marginBottom:'16px' },
  label:        { display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'6px' },
  hint:         { fontSize:'12px', fontWeight:'500', color:'#64748B' },
  input:        { width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:'8px', fontSize:'14px', outline:'none', background:'#FAFAFA', boxSizing:'border-box' },
  fieldHint:    { fontSize:'11px', color:'#94A3B8', marginTop:'5px' },
  autoPass:     { display:'flex', alignItems:'flex-start', gap:'12px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'10px', padding:'14px', marginBottom:'16px' },
  autoPassIcon: { fontSize:'20px', marginTop:'2px' },
  autoPassTitle:{ fontSize:'13px', fontWeight:'600', color:'#15803D' },
  autoPassDesc: { fontSize:'12px', color:'#166534', marginTop:'3px', lineHeight:'1.5' },
  footer:       { display:'flex', gap:'10px', justifyContent:'flex-end', paddingTop:'12px', borderTop:'1px solid #F1F5F9', marginTop:'8px' },
  cancelBtn:    { padding:'10px 20px', border:'1.5px solid #E2E8F0', borderRadius:'8px', background:'#fff', color:'#64748B', fontSize:'13px', fontWeight:'500', cursor:'pointer' },
  submitBtn:    { padding:'10px 22px', border:'none', borderRadius:'8px', background:'linear-gradient(135deg,#16A34A,#15803D)', color:'#fff', fontSize:'13px', fontWeight:'600', cursor:'pointer' },
};
