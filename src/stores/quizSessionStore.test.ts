import { describe, it, expect, beforeEach } from 'vitest';
import { useQuizSession, type QuizQuestion } from './quizSessionStore.ts';

const sampleQs: QuizQuestion[] = Array.from({ length: 3 }).map((_, i) => ({
  module_id: 'math', age_band: '5-6',
  question_text: `Q${i}`, options: ['a','b','c','d'], correct_index: 0,
  explanation: '', source: 'procedural:math', external_id: `m${i}`,
}));

describe('quizSessionStore', () => {
  beforeEach(() => { localStorage.clear(); useQuizSession.getState().reset(); });

  it('start() initialises a session', () => {
    useQuizSession.getState().start('math', sampleQs);
    expect(useQuizSession.getState().questions).toHaveLength(3);
    expect(useQuizSession.getState().currentIndex).toBe(0);
    expect(useQuizSession.getState().score).toBe(0);
  });

  it('answer() records correctness and advances', () => {
    useQuizSession.getState().start('math', sampleQs);
    useQuizSession.getState().answer(0);
    expect(useQuizSession.getState().score).toBe(1);
    expect(useQuizSession.getState().currentIndex).toBe(1);
    useQuizSession.getState().answer(2);
    expect(useQuizSession.getState().score).toBe(1);
    expect(useQuizSession.getState().currentIndex).toBe(2);
  });

  it('isComplete after answering all', () => {
    useQuizSession.getState().start('math', sampleQs);
    useQuizSession.getState().answer(0);
    useQuizSession.getState().answer(0);
    useQuizSession.getState().answer(0);
    expect(useQuizSession.getState().isComplete()).toBe(true);
  });

  it('reset() clears the session', () => {
    useQuizSession.getState().start('math', sampleQs);
    useQuizSession.getState().answer(0);
    useQuizSession.getState().reset();
    expect(useQuizSession.getState().questions).toHaveLength(0);
    expect(useQuizSession.getState().score).toBe(0);
    expect(useQuizSession.getState().moduleId).toBeNull();
  });
});
