---
last_updated: "2026-05-15T00:00:00"
change_ref: "manual-edit"
change_type: "session-68-archive-stub"
status: "archived"
---

# ARCHIVED — moved 2026-05-15

This file was the **Platform UX Review** from March 2, 2026 (P0/P1/P2 recommendations that spawned issues #150–#164). It has been moved and renamed to clarify its purpose:

**New location:** [`docs/archive/Platform-UX-Review-2026-03-02.md`](archive/Platform-UX-Review-2026-03-02.md)

## Why renamed

The original filename "PLATFORM-REVIEW" was ambiguous — it sounded like an architectural platform overview, but the content was actually a **UX review with prioritized issue recommendations**. The new naming convention separates these:

| Pattern | Purpose | Cadence |
|---|---|---|
| `Platform-UX-Review-YYYY-MM-DD.md` | UX/marketplace review → spawns prioritized issues | Commissioned, ad hoc |
| `RAV-Platform-Overview-YYYY-MM-DD.md` (in `docs/exports/`) | Architectural inventory snapshot | Generated on demand by `/generate-docs --operating-model` |

Future UX reviews should use the `Platform-UX-Review-YYYY-MM-DD.md` naming convention and live at `docs/archive/` (current) or top-level (in-flight).

See [DEC-044](PROJECT-HUB.md#dec-044) for the documentation-management framework that enforces this distinction.
