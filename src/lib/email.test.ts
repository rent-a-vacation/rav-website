import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInvoke = vi.fn();

vi.mock('./supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
  isSupabaseConfigured: () => true,
}));

const {
  sendEmail,
  sendWelcomeEmail,
  sendListingSubmittedEmail,
  sendPropertyRegisteredEmail,
  sendContactFormEmail,
} = await import('./email');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendEmail', () => {
  it('calls send-email edge function with correct params', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const result = await sendEmail({
      to: 'user@test.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
      type: 'notification',
    });

    expect(mockInvoke).toHaveBeenCalledWith('send-email', {
      body: {
        to: 'user@test.com',
        subject: 'Test Subject',
        html: '<p>Hello</p>',
        type: 'notification',
      },
    });
    expect(result.success).toBe(true);
  });

  it('returns error on edge function failure', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Function failed' },
    });

    const result = await sendEmail({
      to: 'user@test.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Function failed');
  });

  it('handles thrown exceptions', async () => {
    mockInvoke.mockRejectedValue(new Error('Network error'));

    const result = await sendEmail({
      to: 'user@test.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });
});

describe('sendWelcomeEmail', () => {
  it('sends welcome email with correct subject and CTA', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    await sendWelcomeEmail('newuser@test.com', 'Jane Doe');

    expect(mockInvoke).toHaveBeenCalledWith('send-email', {
      body: expect.objectContaining({
        to: 'newuser@test.com',
        subject: 'Welcome to Rent-A-Vacation!',
        type: 'welcome',
      }),
    });

    // Verify HTML contains personalized greeting and CTA
    const html = mockInvoke.mock.calls[0][1].body.html as string;
    expect(html).toContain('Hi Jane Doe');
    expect(html).toContain('Start Exploring');
    expect(html).toContain('Save 20-40%');
  });

  it('handles empty username gracefully', async () => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });

    await sendWelcomeEmail('user@test.com', '');

    const html = mockInvoke.mock.calls[0][1].body.html as string;
    // Should NOT contain "Hi ," — no recipientName passed
    expect(html).not.toContain('Hi ,');
  });
});

describe('sendListingSubmittedEmail', () => {
  it('shows total price when no nightly rate provided', async () => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });

    await sendListingSubmittedEmail('owner@test.com', 'John Smith', {
      resortName: 'Hilton Hawaiian Village',
      location: 'Honolulu, HI',
      checkIn: '2026-03-15',
      checkOut: '2026-03-22',
      price: 1400,
    });

    const html = mockInvoke.mock.calls[0][1].body.html as string;
    expect(html).toContain('$1,400');
    expect(html).toContain('Hilton Hawaiian Village');
    expect(html).toContain('Honolulu, HI');
    expect(html).toContain('Hi John Smith');
    expect(html).toContain('pending review');
  });

  it('shows nightly rate breakdown when provided', async () => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });

    await sendListingSubmittedEmail('owner@test.com', 'John Smith', {
      resortName: 'Marriott Resort',
      location: 'Orlando, FL',
      checkIn: '2026-04-01',
      checkOut: '2026-04-08',
      price: 1400,
      nightlyRate: 200,
      nights: 7,
    });

    const html = mockInvoke.mock.calls[0][1].body.html as string;
    expect(html).toContain('$200/night');
    expect(html).toContain('7 nights');
    expect(html).toContain('$1,400 total');
  });
});

describe('sendPropertyRegisteredEmail', () => {
  it('includes property details in email', async () => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });

    await sendPropertyRegisteredEmail('owner@test.com', 'Jane Owner', {
      brand: 'Hilton Grand Vacations',
      resortName: 'HGV Las Vegas',
      location: 'Las Vegas, NV',
      bedrooms: 2,
    });

    expect(mockInvoke).toHaveBeenCalledWith('send-email', {
      body: expect.objectContaining({
        to: 'owner@test.com',
        subject: 'Property Registered - Rent-A-Vacation',
        type: 'notification',
      }),
    });

    const html = mockInvoke.mock.calls[0][1].body.html as string;
    expect(html).toContain('Hilton Grand Vacations');
    expect(html).toContain('HGV Las Vegas');
    expect(html).toContain('Las Vegas, NV');
    expect(html).toContain('2');
    expect(html).toContain('Create a Listing');
  });
});

describe('sendContactFormEmail', () => {
  it('sends to support address with form details', async () => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });

    await sendContactFormEmail('Visitor Name', 'visitor@test.com', 'I have a question about booking.');

    expect(mockInvoke).toHaveBeenCalledWith('send-email', {
      body: expect.objectContaining({
        to: 'support@rent-a-vacation.com',
        subject: 'New Contact Form Submission from Visitor Name',
        type: 'contact',
      }),
    });

    const html = mockInvoke.mock.calls[0][1].body.html as string;
    expect(html).toContain('Visitor Name');
    expect(html).toContain('visitor@test.com');
    expect(html).toContain('I have a question about booking.');
  });

  it('converts newlines to <br> in message', async () => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });

    await sendContactFormEmail('User', 'user@test.com', 'Line 1\nLine 2\nLine 3');

    const html = mockInvoke.mock.calls[0][1].body.html as string;
    expect(html).toContain('Line 1<br>Line 2<br>Line 3');
  });

  it('includes internal-only footer note', async () => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });

    await sendContactFormEmail('User', 'user@test.com', 'Hello');

    const html = mockInvoke.mock.calls[0][1].body.html as string;
    expect(html).toContain('Internal notification');
  });
});

describe('sendEmail — non-Error exception', () => {
  it('handles non-Error thrown objects', async () => {
    mockInvoke.mockRejectedValue('string error');

    const result = await sendEmail({
      to: 'user@test.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown error');
  });
});
