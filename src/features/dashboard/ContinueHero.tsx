import type { ModuleTheme } from '../../theme/moduleTheme.ts';
import type { ModuleProgress } from '../../services/moduleProgress.ts';
import { ProgressRing } from '../../components/ProgressRing.tsx';

interface Props {
  theme: ModuleTheme;
  progress: ModuleProgress;
  onResume: () => void;
  onSurprise: () => void;
  allMastered?: boolean;
}

export function ContinueHero({ theme, progress, onResume, onSurprise, allMastered }: Props) {
  if (allMastered) {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg">
        <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Wow! You've mastered everything! 🏆</div>
        <p className="text-base sm:text-lg md:text-xl mb-5 opacity-90">Try a Surprise Mix to keep practicing.</p>
        <button
          onClick={onSurprise}
          className="bg-white text-purple-700 font-bold text-lg sm:text-xl md:text-2xl px-6 py-3 sm:py-4 rounded-2xl shadow focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none"
        >
          Surprise Me ✨
        </button>
      </div>
    );
  }

  const pct = progress.total > 0 ? (progress.answered / progress.total) * 100 : 0;
  return (
    <div className={`${theme.accentBg} text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg`}>
      <div className="text-xs sm:text-sm md:text-base font-bold opacity-80 uppercase tracking-wide">Pick up where you left off</div>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center mt-2">
        <div className="flex-1">
          <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold">Continue {theme.label} {theme.emoji}</div>
          <div className="text-base sm:text-lg md:text-xl mt-2 opacity-90">{progress.answered} / {progress.total} answered</div>
          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={onResume}
              className="bg-white text-gray-900 font-bold text-lg sm:text-xl md:text-2xl px-6 py-3 sm:py-4 rounded-2xl shadow focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none"
            >
              Resume →
            </button>
            <button
              onClick={onSurprise}
              className="bg-white/20 text-white border-2 border-white font-bold text-base sm:text-lg md:text-xl px-5 py-3 sm:py-4 rounded-2xl focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none"
            >
              Surprise Me ✨
            </button>
          </div>
        </div>
        <div className="hidden sm:block">
          <ProgressRing size="lg" percent={pct} color="stroke-white" showLabel />
        </div>
      </div>
    </div>
  );
}
