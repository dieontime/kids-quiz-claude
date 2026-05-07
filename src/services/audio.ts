import { Howl } from 'howler';
import type { ModuleId } from '../theme/moduleTheme.ts';

type UiName = 'tap' | 'correct' | 'incorrect' | 'complete' | 'mastery';

const UI_SOURCES: Record<UiName, string> = {
  tap:       '/sounds/ui/tap.mp3',
  correct:   '/sounds/ui/correct.mp3',
  incorrect: '/sounds/ui/incorrect.mp3',
  complete:  '/sounds/ui/complete.mp3',
  mastery:   '/sounds/ui/mastery.mp3',
};

const STINGER_SOURCES: Record<ModuleId, string> = {
  math:     '/sounds/stingers/math.mp3',
  vehicles: '/sounds/stingers/vehicles.mp3',
  grammar:  '/sounds/stingers/grammar.mp3',
  animals:  '/sounds/stingers/animals.mp3',
  science:  '/sounds/stingers/science.mp3',
};

const uiHowls: Partial<Record<UiName, Howl>> = {};
const stingerHowls: Partial<Record<ModuleId, Howl>> = {};
let preloaded = false;

function buildHowl(src: string): Howl {
  return new Howl({ src: [src], volume: 0.5, preload: true });
}

export const audio = {
  preload(): void {
    if (preloaded) return;
    for (const name of Object.keys(UI_SOURCES) as UiName[]) {
      uiHowls[name] = buildHowl(UI_SOURCES[name]);
    }
    for (const id of Object.keys(STINGER_SOURCES) as ModuleId[]) {
      stingerHowls[id] = buildHowl(STINGER_SOURCES[id]);
    }
    preloaded = true;
  },

  playUI(name: UiName): void {
    uiHowls[name]?.play();
  },

  playStinger(id: ModuleId): void {
    stingerHowls[id]?.play();
  },

  setVolume(v: number): void {
    const clamped = Math.max(0, Math.min(1, v));
    for (const h of Object.values(uiHowls)) h?.volume(clamped);
    for (const h of Object.values(stingerHowls)) h?.volume(clamped);
  },

  setMuted(muted: boolean): void {
    for (const h of Object.values(uiHowls)) h?.mute(muted);
    for (const h of Object.values(stingerHowls)) h?.mute(muted);
  },

  _reset(): void {
    preloaded = false;
    for (const k of Object.keys(uiHowls)) delete uiHowls[k as UiName];
    for (const k of Object.keys(stingerHowls)) delete stingerHowls[k as ModuleId];
  },
};
