import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../../stores/settingsStore.ts';

export interface TimeAttackTimerProps {
  durationS: number;
  onElapsed: () => void;
  paused: boolean;
  resetKey: string | number;
}

type Phase = 'calm' | 'warm' | 'urgent';

function phaseFor(t: number): Phase {
  return t > 7 ? 'calm' : t > 3 ? 'warm' : 'urgent';
}

const PHASE_CLASSES: Record<Phase, { bar: string; text: string; border: string }> = {
  calm:   { bar: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  warm:   { bar: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  urgent: { bar: 'bg-red-100',   text: 'text-red-800',   border: 'border-red-300' },
};

export function TimeAttackTimer({ durationS, onElapsed, paused, resetKey }: TimeAttackTimerProps) {
  const reduced = useSettings(s => s.reducedMotion);
  // remaining is the *displayed* integer seconds (using ceil semantics, see below).
  const [remaining, setRemaining] = useState(durationS);
  // startedAt drives the percentage-width transition; recomputed when resetKey changes.
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const elapsedFiredRef = useRef(false);

  // Reset everything when the resetKey changes (e.g., new question).
  useEffect(() => {
    elapsedFiredRef.current = false;
    setRemaining(durationS);
    setStartedAt(Date.now());
  }, [resetKey, durationS]);

  // Tick the displayed seconds every ~250ms while running.
  // Use Math.ceil so "1" stays visible for the final ~1s window.
  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) return;

    const id = setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      const remainingMs = Math.max(0, durationS * 1000 - elapsedMs);
      const secs = Math.ceil(remainingMs / 1000);
      setRemaining(secs);
      if (remainingMs <= 0 && !elapsedFiredRef.current) {
        elapsedFiredRef.current = true;
        onElapsed();
      }
    }, 250);
    return () => clearInterval(id);
  }, [paused, remaining, startedAt, durationS, onElapsed]);

  // Width as a percentage of total time. When paused, freeze on the last
  // computed remaining-seconds value so the bar visibly stops shrinking.
  const widthPct = paused
    ? Math.max(0, Math.min(100, (remaining / durationS) * 100))
    : Math.max(0, Math.min(100, (remaining / durationS) * 100));

  // For the smooth shrink we want to set width = (remaining/duration)*100 and
  // let CSS transition over 1s linear. The displayed integer seconds drive the
  // width because they update on each setInterval tick (4x/sec). On reset we
  // jump back to 100% — disable transition for that single frame to avoid an
  // animated rewind. Simplest: rely on the fact that remaining is set to
  // durationS synchronously in the resetKey effect, and accept the brief
  // 1s linear back-fill animation. With reduced motion we skip the transition.
  const phase = phaseFor(remaining);
  const cls = PHASE_CLASSES[phase];

  // A subtle, slow pulse only in the urgent phase. Inline keyframes via style
  // tag would be heavier than just toggling opacity via a CSS class. We use
  // inline animation that respects reduced motion.
  const pulseStyle = !reduced && phase === 'urgent'
    ? { animation: 'kq-time-attack-pulse 1.6s ease-in-out infinite' }
    : undefined;

  return (
    <div
      role="timer"
      aria-label="Time remaining"
      className={`relative w-full max-w-3xl h-10 sm:h-12 rounded-full border-4 ${cls.border} bg-white/70 overflow-hidden shadow-inner`}
    >
      {/* The shrinking inner bar */}
      <div
        data-testid="time-attack-bar"
        data-phase={phase}
        className={`absolute inset-y-0 left-0 ${cls.bar} rounded-full`}
        style={{
          width: `${widthPct}%`,
          transition: reduced ? 'none' : 'width 1s linear',
          ...pulseStyle,
        }}
      />
      {/* Centered seconds label, sits above the bar */}
      <div className={`absolute inset-0 flex items-center justify-center text-xl sm:text-2xl font-extrabold ${cls.text}`}>
        <span>{Math.max(0, remaining)}s</span>
      </div>
      {/* Local keyframes — keep subtle (opacity range 0.85→1.0). Defined inline
          so we don't need a global CSS edit. */}
      <style>{`@keyframes kq-time-attack-pulse {
        0%, 100% { opacity: 1; }
        50%      { opacity: 0.8; }
      }`}</style>
    </div>
  );
}
