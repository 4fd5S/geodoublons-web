import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérification au chargement :
  // On vérifie le token MAIS on re-valide avec /api/auth/me à chaque fois.
  // Si l'admin a été désactivé ou rétrogradé dans MongoDB → déconnexion forcée.
  // sessionStorage (pas localStorage) → session détruite à la fermeture du navigateur.
  useEffect(() => {
    const tok = sessionStorage.getItem('geo_token');
    if (tok) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + tok;
      axios.get('/api/auth/me')
        .then(r => {
          // Vérifier que l'utilisateur est toujours admin et actif
          if (r.data.role === 'admin' && r.data.actif) {
            setUser(r.data);
          } else {
            // Rôle ou statut changé → déconnecter
            logout();
          }
        })
        .catch(() => {
          // Token invalide ou expiré → déconnecter
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (tok, userData) => {
    // sessionStorage → session détruite à la fermeture du navigateur
    // (pas localStorage → pas de persistance entre fermetures)
    sessionStorage.setItem('geo_token', tok);
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + tok;
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem('geo_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Intercepteur axios : si le serveur retourne 401/403 → déconnecter
  useEffect(() => {
    const id = axios.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          const msg = err.response?.data?.error || '';
          // Seulement si c'est une vraie session invalide (pas juste un 403 sur une action)
          if (msg === 'Session invalide' || msg === 'Non authentifié' || msg === 'Token invalide') {
            logout();
          }
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
