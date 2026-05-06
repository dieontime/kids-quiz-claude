import { useState } from 'react';
import { motion } from 'framer-motion';
import type { QuizQuestion } from '../../stores/quizSessionStore.ts';

interface Props {
  question: QuizQuestion;
  onAnswer: (pickedIndex: number) => void;
}

export function QuestionCard({ question, onAnswer }: Props) {
  const [picked, setPicked] = useState<number | null>(null);

  const tap = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    onAnswer(i);
  };

  return (
    <div className="flex flex-col gap-6 items-center w-full max-w-2xl">
      <h2 className="text-3xl font-bold text-center">{question.question_text}</h2>
      <div className="grid grid-cols-2 gap-4 w-full">
        {question.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === question.correct_index;
          const reveal = picked !== null;
          const tone = !reveal
            ? 'bg-white text-primary border-primary'
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
              className={`text-2xl font-bold py-6 rounded-2xl border-2 ${tone}`}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
