import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useQuizSession } from '../../stores/quizSessionStore.ts';
import { BigButton } from '../../components/BigButton.tsx';

export function ResultsScreen() {
  const nav = useNavigate();
  const { moduleId, questions, score, reset } = useQuizSession();

  useEffect(() => {
    if (score >= 8) {
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  }, [score]);

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BigButton onClick={() => nav('/dashboard')}>Back</BigButton>
      </div>
    );
  }

  const total = questions.length;
  const cheer = score >= 8 ? 'Awesome! 🎉' : score >= 5 ? 'Nice try!' : 'Keep going!';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-5xl font-extrabold text-primary">{score}/{total}</h1>
      <p className="text-2xl">{cheer}</p>
      <div className="flex gap-3 flex-wrap justify-center">
        <BigButton onClick={() => { const m = moduleId; reset(); if (m) nav(`/quiz/${m}`); else nav('/dashboard'); }}>Retry</BigButton>
        <BigButton variant="ghost" onClick={() => { reset(); nav('/dashboard'); }}>Back</BigButton>
        <BigButton onClick={() => { reset(); nav('/quiz/random'); }}>Next Quiz</BigButton>
      </div>
    </div>
  );
}
