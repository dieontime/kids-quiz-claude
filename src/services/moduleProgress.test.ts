import { describe, it, expect, beforeEach, vi } from 'vitest';
import { computeModuleProgress } from './moduleProgress.ts';

vi.mock('./mockBackend.ts', () => ({
  mockBackend: {
    getAnsweredExternalIds: vi.fn(),
  },
}));
vi.mock('../../data/vehicles.json', () => ({ default: [
  { external_id: 'v1', age_band: '5-6' },
  { external_id: 'v2', age_band: '5-6' },
  { external_id: 'v3', age_band: 'both' },
] }));
vi.mock('../../data/grammar.json', () => ({ default: [
  { external_id: 'g1', age_band: '5-6' },
] }));

import { mockBackend } from './mockBackend.ts';

beforeEach(() => {
  (mockBackend.getAnsweredExternalIds as ReturnType<typeof vi.fn>).mockReset();
});

describe('computeModuleProgress', () => {
  it('returns 3 modules in fixed order: math, vehicles, grammar', async () => {
    (mockBackend.getAnsweredExternalIds as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const result = await computeModuleProgress('p1', '5-6');
    expect(result.map(r => r.moduleId)).toEqual(['math', 'vehicles', 'grammar']);
  });

  it('math 5-6 denominator is 90', async () => {
    (mockBackend.getAnsweredExternalIds as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const result = await computeModuleProgress('p1', '5-6');
    expect(result.find(r => r.moduleId === 'math')!.total).toBe(90);
  });

  it('math 7-9 denominator is 200', async () => {
    (mockBackend.getAnsweredExternalIds as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const result = await computeModuleProgress('p1', '7-9');
    expect(result.find(r => r.moduleId === 'math')!.total).toBe(200);
  });

  it('vehicles 5-6 denominator counts JSON entries with age_band 5-6 or both', async () => {
    (mockBackend.getAnsweredExternalIds as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const result = await computeModuleProgress('p1', '5-6');
    expect(result.find(r => r.moduleId === 'vehicles')!.total).toBe(3);
  });

  it('answered counts only ids matching the module prefix or pool', async () => {
    (mockBackend.getAnsweredExternalIds as ReturnType<typeof vi.fn>).mockResolvedValue([
      'math:5-6:1+1', 'math:5-6:2+2', 'v1', 'unknown:foo',
    ]);
    const result = await computeModuleProgress('p1', '5-6');
    expect(result.find(r => r.moduleId === 'math')!.answered).toBe(2);
    expect(result.find(r => r.moduleId === 'vehicles')!.answered).toBe(1);
    expect(result.find(r => r.moduleId === 'grammar')!.answered).toBe(0);
  });

  it('clamps answered count at total (no over-100% rings)', async () => {
    const ids: string[] = [];
    for (let a = 1; a <= 9; a++) for (let b = 1; b <= 10 - a; b++) ids.push(`math:5-6:${a}+${b}`);
    for (let a = 2; a <= 10; a++) for (let b = 1; b <= a - 1; b++) ids.push(`math:5-6:${a}-${b}`);
    ids.push('extra-stale-id-from-old-version');
    (mockBackend.getAnsweredExternalIds as ReturnType<typeof vi.fn>).mockResolvedValue(ids);
    const result = await computeModuleProgress('p1', '5-6');
    const math = result.find(r => r.moduleId === 'math')!;
    expect(math.answered).toBeLessThanOrEqual(math.total);
  });
});
