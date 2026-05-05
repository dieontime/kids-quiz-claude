import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BigButton } from './BigButton.tsx';

describe('BigButton', () => {
  it('renders label and fires onClick', async () => {
    const onClick = vi.fn();
    render(<BigButton onClick={onClick}>Go</BigButton>);
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables when disabled prop set', () => {
    render(<BigButton onClick={() => {}} disabled>Nope</BigButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
