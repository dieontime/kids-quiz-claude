import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TimeAttackQuizScreen } from './TimeAttackQuizScreen.tsx';
import * as svc from '../../services/questionService.ts';
import { useProfileStore } from '../../stores/profileStore.ts';
import { useQuizSession, type QuizQuestion } from '../../stores/quizSessionStore.ts';

vi.mock('../../services/questionService.ts');

const sampleQs: QuizQuestion[] = Array.from({ length: 3 }).map((_, i) => ({
  module_id: 'math', age_band: '5-6',
  question_text: `Q${i}: pick the right one`,
  options: ['1','2','3','4'], correct_index: i % 4,
  explanation: `Explain ${i}`, source: 'procedural:math', external_id: `m${i}`,
}));

beforeEach(() => {
  localStorage.clear();
  useQuizSession.getState().reset();
  useProfileStore.setState({
    token: 't', profile: { id: 'p1', username: 'X', avatar: 'avatar_cat', age_band: '5-6' },
  });
  vi.mocked(svc.fetchQuizQuestions).mockResolvedValue(sampleQs);
  vi.mocked(svc.logAnswered).mockResolvedValue(undefined);
  vi.mocked(svc.recordQuiz).mockResolvedValue(undefined);
});

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/quiz/time-attack']}>
      <Routes>
        <Route path="/quiz/time-attack" element={<TimeAttackQuizScreen />} />
        <Route path="/results" element={<div>RESULTS-PAGE</div>} />
        <Route path="/login" element={<div>LOGIN-PAGE</div>} />
        <Route path="/dashboard" element={<div>DASHBOARD-PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TimeAttackQuizScreen', () => {
  it('fetches the random module and renders timer + question card', async () => {
    renderScreen();
    expect(await screen.findByText(/Q0/)).toBeInTheDocument();
    expect(svc.fetchQuizQuestions).toHaveBeenCalledWith({ moduleId: 'random', count: 10 });
    expect(screen.getByRole('timer', { name: /time remaining/i })).toBeInTheDocument();
    expect(screen.getByText(/Time Attack/i)).toBeInTheDocument();
  });

  it('redirects to /login if no profile', async () => {
    useProfileStore.setState({ token: null, profile: null });
    renderScreen();
    await waitFor(() => expect(screen.getByText(/LOGIN-PAGE/)).toBeInTheDocument());
  });

  it('on timer elapse: logs incorrect answer and shows the explanation', async () => {
    vi.useFakeTimers();
    try {
      renderScreen();
      // findByText doesn't work with fake timers easily; use a small advance
      // to flush the fetch microtask, then check synchronously.
      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });
      // The fetch promise resolves; React renders Q0.
      await act(async () => { vi.advanceTimersByTime(0); });
      expect(screen.getByText(/Q0/)).toBeInTheDocument();

      // Advance well past 15s so the timer fires onElapsed.
      await act(async () => { vi.advanceTimersByTime(16000); });
      // Flush the async logAnswered call
      await act(async () => { await Promise.resolve(); });

      expect(svc.logAnswered).toHaveBeenCalledWith('p1', 'm0', false);
      // FeedbackFlash for the elapsed question is shown.
      expect(screen.getByText(/Explain 0/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('back button resets session and navigates to /dashboard', async () => {
    renderScreen();
    await screen.findByText(/Q0/);
    await userEvent.click(screen.getByRole('button', { name: /back to dashboard/i }));
    await waitFor(() => expect(screen.getByText(/DASHBOARD-PAGE/)).toBeInTheDocument());
    expect(useQuizSession.getState().questions).toEqual([]);
  });
});
