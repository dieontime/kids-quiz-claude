import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginScreen } from './LoginScreen.tsx';
import * as auth from '../../lib/auth.ts';

vi.mock('../../lib/auth.ts');

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.mocked(auth.login).mockResolvedValue({
      id: 'p1', username: 'PizzaDragon', avatar: 'avatar_cat', age_band: '5-6',
    });
  });

  it('logs in with username + 4-icon PIN', async () => {
    render(<MemoryRouter><LoginScreen /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText(/your silly name/i), 'PizzaDragon');
    for (const e of ['🐱','⚡','🍕','🌈']) {
      await userEvent.click(screen.getAllByText(e)[0]);
    }
    await userEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(auth.login).toHaveBeenCalledWith('PizzaDragon', ['🐱','⚡','🍕','🌈']);
  });

  it('shows error message on login failure', async () => {
    vi.mocked(auth.login).mockRejectedValueOnce(new Error('wrong name or PIN'));
    render(<MemoryRouter><LoginScreen /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText(/your silly name/i), 'PizzaDragon');
    for (const e of ['🐱','⚡','🍕','🌈']) {
      await userEvent.click(screen.getAllByText(e)[0]);
    }
    await userEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(await screen.findByText(/wrong name or pin/i)).toBeInTheDocument();
  });

  it('does not show PIN keypad until username is at least 3 chars', () => {
    render(<MemoryRouter><LoginScreen /></MemoryRouter>);
    // Keypad icons shouldn't be on the page yet
    expect(screen.queryByText('🐱')).toBeNull();
  });
});
