import { generateMathQuestions } from '../generators/math.ts';
import type { Profile } from './mockBackend.ts';
import { backend } from './backend.ts';
import type { QuizQuestion } from '../stores/quizSessionStore.ts';
import vehiclesJson from '../../data/vehicles.json';
import grammarJson from '../../data/grammar.json';
import animalsJson from '../../data/animals.json';
import scienceJson from '../../data/science.json';

export type ModuleId = 'math' | 'animals' | 'science' | 'vehicles' | 'grammar' | 'random';

export interface FetchArgs {
  moduleId: ModuleId;
  count: number;
}

type StaticModule = 'vehicles' | 'grammar' | 'animals' | 'science';

const STATIC_POOLS: Record<StaticModule, QuizQuestion[]> = {
  vehicles: vehiclesJson as QuizQuestion[],
  grammar:  grammarJson  as QuizQuestion[],
  animals:  animalsJson  as QuizQuestion[],
  science:  scienceJson  as QuizQuestion[],
};

const MODULES_FOR_BAND: Record<'5-6' | '7-9', Array<'math' | StaticModule>> = {
  '5-6': ['math', 'vehicles', 'grammar'],
  '7-9': ['math', 'animals', 'science', 'vehicles', 'grammar'],
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function staticPoolFiltered(
  profileId: string,
  module: StaticModule,
  band: '5-6' | '7-9',
  count: number,
): Promise<QuizQuestion[]> {
  const pool = STATIC_POOLS[module].filter(q => q.age_band === band || q.age_band === 'both');
  const seen = new Set(await backend.getAnsweredExternalIds(profileId, [module]));
  const unseen = pool.filter(q => !seen.has(q.external_id));
  return shuffle(unseen).slice(0, count);
}

export async function fetchQuizQuestions({ moduleId, count }: FetchArgs): Promise<QuizQuestion[]> {
  const profile: Profile | null = (await import('../stores/profileStore.ts')).useProfileStore.getState().profile;
  if (!profile) throw new Error('no profile');
  const band = profile.age_band;

  if (moduleId === 'math') {
    return generateMathQuestions(band, count) as QuizQuestion[];
  }
  if (moduleId === 'vehicles' || moduleId === 'grammar' || moduleId === 'animals' || moduleId === 'science') {
    return staticPoolFiltered(profile.id, moduleId, band, count);
  }
  // random
  const mathCount = Math.floor(count * 0.3);
  const otherModules = MODULES_FOR_BAND[band].filter((m): m is StaticModule => m !== 'math');
  const mathQs = generateMathQuestions(band, mathCount) as QuizQuestion[];
  const others: QuizQuestion[] = [];
  for (const m of otherModules) {
    const remaining = count - mathCount - others.length;
    if (remaining <= 0) break;
    const take = Math.ceil(remaining / (otherModules.length - otherModules.indexOf(m)));
    others.push(...await staticPoolFiltered(profile.id, m, band, take));
  }
  return shuffle([...mathQs, ...others]).slice(0, count);
}

export async function logAnswered(profileId: string, questionExternalId: string, correct: boolean): Promise<void> {
  return backend.logAnswered(profileId, questionExternalId, correct);
}

export async function recordQuiz(profileId: string, moduleId: string, score: number, total: number, durationS: number): Promise<void> {
  return backend.recordQuiz(profileId, moduleId, score, total, durationS);
}
