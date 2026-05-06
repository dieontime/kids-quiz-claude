import { motion } from 'framer-motion';

interface Props {
  correct: boolean;
  explanation: string;
  onNext: () => void;
}

export function FeedbackFlash({ correct, explanation, onNext }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-6 p-6 rounded-2xl text-xl font-bold w-full max-w-2xl ${correct ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}
    >
      <div className="text-3xl mb-2">{correct ? '✓ Nice!' : 'Not quite — keep going!'}</div>
      <div className="font-normal mb-4">{explanation}</div>
      <button onClick={onNext} className="px-6 py-2 bg-primary text-white rounded-xl">Next</button>
    </motion.div>
  );
}
