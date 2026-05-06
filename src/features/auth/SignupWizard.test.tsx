import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SignupWizard } from './SignupWizard.tsx';
import * as auth from '../../lib/auth.ts';

vi.mock('../../lib/auth.ts');

describe('SignupWizard', () => {
  beforeEach(() => {
    vi.mocked(auth.checkUsernameAvailable).mockResolvedValue(true);
    vi.mocked(auth.signup).mockResolvedValue({
      profile: { id: 'p1', username: 'PizzaDragon', avatar: 'avatar_cat', age_band: '5-6' },
      recoveryCode: 'PURPLE-FROG-1234',
    });
  });

  it('walks through all 5 steps and signs up', async () => {
    render(<MemoryRouter><SignupWizard /></MemoryRouter>);

    // Step 1: username
    await userEvent.type(screen.getByPlaceholderText(/silly name/i), 'PizzaDragon');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 2: PIN
    for (const e of ['🐱','⚡','🍕','🌈']) {
      await userEvent.click(screen.getAllByText(e)[0]);
    }
    await userEvent.click(screen.getByRole('button', { name: /done/i }));

    // Step 3: avatar — first AvatarPicker button
    // The wizard shows 12 avatar buttons + a Next button. The first 12 are avatars.
    const avatarButtons = screen.getAllByRole('button').slice(0, 12);
    await userEvent.click(avatarButtons[0]);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 4: age band
    await userEvent.click(screen.getByRole('button', { name: /5-6/i }));

    // Step 5: recovery shown
    expect(await screen.findByText(/PURPLE-FROG-1234/)).toBeInTheDocument();
    expect(auth.signup).toHaveBeenCalledWith(expect.objectContaining({
      username: 'PizzaDragon',
      pin: ['🐱','⚡','🍕','🌈'],
      avatar: 'avatar_cat',
      age_band: '5-6',
    }));
  });

  it('shows username suggestions when name is taken', async () => {
    vi.mocked(auth.checkUsernameAvailable).mockResolvedValueOnce(false);
    render(<MemoryRouter><SignupWizard /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText(/silly name/i), 'PizzaDragon');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(await screen.findByText(/already taken|already in use/i)).toBeInTheDocument();
    // Should show 3 suggested alternatives starting with "PizzaDragon"
    const suggestions = screen.getAllByRole('button').filter(b => /^PizzaDragon\d+$/.test(b.textContent ?? ''));
    expect(suggestions.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects profanity and shows error', async () => {
    render(<MemoryRouter><SignupWizard /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText(/silly name/i), 'SmartAss');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(await screen.findByText(/try another name|please try a different name/i)).toBeInTheDocument();
  });
});
