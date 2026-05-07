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
}

export function ModuleStrip({ items, onTileClick }: Props) {
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
    </div>
  );
}
