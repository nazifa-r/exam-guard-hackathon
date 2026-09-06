import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: '1.75rem',
      right: '1.75rem',
      background: toast.isError ? 'rgba(127, 29, 29, 0.95)' : 'rgba(15, 23, 42, 0.95)',
      color: 'white',
      border: `1px solid ${toast.isError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(139, 92, 246, 0.4)'}`,
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.2)',
      borderRadius: '12px',
      padding: '0.85rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.65rem',
      fontSize: '0.88rem',
      fontWeight: 600,
      zIndex: 9999,
      backdropFilter: 'blur(16px)',
      animation: 'fadeIn 0.2s ease'
    }}>
      {toast.isError ? <AlertCircle size={18} color="#fca5a5" /> : <CheckCircle2 size={18} color="#34d399" />}
      <span>{toast.message}</span>
    </div>
  );
}
