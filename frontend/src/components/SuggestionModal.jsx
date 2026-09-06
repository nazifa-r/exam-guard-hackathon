import React from 'react';
import { Sparkles, X, PlusCircle, Check } from 'lucide-react';

export default function SuggestionModal({ modalData, onClose, onApply }) {
  if (!modalData) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 6, 18, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        background: '#0d1326',
        border: '1px solid rgba(139, 92, 246, 0.35)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(139, 92, 246, 0.2)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '640px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '0.4rem', borderRadius: '8px' }}>
              <Sparkles size={18} color="#c4b5fd" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
              {modalData.title || 'AI Faculty Recommendation'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{
            background: 'rgba(6, 9, 22, 0.8)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: '10px',
            padding: '1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            color: '#e2e8f0',
            lineHeight: 1.6
          }}>
            {modalData.question}
          </div>

          <div style={{
            background: 'rgba(139, 92, 246, 0.08)',
            borderLeft: '3px solid #8b5cf6',
            borderRadius: '4px',
            padding: '0.75rem 1rem',
            fontSize: '0.84rem',
            color: '#c4b5fd'
          }}>
            <strong>Pedagogical Rationale:</strong> {modalData.rationale}
          </div>

          {modalData.target_bloom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Target Bloom's Tier:</span>
              <span className="badge badge-cyan">{modalData.target_bloom}</span>
            </div>
          )}
        </div>

        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          background: 'rgba(255, 255, 255, 0.01)'
        }}>
          <button type="button" className="btn-veritas-secondary" onClick={onClose}>
            Dismiss
          </button>
          <button
            type="button"
            className="btn-veritas-primary"
            onClick={() => onApply(modalData.question)}
          >
            <PlusCircle size={16} />
            <span>Append to Draft Exam</span>
          </button>
        </div>
      </div>
    </div>
  );
}
