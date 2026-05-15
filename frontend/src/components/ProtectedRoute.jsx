import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--dark)' }}>
        <div style={{ textAlign:'center' }}>
          <div className="spinner" style={{ width:'32px', height:'32px', margin:'0 auto 12px' }} />
          <div style={{ color:'var(--text-muted)', fontSize:'13px' }}>Loading BrandPulse AI...</div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
