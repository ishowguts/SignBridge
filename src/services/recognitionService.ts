import type { RecognitionResult } from '../types/recognition';
import { UNCERTAIN_LABEL } from '../data/demoSigns';

/**
 * Recognition Service Interface
 * This interface is designed so that a real ML model can be substituted later
 * without changing the UI layer.
 */
export interface IRecognitionService {
  recognize(label: string): Promise<RecognitionResult>;
}

/**
 * Simulated Recognition Service
 * Returns controlled, deterministic demonstration results.
 * 
 * IMPORTANT: This service does NOT analyze webcam frames.
 * All results are simulated for interface demonstration purposes only.
 * Do NOT use mode: 'ml' here — that is reserved for a real trained model.
 */
class SimulatedRecognitionService implements IRecognitionService {
  async recognize(label: string): Promise<RecognitionResult> {
    // Simulate a brief processing delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));

    const id = `result-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const timestamp = new Date().toISOString();

    // Handle the uncertain simulation scenario
    if (label === UNCERTAIN_LABEL) {
      return {
        id,
        label: 'Unknown',
        confidence: null,
        mode: 'simulated',
        status: 'uncertain',
        timestamp,
        isSimulated: true,
      };
    }

    // Deterministic illustrative confidence for demonstration
    // Confidence values are NOT real model outputs
    const illustrativeConfidence = 0.78 + (label.length % 5) * 0.04;

    return {
      id,
      label,
      confidence: Math.min(0.97, illustrativeConfidence),
      mode: 'simulated',
      status: 'recognized',
      timestamp,
      isSimulated: true,
    };
  }
}

// Export singleton instance
export const recognitionService: IRecognitionService = new SimulatedRecognitionService();

/**
 * Future integration point:
 * Replace SimulatedRecognitionService with a class that:
 * 1. Accepts a canvas frame from the camera
 * 2. Runs hand landmark extraction (e.g., MediaPipe)
 * 3. Passes landmarks to a trained ISL classifier
 * 4. Returns a result with mode: 'ml'
 * 
 * Example:
 * class MLRecognitionService implements IRecognitionService {
 *   async recognize(frameCanvas: HTMLCanvasElement): Promise<RecognitionResult> {
 *     // ... real inference here
 *   }
 * }
 */
