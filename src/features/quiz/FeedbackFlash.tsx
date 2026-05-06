import { motion } from 'framer-motion';
import type { ModuleTheme } from '../../theme/moduleTheme.ts';

interface Props {
  correct: boolean;
  explanation: string;
  onNext: () => void;
  theme?: ModuleTheme;
}

export function FeedbackFlash({ correct, explanation, onNext, theme }: Props) {
  const nextBg = theme?.accentBg ?? 'bg-primary';
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-2 sm:mt-4 p-5 sm:p-6 md:p-8 rounded-2xl w-full max-w-3xl shadow-lg ${correct ? 'bg-green-100 text-green-900 border-4 border-green-400' : 'bg-red-100 text-red-900 border-4 border-red-400'}`}
      role="status"
      aria-live="polite"
    >
      <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">
        {correct ? '✓ Nice!' : '✗ Not quite — keep going!'}
      </div>
      <div className="text-lg sm:text-xl md:text-2xl mb-4 sm:mb-5">{explanation}</div>
      <button
        onClick={onNext}
        autoFocus
        className={`px-6 sm:px-8 py-3 sm:py-4 ${nextBg} text-white text-xl sm:text-2xl md:text-3xl font-bold rounded-xl shadow-md focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none active:scale-95 transition-transform`}
      >
        Next
      </button>
    </motion.div>
  );
}
