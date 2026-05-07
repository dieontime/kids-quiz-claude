import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ReviewQuizScreen } from './ReviewQuizScreen.tsx';
import { useProfileStore } from '../../stores/profileStore.ts';
import { useQuizSession, type QuizQuestion } from '../../stores/quizSessionStore.ts';

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

  it('back button ends review, resets session, and navigates to /dashboard', async () => {
    const reviewQs: QuizQuestion[] = [{
      module_id: 'math', age_band: '5-6',
      question_text: 'R0: pick one', options: ['1','2','3','4'], correct_index: 0,
      explanation: 'Explain R0', source: 'procedural:math', external_id: 'r0',
    }];
    useQuizSession.setState({
      isReviewSession: true, questions: reviewQs, reviewQuestions: reviewQs,
      currentIndex: 0, answers: [], score: 0, startedAt: Date.now(),
    });
    renderAt('/quiz/review');
    await screen.findByText(/R0/);

    await userEvent.click(screen.getByRole('button', { name: /back to dashboard/i }));
    await waitFor(() => expect(screen.getByText(/DASHBOARD-PAGE/)).toBeInTheDocument());
    expect(useQuizSession.getState().isReviewSession).toBe(false);
    expect(useQuizSession.getState().questions).toEqual([]);
  });
});
