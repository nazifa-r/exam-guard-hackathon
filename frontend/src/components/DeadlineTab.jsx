import React, { useState } from 'react';
import { CalendarRange, AlertTriangle, CheckCircle, Plus, Trash2, Zap, ArrowRight } from 'lucide-react';

function getSemesterDate(offsetDays) {
  const now = new Date();
  const currentDay = now.getDay();
  const daysToMonday = currentDay === 0 ? 1 : (8 - currentDay);
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToMonday + offsetDays);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, "0");
  const d = String(target.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DEADLINE_PRESETS = {
  collision: [
    { id: "dl-1", course: "CSE220 Data Structures", type: "Midterm Exam", weight: "Major", date: getSemesterDate(49), notes: "30% weight, 2.5hr" },
    { id: "dl-2", course: "CSE311 Database Systems", type: "Midterm Exam", weight: "Major", date: getSemesterDate(51), notes: "25% weight, ERD & BCNF" },
    { id: "dl-3", course: "CSE317 Software Engineering", type: "Midterm Exam", weight: "Major", date: getSemesterDate(56), notes: "UML Exam" },
    { id: "dl-4", course: "CSE212 Digital Logic", type: "Term Project Due", weight: "Major", date: getSemesterDate(58), notes: "FPGA report" },
    { id: "dl-5", course: "CSE305 Microprocessors", type: "Quiz / Lab Test", weight: "Minor", date: getSemesterDate(59), notes: "Assembly quiz" },
    { id: "dl-6", course: "CSE220 Data Structures", type: "Major Assignment", weight: "Major", date: getSemesterDate(91), notes: "Graph library" },
    { id: "dl-7", course: "CSE311 Database Systems", type: "Final Exam", weight: "Major", date: getSemesterDate(93), notes: "Finals week" },
    { id: "dl-8", course: "CSE317 Software Engineering", type: "Term Project Due", weight: "Major", date: getSemesterDate(94), notes: "Sprint demo" }
  ],
  balanced: [
    { id: "dl-b1", course: "CSE220 Data Structures", type: "Quiz / Lab Test", weight: "Minor", date: getSemesterDate(21), notes: "Linked List quiz" },
    { id: "dl-b2", course: "CSE311 Database Systems", type: "Major Assignment", weight: "Minor", date: getSemesterDate(35), notes: "SQL queries" },
    { id: "dl-b3", course: "CSE220 Data Structures", type: "Midterm Exam", weight: "Major", date: getSemesterDate(49), notes: "Midterm 1" },
    { id: "dl-b4", course: "CSE317 Software Engineering", type: "Midterm Exam", weight: "Major", date: getSemesterDate(63), notes: "Midterm 2" },
    { id: "dl-b5", course: "CSE212 Digital Logic", type: "Term Project Due", weight: "Major", date: getSemesterDate(77), notes: "FPGA submission" },
    { id: "dl-b6", course: "CSE311 Database Systems", type: "Final Exam", weight: "Major", date: getSemesterDate(98), notes: "Finals week" }
  ]
};

export default function DeadlineTab({ showToast }) {
  const [deadlines, setDeadlines] = useState(DEADLINE_PRESETS.collision);
  const [course, setCourse] = useState('');
  const [type, setType] = useState('Midterm Exam');
  const [weight, setWeight] = useState('Major');
  const [date, setDate] = useState(getSemesterDate(7));
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!course.trim() || !date) {
      alert('Please enter course code and due date.');
      return;
    }
    const item = {
      id: `dl-${Date.now()}`,
      course: course.trim(),
      type,
      weight,
      date,
      notes: notes.trim()
    };
    setDeadlines([...deadlines, item]);
    setCourse('');
    setNotes('');
    showToast(`Added deadline for ${item.course}`);
  };

  const handleRemove = (id) => {
    setDeadlines(deadlines.filter(d => d.id !== id));
    showToast('Assessment removed.');
  };

  const runCollisionCheck = async () => {
    if (deadlines.length === 0) {
      alert('Please add at least one assessment deadline.');
      return;
    }
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch('/api/check-deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadlines })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze collisions');

      setResults(data);
      showToast(`Detected ${data.collision_count} critical collision week(s)!`);
    } catch (err) {
      showToast(err.message || 'Error auditing deadlines', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Presets Bar */}
      <section className="presets-section">
        <div className="presets-header">
          <div className="presets-title">
            <Zap size={16} color="#8b5cf6" />
            <span>Semester Scheduling Scenarios:</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Simulate concurrent multi-department deadlines</span>
        </div>
        <div className="presets-grid">
          <button
            type="button"
            className="preset-chip-btn"
            onClick={() => {
              setDeadlines(DEADLINE_PRESETS.collision);
              showToast('Loaded 🚨 Midterm Fatigue Shock!');
            }}
          >
            <div className="preset-chip-title">
              <span className="badge badge-rose" style={{ padding: '0.1rem 0.4rem' }}>High Overload</span>
              <span>🚨 Midterm Fatigue Shock (5 Courses, 3 Hotspots)</span>
            </div>
            <p className="preset-chip-desc">Weeks 8, 9 &amp; 14 Concurrent Midterms &amp; Major Project Deadlines</p>
          </button>

          <button
            type="button"
            className="preset-chip-btn"
            onClick={() => {
              setDeadlines(DEADLINE_PRESETS.balanced);
              showToast('Loaded 🟢 Staggered Schedule!');
            }}
          >
            <div className="preset-chip-title">
              <span className="badge badge-emerald" style={{ padding: '0.1rem 0.4rem' }}>Optimized</span>
              <span>🟢 Staggered Semester Schedule (0 Overloads)</span>
            </div>
            <p className="preset-chip-desc">Healthy spacing with 48h+ buffers between deliverables</p>
          </button>

          <button
            type="button"
            className="preset-chip-btn"
            onClick={() => {
              setDeadlines([]);
              setResults(null);
              showToast('Cleared all deadlines.');
            }}
          >
            <div className="preset-chip-title">
              <span className="badge badge-violet" style={{ padding: '0.1rem 0.4rem' }}>Reset</span>
              <span>🧹 Clear All Deadlines</span>
            </div>
            <p className="preset-chip-desc">Start clean with an empty timetable</p>
          </button>
        </div>
      </section>

      {/* 2-Column Grid */}
      <div className="veritas-workspace-grid">
        {/* Left Form & Table */}
        <section className="veritas-panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <div className="step-indicator">1</div>
              <div>
                <h2 className="panel-heading">Multi-Course Deadlines Entry</h2>
                <p className="panel-sub">Add deliverables across departmental courses</p>
              </div>
            </div>
            <span className="badge badge-cyan">{deadlines.length} Configured</span>
          </div>

          <div className="panel-body">
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="form-label">Course Code &amp; Title</label>
                <input
                  type="text"
                  className="veritas-input"
                  placeholder="e.g. CSE220 Data Structures"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Assessment Type</label>
                  <select className="veritas-select" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="Midterm Exam">Midterm Exam</option>
                    <option value="Final Exam">Final Exam</option>
                    <option value="Term Project Due">Term Project Due</option>
                    <option value="Major Assignment">Major Assignment</option>
                    <option value="Quiz / Lab Test">Quiz / Lab Test</option>
                    <option value="Homework">Homework</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Impact / Weight</label>
                  <select className="veritas-select" value={weight} onChange={(e) => setWeight(e.target.value)}>
                    <option value="Major">Major (Exam / Project)</option>
                    <option value="Minor">Minor (Quiz / HW)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    className="veritas-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Context (Optional)</label>
                  <input
                    type="text"
                    className="veritas-input"
                    placeholder="e.g. 30% weight, 3hr"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn-veritas-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={16} />
                <span>Add Assessment Deadline</span>
              </button>
            </form>

            {/* Deadlines Table */}
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', overflow: 'hidden', marginTop: '0.5rem', background: '#ffffff' }}>
              <div style={{ padding: '0.6rem 0.9rem', background: 'var(--bg)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                <span>SCHEDULED ASSESSMENTS</span>
                <span>{deadlines.length} Items</span>
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {deadlines.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
                    No assessments added yet. Click a preset above.
                  </div>
                ) : (
                  deadlines.map((it) => (
                    <div
                      key={it.id}
                      style={{
                        padding: '0.6rem 0.9rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-violet)', fontWeight: 600 }}>{it.date}</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{it.course}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className={`badge ${it.type.includes('Exam') ? 'badge-rose' : it.type.includes('Project') ? 'badge-cyan' : 'badge-violet'}`} style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}>
                            {it.type}
                          </span>
                          <span className={`badge ${it.weight.toLowerCase() === 'major' ? 'badge-rose' : 'badge-emerald'}`} style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}>
                            {it.weight}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(it.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn-veritas-primary"
              disabled={loading || deadlines.length === 0}
              onClick={runCollisionCheck}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              <CalendarRange size={18} />
              <span>{loading ? 'Auditing Cognitive Fatigue...' : '🚀 Audit Semester Deadline Collisions'}</span>
            </button>
          </div>
        </section>

        {/* Right Heatmap & AI Suggestions */}
        <section className="veritas-panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <div className="step-indicator" style={{ background: 'linear-gradient(135deg, #06b6d4, #10b981)' }}>2</div>
              <div>
                <h2 className="panel-heading">Collision Heatmap &amp; Mitigation</h2>
                <p className="panel-sub">16-Week cognitive load timeline &amp; cross-course stagger</p>
              </div>
            </div>
          </div>

          <div className="panel-body">
            {!results ? (
              <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: '#64748b' }}>
                <CalendarRange size={48} color="#475569" style={{ margin: '0 auto 1rem', display: 'block' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem' }}>
                  Ready for Multi-Course Scheduling Audit
                </h3>
                <p style={{ fontSize: '0.84rem', maxWidth: '420px', margin: '0 auto' }}>
                  Add deadlines or click <strong>🚨 Midterm Fatigue Shock</strong> preset to visualize week-by-week cognitive bottlenecks.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                {/* KPI Grid */}
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <span className="kpi-label">Total Deadlines</span>
                    <span className="kpi-value" style={{ color: '#f8fafc' }}>{results.total_deadlines}</span>
                    <span className="kpi-sub">Across all courses</span>
                  </div>

                  <div className="kpi-card">
                    <span className="kpi-label">Collision Weeks</span>
                    <span className="kpi-value" style={{ color: results.collision_count > 0 ? '#f87171' : '#34d399' }}>
                      {results.collision_count}
                    </span>
                    <span className="kpi-sub">High fatigue clusters</span>
                  </div>

                  <div className="kpi-card">
                    <span className="kpi-label">Peak Burden</span>
                    <span className="kpi-value" style={{ color: '#fbbf24' }}>{results.highest_risk_week}</span>
                    <span className="kpi-sub">Max concurrent weight</span>
                  </div>

                  <div className="kpi-card">
                    <span className="kpi-label">Fatigue Risk Index</span>
                    <span className="kpi-value" style={{ color: results.collision_count >= 2 ? '#f87171' : results.collision_count === 1 ? '#fbbf24' : '#34d399' }}>
                      {results.collision_count >= 2 ? 'High Risk' : results.collision_count === 1 ? 'Moderate' : 'Optimal'}
                    </span>
                    <span className="kpi-sub">Temporal spacing</span>
                  </div>
                </div>

                {/* AI Executive Overview */}
                <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Zap size={15} color="#c4b5fd" />
                      <span>AI Academic Coordination Brief</span>
                    </span>
                    <span className="badge badge-violet">Faculty Sync</span>
                  </div>
                  <p style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.55 }}>
                    {results.ai_overview}
                  </p>
                </div>

                {/* 16-Week Heatmap */}
                <div className="result-card-section">
                  <div className="section-head">
                    <h3 className="section-title">
                      <CalendarRange size={18} color="#06b6d4" />
                      <span>16-Week Semester Cognitive Load Heatmap</span>
                    </h3>
                  </div>

                  <div className="heatmap-16-grid">
                    {results.weeks?.map((w) => {
                      const maxScore = Math.max(...results.weeks.map(x => x.total_score), 8.0);
                      const barPct = Math.min(100, Math.round((w.total_score / maxScore) * 100));
                      return (
                        <div key={w.week_num} className={`week-tile severity-${w.severity}`}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{w.label}</strong>
                            <span className="badge badge-violet" style={{ fontSize: '0.62rem', padding: '0.05rem 0.35rem' }}>
                              {w.deadlines.length}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{w.date_range}</span>
                          <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', margin: '0.2rem 0' }}>
                            <div style={{ height: '100%', width: `${barPct}%`, background: w.severity === 'critical' ? '#f43f5e' : w.severity === 'heavy' ? '#f59e0b' : '#10b981', borderRadius: '3px' }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                            {w.deadlines.slice(0, 2).map((d, dIdx) => (
                              <div key={dIdx} style={{ fontSize: '0.7rem', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                &bull; {d.course.split(' ')[0]}: {d.type.split(' ')[0]}
                              </div>
                            ))}
                            {w.deadlines.length > 2 && (
                              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>+{w.deadlines.length - 2} more</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Collision Hotspot Cards */}
                {results.weeks?.filter(w => w.is_collision).map((w) => (
                  <div key={w.week_num} style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.35)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <AlertTriangle size={18} />
                        <span>{w.label} ({w.date_range}) — {w.major_count} Major Deliverables Overload</span>
                      </span>
                      <span className="badge badge-rose">Score: {w.total_score} pts</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                      {w.deadlines.map((d, dIdx) => (
                        <div key={dIdx} style={{ background: 'rgba(6, 9, 22, 0.7)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '6px', padding: '0.6rem 0.8rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.82rem', color: '#f8fafc' }}>{d.course}</strong>
                            <span className={`badge ${d.weight.toLowerCase() === 'major' ? 'badge-rose' : 'badge-cyan'}`} style={{ fontSize: '0.62rem', padding: '0.05rem 0.3rem' }}>{d.weight}</span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.2rem' }}>{d.type} &bull; {d.date}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: 'rgba(6, 9, 22, 0.8)', borderLeft: '3px solid #8b5cf6', borderRadius: '4px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#c4b5fd', lineHeight: 1.5 }}>
                      <strong>💡 AI Rescheduling Strategy for Department Faculty:</strong>
                      <div>{w.recommendation || 'Stagger non-exam deadlines to adjacent lighter weeks to relieve cognitive pressure.'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
