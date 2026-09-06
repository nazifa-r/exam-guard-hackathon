import React from 'react';
import { ShieldCheck, Database, Cpu, Sparkles } from 'lucide-react';

export default function Header({ engineStatus, onOpenBank }) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand-wrapper">
          <div className="brand-icon-shield">
            <ShieldCheck size={24} strokeWidth={2.5} />
          </div>
          <div className="brand-title-group">
            <h1 className="brand-name">ExamGuard</h1>
            <p className="brand-subtitle">AI-Powered Assessment Intelligence</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="engine-status-pill" title={engineStatus.configured ? 'Connected to live Gemini API' : 'Simulation Demo Mode'}>
            <span className={`engine-dot ${engineStatus.configured ? 'active' : ''}`} />
            <span>{engineStatus.model || 'Gemini 3.7 Flash'}</span>
            <span className="badge badge-violet" style={{ marginLeft: '0.2rem', padding: '0.1rem 0.45rem' }}>
              <Cpu size={11} style={{ marginRight: '3px' }} /> Live
            </span>
          </div>

          <button type="button" className="btn-veritas-secondary" onClick={onOpenBank} style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}>
            <Database size={15} color="#8b5cf6" />
            <span>Question Bank</span>
          </button>
        </div>
      </div>
    </header>
  );
}
