import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemedDashboard } from './ThemedDashboard.tsx';

vi.mock('../../stores/profileStore.ts', () => ({
  useProfileStore: Object.assign(
    (sel: (s: unknown) => unknown) => sel({ profile: { id: 'p1', username: 'Sparkle Cat', avatar: '🐱', age_band: '5-6' }, logout: () => {} }),
    { getState: () => ({ profile: { id: 'p1', username: 'Sparkle Cat', avatar: '🐱', age_band: '5-6' }, logout: () => {} }) },
  ),
}));

vi.mock('../../services/moduleProgress.ts', () => ({
  computeModuleProgress: vi.fn().mockResolvedValue([
    { moduleId: 'math',     answered: 30, total: 90, lastPlayedAt: null },
    { moduleId: 'vehicles', answered: 5,  total: 50, lastPlayedAt: null },
    { moduleId: 'grammar',  answered: 0,  total: 50, lastPlayedAt: null },
  ]),
}));

beforeEach(() => { sessionStorage.clear(); });

describe('ThemedDashboard', () => {
  it('renders Continue hero for the lowest-progress module', async () => {
    const { getByText } = render(<MemoryRouter><ThemedDashboard /></MemoryRouter>);
    await waitFor(() => expect(getByText(/Continue Grammar/i)).toBeInTheDocument());
  });

  it('shows PickAModule fallback when ALL modules have zero answered', async () => {
    const mod = await import('../../services/moduleProgress.ts');
    (mod.computeModuleProgress as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { moduleId: 'math',     answered: 0, total: 90, lastPlayedAt: null },
      { moduleId: 'vehicles', answered: 0, total: 50, lastPlayedAt: null },
      { moduleId: 'grammar',  answered: 0, total: 50, lastPlayedAt: null },
    ]);
    const { getByText } = render(<MemoryRouter><ThemedDashboard /></MemoryRouter>);
    await waitFor(() => expect(getByText(/Pick a module to start/i)).toBeInTheDocument());
  });

  it('shows all-mastered fallback when every module is at 100%', async () => {
    const mod = await import('../../services/moduleProgress.ts');
    (mod.computeModuleProgress as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { moduleId: 'math',     answered: 90, total: 90, lastPlayedAt: null },
      { moduleId: 'vehicles', answered: 50, total: 50, lastPlayedAt: null },
      { moduleId: 'grammar',  answered: 50, total: 50, lastPlayedAt: null },
    ]);
    const { getByText } = render(<MemoryRouter><ThemedDashboard /></MemoryRouter>);
    await waitFor(() => expect(getByText(/mastered everything/i)).toBeInTheDocument());
  });

  it('7-9 pick view renders animals and science tiles alongside the base 3', async () => {
    const mod = await import('../../services/moduleProgress.ts');
    (mod.computeModuleProgress as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { moduleId: 'math',     answered: 0, total: 200, lastPlayedAt: null },
      { moduleId: 'vehicles', answered: 0, total: 50,  lastPlayedAt: null },
      { moduleId: 'grammar',  answered: 0, total: 50,  lastPlayedAt: null },
      { moduleId: 'animals',  answered: 0, total: 250, lastPlayedAt: null },
      { moduleId: 'science',  answered: 0, total: 250, lastPlayedAt: null },
    ]);
    const { getByText } = render(<MemoryRouter><ThemedDashboard /></MemoryRouter>);
    await waitFor(() => expect(getByText(/Pick a module to start/i)).toBeInTheDocument());
    expect(getByText('Animals')).toBeInTheDocument();
    expect(getByText('Science')).toBeInTheDocument();
    expect(getByText('Math')).toBeInTheDocument();
    expect(getByText('Vehicles')).toBeInTheDocument();
    expect(getByText('Grammar')).toBeInTheDocument();
  });

  it('7-9 hero view renders the rest including animals and science', async () => {
    const mod = await import('../../services/moduleProgress.ts');
    (mod.computeModuleProgress as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { moduleId: 'math',     answered: 30, total: 200, lastPlayedAt: null },
      { moduleId: 'vehicles', answered: 5,  total: 50,  lastPlayedAt: null },
      { moduleId: 'grammar',  answered: 0,  total: 50,  lastPlayedAt: null },
      { moduleId: 'animals',  answered: 10, total: 250, lastPlayedAt: null },
      { moduleId: 'science',  answered: 1,  total: 250, lastPlayedAt: null },
    ]);
    const { getByText } = render(<MemoryRouter><ThemedDashboard /></MemoryRouter>);
    await waitFor(() => expect(getByText(/Continue Grammar/i)).toBeInTheDocument());
    expect(getByText('Animals')).toBeInTheDocument();
    expect(getByText('Science')).toBeInTheDocument();
  });
});
