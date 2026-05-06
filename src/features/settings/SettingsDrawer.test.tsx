import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { SettingsDrawer } from './SettingsDrawer.tsx';
import { useSettings } from '../../stores/settingsStore.ts';

vi.mock('../../services/audio.ts', () => ({
  audio: { setMuted: vi.fn(), setVolume: vi.fn(), playUI: vi.fn(), preload: vi.fn(), playStinger: vi.fn() },
}));

vi.mock('../../stores/profileStore.ts', () => ({
  useProfileStore: Object.assign(
    (sel: (s: unknown) => unknown) => sel({ logout: vi.fn() }),
    { getState: () => ({ logout: vi.fn() }) },
  ),
}));

beforeEach(() => {
  localStorage.clear();
  useSettings.getState()._resetForTests();
});

describe('SettingsDrawer', () => {
  it('does not render when open is false', () => {
    const { container } = render(<SettingsDrawer open={false} onClose={() => {}} onResetProgress={() => {}} />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('toggles soundOn via the Sound switch', () => {
    const { getByLabelText } = render(<SettingsDrawer open onClose={() => {}} onResetProgress={() => {}} />);
    expect(useSettings.getState().soundOn).toBe(true);
    fireEvent.click(getByLabelText(/^Sound$/i));
    expect(useSettings.getState().soundOn).toBe(false);
  });

  it('toggles reducedMotion / largeText / dyslexiaFont', () => {
    const { getByLabelText } = render(<SettingsDrawer open onClose={() => {}} onResetProgress={() => {}} />);
    fireEvent.click(getByLabelText(/Reduce motion/i));
    expect(useSettings.getState().reducedMotion).toBe(true);
    fireEvent.click(getByLabelText(/Large text/i));
    expect(useSettings.getState().largeText).toBe(true);
    fireEvent.click(getByLabelText(/Dyslexia/i));
    expect(useSettings.getState().dyslexiaFont).toBe(true);
  });

  it('opens AdultGate when Reset is clicked, calls onResetProgress on pass', () => {
    const onReset = vi.fn();
    const { getByText, getByLabelText } = render(<SettingsDrawer open onClose={() => {}} onResetProgress={onReset} />);
    fireEvent.click(getByText(/Reset my progress/i));
    fireEvent.change(getByLabelText(/9 × 7/i), { target: { value: '63' } });
    fireEvent.click(getByText(/Submit/i));
    expect(onReset).toHaveBeenCalled();
  });

  it('closes via ESC', () => {
    const onClose = vi.fn();
    render(<SettingsDrawer open onClose={onClose} onResetProgress={() => {}} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
