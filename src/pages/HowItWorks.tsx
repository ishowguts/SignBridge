import React from 'react';
import {
  CheckCircle,
  XCircle,
  Camera,
  Cpu,
  Layers,
  Tag,
  User,
  ArrowDown,
  Zap,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

const PipelineStep: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  status?: 'done' | 'pending';
  color?: string;
}> = ({ icon, title, desc, status = 'done', color = 'brand' }) => {
  const bgClass =
    color === 'amber'
      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800'
      : color === 'teal'
      ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800'
      : color === 'violet'
      ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800'
      : 'bg-brand-50 dark:bg-brand-900/20 border-brand-100 dark:border-brand-800';

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${bgClass}`}>
      <div className="shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center border border-gray-100 dark:border-gray-800">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
          {status === 'pending' && (
            <span className="text-[9px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
              Not implemented
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ done: boolean; label: string }> = ({ done, label }) => (
  <li className="flex items-start gap-2 text-sm">
    {done ? (
      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" aria-hidden="true" />
    ) : (
      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
    )}
    <span className={done ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}>
      {label}
    </span>
  </li>
);

const GOLDEN_RULES: [string, string, string][] = [
  ['1. Strive for consistency', 'Same sidebar, header, card layout, button styles and colour meaning (green = confirmed/confident, amber = uncertain, red = error) on every page. Demo and camera modes share one result card.', 'All pages'],
  ['2. Enable frequent users to use shortcuts', 'Single-key shortcuts: Space start/stop, Enter capture, C confirm, X incorrect, S speak, R retry, K camera, U undo, / search, ? list. Key hints are printed on the buttons; Practise on camera jumps from a sign straight to recognition.', 'Live Recognition, History, Supported Signs, header'],
  ['3. Offer informative feedback', 'Live "hands detected" badge, landmark skeleton drawn over the video, current guess with live confidence bar and top-3, model-ready badge with test accuracy, toast after every save.', 'Live Recognition'],
  ['4. Design dialogs to yield closure', 'Recognition ends in a locked result card (sign, reference photo, confidence, alternatives). Confirm or Incorrect ends the task with a "saved" notice and a View history link.', 'Live Recognition, History'],
  ['5. Prevent errors and offer simple error handling', 'Below 60% confidence the app shows an uncertain state with closest guesses instead of a wrong answer; a sign must be held steady (9 of 12 frames) before it locks; clear messages for camera denied / missing / busy; model-load failure offers Demo mode; Clear History asks first.', 'Live Recognition, History'],
  ['6. Permit easy reversal of actions', 'Undo (button or U) after confirming, marking incorrect, deleting one entry or clearing all history; Incorrect lets the user record the intended sign; Stop, Reset and Try Again are always visible.', 'Live Recognition, History'],
  ['7. Support internal locus of control', 'Camera starts only on request; recognition starts and stops on the user\'s command; Capture now lets the user decide when to lock; the user chooses manual confirm or auto-save in Settings; nothing leaves the device.', 'Live Recognition, Settings'],
  ['8. Reduce short-term memory load', 'Reference photo of the predicted sign appears next to the result; Supported Signs shows every sign with its photo; the ? dialog lists all shortcuts; hints on buttons; recent results on the Dashboard.', 'Live Recognition, Supported Signs, Dashboard'],
];

export const HowItWorks: React.FC = () => {
  const [acc, setAcc] = React.useState<number | null>(null);
  React.useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}model/isl_mlp.json`)
      .then(r => r.json())
      .then(j => setAcc(j.test_accuracy))
      .catch(() => setAcc(null));
  }, []);
  const arrow = (
    <div className="flex justify-center py-1" aria-hidden="true">
      <ArrowDown className="w-5 h-5 text-gray-300 dark:text-gray-600" />
    </div>
  );
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-8">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">System Architecture</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          SignBridge recognises isolated, static Indian Sign Language signs (fingerspelling A–Z and numbers 1–9) from the webcam.
          Everything runs inside the browser: no server, no upload. The pipeline below is fully implemented.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Recognition Pipeline</h3>
        <PipelineStep icon={<Camera className="w-5 h-5 text-brand-600 dark:text-brand-400" />} title="Camera Input" desc="getUserMedia live video (mirrored preview). Frames are processed about 12 times per second and never stored." />
        {arrow}
        <PipelineStep icon={<Layers className="w-5 h-5 text-amber-500" />} title="Hand Landmark Detection" desc="MediaPipe Hand Landmarker (WebAssembly) finds up to two hands and 21 key points per hand. The skeleton is drawn over the video." color="amber" />
        {arrow}
        <PipelineStep icon={<Zap className="w-5 h-5 text-amber-500" />} title="Feature Extraction" desc="Hands are ordered left to right, centred on their mean point and scaled to unit size, giving 84 coordinates plus a two-hand flag (85 features). This makes the model independent of distance and position in the frame." color="amber" />
        {arrow}
        <PipelineStep icon={<Cpu className="w-5 h-5 text-violet-500" />} title="ISL Sign Classification" desc={`A multilayer perceptron (85-128-64-35) trained with scikit-learn on 42,745 dataset images${acc ? ` reaches ${acc}% accuracy on a held-out test split` : ''}. Weights run in plain TypeScript.`} color="violet" />
        {arrow}
        <PipelineStep icon={<Tag className="w-5 h-5 text-teal-600 dark:text-teal-400" />} title="Smoothing and Decision" desc="Predictions from the last ~1 s are combined. A sign locks only when 9 of 12 frames agree and confidence is at least 60%; otherwise the result is marked uncertain with the closest guesses." color="teal" />
        {arrow}
        <PipelineStep icon={<User className="w-5 h-5 text-brand-600 dark:text-brand-400" />} title="User Review and Correction" desc="The user confirms, corrects, retries or has the result spoken. Results and corrections are saved locally with Undo." />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Design Principles: Shneiderman's Eight Golden Rules</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">How each rule is applied in this interface.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2 pr-3">Rule</th>
                <th className="py-2 pr-3">How it is applied</th>
                <th className="py-2">Where</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800 align-top">
              {GOLDEN_RULES.map(([rule, how, where]) => (
                <tr key={rule}>
                  <td className="py-3 pr-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{rule}</td>
                  <td className="py-3 pr-3 text-gray-600 dark:text-gray-400">{how}</td>
                  <td className="py-3 text-xs text-gray-500 dark:text-gray-400">{where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
            Implemented
          </h3>
          <ul className="space-y-2">
            <FeatureItem done label="Live hand landmark extraction (MediaPipe)" />
            <FeatureItem done label="Trained ISL classifier (35 classes)" />
            <FeatureItem done label="Measured accuracy on held-out data" />
            <FeatureItem done label="Confidence threshold and uncertain state" />
            <FeatureItem done label="Confirm / correct / undo / speak" />
            <FeatureItem done label="Keyboard shortcuts and accessibility settings" />
            <FeatureItem done label="Local history with search and filters" />
            <FeatureItem done label="Demo mode without camera" />
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" aria-hidden="true" />
            Out of Scope / Future Work
          </h3>
          <ul className="space-y-2">
            <FeatureItem done={false} label="Signs with movement (words like HELLO)" />
            <FeatureItem done={false} label="Facial expressions and non-manual markers" />
            <FeatureItem done={false} label="Sentence-level translation" />
            <FeatureItem done={false} label="Training data from many different signers" />
            <FeatureItem done={false} label="Large-scale testing with Deaf ISL users" />
          </ul>
        </div>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
        <StatusBadge variant="prototype" className="mb-2">Scope</StatusBadge>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          The dataset comes from a small number of signers against a dark background, so accuracy on new people, lighting and backgrounds will be lower than the test figure. The confidence threshold and the correction flow exist for exactly that reason.
        </p>
      </div>
    </div>
  );
};
