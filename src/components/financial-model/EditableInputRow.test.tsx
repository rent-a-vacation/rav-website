import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditableInputRow } from './EditableInputRow';
import { GROWTH } from '@/lib/financial-model/data';

const ownGrowth = GROWTH.find((r) => r.name === 'gOwnGrowth')!;

describe('EditableInputRow (#550 PR3) @p0', () => {
  it('renders label', () => {
    render(
      <EditableInputRow
        row={ownGrowth}
        baselineValue={ownGrowth.value as number}
        dirty={false}
        readOnly={false}
        onChange={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.getByText(ownGrowth.label)).toBeInTheDocument();
  });

  it('shows dirty dot when dirty', () => {
    render(
      <EditableInputRow
        row={ownGrowth}
        baselineValue={0.2}
        dirty={true}
        readOnly={false}
        onChange={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.getByLabelText(/differs from baseline/i)).toBeInTheDocument();
  });

  it('does NOT show dirty dot when not dirty', () => {
    render(
      <EditableInputRow
        row={ownGrowth}
        baselineValue={ownGrowth.value as number}
        dirty={false}
        readOnly={false}
        onChange={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.queryByLabelText(/differs from baseline/i)).not.toBeInTheDocument();
  });

  it('shows [×] reset button only when dirty', () => {
    render(
      <EditableInputRow
        row={ownGrowth}
        baselineValue={ownGrowth.value as number}
        dirty={false}
        readOnly={false}
        onChange={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
  });

  it('clicking [×] calls onReset when dirty', () => {
    const onReset = vi.fn();
    render(
      <EditableInputRow
        row={ownGrowth}
        baselineValue={0.2}
        dirty={true}
        readOnly={false}
        onChange={() => {}}
        onReset={onReset}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(onReset).toHaveBeenCalled();
  });

  it('calls onChange with parsed numeric value on blur', () => {
    const onChange = vi.fn();
    render(
      <EditableInputRow
        row={ownGrowth}
        baselineValue={ownGrowth.value as number}
        dirty={false}
        readOnly={false}
        onChange={onChange}
        onReset={() => {}}
      />,
    );
    const input = screen.getByLabelText(ownGrowth.label, { selector: 'input' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '0.40' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(0.4);
  });

  it('readOnly mode renders no input', () => {
    render(
      <EditableInputRow
        row={ownGrowth}
        baselineValue={ownGrowth.value as number}
        dirty={false}
        readOnly={true}
        onChange={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
