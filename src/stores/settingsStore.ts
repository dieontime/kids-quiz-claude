import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AgeBand = '5-6' | '7-9';

interface SettingsState {
  soundOn: boolean;
  volume: number;
  reducedMotion: boolean;
  largeText: boolean;
  dyslexiaFont: boolean;
  ageBand: AgeBand;
  setSoundOn: (v: boolean) => void;
  setVolume: (v: number) => void;
  setReducedMotion: (v: boolean) => void;
  setLargeText: (v: boolean) => void;
  setDyslexiaFont: (v: boolean) => void;
  setAgeBand: (v: AgeBand) => void;
  initFromProfile: (band: AgeBand) => void;
  _resetForTests: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      soundOn: true,
      volume: 0.5,
      reducedMotion: false,
      largeText: false,
      dyslexiaFont: false,
      ageBand: '5-6',
      setSoundOn: (v) => set({ soundOn: v }),
      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
      setReducedMotion: (v) => set({ reducedMotion: v }),
      setLargeText: (v) => set({ largeText: v }),
      setDyslexiaFont: (v) => set({ dyslexiaFont: v }),
      setAgeBand: (v) => set({ ageBand: v }),
      initFromProfile: (band) => set({ ageBand: band }),
      _resetForTests: () => set({
        soundOn: true,
        volume: 0.5,
        reducedMotion: false,
        largeText: false,
        dyslexiaFont: false,
        ageBand: '5-6',
      }),
    }),
    {
      name: 'quiz-settings-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        soundOn: s.soundOn,
        volume: s.volume,
        reducedMotion: s.reducedMotion,
        largeText: s.largeText,
        dyslexiaFont: s.dyslexiaFont,
      }),
    },
  ),
);
