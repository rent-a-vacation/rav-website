# P0 Test Cases — Critical Path Library

> These are the 20 scenarios that, if broken, mean the platform cannot operate.
> Run with: `npm run test:p0`

## How it works

Tests tagged with `// @p0` in their describe block are included in the P0 suite.
The `test:p0` npm script uses Vitest's `--testNamePattern` to run only P0-tagged tests.

---

## P0 Test Cases by Journey

### 1. Authentication & Session (4 cases)

| ID | Scenario | Test File | Test Name |
|----|----------|-----------|-----------|
| P0-AUTH-01 | User can sign up with email/password | `src/contexts/AuthContext.test.tsx` | `@p0 sign up` |
| P0-AUTH-02 | User can sign in with email/password | `src/contexts/AuthContext.test.tsx` | `@p0 sign in` |
| P0-AUTH-03 | Google OAuth sign-in works | `src/contexts/AuthContext.test.tsx` | `@p0 google oauth` |
| P0-AUTH-04 | Role checks (isRavTeam, isPropertyOwner, isRenter) | `src/contexts/AuthContext.test.tsx` | `@p0 role checks` |

### 2. Search & Discovery (3 cases)

| ID | Scenario | Test File | Test Name |
|----|----------|-----------|-----------|
| P0-SRCH-01 | Active listings can be fetched | `src/hooks/useListings.test.ts` | `@p0 fetch active listings` |
| P0-SRCH-02 | Listings can be sorted (price, date, rating) | `src/lib/listingSort.test.ts` | `@p0 sort listings` |
| P0-SRCH-03 | Search results display correct pricing | `src/lib/pricing.test.ts` | `@p0 listing pricing` |

### 3. Pricing & Fees (3 cases)

| ID | Scenario | Test File | Test Name |
|----|----------|-----------|-----------|
| P0-PRICE-01 | Night count calculation is correct | `src/lib/pricing.test.ts` | `@p0 calculate nights` |
| P0-PRICE-02 | Fee breakdown is accurate (base + service fee + cleaning) | `src/lib/pricing.test.ts` | `@p0 fee breakdown` |
| P0-PRICE-03 | Cancellation refund calculation by policy | `src/lib/cancellation.test.ts` | `@p0 cancellation refund` |

### 4. Bidding & Booking (3 cases)

| ID | Scenario | Test File | Test Name |
|----|----------|-----------|-----------|
| P0-BID-01 | Renter can create a bid on a listing | `src/hooks/useBidding.test.ts` | `@p0 create bid` |
| P0-BID-02 | Owner can accept/reject a bid | `src/hooks/useBidding.test.ts` | `@p0 update bid status` |
| P0-BID-03 | BidFormDialog submits correct data | `src/components/bidding/BidFormDialog.test.tsx` | `@p0 bid form submit` |

### 5. Owner Operations (3 cases)

| ID | Scenario | Test File | Test Name |
|----|----------|-----------|-----------|
| P0-OWN-01 | Owner can view dashboard stats | `src/hooks/owner/useOwnerDashboardStats.test.ts` | `@p0 owner dashboard stats` |
| P0-OWN-02 | Owner can manage listings | `src/hooks/owner/useOwnerListingsData.test.ts` | `@p0 owner listings data` |
| P0-OWN-03 | Owner earnings are calculated correctly | `src/hooks/owner/useOwnerEarnings.test.ts` | `@p0 owner earnings` |

### 6. Cancellation & Disputes (2 cases)

| ID | Scenario | Test File | Test Name |
|----|----------|-----------|-----------|
| P0-CXL-01 | Renter cancellation applies correct policy refund | `src/hooks/useCancelBooking.test.ts` | `@p0 renter cancellation` |
| P0-CXL-02 | Dispute submission creates record | `src/hooks/useSubmitDispute.test.ts` | `@p0 submit dispute` |

### 7. Messaging & Notifications (2 cases)

| ID | Scenario | Test File | Test Name |
|----|----------|-----------|-----------|
| P0-MSG-01 | Booking messages can be sent and received | `src/hooks/useBookingMessages.test.ts` | `@p0 send message` |
| P0-MSG-02 | Realtime subscriptions connect and receive updates | `src/hooks/useRealtimeSubscription.test.ts` | `@p0 realtime subscription` |

---

## Coverage Gaps (Not Yet P0-Tagged)

These critical paths have **no existing tests** — they need new tests before launch:

| Gap | Description | Priority |
|-----|-------------|----------|
| **Checkout/Payment** | Stripe session creation → payment → booking confirmation | CRITICAL |
| **Admin Approval** | Listing approval → email → status change | HIGH |
| **Payout Flow** | Escrow release → Stripe Transfer → owner payout | HIGH |

These are tracked in GitHub Issues and will be addressed in dedicated testing sessions.

---

## Pre-Release Sign-Off Procedure

Before each production deploy:

1. Run `npm run test:p0` — all 20 P0 tests must pass
2. Run `npm run build` — zero TypeScript errors
3. Run `npm run lint` — zero lint errors
4. Verify on Vercel preview deploy (manual smoke test)
5. Merge PR to `main` with CI passing

---

## Adding New P0 Tests

When adding a new critical path test:

1. Add `@p0` to the test's `describe` or `it` name
2. Add the test to the table above with its P0 ID
3. Verify it runs with `npm run test:p0`
