import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { QuizQuestion } from '../../stores/quizSessionStore.ts';
import type { ModuleTheme } from '../../theme/moduleTheme.ts';

interface Props {
  question: QuizQuestion;
  onAnswer: (pickedIndex: number) => void;
  // Optional: parent can drive the "picked" reveal externally so the card
  // shows the highlighted answer state even after parent-side state changes.
  // When undefined, the card manages picked internally.
  revealedIndex?: number | null;
  theme?: ModuleTheme;
}

export function QuestionCard({ question, onAnswer, revealedIndex, theme }: Props) {
  const [internalPicked, setInternalPicked] = useState<number | null>(null);
  const picked = revealedIndex !== undefined ? revealedIndex : internalPicked;

  useEffect(() => {
    setInternalPicked(null);
  }, [question.external_id]);

  const tap = (i: number) => {
    if (picked !== null) return;
    if (revealedIndex === undefined) setInternalPicked(i);
    onAnswer(i);
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 items-center w-full max-w-3xl">
      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center px-2">
        {question.question_text}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 w-full">
        {question.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === question.correct_index;
          const reveal = picked !== null;
          const accentText = theme?.accentText ?? 'text-primary';
          const accentBorder = theme?.id === 'math' ? 'border-blue-500' : theme?.id === 'vehicles' ? 'border-red-500' : theme?.id === 'grammar' ? 'border-violet-500' : 'border-primary';
          const tone = !reveal
            ? `bg-white ${accentText} ${accentBorder} hover:bg-black/5`
            : isCorrect
              ? 'bg-green-500 text-white border-green-500'
              : isPicked
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-white text-gray-400 border-gray-200';
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.97 }}
              onClick={() => tap(i)}
              disabled={picked !== null}
              className={`text-xl sm:text-2xl md:text-3xl font-bold py-5 sm:py-6 md:py-8 px-4 rounded-2xl border-4 transition-colors focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none ${tone}`}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
