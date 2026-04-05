-- Migration 048: Set Stripe price IDs for subscription tiers
-- Maps each paid membership tier to its Stripe sandbox price ID.
-- These are TEST mode IDs from the Rent-A-Vacation Stripe sandbox account.

UPDATE membership_tiers SET stripe_price_id = 'price_1TIdJLE8AICp7gyW1QUm6Eu4' WHERE tier_key = 'traveler_plus';
UPDATE membership_tiers SET stripe_price_id = 'price_1TIdxhE8AICp7gyW52JjvV5C' WHERE tier_key = 'traveler_premium';
UPDATE membership_tiers SET stripe_price_id = 'price_1TIe5xE8AICp7gyWVVxlxlLD' WHERE tier_key = 'owner_pro';
UPDATE membership_tiers SET stripe_price_id = 'price_1TIeARE8AICp7gyWsDIWqycw' WHERE tier_key = 'owner_business';
