import React from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  BookOpen,
  History,
  ArrowRight,
  Hand,
  Cpu,
  MessageSquare,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { DEMO_SIGNS } from '../data/demoSigns';
import type { HistoryEntry } from '../types/recognition';

interface DashboardProps {
  history: HistoryEntry[];
}

const ProcessStep: React.FC<{ icon: React.ReactNode; title: string; desc: string; simulated?: boolean }> = ({
  icon, title, desc, simulated,
}) => (
  <div className="flex items-start gap-3">
    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${simulated ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-brand-50 dark:bg-brand-900/20'}`}>
      {icon}
    </div>
    <div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</p>
        {simulated && (
          <span className="text-[9px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
            Simulated
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ history }) => {
  const recentSessions = history.slice(0, 3);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-8">
      {/* Prototype Alert */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge variant="info">Research Prototype</StatusBadge>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Recognises 35 static ISL signs (A–Z, 1–9) on your device with MediaPipe hand landmarks and a trained neural network. It is a learning and communication aid, not a certified interpreter.
          </p>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-8 text-white">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10" aria-hidden="true">
          <svg viewBox="0 0 200 200" fill="currentColor">
            <path d="M100 20 L180 60 L180 140 L100 180 L20 140 L20 60 Z" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">
              Communication, made more accessible.
            </h2>
            <p className="text-blue-100 text-sm sm:text-base max-w-lg leading-relaxed">
              Explore real-time recognition of supported Indian Sign Language signs through a simple camera-based interface.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link to="/recognition">
                <Button
                  variant="secondary"
                  size="lg"
                  icon={<Camera className="w-5 h-5" />}
                  id="hero-start-btn"
                  className="!text-brand-700 !border-white/20 !bg-white hover:!bg-blue-50"
                >
                  Start Recognition
                </Button>
              </Link>
              <Link to="/signs">
                <Button
                  variant="ghost"
                  size="lg"
                  icon={<BookOpen className="w-5 h-5" />}
                  id="hero-signs-btn"
                  className="!text-white !border-white/30 border hover:!bg-white/10"
                >
                  Explore Supported Signs
                </Button>
              </Link>
            </div>
          </div>

          {/* SVG Hand illustration */}
          <div className="shrink-0 hidden sm:block" aria-hidden="true">
            <div className="w-32 h-32 lg:w-44 lg:h-44 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <svg viewBox="0 0 120 120" className="w-20 h-20 lg:w-28 lg:h-28 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {/* Stylized hand */}
                <path d="M60 95 L60 45" />
                <path d="M48 95 L48 35 Q48 28 54 28 Q60 28 60 35" />
                <path d="M72 95 L72 35 Q72 28 78 28 Q84 28 84 35 L84 55" />
                <path d="M36 95 L36 45 Q36 38 42 38 Q48 38 48 45" />
                <path d="M84 55 Q92 55 92 63 Q92 71 84 71 L72 71" />
                <path d="M36 65 Q28 65 28 73 Q28 81 36 81 L60 81" />
                <path d="M36 95 Q36 105 48 105 L72 105 Q84 105 84 95" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Signs</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{DEMO_SIGNS.length}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">ISL letters and numbers</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sessions</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{history.length}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Results saved</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Mode</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">On-device ML</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">MediaPipe + MLP, runs in the browser</p>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Recent Activity</h3>
            <Link to="/history" className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">
              View all
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <EmptyState
              icon={<History className="w-8 h-8" />}
              title="No sessions yet"
              description="Recognise and confirm a sign to see it here."
              action={
                <Link to="/recognition">
                  <Button variant="primary" size="sm" id="dashboard-start-btn">
                    Start Recognising
                  </Button>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {recentSessions.map(entry => (
                <li key={entry.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
                    {entry.label.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{entry.label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(entry.timestamp)}</p>
                  </div>
                  <StatusBadge variant={entry.userFeedback === 'correct' ? 'success' : entry.userFeedback === 'incorrect' ? 'error' : 'default'}>
                    {entry.userFeedback ?? 'pending'}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* How it works */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">How SignBridge Works</h3>
            <Link to="/how-it-works" className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium flex items-center gap-1">
              Full details <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
          <div className="p-5 space-y-4">
            <ProcessStep
              icon={<Camera className="w-5 h-5 text-brand-600 dark:text-brand-400" />}
              title="Capture"
              desc="The user positions their hand clearly in the camera frame."
            />
            <div className="h-px bg-gray-50 dark:bg-gray-800 ml-13" />
            <ProcessStep
              icon={<Cpu className="w-5 h-5 text-amber-500" />}
              title="Recognize"
              desc="MediaPipe finds 21 landmarks per hand; a neural network classifies the hand shape."
            />
            <div className="h-px bg-gray-50 dark:bg-gray-800 ml-13" />
            <ProcessStep
              icon={<MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />}
              title="Communicate"
              desc="The predicted letter or number is shown as text and speech for the user to confirm or correct."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
