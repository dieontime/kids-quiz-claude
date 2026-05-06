import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionCard } from './QuestionCard.tsx';
import type { QuizQuestion } from '../../stores/quizSessionStore.ts';
import { MODULE_THEMES } from '../../theme/moduleTheme.ts';

const q: QuizQuestion = {
  module_id: 'math', age_band: '5-6',
  question_text: 'What is 2 + 2?',
  options: ['1','2','3','4'], correct_index: 3,
  explanation: '2 plus 2 is 4', source: 'procedural:math', external_id: 'math:5-6:2+2',
};

describe('QuestionCard', () => {
  it('renders question + 4 options', () => {
    render(<QuestionCard question={q} onAnswer={() => {}} />);
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('calls onAnswer with picked index', async () => {
    const onAnswer = vi.fn();
    render(<QuestionCard question={q} onAnswer={onAnswer} />);
    await userEvent.click(screen.getByText('4'));
    expect(onAnswer).toHaveBeenCalledWith(3);
  });

  it('disables further taps after answer', async () => {
    const onAnswer = vi.fn();
    render(<QuestionCard question={q} onAnswer={onAnswer} />);
    await userEvent.click(screen.getByText('4'));
    await userEvent.click(screen.getByText('1'));
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it('uses the theme accent text class on option labels when theme is provided', () => {
    const q = {
      module_id: 'math' as const,
      age_band: '5-6' as const,
      question_text: 'What is 1+1?',
      options: ['1', '2', '3', '4'],
      correct_index: 1,
      explanation: 'one plus one is two',
      source: 'procedural:math',
      external_id: 'math:5-6:1+1',
    };
    const { container } = render(<QuestionCard question={q} onAnswer={() => {}} theme={MODULE_THEMES.math} />);
    const buttons = container.querySelectorAll('button');
    expect(Array.from(buttons).some(b => b.className.includes('text-blue-700'))).toBe(true);
  });
});
