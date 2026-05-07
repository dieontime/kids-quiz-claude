import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { TimeAttackTimer } from './TimeAttackTimer.tsx';
import { useSettings } from '../../stores/settingsStore.ts';

function advance(ms: number) {
  // setInterval callbacks read Date.now(), so move both clocks forward.
  vi.advanceTimersByTime(ms);
}

beforeEach(() => {
  vi.useFakeTimers();
  useSettings.getState()._resetForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('TimeAttackTimer', () => {
  it('initial state shows the duration value', () => {
    render(
      <TimeAttackTimer durationS={15} onElapsed={() => {}} paused={false} resetKey="q0" />,
    );
    expect(screen.getByRole('timer', { name: /time remaining/i })).toBeInTheDocument();
    expect(screen.getByText('15s')).toBeInTheDocument();
  });

  it('decrements displayed seconds as time advances', () => {
    render(
      <TimeAttackTimer durationS={15} onElapsed={() => {}} paused={false} resetKey="q0" />,
    );
    expect(screen.getByText('15s')).toBeInTheDocument();
    act(() => { advance(1000); });
    // After ~1s elapsed, ceil((15000-1000)/1000) = 14
    expect(screen.getByText('14s')).toBeInTheDocument();
    act(() => { advance(4000); });
    // After ~5s elapsed, ceil(10000/1000) = 10
    expect(screen.getByText('10s')).toBeInTheDocument();
  });

  it('color phase is calm above 7s, warm between 4 and 7, urgent at 3 or below', () => {
    render(
      <TimeAttackTimer durationS={15} onElapsed={() => {}} paused={false} resetKey="q0" />,
    );
    const bar = screen.getByTestId('time-attack-bar');
    expect(bar.getAttribute('data-phase')).toBe('calm');

    // Drop into warm: t=7 means t > 3 && t > 7 false → warm. We need t≤7.
    act(() => { advance(8000); }); // remaining ≈ 7
    expect(bar.getAttribute('data-phase')).toBe('warm');

    // Drop into urgent: t≤3
    act(() => { advance(4000); }); // total 12s elapsed → remaining ≈ 3
    expect(bar.getAttribute('data-phase')).toBe('urgent');
  });

  it('paused=true halts the countdown', () => {
    const { rerender } = render(
      <TimeAttackTimer durationS={15} onElapsed={() => {}} paused={false} resetKey="q0" />,
    );
    act(() => { advance(2000); });
    expect(screen.getByText('13s')).toBeInTheDocument();

    rerender(
      <TimeAttackTimer durationS={15} onElapsed={() => {}} paused={true} resetKey="q0" />,
    );
    act(() => { advance(5000); });
    // Display did not move while paused.
    expect(screen.getByText('13s')).toBeInTheDocument();
  });

  it('resetKey change restarts the timer at duration', () => {
    const { rerender } = render(
      <TimeAttackTimer durationS={15} onElapsed={() => {}} paused={false} resetKey="q0" />,
    );
    act(() => { advance(6000); });
    expect(screen.getByText('9s')).toBeInTheDocument();

    rerender(
      <TimeAttackTimer durationS={15} onElapsed={() => {}} paused={false} resetKey="q1" />,
    );
    // The reset effect should bring remaining back to 15 immediately.
    expect(screen.getByText('15s')).toBeInTheDocument();
  });

  it('onElapsed fires exactly once when time hits 0', () => {
    const onElapsed = vi.fn();
    render(
      <TimeAttackTimer durationS={3} onElapsed={onElapsed} paused={false} resetKey="q0" />,
    );
    expect(onElapsed).not.toHaveBeenCalled();
    act(() => { advance(3000); });
    // Allow the next tick to observe remainingMs<=0
    act(() => { advance(300); });
    expect(onElapsed).toHaveBeenCalledTimes(1);
    // Subsequent ticks must not refire.
    act(() => { advance(2000); });
    expect(onElapsed).toHaveBeenCalledTimes(1);
  });

  it('reduced motion disables the bar transition', () => {
    useSettings.getState().setReducedMotion(true);
    render(
      <TimeAttackTimer durationS={15} onElapsed={() => {}} paused={false} resetKey="q0" />,
    );
    const bar = screen.getByTestId('time-attack-bar');
    expect(bar.style.transition).toBe('none');
  });
});
