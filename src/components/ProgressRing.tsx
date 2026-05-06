import { useEffect, useRef } from 'react';

interface Props {
  percent: number;
  color: string;
  size: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onMastery?: () => void;
}

const SIZES = {
  sm: { px: 60, stroke: 5,  font: 'text-xs' },
  md: { px: 96, stroke: 7,  font: 'text-base' },
  lg: { px: 200, stroke: 14, font: 'text-3xl font-bold' },
} as const;

export function ProgressRing({ percent, color, size, showLabel, onMastery }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  const mastered = clamped === 100;
  const dim = SIZES[size];
  const r = (dim.px - dim.stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - clamped / 100);

  const fired = useRef(false);
  useEffect(() => {
    if (mastered && !fired.current) {
      fired.current = true;
      onMastery?.();
    }
    if (!mastered) fired.current = false;
  }, [mastered, onMastery]);

  return (
    <svg width={dim.px} height={dim.px} className="block">
      <circle
        cx={dim.px / 2}
        cy={dim.px / 2}
        r={r}
        fill="none"
        strokeWidth={dim.stroke}
        className="stroke-black/10"
      />
      <circle
        cx={dim.px / 2}
        cy={dim.px / 2}
        r={r}
        fill="none"
        strokeWidth={dim.stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${dim.px / 2} ${dim.px / 2})`}
        className={`transition-[stroke-dashoffset] duration-700 ${mastered ? 'stroke-yellow-400' : color}`}
      />
      {showLabel && (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          className={`fill-current ${dim.font}`}
        >
          {Math.round(clamped)}%
        </text>
      )}
    </svg>
  );
}
