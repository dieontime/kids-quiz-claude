import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizSession } from '../../stores/quizSessionStore.ts';
import { BigButton } from '../../components/BigButton.tsx';
import { audio } from '../../services/audio.ts';
import { PlayfulBackground } from '../../components/PlayfulBackground.tsx';

export function ReviewResultsScreen() {
  const nav = useNavigate();
  // Capture totals BEFORE the reset so the screen still has something to show.
  const [snapshot] = useState(() => {
    const s = useQuizSession.getState();
    return { corrected: s.score, total: s.questions.length };
  });
  const reset = useQuizSession(s => s.reset);

  useEffect(() => {
    audio.playUI('complete');
    reset();
  }, [reset]);

  const { corrected, total } = snapshot;
  const headline = total === 0
    ? 'Nothing to review!'
    : corrected === total
      ? 'Great job reviewing!'
      : corrected > 0
        ? 'Nice progress!'
        : 'Keep practicing — you got this!';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 sm:gap-8 md:gap-10 p-4 sm:p-6 md:p-8 text-center relative">
      <PlayfulBackground />
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-primary">
        {corrected}/{total} fixed!
      </h1>
      <p className="text-xl sm:text-2xl md:text-3xl">{headline}</p>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap justify-center max-w-3xl">
        <BigButton onClick={() => nav('/dashboard')}>Back to dashboard</BigButton>
      </div>
    </div>
  );
}
