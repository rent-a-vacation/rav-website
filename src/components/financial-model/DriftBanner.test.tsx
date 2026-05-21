import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DriftBanner } from './DriftBanner';

describe('DriftBanner (#550 PR4) @p0', () => {
  it('hides when no dirty keys', () => {
    const { container } = render(
      <DriftBanner
        dirtyCount={0}
        scenarioName="Base"
        onShowDiff={() => {}}
        onResetAll={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows count and scenario name when dirty', () => {
    render(
      <DriftBanner
        dirtyCount={6}
        scenarioName="Sujit Q3 plan"
        onShowDiff={() => {}}
        onResetAll={() => {}}
      />,
    );
    expect(screen.getByText(/Sujit Q3 plan/)).toBeInTheDocument();
    expect(screen.getByText(/6/)).toBeInTheDocument();
  });

  it('uses singular "input" when count = 1', () => {
    render(
      <DriftBanner
        dirtyCount={1}
        scenarioName="X"
        onShowDiff={() => {}}
        onResetAll={() => {}}
      />,
    );
    expect(screen.getByText(/1 input differ/i)).toBeInTheDocument();
  });

  it('calls onShowDiff when Show diff clicked', () => {
    const onShowDiff = vi.fn();
    render(
      <DriftBanner
        dirtyCount={2}
        scenarioName="X"
        onShowDiff={onShowDiff}
        onResetAll={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /show diff/i }));
    expect(onShowDiff).toHaveBeenCalled();
  });

  it('calls onResetAll when Reset all clicked', () => {
    const onResetAll = vi.fn();
    render(
      <DriftBanner
        dirtyCount={2}
        scenarioName="X"
        onShowDiff={() => {}}
        onResetAll={onResetAll}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /reset all/i }));
    expect(onResetAll).toHaveBeenCalled();
  });
});
