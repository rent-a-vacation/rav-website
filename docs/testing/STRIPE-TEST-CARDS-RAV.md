---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Stripe Test Cards — Rent-A-Vacation Dev Team Reference

> **Important:** These cards only work on **dev.rent-a-vacation.com**  
> Never use real card numbers for testing. Never use these cards on the production site.

---

## Ground Rules for All Test Cards

| Field | What to Enter |
|---|---|
| Card Number | Use any number from the tables below |
| Expiry Date | Any future date — e.g. `12/28` |
| CVC | Any 3 digits — e.g. `123` (4 digits for Amex — e.g. `1234`) |
| ZIP / Postal Code | Any valid format — e.g. `32256` |
| Name | Anything — e.g. `Test User` |

---

## ✅ Successful Payment Cards (Use These for Normal Testing)

These cards complete payment without any issues.

| Brand | Card Number | Notes |
|---|---|---|
| **Visa** | `4242 4242 4242 4242` | Most commonly used — start here |
| **Visa (debit)** | `4000 0566 5566 5556` | Tests debit card flow |
| **Mastercard** | `5555 5555 5555 4444` | Standard Mastercard |
| **Mastercard (2-series)** | `2223 0031 2200 3222` | Newer Mastercard BIN range |
| **Mastercard (debit)** | `5200 8282 8282 8210` | Debit card flow |
| **Mastercard (prepaid)** | `5105 1051 0510 5100` | Prepaid card flow |
| **American Express** | `3782 822463 10005` | 15-digit, use 4-digit CVC |
| **American Express** | `3714 496353 98431` | Alternative Amex |
| **Discover** | `6011 1111 1111 1117` | Discover network |
| **Discover** | `6011 0009 9013 9424` | Alternative Discover |
| **Diners Club** | `3056 9300 0902 0004` | 16-digit |
| **Diners Club** | `3622 720627 1667` | 14-digit |
| **JCB** | `3566 0020 2036 0505` | Japanese card brand |
| **UnionPay** | `6200 0000 0000 0005` | Chinese card brand |

---

## ❌ Declined Payment Cards (Use These to Test Error Handling)

These cards simulate specific decline scenarios. Important for testing your booking error states.

| Card Number | Decline Reason | When to Use |
|---|---|---|
| `4000 0000 0000 0002` | Generic decline | General failure testing |
| `4000 0000 0000 9995` | Insufficient funds | Most common real-world decline |
| `4000 0000 0000 9987` | Lost card | Stolen/lost card scenario |
| `4000 0000 0000 9979` | Stolen card | Fraud scenario |
| `4000 0000 0000 0069` | Expired card | Expired card error |
| `4000 0000 0000 0127` | Incorrect CVC | Wrong security code |
| `4000 0000 0000 0119` | Processing error | Payment processor failure |
| `4000 0000 0000 0101` | Incorrect CVC | Use with any wrong CVC |

---

## 🔐 3D Secure Cards (Authentication Flow Testing)

3D Secure adds an extra authentication step (like a bank OTP). Test these flows if RAV handles European users.

| Card Number | Behavior |
|---|---|
| `4000 0027 6000 3184` | Requires authentication — triggers 3DS popup |
| `4000 0025 0000 3155` | Requires authentication always |
| `4000 0000 0000 3220` | 3DS authentication succeeds |
| `4000 0084 0000 1629` | 3DS authentication fails → payment declined |
| `4000 0000 0000 3063` | 3DS supported, but not required |

**How to use 3DS test cards:**
1. Enter the card number and proceed to checkout
2. A test authentication dialog will appear
3. Click **"Complete authentication"** to succeed or **"Fail authentication"** to decline

---

## 🌍 International Cards (For Testing Location-Based Scenarios)

Useful if testing currency or cross-border fee behavior.

| Country | Card Number | Brand |
|---|---|---|
| United States | `4242 4242 4242 4242` | Visa |
| United Kingdom | `4000 0082 6000 0000` | Visa |
| Canada | `4000 0012 4000 0000` | Visa |
| Australia | `4000 0003 6000 0000` | Visa |
| Brazil | `4000 0007 6000 0002` | Visa |
| India | `4000 0035 6000 0008` | Visa |
| Mexico | `4000 0048 4000 6782` | Visa |
| Germany | `4000 0002 7600 3184` | Visa |
| France | `4000 0025 0000 0003` | Visa |
| Japan | `4000 0039 2000 0003` | Visa |

---

## 🧪 Recommended Test Scenarios for RAV

When testing a full booking flow on dev.rent-a-vacation.com, run through these in order:

### Scenario 1 — Successful Booking (do this first)
- Card: `4242 4242 4242 4242`
- Expected: Payment completes, booking confirmation created, emails sent

### Scenario 2 — Insufficient Funds
- Card: `4000 0000 0000 9995`
- Expected: Payment fails, user sees error message, no booking created

### Scenario 3 — Generic Decline
- Card: `4000 0000 0000 0002`
- Expected: Payment declined, clear error shown to user

### Scenario 4 — Debit Card
- Card: `4000 0566 5566 5556`
- Expected: Same as successful booking — debit should work identically

### Scenario 5 — 3D Secure (if testing EU flows)
- Card: `4000 0027 6000 3184`
- Expected: Authentication popup appears, complete it, booking succeeds

---

## 🔍 How to Verify a Test Payment Went Through

1. Go to **https://dashboard.stripe.com**
2. Make sure you're in **Test mode** (toggle top-right)
3. Go to **Payments** in the left sidebar
4. Your test transaction should appear at the top of the list
5. Click it to see full details — amount, card used, status

If it shows up here → the DEV environment is correctly wired to Stripe test mode ✅  
If it doesn't appear → check that you're on dev.rent-a-vacation.com, not the production site

---

## ⚠️ Important Reminders

- These card numbers **only work in test mode** — they will be declined on the live site
- **Never use real credit card numbers** on the dev environment — Stripe prohibits it
- Test transactions appear in Stripe's test dashboard but **no real money moves**
- If you accidentally run a test on production, check Stripe Live mode → Payments immediately and refund it
- The Stripe test card `4242 4242 4242 4242` is your default — use it for 90% of testing

---

*Reference: Stripe official testing documentation — https://docs.stripe.com/testing*  
*Last updated: February 2026*
