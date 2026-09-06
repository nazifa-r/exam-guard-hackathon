import React from 'react';
import { Sparkles, ShieldAlert, Cpu } from 'lucide-react';

export default function HeroBanner() {
  return (
    <div className="veritas-hero-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '0.6rem', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <Sparkles size={20} color="#a78bfa" />
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a78bfa', marginBottom: '2px' }}>
            Autonomous Academic Co-Pilot
          </div>
          <div className="hero-lead-text">
            <strong>Faculty Pain Point:</strong> Instructors spend dozens of hours balancing cognitive diversity, detecting leaked past questions, averting student deadline collisions, and handing over courses to new faculty.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <span className="badge badge-cyan">Instant OBE Mapping</span>
        <span className="badge badge-emerald">Bloom's Diversity</span>
        <span className="badge badge-violet">Leak Radar</span>
      </div>
    </div>
  );
}
