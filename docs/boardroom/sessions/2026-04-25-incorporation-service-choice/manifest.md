---
last_updated: "2026-04-26T00:28:36"
change_ref: "316dde6"
change_type: "manual-edit"
status: "active"
---

# Session Manifest

**Generated:** 2026-04-25 17:26:01 EDT
**Model:** claude-opus-4-7

## Question
Decision needed: which incorporation service to use for Rent-A-Vacation (RAV).

KNOWNS:
- Vehicle: Delaware C-Corp (decided — for VC fundability)
- Founders: 4 confirmed, 1 may join later, all live in Florida
- Operating state: Florida (will need foreign-entity registration there)
- Business model: Software platform / 3-sided marketplace connecting timeshare property owners to potential renters. Pure software/SaaS company providing services to the timeshare industry — NOT directly affiliated with any timeshare company and NOT owning timeshare properties. RAV charges 15% commission on bookings; tiered subscriptions for owners + travelers.
- Current state: Pre-launch. Platform is feature-complete in DEV (1394 tests, full marketplace + Stripe + voice + chat). All 8 policy docs (booking ToS, privacy, cancellation, payment, refund, trust & safety, insurance/liability, subscription terms) drafted and held in docs/support/policies/ at status:draft pending lawyer review. Goal: zero owners onboarded until lawyer signs off the full packet.
- Budget sensitivity: Bootstrapped solo until now, cost-conscious but won't cut corners on legal foundation.

DECISION TO MAKE: Choose between Stripe Atlas (~$500), Gust Launch, Clerky, or any alternative the board surfaces. Selection criteria the board should weigh: quality of generated documents, multi-founder handling, marketplace fit, bank + Stripe integration, lawyer relationship pipeline, Florida foreign-entity registration, long-term cap table & investor management, total true cost, speed to launch, founder optionality.

## Board
- **Name:** LEGAL-ADVISORY
- **Config file:** C:\Repos\personal_gsujit\github_jisujit\claude-global-config\boards\LEGAL-ADVISORY.md

## Advisors used
- Yokum Taku (Startup formation / Delaware C-Corp / cap table)
- Brian T. Lower (Timeshare law / vacation ownership operations / Florida regulatory compliance)
- Tonia Ouellette Klausner (Platform compliance / consumer class action defense / TCPA / privacy)
- Jason Gamel (Timeshare regulation / ARDA / industry credibility)
- Patrick McKenzie (Payments / Stripe / marketplace risk / fraud)

## Context file
C:\Repos\personal_gsujit\github_jisujit_tektekgo\rentavacation\docs\boardroom\boardroom-context.md

## Flags
- `--board`: LEGAL-ADVISORY (overrode the default RAV-TECHNICAL because the question is incorporation-vehicle / legal infrastructure, not technical)
- `--rounds`: full (R1 + R2)
- `--advisors`: (none — all advisors from board)
- `--context`: (default from board config)

## To rerun this session
```
/boardroom --board LEGAL-ADVISORY "Decision needed: which incorporation service to use for Rent-A-Vacation (RAV). [full question with KNOWNS + DECISION TO MAKE block, see Question section above]"
```

> **Note on reruns:** LLM output is non-deterministic. A rerun will produce a similar but not identical debate even if every input is frozen. Rerunning is also subject to drift in the engine (`commands/boardroom.md`), advisor profiles, business context file, and Claude model version since this session was generated. Rerun is "deliberate again under similar conditions" — not "reproduce."
