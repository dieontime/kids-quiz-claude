import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}

export function BigButton({ children, onClick, disabled, variant = 'primary' }: Props) {
  const base = 'rounded-2xl px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-lg sm:text-xl md:text-2xl font-bold shadow-md disabled:opacity-50 transition-colors';
  const styles = variant === 'primary'
    ? 'bg-primary text-white'
    : 'bg-white text-primary border-4 border-primary';
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.03 }}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles}`}
    >
      {children}
    </motion.button>
  );
}
