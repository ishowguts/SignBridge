import { useState, useRef, useCallback, useEffect } from 'react';
import type { CameraState, CameraPermission } from '../types/recognition';

const initialState: CameraState = {
  permission: 'idle',
  isActive: false,
  stream: null,
  deviceCount: 0,
  currentDeviceId: null,
  errorMessage: null,
};

export function useCamera() {
  const [state, setState] = useState<CameraState>(initialState);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Count available camera devices
  const updateDeviceCount = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      setState(prev => ({ ...prev, deviceCount: cameras.length }));
    } catch {
      setState(prev => ({ ...prev, deviceCount: 0 }));
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState(prev => ({
      ...prev,
      isActive: false,
      stream: null,
      currentDeviceId: null,
      permission: prev.permission === 'granted' ? 'granted' : prev.permission,
    }));
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    // Prevent duplicate streams
    if (streamRef.current) {
      stopStream();
    }

    setState(prev => ({
      ...prev,
      permission: 'requesting' as CameraPermission,
      errorMessage: null,
    }));

    // Check if mediaDevices is supported
    if (!navigator.mediaDevices?.getUserMedia) {
      setState(prev => ({
        ...prev,
        permission: 'unavailable',
        errorMessage: 'Camera API is not supported in this browser.',
      }));
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {
          // Video play may fail silently on some browsers — not a critical error
        });
      }

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack?.getSettings();

      setState(prev => ({
        ...prev,
        permission: 'granted',
        isActive: true,
        stream,
        currentDeviceId: settings?.deviceId ?? deviceId ?? null,
        errorMessage: null,
      }));

      await updateDeviceCount();
    } catch (err) {
      const error = err as DOMException;
      let permission: CameraPermission = 'error';
      let message = 'Failed to access the camera.';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        permission = 'denied';
        message = 'Camera permission was denied. Please allow camera access in your browser settings and try again.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        permission = 'unavailable';
        message = 'No camera device was found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        permission = 'error';
        message = 'Camera is in use by another application. Please close other apps using the camera.';
      } else if (error.name === 'OverconstrainedError') {
        permission = 'error';
        message = 'Could not find a camera matching the requested settings.';
      }

      setState(prev => ({
        ...prev,
        permission,
        isActive: false,
        stream: null,
        errorMessage: message,
      }));
    }
  }, [stopStream, updateDeviceCount]);

  const switchCamera = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      if (cameras.length < 2) return;

      const currentId = state.currentDeviceId;
      const currentIdx = cameras.findIndex(c => c.deviceId === currentId);
      const nextIdx = (currentIdx + 1) % cameras.length;
      const nextDeviceId = cameras[nextIdx].deviceId;

      await startCamera(nextDeviceId);
    } catch {
      // Switch failed — stay on current camera
    }
  }, [state.currentDeviceId, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    state,
    videoRef,
    startCamera,
    stopCamera: stopStream,
    switchCamera,
  };
}
