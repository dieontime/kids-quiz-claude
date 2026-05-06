import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackFlash } from './FeedbackFlash.tsx';

describe('FeedbackFlash', () => {
  it('shows correct message + explanation', () => {
    render(<FeedbackFlash correct={true} explanation="2 plus 2 is 4" onNext={() => {}} />);
    expect(screen.getByText(/Nice/i)).toBeInTheDocument();
    expect(screen.getByText('2 plus 2 is 4')).toBeInTheDocument();
  });

  it('shows incorrect message + explanation', () => {
    render(<FeedbackFlash correct={false} explanation="2 plus 2 is 4" onNext={() => {}} />);
    expect(screen.getByText(/not quite/i)).toBeInTheDocument();
    expect(screen.getByText('2 plus 2 is 4')).toBeInTheDocument();
  });

  it('Next button calls onNext', async () => {
    const onNext = vi.fn();
    render(<FeedbackFlash correct={true} explanation="x" onNext={onNext} />);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onNext).toHaveBeenCalled();
  });
});
