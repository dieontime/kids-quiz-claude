import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RecoveryScreen } from './RecoveryScreen.tsx';
import * as auth from '../../lib/auth.ts';

vi.mock('../../lib/auth.ts');

describe('RecoveryScreen', () => {
  beforeEach(() => {
    vi.mocked(auth.recoverPin).mockResolvedValue({ recoveryCode: 'NEW-CODE-9999' });
  });

  it('walks through 3 stages and shows new recovery code', async () => {
    render(<MemoryRouter><RecoveryScreen /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText(/silly name/i), 'PizzaDragon');
    await userEvent.type(screen.getByPlaceholderText(/recovery code/i), 'old-code-1111');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    for (const e of ['🌈','🌈','🌈','🌈']) {
      await userEvent.click(screen.getAllByText(e)[0]);
    }
    await userEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(await screen.findByText(/NEW-CODE-9999/)).toBeInTheDocument();
    expect(auth.recoverPin).toHaveBeenCalledWith('PizzaDragon', 'OLD-CODE-1111', ['🌈','🌈','🌈','🌈']);
  });

  it('uppercases the recovery code as user types', async () => {
    render(<MemoryRouter><RecoveryScreen /></MemoryRouter>);
    const codeInput = screen.getByPlaceholderText(/recovery code/i) as HTMLInputElement;
    await userEvent.type(codeInput, 'lower-case-1234');
    expect(codeInput.value).toBe('LOWER-CASE-1234');
  });

  it('shows error and goes back to creds on recovery failure', async () => {
    vi.mocked(auth.recoverPin).mockRejectedValueOnce(new Error('not recognized'));
    render(<MemoryRouter><RecoveryScreen /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText(/silly name/i), 'X');
    await userEvent.type(screen.getByPlaceholderText(/recovery code/i), 'bad');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    for (const e of ['🌈','🌈','🌈','🌈']) {
      await userEvent.click(screen.getAllByText(e)[0]);
    }
    await userEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(await screen.findByText(/not recognized/i)).toBeInTheDocument();
    // Back on creds stage — username still filled
    expect((screen.getByPlaceholderText(/silly name/i) as HTMLInputElement).value).toBe('X');
  });
});
