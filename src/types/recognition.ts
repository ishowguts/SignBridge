// Recognition result types
export type RecognitionMode = 'simulated' | 'ml';

export type RecognitionStatus =
  | 'idle'
  | 'requesting_permission'
  | 'camera_active'
  | 'recognizing'
  | 'recognized'
  | 'uncertain'
  | 'error'
  | 'paused';

export interface RecognitionResult {
  id: string;
  label: string;
  confidence: number | null; // null = simulated / illustrative only
  mode: RecognitionMode;
  status: 'recognized' | 'uncertain' | 'error';
  timestamp: string;
  isSimulated: boolean;
  alternatives?: { label: string; confidence: number }[]; // top-3 from the model
}

// Camera state types
export type CameraPermission = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error';

export interface CameraState {
  permission: CameraPermission;
  isActive: boolean;
  stream: MediaStream | null;
  deviceCount: number;
  currentDeviceId: string | null;
  errorMessage: string | null;
}

// History entry
export interface HistoryEntry {
  id: string;
  label: string;
  timestamp: string;
  mode: RecognitionMode;
  status: 'recognized' | 'uncertain' | 'error';
  userFeedback: 'correct' | 'incorrect' | 'pending' | null;
  correctedLabel?: string;
  confidence?: number | null;
  isSimulated: boolean;
}

// Demo sign type
export interface DemoSign {
  id: string;
  label: string;
  category: string;
  description: string;
  notes: string;
  hands?: 1 | 2;
  image?: string;
}

// User preferences
export interface AppPreferences {
  theme: 'light' | 'dark';
  textSize: 'standard' | 'large';
  reducedMotion: boolean;
  speechEnabled: boolean;
  requireManualConfirm: boolean;
  shortcutsEnabled: boolean;
}
