import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useSettings } from '../stores/settingsStore.ts';

interface Props {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}

export function BigButton({ children, onClick, disabled, variant = 'primary' }: Props) {
  const reducedMotion = useSettings(s => s.reducedMotion);
  const base = 'rounded-2xl px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-lg sm:text-xl md:text-2xl font-bold shadow-md disabled:opacity-50 transition-colors focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none';
  const styles = variant === 'primary' ? 'bg-primary text-white' : 'bg-white text-primary border-4 border-primary';
  const className = `${base} ${styles} ${reducedMotion ? 'active:opacity-80' : ''}`;
  if (reducedMotion) {
    return (
      <button onClick={onClick} disabled={disabled} className={className}>
        {children}
      </button>
    );
  }
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.03 }}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </motion.button>
  );
}
