import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}

export function BigButton({ children, onClick, disabled, variant = 'primary' }: Props) {
  const base = 'rounded-2xl px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 text-xl sm:text-2xl md:text-3xl font-bold shadow-md disabled:opacity-50 transition-colors';
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
