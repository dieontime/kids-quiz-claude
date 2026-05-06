import { useSettings } from '../stores/settingsStore.ts';

interface Blob { left: string; top: string; size: string; color: string; delay: string; }
interface Shape { left: string; top: string; size: number; color: string; kind: 'star' | 'heart' | 'circle' | 'sparkle'; delay: string; }

const BLOBS: Blob[] = [
  { left: '4%',  top: '8%',  size: 'w-32 h-32',  color: 'bg-blue-200',   delay: '0s'   },
  { left: '82%', top: '6%',  size: 'w-40 h-40',  color: 'bg-rose-200',   delay: '1.2s' },
  { left: '10%', top: '68%', size: 'w-28 h-28',  color: 'bg-violet-200', delay: '2.4s' },
  { left: '76%', top: '62%', size: 'w-36 h-36',  color: 'bg-amber-200',  delay: '0.6s' },
  { left: '46%', top: '82%', size: 'w-24 h-24',  color: 'bg-green-200',  delay: '1.8s' },
  { left: '90%', top: '36%', size: 'w-20 h-20',  color: 'bg-purple-200', delay: '3s'   },
];

const SHAPES: Shape[] = [
  { left: '18%', top: '22%', size: 56, color: '#FBBF24', kind: 'star',    delay: '0s'   },
  { left: '68%', top: '24%', size: 64, color: '#F472B6', kind: 'heart',   delay: '1.4s' },
  { left: '14%', top: '52%', size: 48, color: '#A78BFA', kind: 'sparkle', delay: '2.6s' },
  { left: '78%', top: '78%', size: 56, color: '#34D399', kind: 'circle',  delay: '0.8s' },
  { left: '52%', top: '14%', size: 40, color: '#60A5FA', kind: 'star',    delay: '2s'   },
  { left: '40%', top: '68%', size: 44, color: '#FB923C', kind: 'sparkle', delay: '0.4s' },
];

function ShapePath({ kind, color, size }: { kind: Shape['kind']; color: string; size: number }) {
  if (kind === 'star') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 9.5l7.1-.6L12 2z"/>
      </svg>
    );
  }
  if (kind === 'heart') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 21s-7-4.5-9.5-9.5C.7 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.3 4 4.5 7.5C19 16.5 12 21 12 21z"/>
      </svg>
    );
  }
  if (kind === 'sparkle') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 2l1.5 7L21 12l-7.5 1.5L12 22l-1.5-7.5L3 12l7.5-1.5L12 2z"/>
      </svg>
    );
  }
  // circle
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <circle cx="12" cy="12" r="9"/>
    </svg>
  );
}

export function PlayfulBackground() {
  const reduced = useSettings(s => s.reducedMotion);
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-rose-50 to-violet-100" />
      {BLOBS.map((b, i) => (
        <div
          key={`b${i}`}
          className={`absolute rounded-full ${b.size} ${b.color} opacity-50 blur-2xl ${reduced ? '' : 'kq-float'}`}
          style={{ left: b.left, top: b.top, animationDelay: b.delay }}
        />
      ))}
      {SHAPES.map((s, i) => (
        <div
          key={`s${i}`}
          className={`absolute opacity-50 ${reduced ? '' : 'kq-float'}`}
          style={{ left: s.left, top: s.top, animationDelay: s.delay }}
        >
          <ShapePath kind={s.kind} color={s.color} size={s.size} />
        </div>
      ))}
    </div>
  );
}
