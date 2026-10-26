import React from 'react';
import { Sun, Moon, Type, Zap, Volume2, CheckSquare, ShieldCheck, Square, Keyboard } from 'lucide-react';
import type { AppPreferences } from '../types/recognition';

interface SettingsPageProps {
  preferences: AppPreferences;
  onUpdate: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void;
  cameraActive: boolean;
  onStopCamera?: () => void;
}

const SettingSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
    </div>
    <div className="divide-y divide-gray-50 dark:divide-gray-800">
      {children}
    </div>
  </section>
);

const SettingRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  control: React.ReactNode;
  id: string;
}> = ({ icon, label, description, control, id }) => (
  <div className="flex items-center justify-between px-5 py-4 gap-4">
    <div className="flex items-start gap-3 flex-1">
      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <label htmlFor={id} className="text-sm font-medium text-gray-800 dark:text-gray-200 block">
          {label}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
    <div className="shrink-0">{control}</div>
  </div>
);

const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
  label: string;
}> = ({ checked, onChange, id, label }) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    id={id}
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
      checked ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'
    }`}
  >
    <span
      aria-hidden="true"
      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

const RadioGroup: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  name: string;
}> = ({ options, value, onChange, name }) => (
  <div className="flex gap-2 flex-wrap">
    {options.map(opt => (
      <label
        key={opt.value}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
          value === opt.value
            ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400 dark:border-brand-700'
            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <input
          type="radio"
          name={name}
          value={opt.value}
          checked={value === opt.value}
          onChange={() => onChange(opt.value)}
          className="sr-only"
        />
        {value === opt.value ? (
          <CheckSquare className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <Square className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        )}
        {opt.label}
      </label>
    ))}
  </div>
);

export const SettingsPage: React.FC<SettingsPageProps> = ({
  preferences,
  onUpdate,
  cameraActive,
  onStopCamera,
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Appearance */}
      <SettingSection title="Appearance">
        <SettingRow
          id="theme-setting"
          icon={preferences.theme === 'light' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-brand-500" />}
          label="Color Theme"
          description="Choose between light and dark interface themes."
          control={
            <RadioGroup
              name="theme"
              value={preferences.theme}
              onChange={v => onUpdate('theme', v as 'light' | 'dark')}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          }
        />
        <SettingRow
          id="textsize-setting"
          icon={<Type className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
          label="Text Size"
          description="Increase text size for improved readability."
          control={
            <RadioGroup
              name="textSize"
              value={preferences.textSize}
              onChange={v => onUpdate('textSize', v as 'standard' | 'large')}
              options={[
                { value: 'standard', label: 'Standard' },
                { value: 'large', label: 'Large' },
              ]}
            />
          }
        />
      </SettingSection>

      {/* Accessibility */}
      <SettingSection title="Accessibility">
        <SettingRow
          id="reduced-motion-toggle"
          icon={<Zap className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
          label="Reduced Motion"
          description="Minimize animations and transitions throughout the interface."
          control={
            <Toggle
              id="reduced-motion-toggle"
              label="Toggle reduced motion"
              checked={preferences.reducedMotion}
              onChange={v => onUpdate('reducedMotion', v)}
            />
          }
        />
      </SettingSection>

      {/* Recognition preferences */}
      <SettingSection title="Recognition Preferences">
        <SettingRow
          id="speech-toggle"
          icon={<Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
          label="Speech Playback"
          description="Enable the 'Speak Result' button to read out predicted signs using your browser's speech synthesis."
          control={
            <Toggle
              id="speech-toggle"
              label="Toggle speech playback"
              checked={preferences.speechEnabled}
              onChange={v => onUpdate('speechEnabled', v)}
            />
          }
        />
        <SettingRow
          id="manual-confirm-toggle"
          icon={<CheckSquare className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
          label="Manual Confirmation"
          description="On: each recognised sign waits for you to Confirm or mark it Incorrect. Off: recognised signs are saved to history automatically (with Undo)."
          control={
            <Toggle
              id="manual-confirm-toggle"
              label="Toggle manual confirmation requirement"
              checked={preferences.requireManualConfirm}
              onChange={v => onUpdate('requireManualConfirm', v)}
            />
          }
        />
      </SettingSection>

      <SettingSection title="Keyboard">
        <SettingRow
          id="shortcuts-toggle"
          icon={<Keyboard className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
          label="Keyboard Shortcuts"
          description="Single-key shortcuts for frequent actions (Space, Enter, C, X, S, R, U, /). Press ? anywhere to see the full list."
          control={
            <Toggle
              id="shortcuts-toggle"
              label="Toggle keyboard shortcuts"
              checked={preferences.shortcutsEnabled}
              onChange={v => onUpdate('shortcutsEnabled', v)}
            />
          }
        />
      </SettingSection>

      {/* Privacy */}
      <SettingSection title="Privacy &amp; Camera">
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800">
            <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-green-800 dark:text-green-300">
              <p className="font-semibold mb-1">Camera usage</p>
              <p className="leading-relaxed">
                The camera is only used when you explicitly start it on the Live Recognition page.
                It is never accessed on other pages. The app does not upload, record, or store any
                video or camera frames. All processing is local to your browser session.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Camera status:{' '}
              <span className={cameraActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}>
                {cameraActive ? 'Active' : 'Inactive'}
              </span>
            </p>

            {cameraActive && onStopCamera && (
              <button
                onClick={onStopCamera}
                className="text-sm text-red-600 dark:text-red-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
                id="settings-stop-camera-btn"
              >
                Stop camera stream now
              </button>
            )}
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
            <p>
              <strong>History storage:</strong> Only result metadata (sign label, confidence, timestamp, feedback) is stored in your browser's local storage. No video or images.
            </p>
            <p>
              <strong>On-device recognition:</strong> Hand detection and sign classification run inside your browser. Camera frames never leave your device; no analytics or telemetry.
            </p>
          </div>
        </div>
      </SettingSection>
    </div>
  );
};
