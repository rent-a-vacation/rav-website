---
last_updated: "2026-04-10T19:18:28"
change_ref: "cf233ec"
change_type: "session-39-docs-update"
status: "active"
---
# Seed Data Management System

## Overview

The seed system generates realistic test data for the DEV environment. It operates in 3 layers:

| Layer | Contents | Behavior on Reseed |
|-------|----------|--------------------|
| **Layer 1: Foundation** | 8 core users (3 RAV + 5 owners) | **Preserved** (never deleted) |
| **Layer 2: Inventory** | 10 properties, 30 listings | Deleted & recreated |
| **Layer 3: Transactions** | 50 renters, 90 bookings, bids, requests, conversations | Deleted & recreated |

## Architecture

```
Migration 015     →  profiles.is_seed_foundation column
Edge Function     →  supabase/functions/seed-manager/index.ts
Admin UI          →  Admin Dashboard > Dev Tools tab (DEV only)
```

## Test Accounts

**Password for all accounts:** `SeedTest2026!`

### RAV Team (Layer 1 — Foundation)
| Email | Role | Purpose |
|-------|------|---------|
| dev-owner@rent-a-vacation.com | RAV Owner | Full admin access |
| dev-admin@rent-a-vacation.com | RAV Admin | Admin operations |
| dev-staff@rent-a-vacation.com | RAV Staff | Staff view testing |

### Property Owners (Layer 1 — Foundation)
| Email | Name | Brand |
|-------|------|-------|
| owner1@rent-a-vacation.com | Alex Rivera | Hilton Grand Vacations |
| owner2@rent-a-vacation.com | Maria Chen | Marriott Vacation Club |
| owner3@rent-a-vacation.com | James Thompson | Disney Vacation Club |
| owner4@rent-a-vacation.com | Priya Patel | Wyndham Destinations |
| owner5@rent-a-vacation.com | Robert Kim | Bluegreen Vacations |

### Owner Maintenance Fees (Layer 1 — Foundation)

Each foundation owner has an `annual_maintenance_fees` value set for testing the Owner Dashboard (Phase 17):

| Owner | Annual Fees | Purpose |
|-------|------------|---------|
| Alex Rivera | $2,400 | HGV — mid-range fees |
| Maria Chen | $3,100 | Marriott — higher fees (Hawaii property) |
| James Thompson | $1,800 | Disney — lower fees |
| Priya Patel | $2,700 | Wyndham — above average |
| Robert Kim | $2,200 | Bluegreen — moderate |

These values are set by the `ensureFoundation()` function in seed-manager and are used by:
- `OwnerHeadlineStats` — fees coverage percentage KPI
- `EarningsTimeline` — monthly fee target ReferenceLine
- `MaintenanceFeeTracker` — coverage progress bar
- `get_owner_dashboard_stats()` RPC — `fees_covered_percent` calculation

### Membership Tier Assignments (Layer 1 — Foundation)

Owner and renter accounts are assigned membership tiers for testing subscription features:

| Account | Tier | Stripe Customer ID | Notes |
|---------|------|--------------------|-------|
| Owner1 (Alex Rivera) | Pro | `cus_test_owner1_pro` | 10 listing limit, 13% commission |
| Owner2 (Maria Chen) | Business | `cus_test_owner2_biz` | 25 listing limit, 10% commission |
| Owner3 (James Thompson) | Free | — | Default, 3 listing limit |
| Owner4 (Priya Patel) | Free | — | Default, 3 listing limit |
| Owner5 (Robert Kim) | Free | — | Default, 3 listing limit |
| Renter001 | Plus | — | Enhanced renter features |
| Renter002 | Plus | — | Enhanced renter features |
| Renter003 | Premium | — | Full renter features |
| Remaining renters | Free | — | Default tier |

### Additional Seed Data (Layer 3)

| Data Type | Count | Notes |
|-----------|-------|-------|
| Referral codes | 5 | One per foundation owner |
| API keys | 1 | `dev-owner`, partner tier |
| Voice search logs | 15 | Distributed across users |
| Conversations | ~50 | One per booking/bid with conversation_id FK set |
| Conversation messages | ~100 | 2 messages per conversation (traveler + owner) |
| Conversation events | ~50 | booking_confirmed / bid_placed / bid_accepted events |

### Renters (Layer 3 — Recreated on reseed)
- 50 renters: `renter001@rent-a-vacation.com` through `renter050@rent-a-vacation.com`
- Signup dates are backdated to create a growth curve over 90 days

### Email Routing
All `@rent-a-vacation.com` emails route via Cloudflare catchall to `rentavacation0@gmail.com`.

## Reseed Procedure

### Via Admin UI
1. Log in as any RAV team member on DEV
2. Go to Admin Dashboard > Dev Tools tab
3. Click "Refresh" in Status section to see current counts
4. Click "Reset & Reseed DEV" and confirm
5. Wait 30-60 seconds for completion
6. Review the step-by-step log

### Via curl
```bash
# Check status
curl -X POST https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/seed-manager \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}'

# Full reseed
curl -X POST https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/seed-manager \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"action": "reseed"}'
```

## Generated Data Details

### Properties (10)
- 2 per owner, using real vacation club resort names
- Brands: HGV, Marriott, Disney, Wyndham, Bluegreen
- Locations: Las Vegas, Orlando, Hawaii, Myrtle Beach, Daytona Beach

### Listings (30)
- 15 fixed-price active (approved)
- 10 bidding (open_for_bidding = true, 7-14 days remaining)
- 5 draft
- Check-in dates: 30-180 days from now
- Pricing: owner_price $700-$3,000, 15% RAV markup

### Bookings (105)
- 90 completed (growth curve: 15 → 30 → 45 over 90 days)
- 10 pending
- 5 confirmed in escrow (pending owner confirmation)
- Each completed booking has: booking_confirmation, platform_guarantee_fund contribution

### Pipeline
- 5 cancellation requests (mix of pending/approved/denied)
- 20 listing bids (on bidding listings)
- 10 travel requests (matching property locations)
- 8 travel proposals (from owners)

## Safety Guards

1. **Production Guard:** Edge function checks `IS_DEV_ENVIRONMENT=true` secret. Returns 403 in PROD.
2. **Admin UI Guard:** Dev Tools tab only renders when `VITE_SUPABASE_URL` contains the DEV project ref.
3. **Foundation Protection:** Layer 1 users have `is_seed_foundation = true` and are excluded from deletion.
4. **Idempotent:** Re-running reseed always works — it deletes non-foundation data first, then recreates.

## Deployment

```bash
# Set the dev environment flag (one-time)
npx supabase secrets set IS_DEV_ENVIRONMENT=true --project-ref oukbxqnlxnkainnligfz

# Deploy the migration
npx supabase db push --include-all

# Deploy the edge function
npx supabase functions deploy seed-manager --project-ref oukbxqnlxnkainnligfz
```

**Important:** Never set `IS_DEV_ENVIRONMENT=true` on PROD (`xzfllqndrlmhclqfybew`).
