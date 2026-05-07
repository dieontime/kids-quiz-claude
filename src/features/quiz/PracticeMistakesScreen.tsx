import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { logAnswered } from '../../services/questionService.ts';
import { fetchIncorrectQuestions } from '../../services/incorrectQuestions.ts';
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

export function PracticeMistakesScreen() {
  const nav = useNavigate();
  const theme = themeFor('practice');
  const profile = useProfileStore(s => s.profile);

  const questions  = useQuizSession(s => s.questions);
  const currentIdx = useQuizSession(s => s.currentIndex);
  const score      = useQuizSession(s => s.score);
  const start      = useQuizSession(s => s.start);
  const answer     = useQuizSession(s => s.answer);
  const isComplete = useQuizSession(s => s.isComplete);

  const [loading, setLoading]         = useState(true);
  const [emptyPool, setEmptyPool]     = useState(false);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      const qs = await fetchIncorrectQuestions(profile.id);
      if (cancelled) return;
      if (qs.length === 0) {
        setEmptyPool(true);
        setLoading(false);
        return;
      }
      start('practice', qs);
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const onBack = () => {
    useQuizSession.getState().reset();
    nav('/dashboard');
  };

  if (!profile) return <Navigate to="/login" replace />;
  if (emptyPool) return <Navigate to="/dashboard" replace />;
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 gap-4 relative">
        <PlayfulBackground />
        <div className="text-xl sm:text-2xl">Loading…</div>
      </div>
    );
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
    await logAnswered(profile.id, q.external_id, correct);
  };

  const onNext = async () => {
    if (pickedIndex === null) return;
    answer(pickedIndex);
    setPickedIndex(null);
    if (isComplete()) {
      nav('/practice-results');
    }
  };

  if (questions.length === 0) return null;
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
        📝 Practice {questions.length} question{questions.length === 1 ? '' : 's'} you missed
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
