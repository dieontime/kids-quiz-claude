import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useQuizSession } from '../../stores/quizSessionStore.ts';
import { BigButton } from '../../components/BigButton.tsx';
import { audio } from '../../services/audio.ts';
import { useSettings } from '../../stores/settingsStore.ts';

export function ResultsScreen() {
  const nav = useNavigate();
  const { moduleId, questions, score, reset } = useQuizSession();
  const reducedMotion = useSettings(s => s.reducedMotion);
  const lastMastered = useQuizSession(s => s.lastMasteredModuleId);
  const isReviewSession = useQuizSession(s => s.isReviewSession);
  const startReview = useQuizSession(s => s.startReview);

  useEffect(() => {
    audio.playUI('complete');
  }, []);

  useEffect(() => {
    if (score >= 8 && !reducedMotion) {
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  }, [score, reducedMotion]);

  useEffect(() => {
    if (lastMastered && !reducedMotion) {
      confetti({ particleCount: 400, spread: 120, origin: { y: 0.5 }, scalar: 1.2 });
      audio.playUI('mastery');
    }
  }, [lastMastered, reducedMotion]);

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <BigButton onClick={() => nav('/dashboard')}>Back</BigButton>
      </div>
    );
  }

  const total = questions.length;
  const cheer = score >= 8 ? 'Awesome! 🎉' : score >= 5 ? 'Nice try!' : 'Keep going!';
  const wrongCount = total - score;
  const showReviewButton = total > 0 && wrongCount > 0 && !isReviewSession;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 sm:gap-8 md:gap-10 p-4 sm:p-6 md:p-8 text-center">
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-primary">
        {score}/{total}
      </h1>
      <p className="text-xl sm:text-2xl md:text-3xl">{cheer}</p>
      {lastMastered && (
        <div className="mb-4 px-6 py-3 rounded-2xl bg-yellow-100 border-4 border-yellow-400 text-yellow-900 text-xl sm:text-2xl font-bold">
          🏆 You mastered {lastMastered}!
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap justify-center max-w-3xl">
        <BigButton onClick={() => { const m = moduleId; reset(); if (m) nav(`/quiz/${m}`); else nav('/dashboard'); }}>Retry</BigButton>
        {showReviewButton && (
          <BigButton onClick={() => { startReview(); nav('/quiz/review'); }}>
            Review wrong answers ({wrongCount})
          </BigButton>
        )}
        <BigButton variant="ghost" onClick={() => { reset(); nav('/dashboard'); }}>Back</BigButton>
        <BigButton onClick={() => { reset(); nav('/quiz/random'); }}>Next Quiz</BigButton>
      </div>
    </div>
  );
}
