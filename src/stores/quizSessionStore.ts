import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QuizQuestion {
  id?: number;
  module_id: 'math' | 'animals' | 'science' | 'vehicles' | 'grammar';
  age_band: '5-6' | '7-9' | 'both';
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string;
  source: string;
  external_id: string;
}

interface AnswerEntry {
  questionExternalId: string;
  pickedIndex: number;
  correct: boolean;
}

interface State {
  moduleId: string | null;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: AnswerEntry[];
  score: number;
  startedAt: number | null;
  lastMasteredModuleId: string | null;
  start: (moduleId: string, questions: QuizQuestion[]) => void;
  answer: (pickedIndex: number) => void;
  reset: () => void;
  isComplete: () => boolean;
  durationS: () => number;
  flagMastery: (moduleId: string) => void;
}

export const useQuizSession = create<State>()(
  persist(
    (set, get) => ({
      moduleId: null,
      questions: [],
      currentIndex: 0,
      answers: [],
      score: 0,
      startedAt: null,
      lastMasteredModuleId: null,
      start: (moduleId, questions) => set({
        moduleId, questions, currentIndex: 0, answers: [], score: 0, startedAt: Date.now(),
      }),
      answer: (pickedIndex) => {
        const { questions, currentIndex, answers, score } = get();
        const q = questions[currentIndex];
        if (!q) return;
        const correct = pickedIndex === q.correct_index;
        set({
          answers: [...answers, { questionExternalId: q.external_id, pickedIndex, correct }],
          score: score + (correct ? 1 : 0),
          currentIndex: currentIndex + 1,
        });
      },
      reset: () => set({ moduleId: null, questions: [], currentIndex: 0, answers: [], score: 0, startedAt: null, lastMasteredModuleId: null }),
      isComplete: () => {
        const { questions, currentIndex } = get();
        return questions.length > 0 && currentIndex >= questions.length;
      },
      durationS: () => {
        const { startedAt } = get();
        return startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
      },
      flagMastery: (moduleId) => set({ lastMasteredModuleId: moduleId }),
    }),
    { name: 'kq_quiz_session' },
  ),
);
