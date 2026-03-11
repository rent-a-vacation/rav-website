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
  it('renders all 5 tool cards', () => {
    renderWithProviders(<RavTools />);
    expect(screen.getByText('RAV SmartEarn')).toBeInTheDocument();
    expect(screen.getByText('RAV SmartPrice')).toBeInTheDocument();
    expect(screen.getByText('RAV SmartCompare')).toBeInTheDocument();
    expect(screen.getByText('RAV SmartMatch')).toBeInTheDocument();
    expect(screen.getByText('RAV SmartBudget')).toBeInTheDocument();
  });

  it('renders page heading', () => {
    renderWithProviders(<RavTools />);
    expect(screen.getByText('Free Tools for Smarter Vacations')).toBeInTheDocument();
  });

  it('all built tools have "Try it Free" buttons with links', () => {
    renderWithProviders(<RavTools />);
    const tryButtons = screen.getAllByText('Try it Free');
    expect(tryButtons).toHaveLength(5);
    // SmartEarn links to /calculator
    const smartEarnLink = tryButtons[0].closest('a');
    expect(smartEarnLink).toHaveAttribute('href', '/calculator');
    // SmartPrice links to /rentals
    const smartPriceLink = tryButtons[1].closest('a');
    expect(smartPriceLink).toHaveAttribute('href', '/rentals');
  });

  it('all tools have active links', () => {
    renderWithProviders(<RavTools />);
    const tryButtons = screen.getAllByText('Try it Free');
    tryButtons.forEach((btn) => {
      const link = btn.closest('a');
      expect(link).not.toBeNull();
      expect(link!.getAttribute('href')).toBeTruthy();
    });
  });

  it('injects JSON-LD script for ItemList schema', () => {
    renderWithProviders(<RavTools />);
    const script = document.getElementById('rav-tools-schema');
    expect(script).not.toBeNull();
    const data = JSON.parse(script!.textContent!);
    expect(data['@type']).toBe('ItemList');
    expect(data.numberOfItems).toBe(5);
    expect(data.itemListElement).toHaveLength(5);
  });

  it('sets page title correctly', () => {
    renderWithProviders(<RavTools />);
    expect(document.title).toContain('RAV Tools');
  });
});
