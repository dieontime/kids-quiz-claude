import { useState } from 'react';
import { motion } from 'framer-motion';

export const PIN_ICONS = [
  '🐱','🐶','🐰','🐼',
  '⚡','🌈','🌟','🌙',
  '🍕','🍔','🍩','🍎',
] as const;

export type PinIcon = typeof PIN_ICONS[number];
export const PIN_LENGTH = 4;

interface Props {
  onComplete: (pin: PinIcon[]) => void;
}

export function EmojiPinKeypad({ onComplete }: Props) {
  const [entered, setEntered] = useState<PinIcon[]>([]);

  const tap = (icon: PinIcon) => {
    if (entered.length >= PIN_LENGTH) return;
    setEntered([...entered, icon]);
  };

  const clear = () => setEntered([]);
  const done = () => {
    if (entered.length === PIN_LENGTH) onComplete(entered);
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6">
      <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {PIN_ICONS.map(icon => (
          <motion.button
            key={icon}
            whileTap={{ scale: 0.9 }}
            onClick={() => tap(icon)}
            className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-2xl sm:text-3xl md:text-4xl lg:text-5xl bg-white rounded-xl shadow-md border-2 border-transparent active:border-primary"
          >
            {icon}
          </motion.button>
        ))}
      </div>
      <div className="flex gap-2 sm:gap-3 min-h-12 text-2xl sm:text-3xl md:text-4xl" aria-label="entered pin">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span key={i} className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center rounded-lg bg-white border-2">
            {entered[i] ?? ''}
          </span>
        ))}
      </div>
      <div className="flex gap-3 sm:gap-4">
        <button
          onClick={clear}
          className="px-4 sm:px-5 py-2 sm:py-3 text-base sm:text-lg md:text-xl font-bold rounded-lg bg-gray-200 text-gray-800"
        >
          Clear
        </button>
        <button
          onClick={done}
          disabled={entered.length !== PIN_LENGTH}
          className="px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg md:text-xl font-bold rounded-lg bg-primary text-white disabled:opacity-50"
        >
          Done
        </button>
      </div>
    </div>
  );
}
