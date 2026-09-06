import React, { useState, useEffect } from 'react';
import { Database, Search, X, Plus, Upload, Trash2, FileUp, CheckCircle } from 'lucide-react';

export default function QuestionBankModal({ isOpen, onClose, showToast }) {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // New Question Form
  const [newCourse, setNewCourse] = useState('');
  const [newYear, setNewYear] = useState('2026');
  const [newText, setNewText] = useState('');
  const [addMode, setAddMode] = useState('text'); // 'text' | 'upload'
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchBank = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/question-bank');
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBank();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const courses = Array.from(new Set(questions.map(q => q.course || 'General'))).filter(Boolean);

  const filtered = questions.filter(q => {
    const matchSearch = search ? (q.text || '').toLowerCase().includes(search.toLowerCase()) || (q.course || '').toLowerCase().includes(search.toLowerCase()) : true;
    const matchCourse = courseFilter ? (q.course || '') === courseFilter : true;
    return matchSearch && matchCourse;
  });

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      const res = await fetch('/api/question-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course: newCourse.trim() || 'Academic Course',
          year: parseInt(newYear, 10) || 2026,
          text: newText.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setNewText('');
        showToast('Question added to bank!');
        fetchBank();
      }
    } catch (err) {
      showToast('Failed to add question', true);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/question-bank/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Question removed from bank');
        fetchBank();
      }
    } catch (err) {
      showToast('Failed to delete question', true);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('course', newCourse.trim() || 'Academic Course');
    formData.append('year', newYear || '2026');

    try {
      const res = await fetch('/api/question-bank/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Extracted & added ${data.added} questions!`);
        setUploadFile(null);
        fetchBank();
      } else {
        showToast(data.error || 'Upload failed', true);
      }
    } catch (err) {
      showToast('Error uploading document', true);
    } finally {
      setUploading(false);
    }
  };

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
        maxWidth: '900px',
        height: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '0.45rem', borderRadius: '8px' }}>
              <Database size={20} color="#8b5cf6" />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                Department Historical Question Bank
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{questions.length} archived assessment questions for leak &amp; duplicate prevention</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body 2 Columns: Add form & Questions list */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', flex: 1, overflow: 'hidden' }}>
          {/* Left: Add questions */}
          <div style={{ padding: '1.25rem', borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(6, 9, 22, 0.5)' }}>
            <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(255,255,255,0.04)', padding: '0.2rem', borderRadius: '8px' }}>
              <button
                type="button"
                className={`btn-veritas-secondary ${addMode === 'text' ? 'active' : ''}`}
                onClick={() => setAddMode('text')}
                style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.76rem', justifyContent: 'center', background: addMode === 'text' ? 'rgba(139, 92, 246, 0.25)' : 'transparent', border: 'none' }}
              >
                Text Entry
              </button>
              <button
                type="button"
                className={`btn-veritas-secondary ${addMode === 'upload' ? 'active' : ''}`}
                onClick={() => setAddMode('upload')}
                style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.76rem', justifyContent: 'center', background: addMode === 'upload' ? 'rgba(139, 92, 246, 0.25)' : 'transparent', border: 'none' }}
              >
                Doc Upload
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="veritas-input"
                placeholder="Course (e.g. CSE220)"
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                style={{ flex: 2, padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}
              />
              <input
                type="number"
                className="veritas-input"
                placeholder="Year"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}
              />
            </div>

            {addMode === 'text' ? (
              <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                <textarea
                  className="veritas-textarea"
                  placeholder="Paste single question here to add to bank..."
                  rows={6}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  style={{ flex: 1, fontSize: '0.82rem' }}
                />
                <button type="submit" className="btn-veritas-primary" style={{ padding: '0.65rem' }}>
                  <Plus size={16} />
                  <span>Add Question</span>
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                <label className="veritas-dropzone" style={{ padding: '1.5rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    style={{ display: 'none' }}
                    onChange={(e) => setUploadFile(e.target.files[0])}
                  />
                  <FileUp size={24} color="#06b6d4" style={{ marginBottom: '0.4rem' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>
                    {uploadFile ? uploadFile.name : 'Select PDF / DOCX / TXT'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Questions parsed automatically
                  </span>
                </label>
                <button
                  type="button"
                  className="btn-veritas-primary"
                  disabled={!uploadFile || uploading}
                  onClick={handleFileUpload}
                  style={{ padding: '0.65rem' }}
                >
                  <Upload size={16} />
                  <span>{uploading ? 'Extracting Questions...' : 'Upload & Extract'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Search & Questions List */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Filter Bar */}
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(255, 255, 255, 0.01)' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  className="veritas-input"
                  placeholder="Search questions in bank..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '32px', padding: '0.5rem 0.75rem 0.5rem 32px', fontSize: '0.82rem' }}
                />
              </div>
              <select
                className="veritas-select"
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                style={{ width: '160px', padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}
              >
                <option value="">All Courses</option>
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="badge badge-violet">{filtered.length} Items</span>
            </div>

            {/* List */}
            <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem 1rem' }}>
                  No questions match your filter.
                </div>
              ) : (
                filtered.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{q.course || 'Course'}</span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{q.year || '2026'}</span>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.45 }}>{q.text}</p>
                    </div>
                    {q.id && (
                      <button
                        type="button"
                        onClick={() => handleDelete(q.id)}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.2rem' }}
                        title="Delete question"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
