import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { InputSectionAccordion } from './InputSectionAccordion';
import { INPUT_SECTIONS } from './sectionMeta';

const growth = INPUT_SECTIONS.find((s) => s.id === 'growth')!;

function renderInRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('InputSectionAccordion (#550 PR2)', () => {
  it('renders title; rows collapsed by default', () => {
    renderInRouter(
      <InputSectionAccordion section={growth} dirtyKeys={new Set()}>
        {growth.baseline.map((row) => (
          <div key={row.name}>{row.label}</div>
        ))}
      </InputSectionAccordion>,
    );
    expect(screen.getByText(growth.title)).toBeInTheDocument();
    expect(screen.queryByText('Launch Month (1 = first model month)')).not.toBeInTheDocument();
  });

  it('expands rows when header clicked', () => {
    renderInRouter(
      <InputSectionAccordion section={growth} dirtyKeys={new Set()}>
        {growth.baseline.map((row) => (
          <div key={row.name}>{row.label}</div>
        ))}
      </InputSectionAccordion>,
    );
    fireEvent.click(screen.getByText(growth.title));
    expect(screen.getByText('Launch Month (1 = first model month)')).toBeInTheDocument();
  });

  it('shows dirty count when dirtyKeys intersects section keys', () => {
    renderInRouter(
      <InputSectionAccordion
        section={growth}
        dirtyKeys={new Set(['gOwnGrowth', 'gMix0', 'unrelated'])}
      >
        <div />
      </InputSectionAccordion>,
    );
    expect(screen.getByText(/2 differ/i)).toBeInTheDocument();
  });

  it('does not show "Reset section" when no dirty keys', () => {
    renderInRouter(
      <InputSectionAccordion section={growth} dirtyKeys={new Set()} onResetSection={() => {}}>
        <div />
      </InputSectionAccordion>,
    );
    expect(screen.queryByRole('button', { name: /reset section/i })).not.toBeInTheDocument();
  });

  it('shows + fires "Reset section" when section has dirty keys', () => {
    let called = false;
    renderInRouter(
      <InputSectionAccordion
        section={growth}
        dirtyKeys={new Set(['gOwnGrowth'])}
        onResetSection={() => {
          called = true;
        }}
      >
        <div />
      </InputSectionAccordion>,
    );
    fireEvent.click(screen.getByRole('button', { name: /reset section/i }));
    expect(called).toBe(true);
  });
});
