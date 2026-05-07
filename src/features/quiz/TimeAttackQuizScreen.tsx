import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  fetchQuizQuestions, logAnswered, recordQuiz,
} from '../../services/questionService.ts';
import { useQuizSession } from '../../stores/quizSessionStore.ts';
import { useProfileStore } from '../../stores/profileStore.ts';
import { QuestionCard } from './QuestionCard.tsx';
import { FeedbackFlash } from './FeedbackFlash.tsx';
import { QuizLoadingScreen } from './QuizLoadingScreen.tsx';
import { TimeAttackTimer } from './TimeAttackTimer.tsx';
import { DEFAULT_THEME } from '../../theme/moduleTheme.ts';
import { audio } from '../../services/audio.ts';
import { PlayfulBackground } from '../../components/PlayfulBackground.tsx';

const QUIZ_LENGTH = 10;
const PER_QUESTION_S = 15;
// Sentinel returned to QuestionCard's revealedIndex when the timer elapses
// before the user picks. -1 means "answered (locked) but no option highlighted",
// which makes every option show the dim "wrong" tone except the correct one
// which is highlighted green — matching how QuestionCard renders a reveal.
const TIMEOUT_SENTINEL = -1;

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

export function TimeAttackQuizScreen() {
  const nav = useNavigate();
  const theme = DEFAULT_THEME;
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
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      try {
        const qs = await fetchQuizQuestions({ moduleId: 'random', count: QUIZ_LENGTH });
        if (cancelled) return;
        if (qs.length === 0) {
          setError('No questions available right now — try a different mode!');
          setLoading(false);
          return;
        }
        start('random', qs);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Could not load quiz');
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const onBack = () => {
    useQuizSession.getState().reset();
    nav('/dashboard');
  };

  const onTimerElapsed = useCallback(async () => {
    const q = questions[currentIdx];
    if (!q || pickedIndex !== null) return;
    setPickedIndex(TIMEOUT_SENTINEL);
    setLastCorrect(false);
    audio.playUI('incorrect');
    if (profile) {
      await logAnswered(profile.id, q.external_id, false);
    }
  }, [questions, currentIdx, pickedIndex, profile]);

  if (!profile) return <Navigate to="/login" replace />;
  if (loading) {
    return <QuizLoadingScreen theme={theme} onBack={onBack} />;
  }
  if (error) {
    return (
      <div className="min-h-screen flex flex-col p-4 sm:p-6 md:p-8 relative">
        <PlayfulBackground />
        <div className="w-full max-w-3xl mx-auto flex justify-start">
          <BackToDashboard onBack={onBack} />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-xl sm:text-2xl text-red-600">{error}</p>
        </div>
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
    await logAnswered(profile.id, q.external_id, correct);
  };

  const onNext = async () => {
    if (pickedIndex === null) return;
    // Convert the timeout sentinel to a non-correct sentinel for the session
    // store (any non-correct_index value works — answer() decides correctness
    // by comparing to question.correct_index).
    const recordedPick = pickedIndex === TIMEOUT_SENTINEL ? TIMEOUT_SENTINEL : pickedIndex;
    answer(recordedPick);
    setPickedIndex(null);
    if (isComplete()) {
      const finalScore = useQuizSession.getState().score;
      await recordQuiz(profile.id, 'random', finalScore, questions.length, durationS());
      nav('/results');
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
        ⏱️ Time Attack
      </div>
      <TimeAttackTimer
        durationS={PER_QUESTION_S}
        onElapsed={onTimerElapsed}
        paused={pickedIndex !== null}
        resetKey={currentIdx}
      />
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
