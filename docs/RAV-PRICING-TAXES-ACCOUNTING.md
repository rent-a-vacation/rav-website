---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Rent-A-Vacation — Pricing, Taxes & Accounting Framework

> **Document for:** RAV Partners & Stakeholders
> **Date:** February 21, 2026 | **Updated:** February 28, 2026
> **Version:** 2.1 — Added staged growth plan, environment mapping, Puzzle.io clarification

---

## 1. Fee Structure

Every booking on Rent-A-Vacation involves multiple fee layers. This document defines who sets, collects, and remits each fee.

| Fee | Who Sets It | Who Collects | Who Remits | Current Status |
|-----|------------|-------------|-----------|----------------|
| **Nightly rate** | Property Owner | RAV (at checkout via Stripe) | Paid to owner (minus commission) | ✅ Active |
| **RAV service fee** | RAV (15% default, tier-adjusted) | RAV (at checkout) | RAV keeps as revenue | ✅ Active |
| **Cleaning fee** | Owner (optional, per listing) | RAV (at checkout) | Passed through to owner | ✅ Active |
| **Resort fee** | Resort (disclosed by owner) | Resort (at check-in, not RAV) | Resort | ✅ Display only |
| **Occupancy / lodging tax** | Government (varies by jurisdiction) | **RAV (marketplace facilitator)** | RAV must remit to tax authority | 🟡 Code ready, pending activation |
| **State / local sales tax** | Government (varies by state) | RAV (marketplace facilitator) | RAV must remit | 🟡 Code ready, pending activation |
| **Stripe processing fee** | Stripe (~2.9% + $0.30) | Stripe (auto-deducted) | N/A | ✅ Active (absorbed by RAV) |

---

## 2. Pricing Model — Per-Night Rates

RAV uses a **per-night pricing model** (industry standard — Airbnb, VRBO, Booking.com):

```
Nightly rate (owner sets)     $257/night
× Number of nights            × 7 nights
= Subtotal                    $1,800
+ RAV service fee (15%)       $270
+ Cleaning fee (optional)     $150
+ Occupancy tax (varies)      $TBD (Stripe Tax, pending activation)
─────────────────────────────
Total charged to traveler     $2,220+
```

Benefits of per-night pricing:
- **Comparison shopping:** Travelers compare 5-night vs 7-night listings fairly
- **Flexible dates:** Enables partial-week booking and date proposals
- **Bidding clarity:** Bids expressed as $/night are intuitive
- **Fair Value Score:** Per-night comparison is apples-to-apples
- **Travel Requests:** Budget ranges expressed as $/night are standard

---

## 3. Booking Price Breakdown — Database Fields

Every booking record tracks fees as separate line items:

