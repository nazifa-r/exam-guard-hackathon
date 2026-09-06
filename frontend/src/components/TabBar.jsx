import React from 'react';
import { SearchCheck, CalendarRange, FileText } from 'lucide-react';

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className="veritas-tab-bar">
      <div className="tab-bar-inner">
        <button
          type="button"
          className={`veritas-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => onTabChange('audit')}
        >
          <SearchCheck size={18} />
          <span>Exam Quality Audit</span>
        </button>

        <button
          type="button"
          className={`veritas-tab-btn ${activeTab === 'deadline' ? 'active' : ''}`}
          onClick={() => onTabChange('deadline')}
        >
          <CalendarRange size={18} />
          <span>Deadline Collision Checker</span>
          <span className="tab-badge-pill">Multi-Course</span>
        </button>

        <button
          type="button"
          className={`veritas-tab-btn ${activeTab === 'handover' ? 'active' : ''}`}
          onClick={() => onTabChange('handover')}
        >
          <FileText size={18} />
          <span>Course Handover Brief</span>
          <span className="tab-badge-pill" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)' }}>New Faculty</span>
        </button>
      </div>
    </nav>
  );
}
