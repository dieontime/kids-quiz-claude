import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the backend module before importing the SUT so the dynamic
// `backend.getIncorrectExternalIds` reads our stub.
const getIncorrect = vi.fn<(p: string) => Promise<string[]>>();
vi.mock('./backend.ts', () => ({
  backend: {
    getIncorrectExternalIds: (...args: unknown[]) => getIncorrect(...(args as [string])),
  },
  backendKind: 'mock' as const,
}));

import { fetchIncorrectQuestions, countIncorrect } from './incorrectQuestions.ts';

beforeEach(() => {
  getIncorrect.mockReset();
});

describe('fetchIncorrectQuestions', () => {
  it('returns matching static-module questions for known external_ids', async () => {
    getIncorrect.mockResolvedValueOnce(['vehicles_v1_001', 'grammar_v1_001']);
    const qs = await fetchIncorrectQuestions('p1');
    expect(qs).toHaveLength(2);
    expect(qs[0].external_id).toBe('vehicles_v1_001');
    expect(qs[1].external_id).toBe('grammar_v1_001');
  });

  it('skips ids whose prefix does not match a known static pool (e.g. math)', async () => {
    getIncorrect.mockResolvedValueOnce([
      'math:5-6:1+2',          // procedural — skipped
      'vehicles_v1_001',       // kept
      'somethingweird_v1_001', // unknown prefix — skipped
    ]);
    const qs = await fetchIncorrectQuestions('p1');
    expect(qs).toHaveLength(1);
    expect(qs[0].external_id).toBe('vehicles_v1_001');
  });

  it('returns [] for empty input', async () => {
    getIncorrect.mockResolvedValueOnce([]);
    const qs = await fetchIncorrectQuestions('p1');
    expect(qs).toEqual([]);
  });
});

describe('countIncorrect', () => {
  it('counts only ids that resolve to real questions', async () => {
    getIncorrect.mockResolvedValueOnce([
      'math:5-6:1+2',     // skipped
      'vehicles_v1_001',  // 1
      'grammar_v1_001',   // 2
    ]);
    expect(await countIncorrect('p1')).toBe(2);
  });
});
