import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmojiPinKeypad, PIN_ICONS } from './EmojiPinKeypad.tsx';

describe('EmojiPinKeypad', () => {
  it('renders all 12 icons', () => {
    render(<EmojiPinKeypad onComplete={() => {}} />);
    PIN_ICONS.forEach(icon => {
      expect(screen.getAllByText(icon).length).toBeGreaterThan(0);
    });
  });

  it('calls onComplete with 4-icon sequence after Done', async () => {
    const onComplete = vi.fn();
    render(<EmojiPinKeypad onComplete={onComplete} />);
    await userEvent.click(screen.getAllByText('🐱')[0]);
    await userEvent.click(screen.getAllByText('⚡')[0]);
    await userEvent.click(screen.getAllByText('🍕')[0]);
    await userEvent.click(screen.getAllByText('🌈')[0]);
    await userEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(onComplete).toHaveBeenCalledWith(['🐱', '⚡', '🍕', '🌈']);
  });

  it('Clear empties the entered sequence', async () => {
    const onComplete = vi.fn();
    render(<EmojiPinKeypad onComplete={onComplete} />);
    await userEvent.click(screen.getAllByText('🐱')[0]);
    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    await userEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('ignores taps after 4 icons entered', async () => {
    const onComplete = vi.fn();
    render(<EmojiPinKeypad onComplete={onComplete} />);
    for (let i = 0; i < 6; i++) {
      await userEvent.click(screen.getAllByText('🐱')[0]);
    }
    await userEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(onComplete).toHaveBeenCalledWith(['🐱', '🐱', '🐱', '🐱']);
  });
});
