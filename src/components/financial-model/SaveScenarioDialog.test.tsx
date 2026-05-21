import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaveScenarioDialog } from './SaveScenarioDialog';

describe('SaveScenarioDialog (#550 PR5) @p0', () => {
  it('hidden when open=false', () => {
    const { container } = render(
      <SaveScenarioDialog
        open={false}
        initialName=""
        initialShared={false}
        title="Save scenario as…"
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('Save button disabled when name is empty', () => {
    render(
      <SaveScenarioDialog
        open
        initialName=""
        initialShared={false}
        title="Save scenario as…"
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('Save button enables once name is typed', () => {
    render(
      <SaveScenarioDialog
        open
        initialName=""
        initialShared={false}
        title="Save scenario as…"
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Sujit Q3' } });
    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
  });

  it('submits name + share flag (trimmed)', () => {
    const onSubmit = vi.fn();
    render(
      <SaveScenarioDialog
        open
        initialName=""
        initialShared={false}
        title="Save scenario as…"
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: '  Sujit Q3  ' } });
    fireEvent.click(screen.getByLabelText(/share/i));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Sujit Q3', isShared: true });
  });

  it('Cancel fires onCancel', () => {
    const onCancel = vi.fn();
    render(
      <SaveScenarioDialog
        open
        initialName="X"
        initialShared={false}
        title="Save scenario as…"
        onSubmit={() => {}}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('resets fields when reopened with new initial values', () => {
    const { rerender } = render(
      <SaveScenarioDialog
        open
        initialName="First"
        initialShared={false}
        title="Save scenario as…"
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect((screen.getByLabelText(/name/i) as HTMLInputElement).value).toBe('First');

    rerender(
      <SaveScenarioDialog
        open
        initialName="Second"
        initialShared
        title="Save scenario as…"
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect((screen.getByLabelText(/name/i) as HTMLInputElement).value).toBe('Second');
    expect((screen.getByLabelText(/share/i) as HTMLInputElement).checked).toBe(true);
  });
});
