import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { renderWithProviders, screen } from '@/test/helpers/render';
import RavTools from '../RavTools';

// Mock Header and Footer to avoid auth/build-globals dependencies
vi.mock('@/components/Header', () => ({
  default: () => <header data-testid="header">Header</header>,
}));
vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

afterEach(() => {
  cleanup();
  const script = document.getElementById('rav-tools-schema');
  if (script) script.remove();
});

describe('RavTools', () => {
  it('renders all 6 tool cards', () => {
    renderWithProviders(<RavTools />);
    expect(screen.getByText('RAV SmartFee')).toBeInTheDocument();
    expect(screen.getByText('RAV SmartPrice')).toBeInTheDocument();
    expect(screen.getByText('Vacation Cost Comparator')).toBeInTheDocument();
    expect(screen.getByText('Rental Yield Estimator')).toBeInTheDocument();
    expect(screen.getByText('Resort Finder Quiz')).toBeInTheDocument();
    expect(screen.getByText('Trip Budget Planner')).toBeInTheDocument();
  });

  it('renders page heading', () => {
    renderWithProviders(<RavTools />);
    expect(screen.getByText('Free Tools for Smarter Vacations')).toBeInTheDocument();
  });

  it('built tools have "Try it Free" buttons with links', () => {
    renderWithProviders(<RavTools />);
    const tryButtons = screen.getAllByText('Try it Free');
    expect(tryButtons).toHaveLength(2);
    const smartFeeLink = tryButtons[0].closest('a');
    expect(smartFeeLink).toHaveAttribute('href', '/calculator');
    const smartPriceLink = tryButtons[1].closest('a');
    expect(smartPriceLink).toHaveAttribute('href', '/rentals');
  });

  it('coming soon tools show "Coming Soon" badges', () => {
    renderWithProviders(<RavTools />);
    const badges = screen.getAllByText('Coming Soon');
    // 4 badge elements + 4 disabled buttons = 8 total
    expect(badges.length).toBeGreaterThanOrEqual(4);
  });

  it('coming soon tools have disabled buttons', () => {
    renderWithProviders(<RavTools />);
    const comingSoonButtons = screen.getAllByRole('button', { name: 'Coming Soon' });
    expect(comingSoonButtons).toHaveLength(4);
    comingSoonButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('injects JSON-LD script for ItemList schema', () => {
    renderWithProviders(<RavTools />);
    const script = document.getElementById('rav-tools-schema');
    expect(script).not.toBeNull();
    const data = JSON.parse(script!.textContent!);
    expect(data['@type']).toBe('ItemList');
    expect(data.numberOfItems).toBe(6);
    expect(data.itemListElement).toHaveLength(6);
  });

  it('sets page title correctly', () => {
    renderWithProviders(<RavTools />);
    expect(document.title).toContain('RAV Tools');
  });
});
