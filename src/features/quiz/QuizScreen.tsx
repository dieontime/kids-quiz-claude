import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import {
  fetchQuizQuestions, logAnswered, recordQuiz, type ModuleId,
} from '../../services/questionService.ts';
import { useQuizSession } from '../../stores/quizSessionStore.ts';
import { useProfileStore } from '../../stores/profileStore.ts';
import { QuestionCard } from './QuestionCard.tsx';
import { FeedbackFlash } from './FeedbackFlash.tsx';
import { themeFor, type ModuleId as ThemeModuleId } from '../../theme/moduleTheme.ts';
import { audio } from '../../services/audio.ts';

const QUIZ_LENGTH = 10;

export function QuizScreen() {
  const nav = useNavigate();
  const { moduleId } = useParams<{ moduleId: string }>();
  const theme = themeFor(moduleId ?? '');
  const profile = useProfileStore(s => s.profile);

  const questions  = useQuizSession(s => s.questions);
  const currentIdx = useQuizSession(s => s.currentIndex);
  const score      = useQuizSession(s => s.score);
  const start      = useQuizSession(s => s.start);
  const answer     = useQuizSession(s => s.answer);
  const isComplete = useQuizSession(s => s.isComplete);
  const durationS  = useQuizSession(s => s.durationS);

  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  // pickedIndex !== null  ⇒  user has chosen for the *current* question and is
  // looking at the feedback panel; the next question only renders after Next.
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);

  useEffect(() => {
    if (!profile || !moduleId) return;
    let cancelled = false;
    (async () => {
      try {
        const qs = await fetchQuizQuestions({ moduleId: moduleId as ModuleId, count: QUIZ_LENGTH });
        if (cancelled) return;
        if (qs.length === 0) {
          setError('No questions available for this module yet — try a different one!');
          setLoading(false);
          return;
        }
        start(moduleId, qs);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Could not load quiz');
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, profile?.id]);

  if (!profile) return <Navigate to="/login" replace />;
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-2xl sm:text-3xl">Loading…</div>;
  }
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-xl sm:text-2xl text-red-600">{error}</p>
        <button onClick={() => nav('/dashboard')} className="px-6 py-3 bg-primary text-white text-xl rounded-xl focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none">Back</button>
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
    if (correct && (moduleId === 'math' || moduleId === 'vehicles' || moduleId === 'grammar')) {
      audio.playStinger(moduleId as ThemeModuleId);
    }
    await logAnswered(profile.id, q.external_id, correct);
  };

  const onNext = async () => {
    if (pickedIndex === null) return;
    answer(pickedIndex);
    setPickedIndex(null);
    if (isComplete()) {
      const finalScore = useQuizSession.getState().score;
      await recordQuiz(profile.id, moduleId ?? 'random', finalScore, questions.length, durationS());
      if (moduleId === 'math' || moduleId === 'vehicles' || moduleId === 'grammar') {
        const { computeModuleProgress } = await import('../../services/moduleProgress.ts');
        const { useSettings } = await import('../../stores/settingsStore.ts');
        const band = useSettings.getState().ageBand;
        const updated = await computeModuleProgress(profile.id, band);
        const row = updated.find(r => r.moduleId === moduleId);
        if (row && row.total > 0 && row.answered >= row.total) {
          useQuizSession.getState().flagMastery(moduleId);
        }
      }
      nav('/results');
    }
  };

  if (questions.length === 0) return null;
  const q = questions[currentIdx];
  if (!q) return null;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-8 gap-4 sm:gap-6">
      <div className="w-full max-w-3xl flex justify-between items-center text-base sm:text-lg md:text-xl font-bold text-primary">
        <span>Question {currentIdx + 1} of {questions.length}</span>
        <span>Score: {score}</span>
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
