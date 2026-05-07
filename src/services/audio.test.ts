import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const playMock = vi.fn();
const volumeMock = vi.fn();
const muteMock = vi.fn();
const HowlMock = vi.fn(function HowlCtor() {
  return { play: playMock, volume: volumeMock, mute: muteMock, on: vi.fn() };
});

vi.mock('howler', () => ({ Howl: HowlMock }));

beforeEach(async () => {
  playMock.mockClear();
  volumeMock.mockClear();
  muteMock.mockClear();
  HowlMock.mockClear();
  const { audio } = await import('./audio.ts');
  audio._reset();
});

afterEach(() => { vi.resetModules(); });

describe('audio service', () => {
  it('preload constructs a Howl per sound (5 ui + 5 stingers = 10)', async () => {
    const { audio } = await import('./audio.ts');
    audio.preload();
    expect(HowlMock).toHaveBeenCalledTimes(10);
  });

  it('playUI plays the named UI sound after preload', async () => {
    const { audio } = await import('./audio.ts');
    audio.preload();
    audio.playUI('correct');
    expect(playMock).toHaveBeenCalled();
  });

  it('playUI is a no-op before preload', async () => {
    const { audio } = await import('./audio.ts');
    audio.playUI('tap');
    expect(playMock).not.toHaveBeenCalled();
  });

  it('playStinger plays the module stinger', async () => {
    const { audio } = await import('./audio.ts');
    audio.preload();
    audio.playStinger('math');
    expect(playMock).toHaveBeenCalled();
  });

  it('setVolume updates each Howl', async () => {
    const { audio } = await import('./audio.ts');
    audio.preload();
    audio.setVolume(0.7);
    expect(volumeMock).toHaveBeenCalledWith(0.7);
  });

  it('setMuted updates each Howl', async () => {
    const { audio } = await import('./audio.ts');
    audio.preload();
    audio.setMuted(true);
    expect(muteMock).toHaveBeenCalledWith(true);
  });
});
