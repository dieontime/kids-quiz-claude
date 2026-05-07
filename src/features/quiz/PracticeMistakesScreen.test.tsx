import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PracticeMistakesScreen } from './PracticeMistakesScreen.tsx';
import { useProfileStore } from '../../stores/profileStore.ts';
import { useQuizSession, type QuizQuestion } from '../../stores/quizSessionStore.ts';

const fetchIncorrect = vi.fn<(p: string) => Promise<QuizQuestion[]>>();

vi.mock('../../services/incorrectQuestions.ts', () => ({
  fetchIncorrectQuestions: (...args: unknown[]) => fetchIncorrect(...(args as [string])),
  countIncorrect: vi.fn(),
}));

vi.mock('../../services/questionService.ts', () => ({
  logAnswered: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  localStorage.clear();
  fetchIncorrect.mockReset();
  useQuizSession.getState().reset();
  useProfileStore.setState({
    token: 't', profile: { id: 'p1', username: 'X', avatar: 'avatar_cat', age_band: '5-6' },
  });
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/quiz/practice" element={<PracticeMistakesScreen />} />
        <Route path="/dashboard" element={<div>DASHBOARD-PAGE</div>} />
        <Route path="/login" element={<div>LOGIN-PAGE</div>} />
        <Route path="/practice-results" element={<div>PRACTICE-RESULTS-PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PracticeMistakesScreen', () => {
  it('redirects to /dashboard when there are no incorrect questions', async () => {
    fetchIncorrect.mockResolvedValueOnce([]);
    renderAt('/quiz/practice');
    await waitFor(() => expect(screen.getByText(/DASHBOARD-PAGE/)).toBeInTheDocument());
  });

  it('redirects to /login when there is no profile', async () => {
    useProfileStore.setState({ token: null, profile: null });
    fetchIncorrect.mockResolvedValueOnce([]);
    renderAt('/quiz/practice');
    await waitFor(() => expect(screen.getByText(/LOGIN-PAGE/)).toBeInTheDocument());
  });

  it('back button resets session and navigates to /dashboard', async () => {
    const qs: QuizQuestion[] = [{
      module_id: 'vehicles', age_band: '5-6',
      question_text: 'P0: pick one', options: ['a','b','c','d'], correct_index: 0,
      explanation: 'Explain P0', source: 'static:vehicles', external_id: 'vehicles_v1_001',
    }];
    fetchIncorrect.mockResolvedValueOnce(qs);
    renderAt('/quiz/practice');
    await screen.findByText(/P0/);

    await userEvent.click(screen.getByRole('button', { name: /back to dashboard/i }));
    await waitFor(() => expect(screen.getByText(/DASHBOARD-PAGE/)).toBeInTheDocument());
    expect(useQuizSession.getState().questions).toEqual([]);
  });
});
