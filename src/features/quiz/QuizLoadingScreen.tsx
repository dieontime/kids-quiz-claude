import { useEffect, useState } from 'react';
import { PlayfulBackground } from '../../components/PlayfulBackground.tsx';
import { useSettings } from '../../stores/settingsStore.ts';
import type { ModuleTheme } from '../../theme/moduleTheme.ts';

const FUN_FACTS: string[] = [
  'A group of flamingos is called a flamboyance!',
  'Octopuses have three hearts and blue blood!',
  'A day on Venus is longer than a year on Venus!',
  'Honey never spoils — archaeologists have found 3000-year-old jars still good!',
  'Sharks existed before trees!',
  'Bananas are berries, but strawberries aren’t!',
  'A bolt of lightning is hotter than the surface of the Sun!',
  'Cows have best friends!',
  'Sloths sleep up to 20 hours a day!',
  'An adult cat has 30 teeth, a kitten has 26!',
  'Butterflies taste with their feet!',
  'Hummingbirds can fly backwards!',
];

const FACT_INTERVAL_MS = 3000;

interface QuizLoadingScreenProps {
  theme: ModuleTheme;
}

export function QuizLoadingScreen({ theme }: QuizLoadingScreenProps) {
  const reduced = useSettings(s => s.reducedMotion);
  const [factIdx, setFactIdx] = useState(() => Math.floor(Math.random() * FUN_FACTS.length));
  // Trigger the progress-bar transition by toggling from 0 -> 90 after mount.
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFactIdx(i => (i + 1) % FUN_FACTS.length);
    }, FACT_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (reduced) return;
    // Next frame so the CSS transition fires from 0 to 90.
    const id = requestAnimationFrame(() => setProgress(90));
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 sm:gap-8 p-6 relative">
      <PlayfulBackground />
      <div className="text-5xl sm:text-6xl" aria-hidden>{theme.emoji}</div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">
        {reduced ? 'Loading your quiz…' : 'Getting your questions ready! 🚀'}
      </h1>

      {reduced ? (
        <div className="flex items-center gap-3" role="status" aria-live="polite">
          <span className="inline-block w-4 h-4 rounded-full bg-primary animate-pulse" />
          <span className="text-lg sm:text-xl">Hang tight…</span>
        </div>
      ) : (
        <div
          className="w-full max-w-md h-4 sm:h-5 bg-white/70 rounded-full overflow-hidden border-2 border-primary/30 shadow-inner"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Loading progress"
        >
          <div
            className={`h-full ${theme.accentBg} rounded-full`}
            style={{
              width: `${progress}%`,
              transition: 'width 2s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </div>
      )}

      <div
        className="max-w-md text-center text-base sm:text-lg md:text-xl text-slate-700 px-4"
        aria-live="polite"
      >
        <span className="font-semibold">🌟 Did you know?</span>{' '}
        <span>{FUN_FACTS[factIdx]}</span>
      </div>
    </div>
  );
}
