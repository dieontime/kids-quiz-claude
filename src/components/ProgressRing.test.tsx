import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ProgressRing } from './ProgressRing.tsx';

describe('ProgressRing', () => {
  it('renders an SVG with two circles (track + progress)', () => {
    const { container } = render(<ProgressRing percent={50} color="stroke-blue-500" size="md" />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2);
  });

  it('shows the percent label when showLabel is true', () => {
    const { getByText } = render(<ProgressRing percent={42} color="stroke-blue-500" size="md" showLabel />);
    expect(getByText('42%')).toBeInTheDocument();
  });

  it('uses the gold mastery color when percent is 100', () => {
    const { container } = render(<ProgressRing percent={100} color="stroke-blue-500" size="md" />);
    const fg = container.querySelectorAll('circle')[1] as SVGCircleElement;
    expect(fg.getAttribute('class')).toContain('stroke-yellow-400');
  });

  it('emits onMastery exactly once when percent transitions to 100', () => {
    const onMastery = vi.fn();
    const { rerender } = render(<ProgressRing percent={99} color="stroke-blue-500" size="md" onMastery={onMastery} />);
    expect(onMastery).not.toHaveBeenCalled();
    rerender(<ProgressRing percent={100} color="stroke-blue-500" size="md" onMastery={onMastery} />);
    expect(onMastery).toHaveBeenCalledTimes(1);
    rerender(<ProgressRing percent={100} color="stroke-blue-500" size="md" onMastery={onMastery} />);
    expect(onMastery).toHaveBeenCalledTimes(1);
  });

  it('clamps percent input to [0, 100]', () => {
    const { rerender, container, getByText } = render(<ProgressRing percent={150} color="stroke-blue-500" size="md" showLabel />);
    expect(getByText('100%')).toBeInTheDocument();
    rerender(<ProgressRing percent={-10} color="stroke-blue-500" size="md" showLabel />);
    expect(container.textContent).toContain('0%');
  });
});
