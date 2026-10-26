import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Camera,
  BookOpen,
  History,
  HelpCircle,
  Settings,
  Hand,
  ShieldCheck,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cameraActive: boolean;
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/recognition', label: 'Live Recognition', icon: Camera },
  { to: '/signs', label: 'Supported Signs', icon: BookOpen },
  { to: '/history', label: 'History', icon: History },
  { to: '/how-it-works', label: 'How It Works', icon: HelpCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, cameraActive }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        id="sidebar"
        aria-label="Main navigation"
        className={`
          fixed top-0 left-0 h-full z-40
          w-64 bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 pt-6 pb-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm">
              <Hand className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <span className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight">
                SignBridge
              </span>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none mt-0.5">
                ISL Recognition
              </p>
            </div>
          </div>
          <button
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Sidebar navigation">
          <ul className="space-y-0.5" role="list">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                      ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                      }`
                    }
                    aria-label={item.label}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-brand-600 dark:text-brand-400'
                              : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                          }`}
                          aria-hidden="true"
                        />
                        {item.label}
                        {item.to === '/recognition' && cameraActive && (
                          <span className="ml-auto flex h-2 w-2" aria-label="Camera active">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom status */}
        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
              On-device recognition
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 px-1">
            <ShieldCheck className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>{cameraActive ? 'Camera in use · local only' : 'Camera inactive'}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
