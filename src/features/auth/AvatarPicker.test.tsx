import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AvatarPicker, AVATARS } from './AvatarPicker.tsx';

describe('AvatarPicker', () => {
  it('renders all avatars', () => {
    render(<AvatarPicker onPick={() => {}} />);
    expect(screen.getAllByRole('button').length).toBe(AVATARS.length);
  });

  it('calls onPick with the avatar id', async () => {
    const onPick = vi.fn();
    render(<AvatarPicker onPick={onPick} />);
    await userEvent.click(screen.getAllByRole('button')[0]);
    expect(onPick).toHaveBeenCalledWith(AVATARS[0]);
  });
});
