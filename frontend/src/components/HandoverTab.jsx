import React, { useState } from 'react';
import {
  FileText, Sparkles, Download, Printer, Copy, Check, Zap, AlertCircle, BookOpen, Clock, Target
} from 'lucide-react';

const HANDOVER_PRESETS = {
  cse220: {
    course: "CSE220: Data Structures & Algorithms",
    term: "Spring 2027",
    outcomes: "LO1: Understand foundational data structures, pointers, and memory layout tradeoffs\nLO2: Implement and evaluate asymptotic complexity of sorting and searching algorithms\nLO3: Apply balanced search trees, priority queues, and hashing to solve real-world problems\nLO4: Design graph traversal and shortest-path algorithms for network applications",
    topics: "Module 1: Pointer arithmetic, dynamic memory, struct alignment\nModule 2: Linked Lists (singly, doubly, circular, sentinel nodes)\nModule 3: Stacks & Queues (expression evaluation)\nModule 4: Recursion & Backtracking (tree traversal, N-Queens)\nModule 5: Trees (BST, AVL balancing rotations, Heaps & Priority Queues)\nModule 6: Graphs (BFS/DFS, Dijkstra, Prim/Kruskal MST)\nModule 7: Hashing (Chaining, Open Addressing, Linear/Quadratic Probing)",
    past_questions: "1. Trace memory allocation and show stack/heap pointers after deleting the second node in a doubly linked list.\n2. Prove the asymptotic runtime of AVL self-balancing after inserting keys [14, 17, 11, 7, 53, 4] using recurrence relations.\n3. Implement Dijkstra's algorithm using a min-heap priority queue and explain time complexity.\n4. Explain why open addressing with linear probing causes primary clustering.",
    grade_avg: "72%",
    grade_min: "38%",
    grade_max: "98%",
    grade_pass: "84%",
    notes: "Students consistently stumble with pointer manipulation and segfaults in linked lists during the first midterm. Make sure to teach box-and-pointer memory tracing explicitly in class. Recursion trees also cause panic — emphasize Master Theorem early. Skip advanced binomial heaps as they never get tested well. TAs grade Big-O proofs too harshly, so ensure you distribute an exact partial credit key for O(N log N) vs O(N^2) brute force."
  },
  cse311: {
    course: "CSE311: Database Management Systems",
    term: "Spring 2027",
    outcomes: "LO1: Design conceptual entity-relationship diagrams and translate to relational schemas\nLO2: Apply relational algebra and normal forms (1NF through BCNF) for dependency preservation\nLO3: Write optimized SQL queries, transactions, and index structures (B+ Trees)\nLO4: Evaluate ACID properties, two-phase locking (2PL), and crash recovery protocols",
    topics: "Module 1: Relational Model & Relational Algebra\nModule 2: ER Diagrams & Schema Mapping\nModule 3: Functional Dependencies & Normalization (3NF/BCNF)\nModule 4: SQL & Query Execution Trees\nModule 5: Storage & B+ Tree Indexing\nModule 6: Transaction Processing & ACID Guarantees\nModule 7: Concurrency Control (2PL, Strict 2PL, Deadlock Detection)",
    past_questions: "1. Given relation R(A,B,C,D,E) with FDs {A->B, BC->D, D->E}, decompose R into BCNF. Is the decomposition dependency-preserving?\n2. Convert SQL query with sub-select into canonical relational algebra tree and apply heuristic push-down optimization.\n3. Draw the B+ tree resulting from deleting key 45 from the given order-4 tree.\n4. Show a schedule that is conflict serializable but not recoverable under basic two-phase locking.",
    grade_avg: "75%",
    grade_min: "44%",
    grade_max: "96%",
    grade_pass: "88%",
    notes: "BCNF decomposition questions cause 60% of exam mark losses — emphasize closure computation algorithms step-by-step. Query optimization trees test very well and students enjoy visual relational algebra. Warning: in project grading, TAs often overlook transaction rollback handling in PHP/Node.js submissions; mandate a standardized testing script."
  }
};

