import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScenarioActions } from './ScenarioActions';
import type { FinancialModelScenario } from '@/hooks/useFinancialModelScenarios';

const ownScenario: FinancialModelScenario = {
  id: 'uuid-own-1',
  owner_id: 'me',
  name: 'My plan',
  multiplier: 'Base',
  overrides: {},
  expense_overrides: [],
  is_shared: false,
  created_at: 't',
  updated_at: 't',
};

const sharedOther: FinancialModelScenario = {
  ...ownScenario,
  id: 'uuid-shared',
  owner_id: 'other',
  is_shared: true,
};

const noopProps = {
  onSave: () => {},
  onSaveAs: () => {},
  onDuplicate: () => {},
  onDiscard: () => {},
  onToggleShare: () => {},
  onDelete: () => {},
};

describe('ScenarioActions (#550 PR5) @p0', () => {
  it('system scenario, no draft: only Save as…', () => {
    render(
      <ScenarioActions
        isSystem
        scenario={null}
        currentUserId="me"
        isDirty={false}
        {...noopProps}
      />,
    );
    expect(screen.getByRole('button', { name: /save as/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /discard/i })).not.toBeInTheDocument();
  });

  it('system scenario, dirty: Save as… + Discard', () => {
    render(
      <ScenarioActions isSystem scenario={null} currentUserId="me" isDirty {...noopProps} />,
    );
    expect(screen.getByRole('button', { name: /save as/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
  });

  it('own scenario, no draft: Save as + Duplicate + Share + Delete', () => {
    render(
      <ScenarioActions
        isSystem={false}
        scenario={ownScenario}
        currentUserId="me"
        isDirty={false}
        {...noopProps}
      />,
    );
    expect(screen.getByRole('button', { name: /save as/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /duplicate/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/share/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument();
  });

  it('own scenario, dirty: Save + Save as + Discard', () => {
    render(
      <ScenarioActions
        isSystem={false}
        scenario={ownScenario}
        currentUserId="me"
        isDirty
        {...noopProps}
      />,
    );
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save as/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /duplicate/i })).not.toBeInTheDocument();
  });

  it('shared by other: only "Duplicate to my scenarios"', () => {
    render(
      <ScenarioActions
        isSystem={false}
        scenario={sharedOther}
        currentUserId="me"
        isDirty={false}
        {...noopProps}
      />,
    );
    expect(
      screen.getByRole('button', { name: /duplicate to my scenarios/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/share/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('Save click fires onSave', () => {
    const onSave = vi.fn();
    render(
      <ScenarioActions
        isSystem={false}
        scenario={ownScenario}
        currentUserId="me"
        isDirty
        {...noopProps}
        onSave={onSave}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalled();
  });

  it('Share toggle fires onToggleShare with new state', () => {
    const onToggleShare = vi.fn();
    render(
      <ScenarioActions
        isSystem={false}
        scenario={ownScenario}
        currentUserId="me"
        isDirty={false}
        {...noopProps}
        onToggleShare={onToggleShare}
      />,
    );
    fireEvent.click(screen.getByLabelText(/share/i));
    expect(onToggleShare).toHaveBeenCalledWith(true);
  });
});
