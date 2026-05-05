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
    <div className="flex flex-col items-center gap-6">
      <div className="grid grid-cols-4 gap-3">
        {PIN_ICONS.map(icon => (
          <motion.button
            key={icon}
            whileTap={{ scale: 0.9 }}
            onClick={() => tap(icon)}
            className="w-16 h-16 text-3xl bg-white rounded-xl shadow"
          >
            {icon}
          </motion.button>
        ))}
      </div>
      <div className="flex gap-3 min-h-12 text-3xl" aria-label="entered pin">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span key={i} className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border">
            {entered[i] ?? ''}
          </span>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={clear} className="px-4 py-2 rounded-lg bg-gray-200">Clear</button>
        <button onClick={done} className="px-4 py-2 rounded-lg bg-primary text-white">Done</button>
      </div>
    </div>
  );
}
