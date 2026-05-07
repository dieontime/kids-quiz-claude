export type ModuleId = 'math' | 'vehicles' | 'grammar' | 'animals' | 'science';

export interface ModuleTheme {
  id: ModuleId;
  label: string;
  emoji: string;
  bgTint: string;
  ringColor: string;
  accentText: string;
  accentBg: string;
  stinger: string;
  // For procedural modules (math), denominator depends on age band.
  // For JSON modules, null — denominator computed at runtime as count of
  // JSON entries matching the active profile's age band.
  milestoneTotal: { '5-6': number; '7-9': number } | null;
}

export const MODULE_THEMES: Record<ModuleId, ModuleTheme> = {
  math: {
    id: 'math',
    label: 'Math',
    emoji: '🔢',
    bgTint: 'bg-blue-100',
    ringColor: 'stroke-blue-500',
    accentText: 'text-blue-700',
    accentBg: 'bg-blue-500',
    stinger: '/sounds/stingers/math.mp3',
    milestoneTotal: { '5-6': 90, '7-9': 200 },
  },
  vehicles: {
    id: 'vehicles',
    label: 'Vehicles',
    emoji: '🚗',
    bgTint: 'bg-red-100',
    ringColor: 'stroke-red-500',
    accentText: 'text-red-700',
    accentBg: 'bg-red-500',
    stinger: '/sounds/stingers/vehicles.mp3',
    milestoneTotal: null,
  },
  grammar: {
    id: 'grammar',
    label: 'Grammar',
    emoji: '📚',
    bgTint: 'bg-violet-100',
    ringColor: 'stroke-violet-500',
    accentText: 'text-violet-700',
    accentBg: 'bg-violet-500',
    stinger: '/sounds/stingers/grammar.mp3',
    milestoneTotal: null,
  },
  animals: {
    id: 'animals',
    label: 'Animals',
    emoji: '🐾',
    bgTint: 'bg-green-100',
    ringColor: 'stroke-green-500',
    accentText: 'text-green-700',
    accentBg: 'bg-green-500',
    stinger: '/sounds/stingers/animals.mp3',
    milestoneTotal: null,
  },
  science: {
    id: 'science',
    label: 'Science',
    emoji: '🔬',
    bgTint: 'bg-amber-100',
    ringColor: 'stroke-amber-500',
    accentText: 'text-amber-700',
    accentBg: 'bg-amber-500',
    stinger: '/sounds/stingers/science.mp3',
    milestoneTotal: null,
  },
};

export const DEFAULT_THEME: ModuleTheme = {
  id: 'math',
  label: 'Surprise Mix',
  emoji: '✨',
  bgTint: 'bg-purple-100',
  ringColor: 'stroke-purple-500',
  accentText: 'text-purple-700',
  accentBg: 'bg-purple-500',
  stinger: '/sounds/stingers/math.mp3',
  milestoneTotal: null,
};

export function themeFor(id: string): ModuleTheme {
  return (MODULE_THEMES as Record<string, ModuleTheme>)[id] ?? DEFAULT_THEME;
}
