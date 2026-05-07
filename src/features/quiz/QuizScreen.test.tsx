import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QuizScreen } from './QuizScreen.tsx';
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

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/quiz/:moduleId" element={<QuizScreen />} />
        <Route path="/results" element={<div>RESULTS-PAGE</div>} />
        <Route path="/login" element={<div>LOGIN-PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('QuizScreen', () => {
  it('loads questions on mount and shows the first one', async () => {
    renderAt('/quiz/math');
    expect(await screen.findByText(/Q0/)).toBeInTheDocument();
    expect(svc.fetchQuizQuestions).toHaveBeenCalledWith({ moduleId: 'math', count: 10 });
  });

  it('redirects to /login if no profile', async () => {
    useProfileStore.setState({ token: null, profile: null });
    renderAt('/quiz/math');
    await waitFor(() => expect(screen.getByText(/LOGIN-PAGE/)).toBeInTheDocument());
  });

  it('on answer: logs, shows flash, advances on Next; navigates to /results when done', async () => {
    renderAt('/quiz/math');
    await screen.findByText(/Q0/);

    // Answer Q0 (correct option index 0)
    await userEvent.click(screen.getByText('1'));
    await screen.findByText(/Explain 0/);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Q1 (correct index 1)
    await screen.findByText(/Q1/);
    await userEvent.click(screen.getByText('2'));
    await screen.findByText(/Explain 1/);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Q2 (correct index 2)
    await screen.findByText(/Q2/);
    await userEvent.click(screen.getByText('3'));
    await screen.findByText(/Explain 2/);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => expect(screen.getByText(/RESULTS-PAGE/)).toBeInTheDocument());
    expect(svc.recordQuiz).toHaveBeenCalledWith('p1', 'math', 3, 3, expect.any(Number));
    expect(svc.logAnswered).toHaveBeenCalledTimes(3);
  });

  it('shows error if no questions available', async () => {
    vi.mocked(svc.fetchQuizQuestions).mockResolvedValueOnce([]);
    renderAt('/quiz/animals');
    expect(await screen.findByText(/no questions available/i)).toBeInTheDocument();
  });

  it('loading screen shows a fun fact while questions are loading', async () => {
    // Hold the fetch open so we can observe the loading state.
    let resolveFetch: (qs: QuizQuestion[]) => void = () => {};
    vi.mocked(svc.fetchQuizQuestions).mockImplementationOnce(
      () => new Promise<QuizQuestion[]>((resolve) => { resolveFetch = resolve; }),
    );
    renderAt('/quiz/math');
    expect(await screen.findByText(/Did you know\?/i)).toBeInTheDocument();
    // Progress bar is rendered as a progressbar role.
    expect(screen.getByRole('progressbar', { name: /loading progress/i })).toBeInTheDocument();
    // Resolve the fetch so the test can complete cleanly.
    await act(async () => {
      resolveFetch(sampleQs);
    });
    await screen.findByText(/Q0/);
  });
});
