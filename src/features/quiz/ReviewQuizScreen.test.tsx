import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ReviewQuizScreen } from './ReviewQuizScreen.tsx';
import { useProfileStore } from '../../stores/profileStore.ts';
import { useQuizSession } from '../../stores/quizSessionStore.ts';

vi.mock('../../services/questionService.ts', () => ({
  logAnswered: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  localStorage.clear();
  useQuizSession.getState().reset();
  useProfileStore.setState({
    token: 't', profile: { id: 'p1', username: 'X', avatar: 'avatar_cat', age_band: '5-6' },
  });
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/quiz/review" element={<ReviewQuizScreen />} />
        <Route path="/dashboard" element={<div>DASHBOARD-PAGE</div>} />
        <Route path="/login" element={<div>LOGIN-PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ReviewQuizScreen', () => {
  it('redirects to /dashboard when no review session is active', async () => {
    renderAt('/quiz/review');
    await waitFor(() => expect(screen.getByText(/DASHBOARD-PAGE/)).toBeInTheDocument());
  });

  it('redirects to /dashboard when review session has no questions', async () => {
    useQuizSession.setState({ isReviewSession: true, questions: [], reviewQuestions: [] });
    renderAt('/quiz/review');
    await waitFor(() => expect(screen.getByText(/DASHBOARD-PAGE/)).toBeInTheDocument());
  });

  it('redirects to /login when there is no profile', async () => {
    useProfileStore.setState({ token: null, profile: null });
    renderAt('/quiz/review');
    await waitFor(() => expect(screen.getByText(/LOGIN-PAGE/)).toBeInTheDocument());
  });
});
