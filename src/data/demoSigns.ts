import type { DemoSign } from '../types/recognition';

/**
 * Vocabulary the trained model recognises: static ISL fingerspelling letters A–Z and digits 1–9.
 * Reference photos (public/signs/<label>.jpg) and the one/two-hand split come from the training dataset
 * (Indian Sign Language dataset, Kaggle / Hugging Face mirror Hemg/Indian_sign_language_dataset).
 */
// Share of training images per class in which MediaPipe found two hands (filled from ml/results/metrics.json).
const TWO_HAND_PCT: Record<string, number> = {'1': 0.0, '2': 0.0, '3': 0.0, '4': 0.0, '5': 0.0, '6': 0.0, '7': 0.2, '8': 0.0, '9': 0.0, 'A': 100.0, 'B': 81.7, 'C': 0.1, 'D': 100.0, 'E': 100.0, 'F': 100.0, 'G': 86.6, 'H': 97.2, 'I': 0.0, 'J': 3.2, 'K': 99.8, 'L': 0.0, 'M': 100.0, 'N': 51.6, 'O': 0.4, 'P': 81.5, 'Q': 2.0, 'R': 30.8, 'S': 55.8, 'T': 99.8, 'U': 8.1, 'V': 0.1, 'W': 99.2, 'X': 100.0, 'Y': 91.9, 'Z': 98.8};

const make = (label: string, category: 'Letters' | 'Digits'): DemoSign => {
  const twoHand = (TWO_HAND_PCT[label] ?? 0) >= 50;
  return {
    id: label.toLowerCase(),
    label,
    category,
    hands: twoHand ? 2 : 1,
    image: `${import.meta.env.BASE_URL}signs/${label}.jpg`,
    description: `ISL fingerspelling ${category === 'Letters' ? 'letter' : 'number'} ${label}. Usually signed with ${
      twoHand ? 'both hands' : 'one hand'
    }. Hold the hand shape still for about one second.`,
    notes: 'Reference photo from the training dataset. Recognition works on still hand shapes only.',
  };
};

export const DEMO_SIGNS: DemoSign[] = [
  ...Array.from({ length: 26 }, (_, i) => make(String.fromCharCode(65 + i), 'Letters')),
  ...Array.from({ length: 9 }, (_, i) => make(String(i + 1), 'Digits')),
];

export const DEMO_CATEGORIES = ['Letters', 'Digits'];

// Special label used by the demo mode to show the uncertain-result state.
export const UNCERTAIN_LABEL = '__UNCERTAIN__';

export const findSign = (label: string) => DEMO_SIGNS.find(s => s.label === label);
