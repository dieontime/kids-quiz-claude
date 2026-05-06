import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useProfileStore } from '../../stores/profileStore.ts';
import { useSettings } from '../../stores/settingsStore.ts';
import { computeModuleProgress, type ModuleProgress } from '../../services/moduleProgress.ts';
import { MODULE_THEMES, type ModuleId } from '../../theme/moduleTheme.ts';
import { ContinueHero } from './ContinueHero.tsx';
import { ModuleStrip } from './ModuleStrip.tsx';
import { SettingsDrawer } from '../settings/SettingsDrawer.tsx';
import { mockBackend } from '../../services/mockBackend.ts';

const MASTERY_SNAPSHOT_KEY = 'kq_mastery_snapshot';

function readSnapshot(): Record<string, boolean> {
  try { return JSON.parse(sessionStorage.getItem(MASTERY_SNAPSHOT_KEY) ?? '{}'); }
  catch { return {}; }
}
function writeSnapshot(snap: Record<string, boolean>): void {
  sessionStorage.setItem(MASTERY_SNAPSHOT_KEY, JSON.stringify(snap));
}

export function ThemedDashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const profile = useProfileStore(s => s.profile);
  const logout = useProfileStore(s => s.logout);
  const ageBand = useSettings(s => s.ageBand);
  const initFromProfile = useSettings(s => s.initFromProfile);
  const nav = useNavigate();
  const [progress, setProgress] = useState<ModuleProgress[] | null>(null);

  useEffect(() => { if (profile) initFromProfile(profile.age_band); }, [profile, initFromProfile]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    computeModuleProgress(profile.id, ageBand).then(p => { if (!cancelled) setProgress(p); });
    return () => { cancelled = true; };
  }, [profile, ageBand]);

  useEffect(() => {
    if (!progress) return;
    const snap = readSnapshot();
    let fired = false;
    const next: Record<string, boolean> = {};
    for (const p of progress) {
      const mastered = p.total > 0 && p.answered >= p.total;
      next[p.moduleId] = mastered;
      if (mastered && !snap[p.moduleId] && !fired) {
        confetti({ particleCount: 250, spread: 90, origin: { y: 0.6 } });
        fired = true;
      }
    }
    writeSnapshot(next);
  }, [progress]);

  const view = useMemo(() => {
    if (!progress) return null;
    const allZero = progress.every(p => p.answered === 0);
    const allMastered = progress.every(p => p.total > 0 && p.answered >= p.total);
    if (allMastered) return { kind: 'mastered' as const };
    if (allZero) return { kind: 'pick' as const };
    const sorted = [...progress].sort((a, b) => {
      const pa = a.total > 0 ? a.answered / a.total : 0;
      const pb = b.total > 0 ? b.answered / b.total : 0;
      if (pa !== pb) return pa - pb;
      return a.moduleId.localeCompare(b.moduleId);
    });
    const hero = sorted[0];
    const rest = progress.filter(p => p.moduleId !== hero.moduleId);
    return { kind: 'hero' as const, hero, rest };
  }, [progress]);

  if (!profile) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 md:p-8 gap-4 sm:gap-6">
      <header className="w-full flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Hi, {profile.username}! {profile.avatar}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            className="px-3 py-2 text-base sm:text-lg font-bold text-primary border-2 border-primary rounded-lg hover:bg-primary/5 focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none"
          >
            ⚙ Settings
          </button>
          <button
            onClick={logout}
            className="px-3 py-2 text-base sm:text-lg font-bold text-primary border-2 border-primary rounded-lg hover:bg-primary/5 focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none"
          >
            Log out
          </button>
        </div>
      </header>

      {view === null && <div className="flex-1 flex items-center justify-center text-xl">Loading…</div>}

      {view?.kind === 'pick' && (
        <div className="flex-1 flex flex-col gap-6 sm:gap-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center">Pick a module to start!</h2>
          <ModuleStrip
            items={(['math', 'vehicles', 'grammar'] as ModuleId[]).map(id => ({
              theme: MODULE_THEMES[id],
              progress: progress!.find(p => p.moduleId === id)!,
            }))}
            onTileClick={(id) => nav(`/quiz/${id}`)}
            onSurpriseMix={() => nav('/quiz/random')}
          />
        </div>
      )}

      {view?.kind === 'hero' && (
        <div className="flex-1 flex flex-col gap-6 sm:gap-8">
          <ContinueHero
            theme={MODULE_THEMES[view.hero.moduleId]}
            progress={view.hero}
            onResume={() => nav(`/quiz/${view.hero.moduleId}`)}
            onSurprise={() => nav('/quiz/random')}
          />
          <ModuleStrip
            items={view.rest.map(p => ({ theme: MODULE_THEMES[p.moduleId], progress: p }))}
            onTileClick={(id) => nav(`/quiz/${id}`)}
            onSurpriseMix={() => nav('/quiz/random')}
          />
        </div>
      )}

      {view?.kind === 'mastered' && (
        <div className="flex-1 flex flex-col justify-center">
          <ContinueHero
            theme={MODULE_THEMES.math}
            progress={progress![0]}
            onResume={() => nav('/quiz/random')}
            onSurprise={() => nav('/quiz/random')}
            allMastered
          />
        </div>
      )}
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onResetProgress={() => {
          mockBackend.reset();
          setSettingsOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
