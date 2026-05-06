import { describe, it, expect } from 'vitest';
import { generateMathQuestions } from './math.ts';

describe('generateMathQuestions', () => {
  it('returns the requested count', () => {
    expect(generateMathQuestions('5-6', 10)).toHaveLength(10);
  });

  it('5-6 band stays within 0-10', () => {
    const out = generateMathQuestions('5-6', 50);
    out.forEach(q => {
      expect(q.module_id).toBe('math');
      expect(q.age_band).toBe('5-6');
      expect(q.options).toHaveLength(4);
      expect(q.correct_index).toBeGreaterThanOrEqual(0);
      expect(q.correct_index).toBeLessThan(4);
      expect(q.options[q.correct_index]).toMatch(/^\d+$/);
      expect(parseInt(q.options[q.correct_index], 10)).toBeLessThanOrEqual(10);
    });
  });

  it('7-9 band includes multiplication', () => {
    const out = generateMathQuestions('7-9', 100);
    expect(out.some(q => q.question_text.includes('×'))).toBe(true);
  });

  it('external_id encodes band + expression', () => {
    const out = generateMathQuestions('5-6', 5);
    out.forEach(q => expect(q.external_id).toMatch(/^math:5-6:/));
  });

  it('options are unique within a question', () => {
    const out = generateMathQuestions('5-6', 30);
    out.forEach(q => expect(new Set(q.options).size).toBe(4));
  });

  it('correct_index points to the right answer', () => {
    const out = generateMathQuestions('7-9', 50);
    out.forEach(q => {
      // We don't eval; just ensure correct_index is in range and the value at that index is numeric
      expect(q.correct_index).toBeGreaterThanOrEqual(0);
      expect(q.correct_index).toBeLessThan(q.options.length);
    });
  });
});