export default function HandoverTab({ showToast }) {
  const [course, setCourse] = useState(HANDOVER_PRESETS.cse220.course);
  const [term, setTerm] = useState(HANDOVER_PRESETS.cse220.term);
  const [outcomes, setOutcomes] = useState(HANDOVER_PRESETS.cse220.outcomes);
  const [topics, setTopics] = useState(HANDOVER_PRESETS.cse220.topics);
  const [pastQuestions, setPastQuestions] = useState(HANDOVER_PRESETS.cse220.past_questions);
  const [avgGrade, setAvgGrade] = useState(HANDOVER_PRESETS.cse220.grade_avg);
  const [minGrade, setMinGrade] = useState(HANDOVER_PRESETS.cse220.grade_min);
  const [maxGrade, setMaxGrade] = useState(HANDOVER_PRESETS.cse220.grade_max);
  const [passRate, setPassRate] = useState(HANDOVER_PRESETS.cse220.grade_pass);
  const [notes, setNotes] = useState(HANDOVER_PRESETS.cse220.notes);

  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState(null);

  const loadPreset = (key) => {
    const p = HANDOVER_PRESETS[key];
    if (!p) return;
    setCourse(p.course);
    setTerm(p.term);
    setOutcomes(p.outcomes);
    setTopics(p.topics);
    setPastQuestions(p.past_questions);
    setAvgGrade(p.grade_avg);
    setMinGrade(p.grade_min);
    setMaxGrade(p.grade_max);
    setPassRate(p.grade_pass);
    setNotes(p.notes);
    showToast(`Loaded handover preset: ${p.course}`);
  };

  const generateBrief = async () => {
    if (!course.trim()) {
      alert('Please enter course code and title.');
      return;
    }

    setLoading(true);
    setBrief(null);

    const payload = {
      course_name: course,
      course_code: course.split(':')[0].trim(),
      term,
      outcomes,
      syllabus_topics: topics,
      past_questions: pastQuestions,
      grade_summary: {
        avg: avgGrade,
        min: minGrade,
        max: maxGrade,
        pass_rate: passRate
      },
      instructor_notes: notes
    };

    try {
      const res = await fetch('/api/generate-handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to synthesize handover');

      setBrief(data);
      showToast('1-Page Faculty Handover Brief Synthesized Successfully!');
    } catch (err) {
      showToast(err.message || 'Error generating brief', true);
    } finally {
      setLoading(false);
    }
  };

  const exportMarkdown = () => {
    if (!brief) return;
    const stats = brief.quick_stats || {};
    const exam = brief.exam_style_notes || {};
    const md = `# Faculty Handover Brief: ${brief.course_name}
**Generated Date:** ${brief.generated_at || 'September 2026'} | **Engine:** ${brief.engine || 'ExamGuard AI'}

---

## 1. Course Overview & Curriculum Role
${brief.course_overview}

**Role in Curriculum:**
${brief.curriculum_role || 'Core departmental prerequisite.'}

- **Estimated Rigor:** ${stats.estimated_rigor || 'High'}
- **Theory vs Coding Ratio:** ${stats.math_vs_coding_ratio || '35% Math / 65% Code'}
- **Recommended Quiz Cadence:** ${stats.recommended_quiz_frequency || 'Bi-Weekly'}

---

## 2. Historically Tricky Topics & Student Pitfalls
${(brief.tricky_topics || []).map(t => `### ⚠️ ${t.topic} (${t.difficulty_level || 'High'} Difficulty)\n- **Student Pitfall:** ${t.pitfall}\n- **Historical Evidence:** ${t.evidence}`).join('\n\n')}

---

## 3. Exam Style & Cognitive Culture
- **Bloom's Cognitive Distribution:** ${exam.blooms_distribution || 'N/A'}
- **Typical Exam Format:** ${exam.typical_format || 'N/A'}
- **Common Question Archetypes:** ${exam.common_question_types || 'N/A'}
- **TA Grading Consistency Warning:** ${exam.grading_pitfalls || 'N/A'}

---

## 4. Suggested Focus Areas for Incoming Faculty
${(brief.suggested_focus || []).map(f => `### 🎯 ${f.title} [${f.timing || 'Semester'}]\n${f.advice}`).join('\n\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(brief.course_code || 'course').toLowerCase()}_handover_brief.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded handover brief as Markdown file!');
  };

  const copyBrief = () => {
    if (!brief) return;
    exportMarkdown();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Presets Bar */}
      <section className="presets-section">
        <div className="presets-header">
          <div className="presets-title">
            <Zap size={16} color="#8b5cf6" />
            <span>Faculty Transition Presets:</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Preload real course context, exam styles &amp; informal advice</span>
        </div>
        <div className="presets-grid">
          <button type="button" className="preset-chip-btn" onClick={() => loadPreset('cse220')}>
            <div className="preset-chip-title">
              <span className="badge badge-emerald" style={{ padding: '0.1rem 0.4rem' }}>Core Gateway</span>
              <span>🌟 CSE220 Data Structures &amp; Algorithms</span>
            </div>
            <p className="preset-chip-desc">Memory leaks, recursion proofs, O(N log N) partial credit rules</p>
          </button>

          <button type="button" className="preset-chip-btn" onClick={() => loadPreset('cse311')}>
            <div className="preset-chip-title">
              <span className="badge badge-cyan" style={{ padding: '0.1rem 0.4rem' }}>Systems Course</span>
              <span>⚡ CSE311 Database Systems</span>
            </div>
            <p className="preset-chip-desc">BCNF decomposition, query execution trees, ACID isolation pitfalls</p>
          </button>

          <button
            type="button"
            className="preset-chip-btn"
            onClick={() => {
              setCourse('');
              setOutcomes('');
              setTopics('');
              setPastQuestions('');
              setNotes('');
              setBrief(null);
              showToast('Cleared handover form.');
            }}
          >
            <div className="preset-chip-title">
              <span className="badge badge-violet" style={{ padding: '0.1rem 0.4rem' }}>Reset</span>
              <span>🧹 Clear Form</span>
            </div>
            <p className="preset-chip-desc">Enter a new course from scratch</p>
          </button>
        </div>
      </section>

      {/* 2-Column Grid */}
      <div className="veritas-workspace-grid">
        {/* Left Form */}
        <section className="veritas-panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <div className="step-indicator">1</div>
              <div>
                <h2 className="panel-heading">Course Historical Context</h2>
                <p className="panel-sub">Syllabus, exam patterns &amp; hallway advice</p>
              </div>
            </div>
          </div>

          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Course Code &amp; Title</label>
                <input
                  type="text"
                  className="veritas-input"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. CSE220 Data Structures"
                />
              </div>
              <div>
                <label className="form-label">Target Term</label>
                <input
                  type="text"
                  className="veritas-input"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="e.g. Spring 2027"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Course Learning Outcomes (COs / LOs)</label>
              <textarea
                className="veritas-textarea"
                rows={3}
                value={outcomes}
                onChange={(e) => setOutcomes(e.target.value)}
                placeholder="LO1: Understand foundational data structures..."
              />
            </div>

            <div>
              <label className="form-label">Syllabus Topics Covered</label>
              <textarea
                className="veritas-textarea"
                rows={3}
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="Module 1: Pointer arithmetic, dynamic memory..."
              />
            </div>

            <div>
              <label className="form-label">Past Exam Questions / Samples</label>
              <textarea
                className="veritas-textarea"
                rows={3}
                value={pastQuestions}
                onChange={(e) => setPastQuestions(e.target.value)}
                placeholder="1. Trace memory allocation and show stack/heap pointers..."
              />
            </div>

            <div>
              <label className="form-label">Past Grade Distribution Summary</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                <input type="text" className="veritas-input" placeholder="Avg: 72%" value={avgGrade} onChange={(e) => setAvgGrade(e.target.value)} />
                <input type="text" className="veritas-input" placeholder="Min: 38%" value={minGrade} onChange={(e) => setMinGrade(e.target.value)} />
                <input type="text" className="veritas-input" placeholder="Max: 98%" value={maxGrade} onChange={(e) => setMaxGrade(e.target.value)} />
                <input type="text" className="veritas-input" placeholder="Pass: 84%" value={passRate} onChange={(e) => setPassRate(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="form-label">
                <span>Outgoing Instructor's Informal Hallway Notes</span>
                <span className="badge badge-amber">High Impact</span>
              </label>
              <textarea
                className="veritas-textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Students always struggle with pointer manipulation in recursion. Skip topic X..."
              />
            </div>

            <button
              type="button"
              className="btn-veritas-primary"
              disabled={loading}
              onClick={generateBrief}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              <Sparkles size={18} />
              <span>{loading ? 'Synthesizing Faculty Brief...' : '✨ Synthesize 1-Page Handover Brief'}</span>
            </button>
          </div>
        </section>

        {/* Right Output Document */}
        <section className="veritas-panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <div className="step-indicator" style={{ background: 'linear-gradient(135deg, #06b6d4, #10b981)' }}>2</div>
              <div>
                <h2 className="panel-heading">Synthesized Handover Brief</h2>
                <p className="panel-sub">1-Page transition document for incoming instructors</p>
              </div>
            </div>
            {brief && (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button type="button" className="btn-veritas-secondary" onClick={exportMarkdown} style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem' }}>
                  <Download size={13} />
                  <span>Export .md</span>
                </button>
                <button type="button" className="btn-veritas-secondary" onClick={() => window.print()} style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem' }}>
                  <Printer size={13} />
                  <span>Print PDF</span>
                </button>
              </div>
            )}
          </div>

          <div className="panel-body">
            {!brief ? (
              <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: '#64748b' }}>
                <FileText size={48} color="#475569" style={{ margin: '0 auto 1rem', display: 'block' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem' }}>
                  Ready to Generate Handover Brief
                </h3>
                <p style={{ fontSize: '0.84rem', maxWidth: '420px', margin: '0 auto' }}>
                  Select a preset like <strong>🌟 CSE220 Data Structures</strong> or fill out the historical syllabus data to produce an actionable 2-minute handover brief.
                </p>
              </div>
            ) : (
              <div className="handover-paper">
                {/* Header */}
                <div className="handover-header-box">
                  <div>
                    <span className="badge badge-emerald" style={{ marginBottom: '0.4rem' }}>Official Faculty Transition Document</span>
                    <h1 className="handover-title">{brief.course_name}</h1>
                    <p style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
                      Instructional Continuity &amp; Assessment Culture Brief &bull; {term || 'Upcoming Semester'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                    <span className="badge badge-violet">{brief.engine || 'AI Synthesized'}</span>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{brief.generated_at || 'September 2026'}</span>
                  </div>
                </div>

                {/* Quick Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1.1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Course Rigor Profile</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>{brief.quick_stats?.estimated_rigor || 'High (Core Gateway)'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Theory vs Coding</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#67e8f9' }}>{brief.quick_stats?.math_vs_coding_ratio || '35% Math / 65% Code'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Recommended Quizzes</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#34d399' }}>{brief.quick_stats?.recommended_quiz_frequency || 'Bi-Weekly'}</div>
                  </div>
                </div>

                {/* Section 1: Overview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    <div style={{ width: '22px', height: '22px', background: '#7c3aed', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>1</div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>Course Overview &amp; Curriculum Role</h3>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>{brief.course_overview}</p>
                  <div style={{ background: 'rgba(6, 182, 212, 0.08)', borderLeft: '3px solid #06b6d4', padding: '0.6rem 0.85rem', borderRadius: '4px', fontSize: '0.82rem', color: '#67e8f9' }}>
                    <strong>Role in Curriculum:</strong> {brief.curriculum_role || 'Core departmental prerequisite.'}
                  </div>
                </div>

                {/* Section 2: Tricky Topics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    <div style={{ width: '22px', height: '22px', background: '#f59e0b', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>2</div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>Historically Tricky Topics &amp; Student Pitfalls</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {brief.tricky_topics?.map((t, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderLeft: '4px solid #f59e0b', borderRadius: '8px', padding: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>⚠️ {t.topic}</strong>
                          <span className={`badge ${t.difficulty_level?.toLowerCase().includes('very') ? 'badge-rose' : 'badge-amber'}`}>{t.difficulty_level || 'High'} Difficulty</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.35rem' }}><strong>Common Student Pitfall:</strong> {t.pitfall}</p>
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '0.35rem 0.65rem', borderRadius: '4px', fontStyle: 'italic' }}>
                          <strong>Historical Evidence:</strong> {t.evidence}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Exam Style */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    <div style={{ width: '22px', height: '22px', background: '#06b6d4', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>3</div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>Exam Style &amp; Cognitive Culture</h3>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.84rem' }}>
                    <div><strong style={{ color: '#94a3b8' }}>Cognitive Distribution:</strong> <span style={{ color: '#f8fafc' }}>{brief.exam_style_notes?.blooms_distribution || '40% Apply, 35% Analyze, 25% Remember'}</span></div>
                    <div><strong style={{ color: '#94a3b8' }}>Typical Exam Format:</strong> <span style={{ color: '#f8fafc' }}>{brief.exam_style_notes?.typical_format || '20% Tracing, 50% Algorithm Design, 30% Code'}</span></div>
                    <div><strong style={{ color: '#94a3b8' }}>Common Question Types:</strong> <span style={{ color: '#f8fafc' }}>{brief.exam_style_notes?.common_question_types || 'Memory diagrams, asymptotic proofs, edge cases'}</span></div>
                    <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '6px', padding: '0.6rem 0.85rem', color: '#fde68a', marginTop: '0.2rem' }}>
                      <strong>⚠️ TA Grading Consistency Warning:</strong> {brief.exam_style_notes?.grading_pitfalls || 'Standardize partial credit rubrics for brute force vs optimal algorithms.'}
                    </div>
                  </div>
                </div>

                {/* Section 4: Focus Areas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    <div style={{ width: '22px', height: '22px', background: '#10b981', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>4</div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>Suggested Focus Areas for Incoming Faculty</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {brief.suggested_focus?.map((f, idx) => (
                      <div key={idx} style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <strong style={{ fontSize: '0.88rem', color: '#c4b5fd' }}>🎯 {f.title}</strong>
                          <span className="badge badge-violet">{f.timing || 'Semester Action'}</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>{f.advice}</p>
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
