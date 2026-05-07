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

  it('tracks lastMasteredModuleId set via flagMastery and cleared on reset', () => {
    const { flagMastery, reset } = useQuizSession.getState();
    flagMastery('math');
    expect(useQuizSession.getState().lastMasteredModuleId).toBe('math');
    reset();
    expect(useQuizSession.getState().lastMasteredModuleId).toBeNull();
  });

  it('wrongAnswers() returns only the questions whose answer was incorrect', () => {
    useQuizSession.getState().start('math', sampleQs);
    useQuizSession.getState().answer(0); // Q0 correct
    useQuizSession.getState().answer(2); // Q1 wrong
    useQuizSession.getState().answer(3); // Q2 wrong
    const wrong = useQuizSession.getState().wrongAnswers();
    expect(wrong).toHaveLength(2);
    expect(wrong.map(q => q.external_id)).toEqual(['m1', 'm2']);
  });

  it('startReview() populates reviewQuestions and sets isReviewSession=true', () => {
    useQuizSession.getState().start('math', sampleQs);
    useQuizSession.getState().answer(0); // correct
    useQuizSession.getState().answer(2); // wrong
    useQuizSession.getState().answer(3); // wrong
    useQuizSession.getState().startReview();
    const s = useQuizSession.getState();
    expect(s.isReviewSession).toBe(true);
    expect(s.reviewQuestions).toHaveLength(2);
    expect(s.questions).toHaveLength(2);
    expect(s.moduleId).toBe('review');
    expect(s.currentIndex).toBe(0);
    expect(s.score).toBe(0);
    expect(s.answers).toHaveLength(0);
  });

  it('reset() clears review state', () => {
    useQuizSession.getState().start('math', sampleQs);
    useQuizSession.getState().answer(2);
    useQuizSession.getState().answer(2);
    useQuizSession.getState().answer(2);
    useQuizSession.getState().startReview();
    expect(useQuizSession.getState().isReviewSession).toBe(true);
    useQuizSession.getState().reset();
    const s = useQuizSession.getState();
    expect(s.isReviewSession).toBe(false);
    expect(s.reviewQuestions).toHaveLength(0);
  });

  it('endReview() turns off the review flag', () => {
    useQuizSession.getState().start('math', sampleQs);
    useQuizSession.getState().answer(2);
    useQuizSession.getState().answer(2);
    useQuizSession.getState().answer(2);
    useQuizSession.getState().startReview();
    useQuizSession.getState().endReview();
    expect(useQuizSession.getState().isReviewSession).toBe(false);
  });
});
