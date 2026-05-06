import type { ModuleTheme } from '../../theme/moduleTheme.ts';
import type { ModuleProgress } from '../../services/moduleProgress.ts';
import { ProgressRing } from '../../components/ProgressRing.tsx';

interface Props {
  theme: ModuleTheme;
  progress: ModuleProgress;
  onClick: () => void;
}

export function ModuleTile({ theme, progress, onClick }: Props) {
  const pct = progress.total > 0 ? (progress.answered / progress.total) * 100 : 0;
  const mastered = progress.answered === progress.total && progress.total > 0;
  return (
    <button
      onClick={onClick}
      className={`${theme.bgTint} rounded-2xl p-4 sm:p-5 text-left shadow-md hover:scale-[1.02] transition-transform focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none w-full`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-3xl sm:text-4xl">{theme.emoji}</div>
          <div className={`text-lg sm:text-xl font-bold ${theme.accentText} mt-1`}>{theme.label}</div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">
            {mastered ? '🏆 Mastered!' : `${progress.answered} / ${progress.total}`}
          </div>
        </div>
        <ProgressRing size="sm" percent={pct} color={theme.ringColor} showLabel />
      </div>
    </button>
  );
}
