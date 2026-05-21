import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScenarioPicker } from './ScenarioPicker';
import type { FinancialModelScenario } from '@/hooks/useFinancialModelScenarios';

const ownScenarios: FinancialModelScenario[] = [
  {
    id: 'uuid-own-1',
    owner_id: 'me',
    name: 'Sujit Q3 plan',
    multiplier: 'Base',
    overrides: {},
    expense_overrides: [],
    is_shared: false,
    created_at: 't',
    updated_at: 't',
  },
];
const sharedScenarios: FinancialModelScenario[] = [
  {
    id: 'uuid-shared-1',
    owner_id: 'someone',
    name: 'Team plan v2',
    multiplier: 'Optimistic',
    overrides: {},
    expense_overrides: [],
    is_shared: true,
    created_at: 't',
    updated_at: 't',
  },
];

describe('ScenarioPicker (#550 PR2) @p0', () => {
  it('groups system, own, and shared scenarios', () => {
    render(
      <ScenarioPicker
        scenarios={[...ownScenarios, ...sharedScenarios]}
        currentUserId="me"
        activeId="system:base"
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Base/i }));
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Mine')).toBeInTheDocument();
    expect(screen.getByText('Shared')).toBeInTheDocument();
    expect(screen.getByText('Sujit Q3 plan')).toBeInTheDocument();
    expect(screen.getByText('Team plan v2')).toBeInTheDocument();
  });

  it('calls onChange with selected id', () => {
    const onChange = vi.fn();
    render(
      <ScenarioPicker
        scenarios={ownScenarios}
        currentUserId="me"
        activeId="system:base"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Base/i }));
    fireEvent.click(screen.getByText('Sujit Q3 plan'));
    expect(onChange).toHaveBeenCalledWith('uuid-own-1');
  });

  it('shows "shared" badge on shared scenarios', () => {
    render(
      <ScenarioPicker
        scenarios={sharedScenarios}
        currentUserId="me"
        activeId="system:base"
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Base/i }));
    // Two "shared" matches expected: section header "Shared" + per-item badge "shared".
    expect(screen.getAllByText(/shared/i).length).toBeGreaterThanOrEqual(2);
  });

  it('hides Mine section when user has no own scenarios', () => {
    render(
      <ScenarioPicker
        scenarios={sharedScenarios}
        currentUserId="me"
        activeId="system:base"
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Base/i }));
    expect(screen.queryByText('Mine')).not.toBeInTheDocument();
  });
});
