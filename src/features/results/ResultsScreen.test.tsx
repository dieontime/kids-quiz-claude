import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ResultsScreen } from './ResultsScreen.tsx';
import { useQuizSession, type QuizQuestion } from '../../stores/quizSessionStore.ts';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const sampleQs: QuizQuestion[] = Array.from({ length: 10 }).map((_, i) => ({
  module_id: 'math', age_band: '5-6',
  question_text: `Q${i}`, options: ['a','b','c','d'], correct_index: 0,
  explanation: '', source: 'procedural:math', external_id: `m${i}`,
}));

beforeEach(() => {
  localStorage.clear();
  useQuizSession.getState().reset();
});

describe('ResultsScreen', () => {
  it('shows score / total when there are questions', () => {
    useQuizSession.setState({ moduleId: 'math', questions: sampleQs, score: 7, currentIndex: 10, answers: [], startedAt: 0 });
    render(<MemoryRouter><ResultsScreen /></MemoryRouter>);
    expect(screen.getByText('7/10')).toBeInTheDocument();
    expect(screen.getByText(/Nice try/i)).toBeInTheDocument();
  });

  it('shows celebration cheer for 8+', () => {
    useQuizSession.setState({ moduleId: 'math', questions: sampleQs, score: 9, currentIndex: 10, answers: [], startedAt: 0 });
    render(<MemoryRouter><ResultsScreen /></MemoryRouter>);
    expect(screen.getByText(/Awesome/i)).toBeInTheDocument();
  });

  it('renders Back button only when no questions in store', () => {
    render(<MemoryRouter><ResultsScreen /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.queryByText(/\d+\/\d+/)).toBeNull();
  });
});
