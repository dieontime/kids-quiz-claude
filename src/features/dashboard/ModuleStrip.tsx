import type { ModuleTheme } from '../../theme/moduleTheme.ts';
import type { ModuleProgress } from '../../services/moduleProgress.ts';
import { ModuleTile } from './ModuleTile.tsx';

interface Item {
  theme: ModuleTheme;
  progress: ModuleProgress;
}

interface Props {
  items: Item[];
  onTileClick: (moduleId: string) => void;
  onSurpriseMix: () => void;
}

export function ModuleStrip({ items, onTileClick, onSurpriseMix }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
      {items.map(({ theme, progress }) => (
        <ModuleTile
          key={theme.id}
          theme={theme}
          progress={progress}
          onClick={() => onTileClick(theme.id)}
        />
      ))}
      <button
        onClick={onSurpriseMix}
        className="bg-purple-100 rounded-2xl p-4 sm:p-5 shadow-md hover:scale-[1.02] transition-transform focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none text-left"
      >
        <div className="text-3xl sm:text-4xl">✨</div>
        <div className="text-lg sm:text-xl font-bold text-purple-700 mt-1">Surprise Mix</div>
        <div className="text-xs sm:text-sm text-gray-600 mt-1">A bit of everything</div>
      </button>
    </div>
  );
}
