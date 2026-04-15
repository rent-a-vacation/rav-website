import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PostRequestCTA } from '../PostRequestCTA';

function renderCTA(props: Parameters<typeof PostRequestCTA>[0] = {}) {
  return render(
    <MemoryRouter>
      <PostRequestCTA {...props} />
    </MemoryRouter>
  );
}

describe('PostRequestCTA', () => {
  it('renders the CTA card', () => {
    renderCTA();
    expect(screen.getByText(/Can't find what you need/)).toBeDefined();
    expect(screen.getByRole('button', { name: /Post a Wish/ })).toBeDefined();
  });

  it('renders descriptive text', () => {
    renderCTA();
    expect(screen.getByText(/Post a Wish and let owners come to you/)).toBeDefined();
  });

  it('link includes destination param when provided', () => {
    renderCTA({ searchDestination: 'Orlando' });
    const link = screen.getByRole('button', { name: /Post a Wish/ }).closest('a');
    expect(link?.getAttribute('href')).toContain('destination=Orlando');
  });

  it('link includes date params when provided', () => {
    renderCTA({ searchCheckIn: '2026-04-15', searchCheckOut: '2026-04-22' });
    const link = screen.getByRole('button', { name: /Post a Wish/ }).closest('a');
    expect(link?.getAttribute('href')).toContain('checkin=2026-04-15');
    expect(link?.getAttribute('href')).toContain('checkout=2026-04-22');
  });

  it('link points at /marketplace with tab=wishes and prefill=true', () => {
    renderCTA();
    const link = screen.getByRole('button', { name: /Post a Wish/ }).closest('a');
    expect(link?.getAttribute('href')).toContain('/marketplace');
    expect(link?.getAttribute('href')).toContain('tab=wishes');
    expect(link?.getAttribute('href')).toContain('prefill=true');
  });

  it('renders privacy note about owner visibility', () => {
    renderCTA();
    expect(screen.getByText(/visible to all verified owners/)).toBeDefined();
  });
});
