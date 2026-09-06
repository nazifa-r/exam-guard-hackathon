import React, { useState } from 'react';
import {
  Sparkles, FileText, Upload, AlertTriangle, CheckCircle, ShieldCheck,
  Zap, Award, ArrowUpRight, Copy, Printer, FileDown, Layers, HelpCircle, Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';

const AUDIT_PRESETS = {
  flawed: {
    course: "CSE220 — Data Structures & Algorithms",
    title: "Midterm Examination 2026 (Draft v1)",
    los: [
      "LO1: Understand foundational data structures, pointers, and memory layout tradeoffs",
      "LO2: Implement and evaluate asymptotic complexity of sorting and searching algorithms",
      "LO3: Apply balanced search trees, priority queues, and hashing to solve real-world problems",
      "LO4: Design graph traversal and shortest-path algorithms for network applications"
    ],
    questions: [
      "Q1. Define what a singly linked list is and list two differences between an array and a linked list. (5 marks)",
      "Q2. What is the worst-case time complexity of QuickSort? State the condition when this worst-case occurs. (5 marks)",
      "Q3. Name three collision resolution techniques used in hash tables and briefly describe linear probing. (5 marks)",
      "Q4. Trace the step-by-step execution of Dijkstra's algorithm on the given 5-node directed graph. Show distance and predecessor arrays. (10 marks)"
    ]
  },
  balanced: {
    course: "CSE220 — Data Structures & Algorithms",
    title: "Midterm Examination 2026 (Balanced Edition)",
    los: [
      "LO1: Understand foundational data structures, pointers, and memory layout tradeoffs",
      "LO2: Implement and evaluate asymptotic complexity of sorting and searching algorithms",
      "LO3: Apply balanced search trees, priority queues, and hashing to solve real-world problems",
      "LO4: Design graph traversal and shortest-path algorithms for network applications"
    ],
    questions: [
      "Q1. Design an in-place algorithm to reverse every k-node sub-group of a linked list. Analyze its memory footprint. (8 marks)",
      "Q2. Derive the recurrence relation for Median-of-3 QuickSort and prove why it avoids quadratic worst-case. (7 marks)",
      "Q3. Implement an augmented AVL tree supporting findKthSmallest(k) in O(log N) time. Show rotation state invariants. (10 marks)",
      "Q4. Modify Dijkstra's algorithm to compute shortest path with at most K edge traversals. Prove optimality. (10 marks)"
    ]
  },
  database: {
    course: "CSE311 — Database Management Systems",
    title: "Final Examination 2026 (Draft)",
    los: [
      "LO1: Design conceptual entity-relationship schemas and normalize to BCNF",
      "LO2: Formulate complex relational algebra expressions and SQL optimization plans",
      "LO3: Evaluate transaction ACID properties, serializability, and 2PL locking protocols"
    ],
    questions: [
      "Q1. Given relation R(A,B,C,D,E) with FDs {A->BC, CD->E, B->D}, find all candidate keys and decompose into BCNF. (10 marks)",
      "Q2. Construct the canonical relational algebra query tree for the given nested SQL query and push down selection predicates. (10 marks)",
      "Q3. Construct a non-serial schedule of 3 transactions that is conflict serializable and state why Strict 2PL prevents cascading rollbacks. (10 marks)"
    ]
  }
};

export default function AuditTab({ onOpenSuggestionModal, showToast }) {
  const [courseName, setCourseName] = useState('CSE220 — Data Structures & Algorithms');
  const [examTitle, setExamTitle] = useState('Midterm Examination 2026 (Draft v1)');
  const [los, setLos] = useState(AUDIT_PRESETS.flawed.los.join('\n'));
  const [questions, setQuestions] = useState(AUDIT_PRESETS.flawed.questions.join('\n'));

  const [inputMode, setInputMode] = useState('paste'); // 'paste' | 'upload'
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const loCount = los.split('\n').filter(s => s.trim()).length;
  const qCount = questions.split('\n').filter(s => s.trim()).length;

  const loadPreset = (key) => {
    const p = AUDIT_PRESETS[key];
    if (!p) return;
    setCourseName(p.course);
    setExamTitle(p.title);
    setLos(p.los.join('\n'));
    setQuestions(p.questions.join('\n'));
    showToast(`Loaded preset: ${p.title}`);
  };

  const runAudit = async () => {
    if (!los.trim() || !questions.trim()) {
      alert('Please provide learning outcomes and draft exam questions.');
      return;
    }

    setLoading(true);
    setReport(null);

    const payload = {
      course_name: courseName,
      exam_title: examTitle,
      los: los.split('\n').map(s => s.trim()).filter(Boolean),
      questions: questions.split('\n').map(s => s.trim()).filter(Boolean)
    };

    try {
      const res = await fetch('/api/audit-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');

      setReport(data);
      showToast(`Exam audit complete! Health Index: ${data.quality_index}/100`);

      if (data.quality_index >= 85) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      showToast(err.message || 'Error running audit', true);
    } finally {
      setLoading(false);
    }
  };

  // Human-in-the-Loop AI Action Triggers
  const handleSuggestLOQuestion = async (loText) => {
    try {
      showToast('Generating targeted question for uncovered outcome...');
      const res = await fetch('/api/suggest-lo-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lo_text: loText,
          target_bloom: 'Apply',
          course_name: courseName
        })
      });
      const data = await res.json();
      onOpenSuggestionModal({
        title: `Targeted Question for Outcome`,
        question: data.suggested_question,
        rationale: data.rationale,
        target_bloom: data.target_bloom
      });
    } catch (err) {
      showToast('Failed to generate recommendation', true);
    }
  };

  const handleElevateBloom = async (qText) => {
    try {
      showToast('Elevating rote question to Higher-Order Thinking...');
      const res = await fetch('/api/elevate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: qText,
          target_bloom: 'Analyze'
        })
      });
      const data = await res.json();
      onOpenSuggestionModal({
        title: `Bloom\'s Cognitive Elevation (Rote -> Analyze)`,
        question: data.suggested_question,
        rationale: data.rationale,
        target_bloom: data.target_bloom
      });
    } catch (err) {
      showToast('Failed to elevate question', true);
    }
  };

  const handleGenerateVariant = async (qText, pastMatch) => {
    try {
      showToast('Synthesizing fresh variant for duplicate question...');
      const res = await fetch('/api/generate-variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_question: qText,
          past_question: pastMatch || qText
        })
      });
      const data = await res.json();
      onOpenSuggestionModal({
        title: `Fresh Assessment Variant (Leak Prevention)`,
        question: data.suggested_question,
        rationale: data.rationale,
        target_bloom: 'Apply'
      });
    } catch (err) {
      showToast('Failed to generate variant', true);
    }
  };

  const handleArchiveExam = async () => {
    const qList = questions.split('\n').map(s => s.trim()).filter(Boolean);
    try {
      const res = await fetch('/api/archive-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_name: courseName,
          year: 2026,
          questions: qList
        })
      });
      const data = await res.json();
      showToast(`Archived ${data.added} questions to Department Question Bank!`);
    } catch (err) {
      showToast('Failed to archive questions', true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Presets Bar */}
      <section className="presets-section">
        <div className="presets-header">
          <div className="presets-title">
            <Zap size={16} color="#8b5cf6" />
            <span>Interactive Demo Scenarios for Judges:</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>1-Click preloads real syllabus outcomes &amp; draft questions</span>
        </div>
        <div className="presets-grid">
          <button type="button" className="preset-chip-btn" onClick={() => loadPreset('flawed')}>
            <div className="preset-chip-title">
              <span className="badge badge-rose" style={{ padding: '0.1rem 0.4rem' }}>Live Demo Choice</span>
              <span>🚨 Flawed Draft (CSE220)</span>
            </div>
            <p className="preset-chip-desc">1 Uncovered Outcome, 100% Rote Recall, 1 Question Bank Duplicate</p>
          </button>

          <button type="button" className="preset-chip-btn" onClick={() => loadPreset('balanced')}>
            <div className="preset-chip-title">
              <span className="badge badge-emerald" style={{ padding: '0.1rem 0.4rem' }}>High Rigor</span>
              <span>🌟 Balanced Exam (CSE220)</span>
            </div>
            <p className="preset-chip-desc">100% Outcome Coverage, High Bloom's Diversity, 0 Leaks</p>
          </button>

          <button type="button" className="preset-chip-btn" onClick={() => loadPreset('database')}>
            <div className="preset-chip-title">
              <span className="badge badge-cyan" style={{ padding: '0.1rem 0.4rem' }}>Multi-Topic</span>
              <span>⚡ Database Systems (CSE311)</span>
            </div>
            <p className="preset-chip-desc">BCNF Normalization, Query Trees, ACID Isolation Rubrics</p>
          </button>
        </div>
      </section>

      {/* 2-Column Workspace */}
      <div className="veritas-workspace-grid">
        {/* Left Ingestion Panel */}
        <section className="veritas-panel input-panel-container">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <div className="step-indicator">1</div>
              <div>
                <h2 className="panel-heading">Assessment Ingestion</h2>
                <p className="panel-sub">Paste syllabus outcomes &amp; draft questions</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(255,255,255,0.04)', padding: '0.2rem', borderRadius: '8px' }}>
              <button
                type="button"
                className={`btn-veritas-secondary ${inputMode === 'paste' ? 'active' : ''}`}
                onClick={() => setInputMode('paste')}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem', background: inputMode === 'paste' ? 'rgba(139, 92, 246, 0.25)' : 'transparent', border: 'none' }}
              >
                Text
              </button>
              <button
                type="button"
                className={`btn-veritas-secondary ${inputMode === 'upload' ? 'active' : ''}`}
                onClick={() => setInputMode('upload')}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem', background: inputMode === 'upload' ? 'rgba(139, 92, 246, 0.25)' : 'transparent', border: 'none' }}
              >
                Upload File
              </button>
            </div>
          </div>

          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Course Code &amp; Title</label>
                <input
                  type="text"
                  className="veritas-input"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. CSE220 Data Structures"
                />
              </div>
              <div>
                <label className="form-label">Exam Title / Version</label>
                <input
                  type="text"
                  className="veritas-input"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="e.g. Midterm Exam 2026"
                />
              </div>
            </div>

            {inputMode === 'paste' ? (
              <>
                <div>
                  <div className="form-label">
                    <span>Course Learning Outcomes (COs / LOs)</span>
                    <span className="badge badge-violet">{loCount} Outcome{loCount !== 1 ? 's' : ''}</span>
                  </div>
                  <textarea
                    className="veritas-textarea"
                    rows={4}
                    value={los}
                    onChange={(e) => setLos(e.target.value)}
                    placeholder="LO1: Understand pointers and memory allocation tradeoffs..."
                  />
                </div>

                <div>
                  <div className="form-label">
                    <span>Draft Exam Questions (1 per line or numbered)</span>
                    <span className="badge badge-cyan">{qCount} Question{qCount !== 1 ? 's' : ''}</span>
                  </div>
                  <textarea
                    className="veritas-textarea"
                    rows={6}
                    value={questions}
                    onChange={(e) => setQuestions(e.target.value)}
                    placeholder="Q1. Define what a singly linked list is...\nQ2. Implement Dijkstra..."
                  />
                </div>
              </>
            ) : (
              <label className="veritas-dropzone">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setUploadFile(file);
                      showToast(`Selected ${file.name}`);
                    }
                  }}
                />
                <Upload size={32} color="#06b6d4" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                  {uploadFile ? uploadFile.name : 'Drag & drop draft exam file here, or browse'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Supports PDF, DOCX, Markdown, Text
                </div>
              </label>
            )}

            <button
              type="button"
              className="btn-veritas-primary"
              disabled={loading}
              onClick={runAudit}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              <Sparkles size={18} />
              <span>{loading ? 'Scanning Assessment Dimensions...' : '🚀 Analyze Exam Quality (AI Audit)'}</span>
            </button>
          </div>
        </section>

        {/* Right Output Panel */}
        <section className="veritas-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <div className="step-indicator" style={{ background: 'linear-gradient(135deg, #06b6d4, #10b981)' }}>2</div>
              <div>
                <h2 className="panel-heading">Audit Telemetry &amp; Rubrics</h2>
                <p className="panel-sub">OBE coverage, cognitive rigor, duplicate leak radar &amp; TA rubric</p>
              </div>
            </div>
            {report && (
              <button
                type="button"
                className="btn-veritas-secondary"
                onClick={handleArchiveExam}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
              >
                <Award size={14} color="#10b981" />
                <span>Archive to Bank</span>
              </button>
            )}
          </div>

          <div className="panel-body">
            {!report ? (
              <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: '#64748b' }}>
                <ShieldCheck size={48} color="#475569" style={{ margin: '0 auto 1rem', display: 'block' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem' }}>
                  Awaiting Assessment Ingestion
                </h3>
                <p style={{ fontSize: '0.84rem', maxWidth: '420px', margin: '0 auto' }}>
                  Click <strong>🚨 Flawed Draft Exam</strong> preset or input your course outcomes to generate a multi-dimensional curriculum audit.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                {/* Circular Health Gauge & KPI Summary */}
                <div className="health-score-banner">
                  <div className="score-gauge-wrapper">
                    <svg className="gauge-svg" width="90" height="90" viewBox="0 0 90 90">
                      <circle className="gauge-bg-circle" cx="45" cy="45" r="38" />
                      <circle
                        className="gauge-fill-circle"
                        cx="45"
                        cy="45"
                        r="38"
                        stroke={report.quality_index >= 80 ? '#10b981' : report.quality_index >= 60 ? '#f59e0b' : '#f43f5e'}
                        strokeDasharray={238.76}
                        strokeDashoffset={238.76 - (238.76 * report.quality_index) / 100}
                      />
                    </svg>
                    <div className="gauge-score-text">
                      <span>{report.quality_index}</span>
                      <span className="gauge-score-label">Score</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${report.quality_index >= 80 ? 'badge-emerald' : report.quality_index >= 60 ? 'badge-amber' : 'badge-rose'}`}>
                        {report.quality_index >= 80 ? '🌟 High Assessment Quality' : report.quality_index >= 60 ? '⚠️ Moderate Gaps Found' : '🚨 Critical Imbalance'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                      {report.executive_summary || 'Multi-dimensional analysis complete across all course outcomes.'}
                    </p>
                  </div>
                </div>

                {/* KPI 4 Cards */}
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <span className="kpi-label">Outcome Coverage</span>
                    <span className="kpi-value" style={{ color: report.coverage_percentage >= 90 ? '#34d399' : '#f87171' }}>
                      {report.coverage_percentage}%
                    </span>
                    <span className="kpi-sub">{report.uncovered_los?.length || 0} uncovered</span>
                  </div>

                  <div className="kpi-card">
                    <span className="kpi-label">Higher-Order Rigor</span>
                    <span className="kpi-value" style={{ color: '#67e8f9' }}>
                      {report.higher_order_percentage}%
                    </span>
                    <span className="kpi-sub">Apply / Analyze / Create</span>
                  </div>

                  <div className="kpi-card">
                    <span className="kpi-label">Question Bank Leaks</span>
                    <span className="kpi-value" style={{ color: report.max_similarity_score > 65 ? '#f87171' : '#34d399' }}>
                      {report.flagged_duplicates?.length || 0}
                    </span>
                    <span className="kpi-sub">Peak overlap: {report.max_similarity_score}%</span>
                  </div>

                  <div className="kpi-card">
                    <span className="kpi-label">TA Rubric Ready</span>
                    <span className="kpi-value" style={{ color: '#c4b5fd' }}>
                      {report.rubrics?.length || 0} Qs
                    </span>
                    <span className="kpi-sub">Normalized criteria</span>
                  </div>
                </div>

                {/* Dimension 1: OBE Outcome Alignment */}
                <div className="result-card-section">
                  <div className="section-head">
                    <h3 className="section-title">
                      <Layers size={18} color="#8b5cf6" />
                      <span>1. Outcome-Based Education (OBE) Mapping</span>
                    </h3>
                    <span className="badge badge-violet">{report.coverage_percentage}% Aligned</span>
                  </div>

                  {report.uncovered_los && report.uncovered_los.length > 0 && (
                    <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', padding: '0.85rem' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fca5a5', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <AlertTriangle size={15} />
                        <span>Uncovered Course Outcomes Detected:</span>
                      </div>
                      {report.uncovered_los.map((ulo, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', marginTop: '0.4rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{ulo}</span>
                          <button
                            type="button"
                            className="btn-veritas-ghost"
                            onClick={() => handleSuggestLOQuestion(ulo)}
                          >
                            <Sparkles size={13} />
                            <span>AI Draft Question</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {report.question_mappings?.map((qm, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '0.6rem 0.8rem', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#e2e8f0' }}><strong>{qm.question_label || `Q${idx+1}`}:</strong> {qm.question_snippet}</span>
                        <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>{qm.mapped_lo || 'LO Matched'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dimension 2: Bloom's Cognitive Diversity */}
                <div className="result-card-section">
                  <div className="section-head">
                    <h3 className="section-title">
                      <Flame size={18} color="#f59e0b" />
                      <span>2. Bloom's Taxonomy Cognitive Diversity</span>
                    </h3>
                    <span className="badge badge-amber">{report.blooms_diversity_score || 'Balanced'}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {report.blooms_classification?.map((bc, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontSize: '0.82rem', color: '#f8fafc' }}><strong>{bc.question_label}:</strong> {bc.question_text}</span>
                          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{bc.rationale}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span className={`badge ${['Remember', 'Understand'].includes(bc.bloom_level) ? 'badge-rose' : 'badge-emerald'}`}>
                            {bc.bloom_level}
                          </span>
                          {['Remember', 'Understand'].includes(bc.bloom_level) && (
                            <button
                              type="button"
                              className="btn-veritas-ghost"
                              onClick={() => handleElevateBloom(bc.question_text)}
                              title="Elevate to higher cognitive tier"
                            >
                              <ArrowUpRight size={14} />
                              <span>Elevate</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dimension 3: Duplicate & Leak Radar */}
                <div className="result-card-section">
                  <div className="section-head">
                    <h3 className="section-title">
                      <ShieldCheck size={18} color="#06b6d4" />
                      <span>3. Historical Question Bank Similarity &amp; Leak Radar</span>
                    </h3>
                    <span className={`badge ${report.max_similarity_score > 65 ? 'badge-rose' : 'badge-emerald'}`}>
                      Max {report.max_similarity_score}% Overlap
                    </span>
                  </div>

                  {report.flagged_duplicates && report.flagged_duplicates.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {report.flagged_duplicates.map((dup, idx) => (
                        <div key={idx} style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', padding: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fca5a5' }}>
                              🚨 High Similarity to Past Exam ({dup.matched_year || 2024} {dup.matched_course || ''}) — {dup.similarity_score}% Match
                            </span>
                            <button
                              type="button"
                              className="btn-veritas-ghost"
                              onClick={() => handleGenerateVariant(dup.current_question, dup.past_question)}
                            >
                              <Sparkles size={13} />
                              <span>AI Fresh Variant</span>
                            </button>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: '#e2e8f0', marginBottom: '0.2rem' }}><strong>Current Question:</strong> {dup.current_question}</p>
                          <p style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}><strong>Past Exam Match:</strong> "{dup.past_question}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.84rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={16} />
                      <span>Zero high-similarity historical exam duplicates detected. Exam paper is leak-safe!</span>
                    </div>
                  )}
                </div>

                {/* Dimension 4: Standardized Multi-TA Grading Rubric */}
                <div className="result-card-section">
                  <div className="section-head">
                    <h3 className="section-title">
                      <Award size={18} color="#10b981" />
                      <span>4. Standardized Inter-Grader Rubrics (Multi-TA Consistency)</span>
                    </h3>
                    <button
                      type="button"
                      className="btn-veritas-secondary"
                      onClick={() => window.print()}
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem' }}
                    >
                      <Printer size={13} />
                      <span>Print TA Sheet</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {report.rubrics?.map((r, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc' }}>{r.question_label} ({r.total_marks || '10'} Marks)</span>
                          <span className="badge badge-emerald">Standardized Scheme</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>{r.question_snippet}</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {r.criteria?.map((crit, cIdx) => (
                            <div key={cIdx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.65rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                              <span style={{ color: '#e2e8f0' }}>{crit.criterion}</span>
                              <span style={{ color: '#34d399', textAlign: 'right', fontWeight: 700 }}>{crit.marks_allocated}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
