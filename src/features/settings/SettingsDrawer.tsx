import { useEffect, useState } from 'react';
import { useSettings, type AgeBand } from '../../stores/settingsStore.ts';
import { audio } from '../../services/audio.ts';
import { useProfileStore } from '../../stores/profileStore.ts';
import { AdultGate } from './AdultGate.tsx';

interface Props {
  open: boolean;
  onClose: () => void;
  onResetProgress: () => void;
}

interface SwitchProps { label: string; value: boolean; onChange: (v: boolean) => void; }
function Switch({ label, value, onChange }: SwitchProps) {
  return (
    <label className="flex items-center justify-between gap-3 py-3 cursor-pointer">
      <span className="text-lg">{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="w-6 h-6"
      />
    </label>
  );
}

export function SettingsDrawer({ open, onClose, onResetProgress }: Props) {
  const s = useSettings();
  const logout = useProfileStore(st => st.logout);
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => { audio.setMuted(!s.soundOn); }, [s.soundOn]);
  useEffect(() => { audio.setVolume(s.volume); }, [s.volume]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <aside
        role="dialog"
        aria-label="Settings"
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto p-5 sm:p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold">Settings</h2>
          <button onClick={onClose} aria-label="Close settings" className="text-3xl px-2 focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none rounded">×</button>
        </div>

        <section className="border-t-2 pt-3">
          <h3 className="text-lg font-bold uppercase tracking-wide text-gray-500 mb-1">Sound</h3>
          <Switch label="Sound" value={s.soundOn} onChange={s.setSoundOn} />
          <label className="flex items-center justify-between gap-3 py-3">
            <span className="text-lg">Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              step={25}
              value={Math.round(s.volume * 100)}
              onChange={(e) => s.setVolume(Number(e.target.value) / 100)}
              aria-label="Volume"
              className="w-32"
            />
          </label>
        </section>

        <section className="border-t-2 pt-3 mt-2">
          <h3 className="text-lg font-bold uppercase tracking-wide text-gray-500 mb-1">Display</h3>
          <Switch label="Reduce motion" value={s.reducedMotion} onChange={s.setReducedMotion} />
          <Switch label="Large text" value={s.largeText} onChange={s.setLargeText} />
          <Switch label="Dyslexia-friendly font" value={s.dyslexiaFont} onChange={s.setDyslexiaFont} />
        </section>

        <section className="border-t-2 pt-3 mt-2">
          <h3 className="text-lg font-bold uppercase tracking-wide text-gray-500 mb-1">Quiz</h3>
          <label className="flex items-center justify-between gap-3 py-3">
            <span className="text-lg">Age band</span>
            <select
              value={s.ageBand}
              onChange={(e) => s.setAgeBand(e.target.value as AgeBand)}
              className="px-3 py-2 rounded border-2"
            >
              <option value="5-6">5-6 years</option>
              <option value="7-9">7-9 years</option>
            </select>
          </label>
          <p className="text-xs text-gray-500">This setting resets when you log out.</p>
        </section>

        <section className="border-t-2 pt-3 mt-2">
          <h3 className="text-lg font-bold uppercase tracking-wide text-gray-500 mb-1">Account</h3>
          <button onClick={logout} className="w-full text-left py-3 text-lg font-bold text-primary">Log out</button>
          <button onClick={() => setShowGate(true)} className="w-full text-left py-3 text-lg font-bold text-red-600">Reset my progress</button>
        </section>

        {showGate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
            <AdultGate
              onPass={() => { setShowGate(false); onResetProgress(); }}
              onCancel={() => setShowGate(false)}
            />
          </div>
        )}
      </aside>
    </>
  );
}
