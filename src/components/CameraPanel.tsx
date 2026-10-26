import React from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  SwitchCamera,
  ShieldCheck,
  AlertTriangle,
  Wifi,
  Square,
} from 'lucide-react';
import { Button } from './Button';
import type { CameraState } from '../types/recognition';

interface CameraPanelProps {
  cameraState: CameraState;
  videoRef: React.RefObject<HTMLVideoElement>;
  onStart: () => void;
  onStop: () => void;
  onSwitch: () => void;
  /** Landmark overlay drawn by the recogniser. */
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  /** Live status shown on top of the video (hand detected, current guess). */
  overlay?: React.ReactNode;
}

export const CameraPanel: React.FC<CameraPanelProps> = ({
  cameraState,
  videoRef,
  onStart,
  onStop,
  onSwitch,
  canvasRef,
  overlay,
}) => {
  const { permission, isActive, deviceCount, errorMessage } = cameraState;

  return (
    <div className="flex flex-col gap-4">
      {/* Camera Preview */}
      <div className="relative aspect-video bg-gray-950 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Live video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity duration-300 ${
            isActive ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Live camera feed (mirrored)"
        />
        {canvasRef && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none"
            aria-hidden="true"
          />
        )}
        {isActive && overlay}

        {/* Frame guide overlay */}
        {isActive && (
          <>
            {/* Corner guides */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <div className="absolute inset-6 border-2 border-white/20 rounded-xl">
                {/* Corner accents */}
                <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-white/60 rounded-tl-xl" />
                <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-white/60 rounded-tr-xl" />
                <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-white/60 rounded-bl-xl" />
                <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-white/60 rounded-br-xl" />
              </div>
              {/* Center label */}
              <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                <span className="text-white/60 text-xs bg-black/30 px-3 py-1 rounded-full">
                  Keep both hands inside the frame
                </span>
              </div>
            </div>

            {/* Camera active indicator */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 text-white text-[10px] font-medium px-2 py-1 rounded-full backdrop-blur-sm">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span>Camera Active</span>
            </div>
          </>
        )}

        {/* Idle / Not started state */}
        {!isActive && permission === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-white font-medium text-sm mb-1">Camera not started</p>
              <p className="text-gray-400 text-xs max-w-xs">
                Allow camera access and position one sign clearly within the frame.
              </p>
            </div>
            <Button variant="primary" onClick={onStart} icon={<Camera className="w-4 h-4" />} id="start-camera-btn">
              Start Camera
            </Button>
          </div>
        )}

        {/* Requesting permission */}
        {permission === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" aria-label="Requesting camera permission" />
            <p className="text-white text-sm">Requesting camera access…</p>
            <p className="text-gray-400 text-xs">Please allow access in the browser prompt.</p>
          </div>
        )}

        {/* Permission denied */}
        {permission === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-900/30 flex items-center justify-center">
              <CameraOff className="w-8 h-8 text-red-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-white font-medium text-sm mb-1">Camera access denied</p>
              <p className="text-gray-400 text-xs max-w-xs">
                {errorMessage ?? 'Please allow camera access in your browser settings and try again.'}
              </p>
            </div>
            <Button variant="secondary" onClick={onStart} icon={<RefreshCw className="w-4 h-4" />} id="retry-camera-btn">
              Retry Permission
            </Button>
          </div>
        )}

        {/* Camera unavailable */}
        {permission === 'unavailable' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center">
              <Wifi className="w-8 h-8 text-gray-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-white font-medium text-sm mb-1">No camera found</p>
              <p className="text-gray-400 text-xs max-w-xs">
                {errorMessage ?? 'Connect a camera and try again. You can still explore the demo without a camera.'}
              </p>
            </div>
          </div>
        )}

        {/* Generic error */}
        {permission === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-white font-medium text-sm mb-1">Camera error</p>
              <p className="text-gray-400 text-xs max-w-xs">
                {errorMessage ?? 'An error occurred accessing the camera.'}
              </p>
            </div>
            <Button variant="secondary" onClick={onStart} icon={<RefreshCw className="w-4 h-4" />} id="retry-camera-error-btn">
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div className="flex flex-wrap gap-2">
        {!isActive ? (
          <Button
            variant="primary"
            onClick={onStart}
            disabled={permission === 'requesting'}
            icon={<Camera className="w-4 h-4" />}
            id="cam-start-btn"
          >
            Start Camera
          </Button>
        ) : (
          <Button
            variant="danger"
            onClick={onStop}
            icon={<Square className="w-4 h-4" />}
            id="cam-stop-btn"
          >
            Stop Camera
          </Button>
        )}

        {isActive && deviceCount > 1 && (
          <Button
            variant="secondary"
            onClick={onSwitch}
            icon={<SwitchCamera className="w-4 h-4" />}
            id="cam-switch-btn"
          >
            Switch Camera
          </Button>
        )}
      </div>

      {/* Privacy note */}
      <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
        <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">Privacy: </span>
          Frames are analysed on your device only. Nothing is uploaded or recorded.
        </p>
      </div>
    </div>
  );
};
