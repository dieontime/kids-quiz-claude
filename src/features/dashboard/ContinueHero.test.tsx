import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ContinueHero } from './ContinueHero.tsx';
import { MODULE_THEMES } from '../../theme/moduleTheme.ts';

describe('ContinueHero', () => {
  it('renders module label, progress, and Resume + Surprise buttons', () => {
    const onResume = vi.fn();
    const onSurprise = vi.fn();
    const { getByText } = render(
      <ContinueHero
        theme={MODULE_THEMES.math}
        progress={{ moduleId: 'math', answered: 28, total: 90, lastPlayedAt: null }}
        onResume={onResume}
        onSurprise={onSurprise}
      />,
    );
    expect(getByText(/Continue Math/i)).toBeInTheDocument();
    expect(getByText(/28.*90/)).toBeInTheDocument();
    fireEvent.click(getByText(/Resume/i));
    expect(onResume).toHaveBeenCalled();
    fireEvent.click(getByText(/Surprise/i));
    expect(onSurprise).toHaveBeenCalled();
  });

  it('renders the all-mastered fallback when allMastered is true', () => {
    const { getByText } = render(
      <ContinueHero
        theme={MODULE_THEMES.math}
        progress={{ moduleId: 'math', answered: 90, total: 90, lastPlayedAt: null }}
        onResume={() => {}}
        onSurprise={() => {}}
        allMastered
      />,
    );
    expect(getByText(/mastered everything/i)).toBeInTheDocument();
  });
});
