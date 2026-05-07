import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { logAnswered } from '../../services/questionService.ts';
import { useQuizSession } from '../../stores/quizSessionStore.ts';
import { useProfileStore } from '../../stores/profileStore.ts';
import { QuestionCard } from './QuestionCard.tsx';
import { FeedbackFlash } from './FeedbackFlash.tsx';
import { themeFor, type ModuleId as ThemeModuleId } from '../../theme/moduleTheme.ts';
import { audio } from '../../services/audio.ts';
import { PlayfulBackground } from '../../components/PlayfulBackground.tsx';

const STINGER_MODULES = new Set<ThemeModuleId>(['math', 'vehicles', 'grammar', 'animals', 'science']);

function BackToDashboard({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      aria-label="Back to dashboard"
      className="px-3 py-2 rounded-xl text-base sm:text-lg font-semibold text-primary hover:bg-white/40 focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none"
    >
      ← Back
    </button>
  );
}

export function ReviewQuizScreen() {
  const nav = useNavigate();
  const theme = themeFor('review');
  const profile = useProfileStore(s => s.profile);

  const questions       = useQuizSession(s => s.questions);
  const currentIdx      = useQuizSession(s => s.currentIndex);
  const score           = useQuizSession(s => s.score);
  const answer          = useQuizSession(s => s.answer);
  const isComplete      = useQuizSession(s => s.isComplete);
  const isReviewSession = useQuizSession(s => s.isReviewSession);
  const endReview       = useQuizSession(s => s.endReview);

  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);

  const onBack = () => {
    endReview();
    useQuizSession.getState().reset();
    nav('/dashboard');
  };

  if (!profile) return <Navigate to="/login" replace />;
  if (!isReviewSession || questions.length === 0) {
    return <Navigate to="/dashboard" replace />;
  }

  const onAnswer = async (idx: number) => {
    const q = questions[currentIdx];
    if (!q || pickedIndex !== null) return;
    const correct = idx === q.correct_index;
    setPickedIndex(idx);
    setLastCorrect(correct);
    audio.playUI(correct ? 'correct' : 'incorrect');
    if (correct && STINGER_MODULES.has(q.module_id as ThemeModuleId)) {
      audio.playStinger(q.module_id as ThemeModuleId);
    }
  };

  const onNext = async () => {
    if (pickedIndex === null) return;
    answer(pickedIndex);
    setPickedIndex(null);
    if (isComplete()) {
      // Persist all the corrections so the questionService dedup set updates.
      const finalAnswers = useQuizSession.getState().answers;
      for (const a of finalAnswers) {
        await logAnswered(profile.id, a.questionExternalId, a.correct);
      }
      endReview();
      nav('/review-results');
    }
  };

  const q = questions[currentIdx];
  if (!q) return null;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-8 gap-4 sm:gap-6 relative">
      <PlayfulBackground />
      <div className="w-full max-w-3xl flex justify-between items-center gap-2 text-base sm:text-lg md:text-xl font-bold text-primary">
        <BackToDashboard onBack={onBack} />
        <span>Question {currentIdx + 1} of {questions.length}</span>
        <span>Score: {score}</span>
      </div>
      <div className="w-full max-w-3xl px-4 py-2 rounded-2xl bg-purple-100 border-4 border-purple-400 text-purple-900 text-lg sm:text-xl md:text-2xl font-bold text-center">
        📝 Review: {questions.length} question{questions.length === 1 ? '' : 's'}
      </div>
      <div className="w-full flex-1 flex flex-col items-center justify-center gap-4 sm:gap-6">
        <QuestionCard
          key={q.external_id}
          question={q}
          onAnswer={onAnswer}
          revealedIndex={pickedIndex}
          theme={theme}
        />
        {pickedIndex !== null && (
          <FeedbackFlash
            correct={lastCorrect}
            explanation={q.explanation}
            onNext={onNext}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}
