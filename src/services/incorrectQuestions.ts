import vehiclesJson from '../../data/vehicles.json';
import grammarJson from '../../data/grammar.json';
import animalsJson from '../../data/animals.json';
import scienceJson from '../../data/science.json';
import type { QuizQuestion } from '../stores/quizSessionStore.ts';
import { backend } from './backend.ts';

const POOL_BY_PREFIX: Record<string, QuizQuestion[]> = {
  vehicles: vehiclesJson as QuizQuestion[],
  grammar:  grammarJson  as QuizQuestion[],
  animals:  animalsJson  as QuizQuestion[],
  science:  scienceJson  as QuizQuestion[],
};

function prefixOf(id: string): string {
  // 'vehicles_v1_001' -> 'vehicles'; 'math:5-6:abc' -> 'math'
  const m = id.match(/^([a-z]+)/);
  return m ? m[1] : '';
}

export async function fetchIncorrectQuestions(profileId: string): Promise<QuizQuestion[]> {
  const ids = await backend.getIncorrectExternalIds(profileId);
  // Skip math: math questions are procedurally generated, not reconstructable from ID
  const result: QuizQuestion[] = [];
  for (const id of ids) {
    const p = prefixOf(id);
    const pool = POOL_BY_PREFIX[p];
    if (!pool) continue;
    const q = pool.find(x => x.external_id === id);
    if (q) result.push(q);
  }
  return result;
}

export async function countIncorrect(profileId: string): Promise<number> {
  const qs = await fetchIncorrectQuestions(profileId);
  return qs.length;
}
