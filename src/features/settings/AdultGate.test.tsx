import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { AdultGate } from './AdultGate.tsx';

beforeEach(() => sessionStorage.clear());

describe('AdultGate', () => {
  it('calls onPass when "63" is submitted', () => {
    const onPass = vi.fn();
    const { getByLabelText, getByText } = render(<AdultGate onPass={onPass} onCancel={() => {}} />);
    fireEvent.change(getByLabelText(/9 × 7/i), { target: { value: '63' } });
    fireEvent.click(getByText(/Submit/i));
    expect(onPass).toHaveBeenCalled();
  });

  it('shows error and clears input on wrong answer', () => {
    const onPass = vi.fn();
    const { getByLabelText, getByText } = render(<AdultGate onPass={onPass} onCancel={() => {}} />);
    const input = getByLabelText(/9 × 7/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '62' } });
    fireEvent.click(getByText(/Submit/i));
    expect(onPass).not.toHaveBeenCalled();
    expect(getByText(/not quite/i)).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  it('locks for 30 seconds after 3 wrong answers', async () => {
    const onCancel = vi.fn();
    const { getByLabelText, getByText } = render(<AdultGate onPass={() => {}} onCancel={onCancel} />);
    for (let i = 0; i < 3; i++) {
      fireEvent.change(getByLabelText(/9 × 7/i), { target: { value: '99' } });
      fireEvent.click(getByText(/Submit/i));
    }
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
    expect(sessionStorage.getItem('kq_adult_gate_lock')).toBeTruthy();
  });

  it('refuses to render input field if cooldown is active', () => {
    sessionStorage.setItem('kq_adult_gate_lock', String(Date.now() + 15_000));
    const { getByText, queryByLabelText } = render(<AdultGate onPass={() => {}} onCancel={() => {}} />);
    expect(getByText(/Try again in/i)).toBeInTheDocument();
    expect(queryByLabelText(/9 × 7/i)).toBeNull();
  });
});
