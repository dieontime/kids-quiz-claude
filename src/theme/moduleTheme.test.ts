import { describe, it, expect } from 'vitest';
import { MODULE_THEMES, DEFAULT_THEME, themeFor, type ModuleId } from './moduleTheme.ts';

describe('moduleTheme', () => {
  it('exposes math, vehicles, grammar themes only (Plan 2 catalog)', () => {
    const ids = Object.keys(MODULE_THEMES).sort();
    expect(ids).toEqual(['grammar', 'math', 'vehicles']);
  });

  it('every theme has all required fields', () => {
    for (const id of Object.keys(MODULE_THEMES) as ModuleId[]) {
      const t = MODULE_THEMES[id];
      expect(t.id).toBe(id);
      expect(t.label.length).toBeGreaterThan(0);
      expect(t.emoji.length).toBeGreaterThan(0);
      expect(t.bgTint).toMatch(/^bg-\w+-\d{2,3}$/);
      expect(t.ringColor).toMatch(/^stroke-\w+-\d{2,3}$/);
      expect(t.accentText).toMatch(/^text-\w+-\d{2,3}$/);
      expect(t.accentBg).toMatch(/^bg-\w+-\d{2,3}$/);
      expect(t.stinger).toMatch(/^\/sounds\/stingers\/.+\.mp3$/);
    }
  });

  it('math has milestone targets per band; vehicles + grammar have null', () => {
    expect(MODULE_THEMES.math.milestoneTotal).toEqual({ '5-6': 90, '7-9': 200 });
    expect(MODULE_THEMES.vehicles.milestoneTotal).toBeNull();
    expect(MODULE_THEMES.grammar.milestoneTotal).toBeNull();
  });

  it('DEFAULT_THEME is the neutral purple used by /quiz/random', () => {
    expect(DEFAULT_THEME.id).toBe('math'); // placeholder id; visual theme is purple
    expect(DEFAULT_THEME.bgTint).toBe('bg-purple-100');
    expect(DEFAULT_THEME.accentBg).toBe('bg-purple-500');
  });

  it('themeFor returns the theme for a known id and DEFAULT_THEME for unknown', () => {
    expect(themeFor('math').accentBg).toBe(MODULE_THEMES.math.accentBg);
    expect(themeFor('random').accentBg).toBe(DEFAULT_THEME.accentBg);
    expect(themeFor('unknown' as ModuleId).accentBg).toBe(DEFAULT_THEME.accentBg);
  });
});
