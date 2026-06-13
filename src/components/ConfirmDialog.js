import React from 'react';

/**
 * ConfirmDialog — Dialogue de confirmation personnalisé
 * Remplace window.confirm() pour tous les actions dangereuses :
 *   - Supprimer utilisateur
 *   - Réinitialiser mot de passe
 *   - Modifier rôle
 *
 * Usage :
 *   const [dialog, setDialog] = useState(null);
 *
 *   // Ouvrir :
 *   setDialog({
 *     icon: '🗑️',
 *     title: 'Supprimer l\'utilisateur',
 *     message: 'Cette action est irréversible.',
 *     detail: 'jean.dupont@email.com',
 *     confirmLabel: 'Supprimer',
 *     confirmDanger: true,
 *     onConfirm: () => { ... }
 *   });
 *
 *   // Dans le JSX :
 *   {dialog && <ConfirmDialog {...dialog} onClose={() => setDialog(null)} />}
 */
export default function ConfirmDialog({
  icon = '⚠️',
  title,
  message,
  detail,
  confirmLabel = 'Confirmer',
  confirmDanger = false,
  onConfirm,
  onClose,
}) {
  const handleConfirm = () => {
    onClose();
    onConfirm();
  };

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={s.box}>

        {/* Icône */}
        <div style={{ ...s.iconWrap, background: confirmDanger ? '#FEF2F2' : '#EFF6FF' }}>
          <span style={s.iconText}>{icon}</span>
        </div>

        {/* Titre */}
        <div style={s.title}>{title}</div>

        {/* Message */}
        {message && <p style={s.message}>{message}</p>}

        {/* Détail (email, nom…) */}
        {detail && (
          <div style={s.detailBox}>
            <span style={s.detailText}>{detail}</span>
          </div>
        )}

        {/* Boutons */}
        <div style={s.actions}>
          <button style={s.cancelBtn} onClick={onClose}>
            Annuler
          </button>
          <button
            style={{ ...s.confirmBtn,
              background: confirmDanger
                ? 'linear-gradient(135deg,#DC2626,#B91C1C)'
                : 'linear-gradient(135deg,#2563EB,#1D4ED8)'
            }}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 2000,
    background: 'rgba(15,23,42,0.60)',
    backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
    animation: 'fadeIn .15s ease',
  },
  box: {
    background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '400px',
    padding: '32px 28px', textAlign: 'center',
    boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
    animation: 'slideUp .18s ease',
  },
  iconWrap: {
    width: '64px', height: '64px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 18px',
  },
  iconText: { fontSize: '26px' },
  title: {
    fontSize: '17px', fontWeight: '700', color: '#0F172A', marginBottom: '10px',
  },
  message: {
    fontSize: '14px', color: '#475569', lineHeight: '1.6',
    margin: '0 0 14px',
  },
  detailBox: {
    background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px',
    padding: '10px 14px', marginBottom: '22px',
  },
  detailText: { fontSize: '13px', color: '#374151', fontWeight: '600', wordBreak: 'break-all' },
  actions: { display: 'flex', gap: '10px', justifyContent: 'center' },
  cancelBtn: {
    flex: 1, padding: '11px 0', background: '#fff',
    border: '1.5px solid #E2E8F0', borderRadius: '9px',
    color: '#64748B', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
  },
  confirmBtn: {
    flex: 1, padding: '11px 0', border: 'none', borderRadius: '9px',
    color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
};
