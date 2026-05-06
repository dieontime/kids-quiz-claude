import { describe, it, expect, beforeEach } from 'vitest';
import { useSettings } from './settingsStore.ts';

beforeEach(() => {
  localStorage.clear();
  useSettings.getState()._resetForTests();
});

describe('settingsStore', () => {
  it('has expected defaults', () => {
    const s = useSettings.getState();
    expect(s.soundOn).toBe(true);
    expect(s.volume).toBe(0.5);
    expect(s.reducedMotion).toBe(false);
    expect(s.largeText).toBe(false);
    expect(s.dyslexiaFont).toBe(false);
    expect(s.ageBand).toBe('5-6');
  });

  it('setSoundOn toggles the flag', () => {
    useSettings.getState().setSoundOn(false);
    expect(useSettings.getState().soundOn).toBe(false);
  });

  it('setVolume clamps to [0,1]', () => {
    useSettings.getState().setVolume(1.5);
    expect(useSettings.getState().volume).toBe(1);
    useSettings.getState().setVolume(-0.2);
    expect(useSettings.getState().volume).toBe(0);
  });

  it('persists soundOn / volume / reducedMotion / largeText / dyslexiaFont to localStorage', () => {
    useSettings.getState().setSoundOn(false);
    useSettings.getState().setVolume(0.25);
    useSettings.getState().setReducedMotion(true);
    useSettings.getState().setLargeText(true);
    useSettings.getState().setDyslexiaFont(true);

    const raw = localStorage.getItem('quiz-settings-v1');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.soundOn).toBe(false);
    expect(parsed.state.volume).toBe(0.25);
    expect(parsed.state.reducedMotion).toBe(true);
    expect(parsed.state.largeText).toBe(true);
    expect(parsed.state.dyslexiaFont).toBe(true);
  });

  it('does NOT persist ageBand (session-only override)', () => {
    useSettings.getState().setAgeBand('7-9');
    const raw = localStorage.getItem('quiz-settings-v1');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    expect(parsed.state.ageBand).toBeUndefined();
  });

  it('initFromProfile sets ageBand from profile', () => {
    useSettings.getState().initFromProfile('7-9');
    expect(useSettings.getState().ageBand).toBe('7-9');
  });
});
