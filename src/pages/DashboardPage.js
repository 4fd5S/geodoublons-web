import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div style={{ padding: '20px' }}>
      <h1
        style={{
          marginBottom: '5px',
          color: '#1e293b',
          fontSize: '28px'
        }}
      >
        Bonjour, {user?.prenom} 
      </h1>

      <p
        style={{
          color: '#64748b',
          marginBottom: '20px'
        }}
      >
        Tableau de bord GeoDoublons - Analyse des doublons géographiques
      </p>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
          marginTop: '15px'
        }}
      >
        <iframe
          title="GeoDoublons Dashboard"
          width="100%"
          height="900"
          src="https://app.powerbi.com/reportEmbed?reportId=d3e1adb6-8cfe-421b-92b2-8fe7fb54a3b3&autoAuth=true&ctid=01b16415-fdef-4b49-a87a-6af594b18684"
          frameBorder="0"
          allowFullScreen
          style={{
            border: '1px solid #f1f5f9',
            borderRadius: '12px',
            background: '#ffffff'
          }}
        />
      </div>
    </div>
  );
}