import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import {
  fetchQuizQuestions, logAnswered, recordQuiz, type ModuleId,
} from '../../services/questionService.ts';
import { useQuizSession } from '../../stores/quizSessionStore.ts';
import { useProfileStore } from '../../stores/profileStore.ts';
import { QuestionCard } from './QuestionCard.tsx';
import { FeedbackFlash } from './FeedbackFlash.tsx';

const QUIZ_LENGTH = 10;

export function QuizScreen() {
  const nav = useNavigate();
  const { moduleId } = useParams<{ moduleId: string }>();
  const profile = useProfileStore(s => s.profile);

  const questions  = useQuizSession(s => s.questions);
  const currentIdx = useQuizSession(s => s.currentIndex);
  const score      = useQuizSession(s => s.score);
  const start      = useQuizSession(s => s.start);
  const answer     = useQuizSession(s => s.answer);
  const isComplete = useQuizSession(s => s.isComplete);
  const durationS  = useQuizSession(s => s.durationS);

  const [loading, setLoading]     = useState(true);
  const [showFlash, setShowFlash] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    return <div className="min-h-screen flex items-center justify-center text-2xl">Loading…</div>;
  }
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-xl text-red-600">{error}</p>
        <button onClick={() => nav('/dashboard')} className="px-6 py-2 bg-primary text-white rounded-xl">Back</button>
      </div>
    );
  }

  const onAnswer = async (pickedIndex: number) => {
    const q = questions[currentIdx];
    if (!q) return;
    const correct = pickedIndex === q.correct_index;
    answer(pickedIndex);
    setLastCorrect(correct);
    setShowFlash(true);
    await logAnswered(profile.id, q.external_id, correct);
  };

  const onNext = async () => {
    setShowFlash(false);
    if (isComplete()) {
      // After answer() advanced past the last question, score includes the final answer
      const finalScore = useQuizSession.getState().score;
      const finalTotal = questions.length;
      await recordQuiz(profile.id, moduleId ?? 'random', finalScore, finalTotal, durationS());
      nav('/results');
    }
  };

  if (questions.length === 0) {
    // Defensive: shouldn't reach this since loading gates it, but covers race
    return null;
  }
  // After the last answer, currentIdx === questions.length. We still render the
  // final flash; QuestionCard would crash on undefined, so skip it.
  const q = questions[currentIdx];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
      <div className="w-full max-w-2xl flex justify-between text-lg font-bold text-primary">
        <span>Question {Math.min(currentIdx + 1, questions.length)} of {questions.length}</span>
        <span>Score: {score}</span>
      </div>
      {q && <QuestionCard key={q.external_id} question={q} onAnswer={onAnswer} />}
      {showFlash && (
        <FeedbackFlash
          correct={lastCorrect}
          explanation={questions[Math.min(currentIdx - 1, questions.length - 1)]?.explanation ?? ''}
          onNext={onNext}
        />
      )}
    </div>
  );
}
