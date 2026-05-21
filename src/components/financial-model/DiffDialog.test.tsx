import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiffDialog, type DiffEntry, type ExpenseDiffEntry } from './DiffDialog';

const diffs: DiffEntry[] = [
  {
    key: 'gOwnGrowth',
    label: 'Monthly Owner Growth Rate (%)',
    baseline: 0.2,
    current: 0.4,
  },
  {
    key: 'gMix0',
    label: 'Booking Mix — Free Owner %',
    baseline: 0.65,
    current: 0.55,
  },
];

const expenseDiffs: ExpenseDiffEntry[] = [
  {
    category: 'Marketing & Launch',
    item: 'Conference exhibitor / booth fee',
    baseline: 2500,
    current: 3000,
  },
];

describe('DiffDialog (#550 PR4) @p0', () => {
  it('does not render when open=false', () => {
    const { container } = render(
      <DiffDialog
        open={false}
        diffs={diffs}
        expenseDiffs={[]}
        onClose={() => {}}
        onResetField={() => {}}
        onResetExpense={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders each dirty input row with label + values', () => {
    render(
      <DiffDialog
        open
        diffs={diffs}
        expenseDiffs={[]}
        onClose={() => {}}
        onResetField={() => {}}
        onResetExpense={() => {}}
      />,
    );
    expect(screen.getByText('Monthly Owner Growth Rate (%)')).toBeInTheDocument();
    expect(screen.getByText('Booking Mix — Free Owner %')).toBeInTheDocument();
  });

  it('per-field reset triggers callback with key', () => {
    const onResetField = vi.fn();
    render(
      <DiffDialog
        open
        diffs={diffs}
        expenseDiffs={[]}
        onClose={() => {}}
        onResetField={onResetField}
        onResetExpense={() => {}}
      />,
    );
    const buttons = screen.getAllByRole('button', { name: /reset/i });
    fireEvent.click(buttons[0]);
    expect(onResetField).toHaveBeenCalledWith('gOwnGrowth');
  });

  it('expense diffs render with category — item label', () => {
    render(
      <DiffDialog
        open
        diffs={[]}
        expenseDiffs={expenseDiffs}
        onClose={() => {}}
        onResetField={() => {}}
        onResetExpense={() => {}}
      />,
    );
    expect(
      screen.getByText('Marketing & Launch — Conference exhibitor / booth fee'),
    ).toBeInTheDocument();
  });

  it('expense reset triggers callback with category + item', () => {
    const onResetExpense = vi.fn();
    render(
      <DiffDialog
        open
        diffs={[]}
        expenseDiffs={expenseDiffs}
        onClose={() => {}}
        onResetField={() => {}}
        onResetExpense={onResetExpense}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Conference exhibitor/i }));
    expect(onResetExpense).toHaveBeenCalledWith(
      'Marketing & Launch',
      'Conference exhibitor / booth fee',
    );
  });

  it('shows "No differences" when both lists empty', () => {
    render(
      <DiffDialog
        open
        diffs={[]}
        expenseDiffs={[]}
        onClose={() => {}}
        onResetField={() => {}}
        onResetExpense={() => {}}
      />,
    );
    expect(screen.getByText(/No differences/i)).toBeInTheDocument();
  });

  it('Close button fires onClose', () => {
    const onClose = vi.fn();
    render(
      <DiffDialog
        open
        diffs={diffs}
        expenseDiffs={[]}
        onClose={onClose}
        onResetField={() => {}}
        onResetExpense={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
