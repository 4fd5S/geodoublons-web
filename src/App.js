import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage     from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage     from './pages/UsersPage';
import ProfilePage   from './pages/ProfilePage';
import Layout        from './components/Layout';

// ── BARRE DE NAVIGATION SUPÉRIEURE (STYLE YOUTUBE) ──
function TopNavbar() {
  return (
    <header style={navStyles.navbar}>
      <div style={navStyles.logoContainer} onClick={() => window.location.href = '/'}>
        {/* Intégration de votre logo PNG */}
        <img 
          src="/logo.png" 
          alt="GeoDoublons Logo" 
          style={navStyles.logoImg} 
        />
        <span style={navStyles.logoText}>GeoDoublons</span>
      </div>
      <div style={navStyles.rightSection}>
        {/* Options de droite facultatives */}
      </div>
    </header>
  );
}

// ── DOUBLE CONTENEUR PROFESSIONNEL (BARRE UNIQUEMENT EN ZONE CONNECTÉE) ──
function AdminLayout() {
  return (
    <>
      <TopNavbar />
      {/* Le padding-top s'applique uniquement ici pour ne pas impacter la page login */}
      <div style={{ paddingTop: '56px', minHeight: 'calc(100vh - 56px)', boxSizing: 'border-box' }}>
        <Layout />
      </div>
    </>
  );
}

// ── ÉCRAN DE CHARGEMENT PRO AVEC LOGO PNG ──
function LoadingScreen() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', background:'linear-gradient(135deg,#1B2A4A 0%,#0F1829 100%)' }}>
      <div style={{ textAlign:'center' }}>
        {/* Remplacement du ◈ par votre logo.png */}
        <img 
          src="/logo.png" 
          alt="Chargement..." 
          style={{ width: '56px', height: '56px', marginBottom: '16px', objectFit: 'contain' }} 
        />
        <div style={{ color:'#93C5FD', fontSize:'14px', fontFamily:'Inter,sans-serif' }}>
          Vérification de l'accès…
        </div>
      </div>
    </div>
  );
}

// Route protégée — admin uniquement
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Page de connexion épurée et isolée (Pas de TopNavbar ici !) */}
          <Route path="/login" element={<LoginPage />} />

          {/* Zone d'administration protégée avec barre supérieure intégrée */}
          <Route path="/" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users"     element={<UsersPage />} />
            <Route path="profile"   element={<ProfilePage />} />
          </Route>

          {/* Redirection globale */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// ── DESIGN DE LA BARRE STYLE YOUTUBE ──
const navStyles = {
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '56px',
    backgroundColor: '#1B2A4A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 9999,
    boxSizing: 'border-box',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
  },
  logoImg: {
    height: '32px',
    width: '32px',
    objectFit: 'contain',
    marginRight: '12px',
  },
  logoText: {
    fontFamily: '"Segoe UI", Roboto, sans-serif',
    fontSize: '19px',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: '-0.3px',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
  }
};