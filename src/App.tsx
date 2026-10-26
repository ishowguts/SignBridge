import React, { useState, useCallback, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { LiveRecognition } from './pages/LiveRecognition';
import { SupportedSigns } from './pages/SupportedSigns';
import { HistoryPage } from './pages/History';
import { HowItWorks } from './pages/HowItWorks';
import { SettingsPage } from './pages/Settings';
import { usePreferences } from './hooks/usePreferences';
import { useShortcuts } from './hooks/useShortcuts';
import { Toast, type ToastData } from './components/Toast';
import { ShortcutsDialog } from './components/ShortcutsDialog';
import { historyService } from './services/historyService';
import type { HistoryEntry } from './types/recognition';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'SignBridge — on-device ISL recognition' },
  '/recognition': { title: 'Live Recognition', subtitle: 'Recognize individual ISL signs' },
  '/signs': { title: 'Supported Signs', subtitle: 'The 35 ISL signs the model recognises' },
  '/history': { title: 'Recognition History', subtitle: 'Confirmed and corrected results' },
  '/how-it-works': { title: 'How It Works', subtitle: 'System architecture and pipeline' },
  '/settings': { title: 'Settings', subtitle: 'Appearance, accessibility and privacy' },
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => historyService.getAll());
  const stopCameraRef = useRef<(() => void) | null>(null);

  const { preferences, updatePreference } = usePreferences();

  const location = useLocation();
  const pageInfo = PAGE_TITLES[location.pathname] ?? PAGE_TITLES['/'];

  const handleToggleTheme = useCallback(() => {
    updatePreference('theme', preferences.theme === 'light' ? 'dark' : 'light');
  }, [preferences.theme, updatePreference]);

  const handleHistoryUpdate = useCallback(() => {
    setHistory(historyService.getAll());
  }, []);

  const [toast, setToast] = useState<ToastData | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const navigate = useNavigate();
  const notify = useCallback((t: Omit<ToastData, 'id'>) => setToast({ ...t, id: Date.now() }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  const restoreHistory = useCallback((snapshot: HistoryEntry[]) => {
    historyService.setAll(snapshot);
    setHistory(snapshot);
  }, []);

  // Clearing is reversible for a few seconds via Undo (Golden Rule 6).
  const handleClearHistory = useCallback(() => {
    const snapshot = historyService.getAll();
    historyService.clear();
    setHistory([]);
    notify({ message: `Cleared ${snapshot.length} entries.`, onUndo: () => restoreHistory(snapshot) });
  }, [notify, restoreHistory]);

  const handleDeleteEntry = useCallback(
    (id: string) => {
      const snapshot = historyService.getAll();
      historyService.remove(id);
      setHistory(historyService.getAll());
      notify({ message: 'Entry deleted.', onUndo: () => restoreHistory(snapshot) });
    },
    [notify, restoreHistory]
  );

  useShortcuts(
    {
      '?': () => setShowShortcuts(true),
      u: () => {
        if (toast?.onUndo) {
          toast.onUndo();
          setToast(null);
        }
      },
    },
    preferences.shortcutsEnabled
  );

  const handleUpdateFeedback = useCallback(
    (id: string, feedback: 'correct' | 'incorrect', correctedLabel?: string) => {
      historyService.updateFeedback(id, feedback, correctedLabel);
      setHistory(historyService.getAll());
    },
    []
  );

  const handleStopCamera = useCallback(() => {
    if (stopCameraRef.current) {
      stopCameraRef.current();
    }
  }, []);

  return (
    <div
      className={`flex h-screen bg-[#F7F8FA] dark:bg-gray-950 overflow-hidden ${
        preferences.reducedMotion ? 'motion-reduce' : ''
      }`}
    >
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        cameraActive={cameraActive}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          preferences={preferences}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onToggleTheme={handleToggleTheme}
          onShowShortcuts={() => setShowShortcuts(true)}
        />

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-6"
          aria-label="Main content"
        >
          <Routes>
            <Route path="/" element={<Dashboard history={history} />} />
            <Route
              path="/recognition"
              element={
                <LiveRecognition
                  preferences={preferences}
                  onHistoryUpdate={handleHistoryUpdate}
                  notify={notify}
                  onViewHistory={() => navigate('/history')}
                  onCameraStatusChange={setCameraActive}
                  stopCameraRef={stopCameraRef}
                />
              }
            />
            <Route path="/signs" element={<SupportedSigns shortcutsEnabled={preferences.shortcutsEnabled} />} />
            <Route
              path="/history"
              element={
                <HistoryPage
                  history={history}
                  onClear={handleClearHistory}
                  onDelete={handleDeleteEntry}
                  onUpdateFeedback={handleUpdateFeedback}
                  shortcutsEnabled={preferences.shortcutsEnabled}
                />
              }
            />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route
              path="/settings"
              element={
                <SettingsPage
                  preferences={preferences}
                  onUpdate={updatePreference}
                  cameraActive={cameraActive}
                  onStopCamera={handleStopCamera}
                />
              }
            />
          </Routes>
        </main>
      </div>
      <Toast toast={toast} onDismiss={dismissToast} />
      <ShortcutsDialog open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}

export default App;
