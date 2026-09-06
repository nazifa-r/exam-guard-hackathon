import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import TabBar from './components/TabBar';
import AuditTab from './components/AuditTab';
import DeadlineTab from './components/DeadlineTab';
import HandoverTab from './components/HandoverTab';
import SuggestionModal from './components/SuggestionModal';
import QuestionBankModal from './components/QuestionBankModal';
import Toast from './components/Toast';

export default function App() {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'deadline' | 'handover'
  const [engineStatus, setEngineStatus] = useState({ configured: true, model: 'Gemini 3.7 Flash' });
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [suggestionModal, setSuggestionModal] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        setEngineStatus({
          configured: data.gemini_configured,
          model: data.model || 'Gemini 3.7 Flash'
        });
      })
      .catch(() => {
        setEngineStatus({ configured: false, model: 'Simulation Engine' });
      });
  }, []);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3800);
  };

  const handleApplySuggestion = (questionText) => {
    // Append or notify
    showToast('Appended AI question to assessment!');
    setSuggestionModal(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        engineStatus={engineStatus}
        onOpenBank={() => setIsBankOpen(true)}
      />

      <TabBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      <main className="veritas-main">
        <HeroBanner />

        {activeTab === 'audit' && (
          <AuditTab
            onOpenSuggestionModal={(data) => setSuggestionModal(data)}
            showToast={showToast}
          />
        )}

        {activeTab === 'deadline' && (
          <DeadlineTab
            showToast={showToast}
          />
        )}

        {activeTab === 'handover' && (
          <HandoverTab
            showToast={showToast}
          />
        )}
      </main>



      {/* Modals & Overlays */}
      <SuggestionModal
        modalData={suggestionModal}
        onClose={() => setSuggestionModal(null)}
        onApply={handleApplySuggestion}
      />

      <QuestionBankModal
        isOpen={isBankOpen}
        onClose={() => setIsBankOpen(false)}
        showToast={showToast}
      />

      <Toast toast={toast} />
    </div>
  );
}
