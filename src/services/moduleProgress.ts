import { backend } from './backend.ts';
import { MODULE_THEMES, type ModuleId } from '../theme/moduleTheme.ts';
import vehiclesJson from '../../data/vehicles.json';
import grammarJson from '../../data/grammar.json';
import animalsJson from '../../data/animals.json';
import scienceJson from '../../data/science.json';
import type { AgeBand } from '../stores/settingsStore.ts';

interface JsonEntry { external_id: string; age_band: '5-6' | '7-9' | 'both' }

type StaticModule = 'vehicles' | 'grammar' | 'animals' | 'science';

const POOLS: Record<StaticModule, JsonEntry[]> = {
  vehicles: vehiclesJson as JsonEntry[],
  grammar:  grammarJson  as JsonEntry[],
  animals:  animalsJson  as JsonEntry[],
  science:  scienceJson  as JsonEntry[],
};

export interface ModuleProgress {
  moduleId: ModuleId;
  answered: number;
  total: number;
  lastPlayedAt: number | null;
}

function jsonTotalForBand(module: StaticModule, band: AgeBand): number {
  return POOLS[module].filter(e => e.age_band === band || e.age_band === 'both').length;
}

function countAnsweredForModule(allAnswered: string[], moduleId: ModuleId, band: AgeBand): number {
  if (moduleId === 'math') {
    return allAnswered.filter(id => id.startsWith(`math:${band}:`)).length;
  }
  const ids = new Set(POOLS[moduleId].filter(e => e.age_band === band || e.age_band === 'both').map(e => e.external_id));
  return allAnswered.filter(id => ids.has(id)).length;
}

export async function computeModuleProgress(profileId: string, band: AgeBand): Promise<ModuleProgress[]> {
  const baseOrder: ModuleId[] = ['math', 'vehicles', 'grammar'];
  const order: ModuleId[] = band === '7-9' ? [...baseOrder, 'animals', 'science'] : baseOrder;
  const allAnswered = await backend.getAnsweredExternalIds(profileId, order);
  return order.map(moduleId => {
    const total = moduleId === 'math'
      ? MODULE_THEMES.math.milestoneTotal![band]
      : jsonTotalForBand(moduleId, band);
    const rawAnswered = countAnsweredForModule(allAnswered, moduleId, band);
    const answered = Math.min(rawAnswered, total);
    return { moduleId, answered, total, lastPlayedAt: null };
  });
}