| Line Item | Field | Description | Status |
|-----------|-------|-------------|--------|
| Nightly rate | `nightly_rate` | Owner's per-night price | ✅ Active |
| Number of nights | `num_nights` | Derived from check-in/check-out dates | ✅ Active |
| Subtotal | `base_amount` | nightly_rate × num_nights | ✅ Active |
| RAV service fee | `service_fee` | Commission (15% default, tier-adjusted) | ✅ Active |
| Cleaning fee | `cleaning_fee` | Optional, set by owner per listing | ✅ Active |
| Tax amount | `tax_amount` | Calculated by Stripe Tax based on location | 🟡 Ready ($0 until activated) |
| Tax rate | `tax_rate` | Effective rate for jurisdiction | 🟡 Ready |
| Tax jurisdiction | `tax_jurisdiction` | City/county/state combo | 🟡 Ready |
| Stripe tax calc ID | `stripe_tax_calculation_id` | Reference for Stripe Tax audit trail | 🟡 Ready |
| **Total charged** | `total_amount` | Sum of all above — what Stripe captures | ✅ Active |
| Owner payout | `owner_payout` | base_amount + cleaning_fee (owner's portion) | ✅ Active |
| RAV revenue | `rav_commission` | service_fee (RAV's portion) | ✅ Active |
| Payment intent | `payment_intent_id` | Stripe PaymentIntent ID for refund lookup | ✅ Active |
| Transfer ID | `stripe_transfer_id` | Stripe Connect transfer to owner | ✅ Active |
| Payout status | `payout_status` | pending / processing / paid | ✅ Active |

---

## 4. Tax Obligations — Marketplace Facilitator Laws

### What RAV Must Do

As a marketplace that processes payments, RAV is classified as a **marketplace facilitator** in 43 US states + DC. This means RAV is legally required to:

1. **Calculate** applicable occupancy and sales taxes at checkout
2. **Collect** tax from the traveler as a line item
3. **Remit** tax to the appropriate government authority (state, county, city)
4. **File** periodic tax returns per jurisdiction

### Tax Rates (Examples)

| Location | Occupancy Tax | Sales Tax | Total Tax |
|----------|--------------|-----------|-----------|
| Orlando, FL | 6% county + 6% tourism | 6.5% state | ~12-18% |
| Las Vegas, NV | 13% transient lodging | 8.375% sales | ~13-21% |
| Myrtle Beach, SC | 3% accommodations | 6% state + 3% local | ~12% |
| Kapolei, HI (Oahu) | 10.25% transient | 4.5% excise | ~14.75% |

> Rates vary by city, county, and property type. Automated tax calculation is required.

### Tax Integration — Stripe Tax

| Service | What It Does | Cost | Status |
|---------|-------------|------|--------|
| **Stripe Tax** | Auto-calculates & collects tax at checkout | 0.5% per transaction | 🟡 Code ready, pending Stripe Dashboard activation |
| **Avalara** | Full tax compliance (calculation, filing, remittance) | $50-300/mo | Future — when volume justifies |
| **TaxJar** | Tax calculation + auto-filing for US states | $19-99/mo | Future — when volume justifies |

**Current implementation:**
- `create-booking-checkout` edge function includes `automatic_tax: { enabled: true }`
- Tax codes: `txcd_99999999` (lodging), `txcd_10000000` (service fees)
- `verify-booking-payment` extracts tax from `session.total_details.amount_tax`
- **Blocked on:** Business formation (#127) — LLC, EIN, state tax registrations required
- **When activated:** Taxes auto-calculate based on property location, zero code changes needed

---

## 5. Accounting & Reporting

### 5.1 What RAV Already Tracks (Built-In Dashboards)

RAV has comprehensive operational financial tracking built into the admin dashboard. These are **not** dependent on any external accounting tool.

| Dashboard | Location | What It Shows |
|-----------|----------|---------------|
| **AdminFinancials** | `/admin-dashboard?tab=financials` | Revenue, commissions, payouts, transaction history, average booking value |
| **AdminTaxReporting** | `/admin-dashboard?tab=tax-reporting` | Annual revenue by month, tax collected per jurisdiction, 1099-K threshold tracking, W-9 status per owner |
| **AdminPayouts** | `/admin-dashboard?tab=payouts` | Per-owner payout queue, Stripe Connect status, "Pay via Stripe" or manual "Mark Paid" |

### 5.2 What RAV Needs an External Accounting Tool For

The admin dashboards track **operational** data. An external accounting tool provides the **legally authoritative** financial record:

| Capability | RAV Dashboard | Accounting Tool |
|------------|--------------|-----------------|
| Fee calculation & tracking | ✅ Yes (`pricing.ts`, bookings table) | Not needed |
| Owner payout orchestration | ✅ Yes (Stripe Connect + AdminPayouts) | Not needed |
| Tax collection at checkout | ✅ Yes (Stripe Tax, code ready) | Not needed |
| 1099-K generation for owners | ✅ Yes (Stripe Connect native — see §5.4) | Not needed |
| Admin revenue dashboards | ✅ Yes (AdminFinancials, AdminTaxReporting) | Not needed |
| **General ledger (official books)** | ❌ | ✅ Required |
| **Bank reconciliation** | ❌ | ✅ Required |
| **P&L / Balance Sheet / Cash Flow** | ❌ | ✅ Required |
| **CPA-ready tax package** | ❌ | ✅ Required |
| **Revenue recognition (ASC 606)** | ❌ | ✅ Required |
| **Expense tracking** (hosting, SaaS, etc.) | ❌ | ✅ Required |

### 5.3 Accounting Tool Selection — Puzzle.io (Decision: Feb 28, 2026)

After evaluating QuickBooks Online, Wave, Zoho Books, Xero, FreshBooks, and ZipBooks, **Puzzle.io** was selected as the primary accounting provider.

#### Why Puzzle.io

| Criteria | Puzzle.io | QuickBooks Online | Zoho Books | Xero |
|----------|-----------|-------------------|------------|------|
| **Stripe integration** | **Native API** — 98% auto-categorization | Via Synder/Zapier middleware | Basic (payment collection only) | Via marketplace app |
| **Free tier** | Yes — <$20K/mo transactions | No — $30-200/mo | Yes — <$50K/yr revenue | No — $20/mo minimum |
| **Revenue recognition** | **Automated (ASC 606)** | Manual | Manual | Manual |
| **Marketplace fit** | **High** — designed for platforms | Low — simple business focus | Medium | Medium-High |
| **API quality** | Modern REST | OAuth2 REST (complex) | REST (1K calls/day free) | REST (tiered pricing) |
| **Multi-user** | Unlimited (all plans) | Limited by tier | 1 user on free | Unlimited |
| **Mobile app** | Web only | Desktop + mobile | Strong mobile | Good mobile |

#### Key advantages for RAV:
1. **Zero middleware** — direct Stripe API connection maintains full data fidelity
2. **Automated revenue recognition** — critical for a marketplace (service fees are earned at booking, owner payouts are pass-through liabilities)
3. **Free tier covers early operations** — up to $20K/month in transaction volume
4. **Modern REST API** — clean integration path for programmatic sync
5. **Dual-basis accounting** (cash + accrual) out of the box

#### Pricing tiers (as of Feb 2026):
| Tier | Transaction Volume | Price |
|------|-------------------|-------|
| Free | <$20K/month | $0 |
| Basics | Up to $50K/month | $25/mo |
| Insights | Up to $200K/month | $50/mo |
| Advanced | Up to $500K/month | $100/mo |
| Scale | Unlimited | $300/mo |

### 5.4 1099-K Compliance — Handled by Stripe Connect

**RAV does NOT need an accounting tool or Gusto for 1099-K generation.** Stripe Connect handles this natively:

- **Auto-generates 1099-K** forms using transaction data in your Stripe account
- **E-files with IRS and states** automatically
- **Delivers to connected accounts** (owners) via e-delivery or mail
- **Cost:** $2.99/form (IRS e-filing) + $1.49/form (state e-filing) + $2.99/form (paper mail, optional)
- **Threshold:** >$20,000 gross payments AND >200 transactions per platform (reinstated under OBBBA)

RAV's `AdminTaxReporting` dashboard tracks owner earnings and W-9 status, but the actual 1099-K form generation and filing is Stripe's responsibility.

### 5.5 Reporting Requirements

| Report | Frequency | Source | Purpose |
|--------|-----------|--------|---------|
| **Revenue report** | Monthly | Puzzle.io (auto from Stripe) | RAV service fees = gross revenue |
| **Owner payouts** | Per booking | RAV AdminPayouts + Puzzle.io | Track amounts owed vs. paid |
| **Tax collected** | Monthly | RAV AdminTaxReporting | Taxes collected by jurisdiction |
| **Tax remitted** | Per jurisdiction deadline | Manual (until Avalara) | Proof of tax payment |
| **1099-K forms** | Annual (Jan 31) | Stripe Connect | Owners earning >$600/year |
| **P&L statement** | Monthly/Quarterly | Puzzle.io | Business performance |
| **Balance sheet** | Quarterly/Annual | Puzzle.io | Financial position |
| **Cash flow** | Monthly | Puzzle.io | Cash management |
| **CPA tax package** | Annual | Puzzle.io export | Business tax filing |

---

## 6. Pluggable Accounting Architecture

### 6.1 Design Philosophy

The accounting integration is built as a **provider-agnostic adapter pattern**. This means:
- The platform speaks a common `AccountingEvent` format
- A provider adapter translates events to the specific API (Puzzle.io, QuickBooks, Xero, etc.)
- Switching providers is a configuration change, not a code rewrite
- This is valuable for: (a) future flexibility, (b) white-label/resale scenarios

### 6.2 Architecture

```
Booking Event (confirmed/payout/refund)
    ↓
sync-accounting edge function
    ↓
Reads provider from system_settings
    ↓
┌─────────────────────────────────────────┐
│  AccountingProvider interface            │
│  ─────────────────────────────────────  │
│  syncBookingConfirmed(event)            │
│  syncOwnerPayout(event)                 │
│  syncRefund(event)                      │
│  syncTaxCollected(event)                │
│  getConnectionStatus()                  │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┼──────────┬──────────┐
    ▼         ▼          ▼          ▼
 Puzzle    QuickBooks   Xero     Manual
 Provider  Provider    Provider  (CSV export)
```

### 6.3 Accounting Event Types

```typescript
// Standard event format — provider-agnostic
type AccountingEvent =
  | { type: 'booking_confirmed'; booking: BookingFinancials }
  | { type: 'owner_payout'; booking: BookingFinancials; transfer: StripeTransfer }
  | { type: 'refund_processed'; booking: BookingFinancials; refundAmount: number; reason: string }
  | { type: 'tax_collected'; booking: BookingFinancials; taxDetails: TaxBreakdown }

interface BookingFinancials {
  bookingId: string;
  bookingRef: string;
  propertyName: string;
  ownerName: string;
  renterName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  baseAmount: number;      // nightly_rate × nights
  serviceFee: number;      // RAV commission
  cleaningFee: number;     // pass-through to owner
  taxAmount: number;       // collected for remittance
  totalAmount: number;     // what traveler paid
  ownerPayout: number;     // what owner receives
  ravRevenue: number;      // what RAV keeps
  currency: string;        // 'usd'
  stripePaymentIntentId: string;
}

interface AccountingProvider {
  name: string;
  syncBookingConfirmed(event: BookingFinancials): Promise<SyncResult>;
  syncOwnerPayout(event: BookingFinancials, transferId: string): Promise<SyncResult>;
  syncRefund(event: BookingFinancials, refundAmount: number): Promise<SyncResult>;
  testConnection(): Promise<{ connected: boolean; error?: string }>;
}
```

### 6.4 Provider Implementations

| Provider | File | Status | Notes |
|----------|------|--------|-------|
| **Puzzle.io** | `puzzle-provider.ts` | Primary | Native Stripe sync handles most; API for custom journal entries |
| **QuickBooks** | `quickbooks-provider.ts` | Planned | OAuth2 + REST API, complex but widely used |
| **Xero** | `xero-provider.ts` | Planned | Good API, popular internationally |
| **Manual/CSV** | `csv-provider.ts` | Planned | Fallback — exports CSV for manual import to any system |

### 6.5 Admin Configuration UI

The admin dashboard includes an Accounting Integration panel:
- **Provider selector** — choose active provider from system_settings
- **Connection status** — green/red indicator, last sync timestamp
- **API credentials** — securely stored in Supabase secrets (not in system_settings)
- **Manual sync trigger** — re-sync a date range if needed
- **Sync log** — recent events with success/failure status

---

## 7. Owner's Responsibilities vs. RAV's

| Concern | Owner's Job | RAV's Job |
|---------|------------|-----------|
| Set nightly rate | Yes | Display + collect |
| Set cleaning fee | Yes (optional) | Pass through to owner |
| Disclose resort fees | Yes (in listing description) | Display (don't collect) |
| Occupancy / lodging tax | Nothing | Calculate, collect, remit |
| Sales tax | Nothing | Calculate, collect, remit |
| Income tax (personal) | File own taxes | Issue 1099-K if >$600/year (via Stripe Connect) |
| W-9 submission | Submit before Dec 31 | Track status in AdminTaxReporting |
| RAV service fee | Nothing | Deduct as commission |
| Stripe processing fee | Nothing | Absorbed by RAV |
| Price accuracy | Set honest prices | Enforce via Fair Value Score |
| Cancellation refunds | Approve/deny | Process refund via Stripe |

---

## 8. Implementation Roadmap

| Phase | What | Status | Effort |
|-------|------|--------|--------|
| **Phase A** | Per-night pricing model + fee breakdown display | ✅ Done (Migration 020) | 8-10 hours |
| **Phase B** | Cleaning fee + resort fee fields on listings | ✅ Done (Migration 023) | 2-3 hours |
| **Phase C** | Stripe Tax integration (auto-calculate at checkout) | 🟡 Code ready, blocked on #127 | 6-8 hours |
| **Phase D** | Admin tax reporting dashboard | ✅ Done (AdminTaxReporting) | 4-6 hours |
| **Phase E** | Accounting integration — Puzzle.io (pluggable) | 📋 Planned (Issue #63) | See below |
| **Phase F** | 1099-K compliance | ✅ Handled by Stripe Connect | $2.99/form |
| **Phase G** | Automated tax filing (Avalara/TaxJar) | 📋 Future — when volume justifies | 8-16 hours |

### Phase E Breakdown — Accounting Integration

| Sub-phase | What | Effort | Dependency |
|-----------|------|--------|------------|
| **E.1** | Create Puzzle.io account + connect Stripe | 0h (manual setup) | Stripe account |
| **E.2** | Pluggable provider architecture (`src/lib/accounting/`) | 4-6 hours | None |
| **E.3** | `sync-accounting` edge function (event-driven sync) | 2-3 hours | E.2 |
| **E.4** | Admin Accounting Integration settings panel | 2-3 hours | E.2 |
| **E.5** | Additional providers (QuickBooks, Xero) | 2-3 hours each | E.2 (as needed) |

---

## 9. Staged Financial Stack — Growth Plan

### Important Clarification: Puzzle.io IS the Ledger

Puzzle.io is a **complete general ledger** — not middleware or an automation layer. It replaces QuickBooks/Xero, it does not sit on top of them. Common misconception:

```
❌ WRONG: Stripe → Puzzle.io (automation) → QuickBooks (ledger)
✅ RIGHT: Stripe → Puzzle.io (ledger + automation + reports)
```

Puzzle.io provides: chart of accounts, journal entries, P&L, Balance Sheet, Cash Flow, bank reconciliation, and automated revenue recognition. No additional bookkeeping tool is needed.

### When Would RAV Add QuickBooks/Xero?

| Trigger | Why | Likelihood |
|---------|-----|------------|
| CPA insists on it | Most CPAs are trained on QB/Xero | Medium (depends on CPA) |
| W-2 payroll needed | Puzzle.io doesn't do payroll; QB integrates with Gusto/ADP | When hiring employees |
| Investor due diligence | Some investors/acquirers want "standard" books | Fundraising or acquisition |
| Multi-entity accounting | Subsidiary LLCs per state for tax | Significant multi-state ops |
| White-label / resale | Buyer may already use a different tool | Acquisition scenario |

The **pluggable architecture** (§6) ensures any of these transitions is a configuration change, not a rewrite.

### Stage 1 — Pre-Revenue / Early Revenue (NOW)

```
Stripe (test mode) ──→ nothing (dev transactions are invisible)
Stripe (live mode)  ──→ Puzzle.io (free tier, auto-sync)

RAV AdminDashboards ──→ Operational reporting (already built)
Stripe Connect      ──→ 1099-K generation (native)
```

**Tools:** Puzzle.io (free) | **Cost:** $0/mo

**What you get:**
- Auto-categorized Stripe transactions
- P&L, Balance Sheet, Cash Flow statements
- Revenue recognition (service fees = earned, owner payouts = liability)
- Bank reconciliation
- CPA export at tax time

### Stage 2 — Growing ($5K-$50K/mo revenue)

```
Stripe (live mode)   ──→ Puzzle.io ($25-50/mo)
Business bank account ──→ Puzzle.io (bank feed)
Corporate card (Ramp) ──→ Puzzle.io (expense auto-sync)
CPA                   ──→ Puzzle.io (invite as user)
```

**Added tools:** Ramp or Mercury card (optional) | **Cost:** $25-50/mo

**What you add:**
- Expense tracking for business costs (Vercel, Supabase, domains, marketing)
- Cash flow forecasting
- Direct CPA access to books
- Corporate card auto-categorization

### Stage 3 — Scale / Acquisition

```
Stripe (live mode)   ──→ QuickBooks or Xero (CPA's choice)
                          ↑ RAV pluggable adapter swaps config
Payroll (Gusto/ADP)  ──→ QuickBooks
Avalara/TaxJar       ──→ Automated tax filing per jurisdiction
```

**Added tools:** QB/Xero ($30-80/mo), Avalara ($50-300/mo) | **Cost:** $80-380/mo

**What you add:**
- "Standard" books for due diligence
- Payroll integration
- Automated tax filing and remittance
- Multi-entity support if needed

### Complementary Tools Reference

These tools are NOT needed now but may be relevant at scale:

| Tool | What It Does | When RAV Would Need It | Cost |
|------|-------------|------------------------|------|
| **Ramp** | Corporate cards + automated expense management | When RAV has regular business expenses | Free (revenue from interchange) |
| **Mercury** | Startup banking with API + card | Alternative to traditional bank | Free |
| **Avalara** | Automated tax filing per jurisdiction | When transaction volume justifies | $50-300/mo |
| **TaxJar** | Tax calculation + auto-filing (US states) | Alternative to Avalara | $19-99/mo |
| **Gusto** | Payroll + benefits for W-2 employees | When hiring employees | $40/mo + $6/person |
| **Digits.com** | AI cash flow forecasting, real-time P&L | Only if on QB wanting better visibility | $25-50/mo |
| **Monarch** | Business finance dashboards, FP&A | CFO-level planning at scale | $15/mo |
| **FreshBooks** | Invoicing + estimates | Not needed — Stripe handles billing | N/A |

---

## 10. Environment Mapping — Dev vs. Production

### Puzzle.io Does NOT Need Separate Dev/Prod Instances

Puzzle.io connects to your Stripe account at the **account level**. Stripe internally separates test mode vs. live mode data. This means:

```
DEV ENVIRONMENT (no Puzzle.io interaction):
┌─────────────────────────────────────────────────────────────┐
│ dev.rent-a-vacation.com                                     │
│   → GitHub: dev branch                                      │
│   → Vercel: preview deployment                              │
│   → Supabase DEV: oukbxqnlxnkainnligfz                     │
│   → Stripe: TEST mode keys (pk_test_*, sk_test_*)           │
│   → Puzzle.io: ❌ never sees test transactions              │
└─────────────────────────────────────────────────────────────┘

PRODUCTION ENVIRONMENT (Puzzle.io auto-syncs):
┌─────────────────────────────────────────────────────────────┐
│ rent-a-vacation.com                                         │
│   → GitHub: main branch                                     │
│   → Vercel: production deployment                           │
│   → Supabase PROD: xzfllqndrlmhclqfybew                    │
│   → Stripe: LIVE mode keys (pk_live_*, sk_live_*)           │
│   → Puzzle.io: ✅ auto-syncs all live transactions          │
└─────────────────────────────────────────────────────────────┘
```

### Setup Checklist

- [ ] Create ONE Puzzle.io account (free tier)
- [ ] Connect Stripe from the **live mode** dashboard (not test mode)
- [ ] Verify: test transactions from dev should NOT appear in Puzzle.io
- [ ] Verify: any live transactions auto-appear in Puzzle.io
- [ ] Set up chart of accounts: Revenue (Service Fees), Owner Payouts (Liability), Tax Collected (Liability), Operating Expenses

### Why This Works

Stripe's OAuth authorization scopes are mode-specific. When Puzzle.io requests access via Stripe Connect OAuth, it connects to your **live mode** data. Stripe test-mode transactions (from `sk_test_*` keys) exist in a completely separate namespace and are never exposed to connected third-party applications unless explicitly authorized in test mode.

---

## 11. Summary & Recommendations

1. **Per-night pricing** is active as the atomic unit across the platform ✅
2. **Separate fee line items** in booking records — nightly rate, service fee, cleaning fee, tax ✅
3. **Stripe Tax** for automated tax calculation — code ready, pending business formation (#127) 🟡
4. **Puzzle.io IS the general ledger** — not middleware. It replaces QuickBooks/Xero, not supplements them. Native Stripe integration, free tier, automated ASC 606 revenue recognition
5. **One Puzzle.io account** covers everything — connects to Stripe live mode only; dev/test transactions are invisible. No separate dev/prod instances needed
6. **1099-K compliance** handled natively by Stripe Connect ($2.99/form) — no separate tool needed ✅
7. **Pluggable architecture** for accounting integration — provider-agnostic adapter pattern; swap to QuickBooks/Xero via configuration (valuable for CPA preference, acquisition, or white-label scenarios)
8. **Staged growth plan** — start free (Puzzle.io), add expense tracking (Ramp/Mercury card), graduate to QB/Xero only if CPA or acquirer requires it
9. **Resort fees are owner-disclosed, not RAV-collected** ✅
10. **Stripe processing fees (~2.9%) absorbed by RAV** — baked into 15% service fee margin ✅
11. **Avalara/TaxJar** for automated tax filing — add when transaction volume justifies the cost

---

## Appendix A: Accounting Tool Evaluation & Decision Log (Feb 28, 2026)

### Tools Evaluated

| Tool | Free Tier | Stripe Integration | Revenue Recognition | Marketplace Fit | Decision |
|------|-----------|-------------------|---------------------|-----------------|----------|
| **Puzzle.io** | <$20K/mo | **Native API** (98% auto) | Automated (ASC 606) | **High** | ✅ Selected |
| QuickBooks Online | No ($30+/mo) | Via Synder/Zapier | Manual | Low | ❌ Too expensive, middleware required |
| Wave | Yes (limited) | Zapier only | Manual | Low | ❌ No mobile app, single-user free |
| Zoho Books | <$50K/yr | Basic | Manual | Medium | Runner-up |
| Xero | No ($20+/mo) | Marketplace app | Manual | Medium-High | Future option |
| FreshBooks | No ($19+/mo) | Third-party only | Manual | Low | ❌ Freelancer-focused |
| ZipBooks | Yes (basic) | Built-in (limited) | Manual | Low | ❌ Too basic |

### Key Decision Factors
1. **Native Stripe integration** eliminated need for middleware (Synder, Acodei, Zapier) — reduces cost, complexity, and data loss
2. **Automated revenue recognition** is critical for marketplace accounting (service fees = earned revenue, owner payouts = pass-through liabilities)
3. **Free tier** sufficient for pre-revenue / early-revenue phase
4. **Modern API** enables clean programmatic integration when needed
5. **Pluggable architecture** protects against vendor lock-in — can switch to QuickBooks/Xero if business requirements change (e.g., CPA preference, acquisition scenario)

### Common Misconception: "You need QuickBooks AND Puzzle.io"

A frequently encountered enterprise financial architecture looks like this:

```
Stripe → Puzzle.io (automation) → QuickBooks (ledger) → CPA
                                      ↑
                     Ramp (cards) ─────┘
```

This pattern makes sense for companies that **already have QuickBooks** and want better automation. But for a new company like RAV, this is unnecessary complexity. Puzzle.io IS the ledger:

```
Stripe → Puzzle.io (ledger + automation + reports) → CPA
```

The only scenarios where RAV would add QuickBooks/Xero on top:
1. A CPA who refuses to work in anything other than QB/Xero (unlikely with modern CPAs)
2. An acquisition where the buyer requires books in their existing system
3. W-2 payroll integration (Puzzle.io doesn't do payroll)

All of these are handled by the pluggable architecture — swap the provider config, re-sync historical data, done.

### Sources
- Synder: 8 Best Free QuickBooks Alternatives
- Zapier: The 10 Best QuickBooks Alternatives
- Mercury: Best Accounting Software for Startups 2026
- Puzzle.io: Stripe Partner Page, Revenue Recognition docs, Pricing page
- Stripe: Connect 1099 Tax Reporting documentation
- NerdWallet: Wave Accounting Review 2026
- Business.org: Best QuickBooks Alternatives 2026
- HubiFi: Best Accounting Software for Stripe Integration
- Hostaway: Best Accounting Software for Vacation Rentals

---

*Prepared for RAV Partners — February 2026 (Updated February 28, 2026)*
*Questions: support@rent-a-vacation.com*
