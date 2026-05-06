import { mockBackend } from './mockBackend.ts';
import { MODULE_THEMES, type ModuleId } from '../theme/moduleTheme.ts';
import vehiclesJson from '../../data/vehicles.json';
import grammarJson from '../../data/grammar.json';
import type { AgeBand } from '../stores/settingsStore.ts';

interface JsonEntry { external_id: string; age_band: '5-6' | '7-9' | 'both' }

const POOLS: Record<'vehicles' | 'grammar', JsonEntry[]> = {
  vehicles: vehiclesJson as JsonEntry[],
  grammar:  grammarJson  as JsonEntry[],
};

export interface ModuleProgress {
  moduleId: ModuleId;
  answered: number;
  total: number;
  lastPlayedAt: number | null;
}

function jsonTotalForBand(module: 'vehicles' | 'grammar', band: AgeBand): number {
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
  const allAnswered = await mockBackend.getAnsweredExternalIds(profileId, ['math', 'vehicles', 'grammar']);
  const order: ModuleId[] = ['math', 'vehicles', 'grammar'];
  return order.map(moduleId => {
    const total = moduleId === 'math'
      ? MODULE_THEMES.math.milestoneTotal![band]
      : jsonTotalForBand(moduleId, band);
    const rawAnswered = countAnsweredForModule(allAnswered, moduleId, band);
    const answered = Math.min(rawAnswered, total);
    return { moduleId, answered, total, lastPlayedAt: null };
  });
}
