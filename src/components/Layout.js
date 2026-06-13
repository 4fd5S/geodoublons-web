import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const NAV = [
    { to: '/dashboard', icon: '🏠', label: 'Tableau de bord', color: '#2563EB' },
    ...(user?.role === 'admin' ? [{ to: '/users', icon: '👥', label: 'Utilisateurs', color: '#16A34A' }] : []),
    { to: '/profile', icon: '👤', label: 'Mon Profil', color: '#7C3AED' },
  ];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={S.shell}>
      <aside style={{ ...S.sidebar, width: collapsed ? '64px' : '236px' }}>

        {/* Barre supérieure latérale épurée — Contient uniquement le bouton de réduction */}
        <div style={{ ...S.logoBar, justifyContent: collapsed ? 'center' : 'flex-end' }}>
          <button style={S.collapseBtn} onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Développer' : 'Réduire'}>
            <span style={{ fontSize: '12px' }}>{collapsed ? '›' : '‹'}</span>
          </button>
        </div>

        {/* Profil de l'utilisateur sécurisé (Adresse e-mail supprimée) */}
        {!collapsed && (
          <div style={S.profileStrip}>
            <div style={S.avatarSm}>{user?.prenom?.[0] || 'S'}{user?.nom?.[0] || 'A'}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={S.profileName}>{user?.prenom || 'Super'} {user?.nom || 'Admin'}</div>
            </div>
            <span style={user?.role === 'admin' ? S.badgeAdmin : S.badgeUser}>
              {user?.role === 'admin' ? 'ADMIN' : 'USER'}
            </span>
          </div>
        )}

        <div style={S.divider} />

        {/* Navigation principale */}
        <nav style={S.nav}>
          {!collapsed && <div style={S.navSection}>NAVIGATION</div>}
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} title={collapsed ? n.label : undefined}
              style={({ isActive }) => ({
                ...S.navItem,
                ...(isActive ? { background: 'rgba(255,255,255,0.12)', color: '#ffffff', borderLeftColor: n.color } : {}),
                justifyContent: collapsed ? 'center' : 'flex-start',
              })}>
              <span style={S.navIcon}>{n.icon}</span>
              {!collapsed && <span style={S.navLabel}>{n.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Pied de la barre latérale */}
        <div style={S.sidebarFooter}>
          <div style={S.divider} />
          {!collapsed && (
            <div style={S.versionRow}>
              <span style={S.versionText}>GeoDoublons Web v1.0</span>
            </div>
          )}
          <button style={{ ...S.logoutBtn, justifyContent: collapsed ? 'center' : 'flex-start' }} onClick={handleLogout} title="Déconnexion">
            <span style={{ fontSize: '16px' }}>⏻</span>
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      <main style={S.main}>
        <Outlet />
      </main>
    </div>
  );
}

const S = {
  shell: { display: 'flex', minHeight: '100vh', background: '#F0F2F5' },
  sidebar: { 
    background: 'linear-gradient(180deg,#1B2A4A 0%,#162036 100%)', 
    display: 'flex', 
    flexDirection: 'column', 
    transition: 'width 0.2s ease', 
    flexShrink: 0, 
    position: 'sticky', 
    top: '56px',               // Calé parfaitement sous les 56px de la barre YouTube
    height: 'calc(100vh - 56px)', // Ajustement dynamique de la hauteur restante
    overflow: 'hidden' 
  },
  logoBar: { display: 'flex', alignItems: 'center', padding: '12px 14px 10px' },
  collapseBtn: { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94A3B8', width: '24px', height: '24px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  profileStrip: { display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 14px 12px', minWidth: 0 },
  avatarSm: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#7C3AED)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0 },
  profileName: { fontSize: '12px', fontWeight: '700', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  badgeAdmin: { background: '#7C3AED', color: '#ffffff', fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 },
  badgeUser: { background: '#16A34A', color: '#ffffff', fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 },
  divider: { height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 12px' },
  nav: { flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto' },
  navSection: { fontSize: '9px', fontWeight: '700', color: '#475569', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '6px 8px 8px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', textDecoration: 'none', color: '#94A3B8', fontSize: '13px', fontWeight: '500', borderLeft: '3px solid transparent', transition: 'all 0.15s' },
  navIcon: { fontSize: '16px', flexShrink: 0, width: '20px', textAlign: 'center' },
  navLabel: { whiteSpace: 'nowrap', overflow: 'hidden' },
  sidebarFooter: { padding: '0 10px 14px', flexShrink: 0 },
  versionRow: { padding: '8px 8px 4px' },
  versionText: { fontSize: '10px', color: '#334155' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 10px', background: 'rgba(220,38,38,0.12)', border: 'none', color: '#FCA5A5', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'background 0.15s', marginTop: '6px' },
  main: { flex: 1, overflow: 'auto', minWidth: 0 },
};