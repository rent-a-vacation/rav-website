---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# 📘 UNIVERSAL PROJECT DOCUMENTATION TEMPLATE

> **Use this structure for EVERY new project**  
> Copy this entire folder structure at project start

---

## 📁 STANDARD DOCS STRUCTURE

```
docs/
├── PROJECT-HUB.md              ⭐ SINGLE SOURCE OF TRUTH (start here!)
├── ARCHITECTURE.md             📐 Technical architecture & stack
├── DEPLOYMENT.md               🚀 CI/CD, deployment process
├── SETUP.md                    🛠️ Local development setup
│
├── features/                   🎯 Feature-specific documentation
│   ├── [feature-name]/
│   │   ├── 00-PROJECT-BRIEF.md         # What & why
│   │   ├── 01-SESSION1-TASK.md         # Implementation tasks
│   │   ├── handoffs/                   # Session handoffs
│   │   ├── KNOWN-ISSUES.md             # Bugs & tech debt
│   │   └── README.md                   # Quick reference
│   └── ...
│
├── guides/                     📚 User-facing documentation
│   ├── user-journey-map.md     # Complete UX flows
│   ├── help/                   # In-app help content
│   └── NEW-CHAT-TEMPLATE.md    # How to resume work
│
└── supabase-migrations/        🗄️ Database migrations (if using Supabase)
    ├── 001_initial_schema.sql
    └── ...
```

---

## ⭐ THE HUB: PROJECT-HUB.md

**Purpose:** The ONE file that answers "What's the project status?"

**Must contain:**
1. **Current Status** - What phase? What's being worked on?
2. **Top 3 Priorities** - Focus for this week
3. **Completed Phases** - What's shipped?
4. **Active Phases** - What's in progress?
5. **Planned Phases** - What's next (roadmap)?
6. **Ideas Backlog** - Unprior

itized ideas
7. **Decisions Log** - Why we chose X over Y
8. **Success Metrics** - How are we doing?
9. **Quick Reference** - Links to everything
10. **How to Use This Hub** - Instructions

**Update:** Every session end  
**Review:** Weekly

---

## 📐 ARCHITECTURE.md

**Purpose:** Technical reference for developers

**Must contain:**
1. High-level system diagram
2. Technology stack table
3. Project structure (folder tree)
4. Database schema
5. Key flows & integrations
6. Design system tokens
7. Deployment environments
8. Code conventions
9. Quick start for new devs

**Update:** When tech stack changes  
**Review:** Monthly

---

## 🚀 DEPLOYMENT.md

**Purpose:** How to deploy to production

**Must contain:**
1. Deployment pipeline diagram
2. Environment variables
3. CI/CD configuration
4. Manual deployment steps
5. Rollback procedure
6. Post-deployment checklist
7. Common issues & fixes

**Update:** When deployment process changes  
**Review:** Quarterly

---

## 🛠️ SETUP.md

**Purpose:** Get a new developer running locally

**Must contain:**
1. Prerequisites (Node, Git, etc.)
2. Clone repository
3. Install dependencies
4. Environment variables
5. Database setup
6. Run development server
7. Run tests
8. Common setup issues

**Update:** When onboarding fails  
**Review:** When new dev joins

---

## 🎯 Feature Documentation Pattern

**For EACH feature/phase, create:**

```
docs/features/[feature-name]/
├── 00-PROJECT-BRIEF.md         # Architecture, requirements, user flows
├── 01-SESSIONX-TASK.md         # Agent task cards (one per session)
├── handoffs/                   # Session completion summaries
│   └── sessionX-handoff.md
├── KNOWN-ISSUES.md             # Bugs, tech debt for this feature
└── README.md                   # Quick start, testing, links
```

**Template for PROJECT-BRIEF.md:**
- **Overview:** What is this feature?
- **Goals:** What problem does it solve?
- **Requirements:** What must it do?
- **Architecture:** How does it work?
- **Database Schema:** New tables/fields
- **User Flows:** Step-by-step UX
- **Implementation Plan:** Sessions breakdown
- **Success Criteria:** How to measure success

**Template for SESSION-TASK.md:**
- **Session:** Number and name
- **Duration:** Estimated time
- **Prerequisites:** What must be done first
- **Agent Role:** Database Engineer, Frontend, etc.
- **Tasks:** Numbered checklist
- **Deliverables:** Files created
- **Testing:** How to verify
- **Handoff:** What next session needs

**Template for handoffs/sessionX-handoff.md:**
- **What Was Built:** Components, files
- **What Works:** Verified functionality
- **Known Issues:** Any problems
- **Next Steps:** For next session
- **Testing Instructions:** How to verify

---

## 📚 User Guide Pattern

**For user-facing help:**

```
docs/guides/
├── user-journey-map.md         # Complete UX for all user types
└── help/
    ├── how-to-[feature].md     # Step-by-step guides
    └── faq.md                  # Common questions
```

---

## 🔄 NEW-CHAT-TEMPLATE.md

**Purpose:** How to start a fresh chat without losing context

**Must contain:**
1. Copy-paste prompt template
2. Files to reference
3. Environment info
4. Current status summary

**Example template:**

```markdown
# Starting a New Chat - [Project Name]

**Copy-paste this into ANY new Claude chat:**

---

Hi Claude! Continuing [Project Name] project.

**Context Files (please read):**
1. docs/PROJECT-HUB.md - Current status & priorities
2. docs/ARCHITECTURE.md - Technical architecture
3. [Feature-specific docs if relevant]

**Project Location:** [full path]

**Current Work:**
[Copy from PROJECT-HUB.md "Top 3 Priorities"]

**Today's Goal:**
[What you want to accomplish this session]

**Environment:**
- Production: [URL]
- Database: [connection info]
- Repo: [GitHub URL]

Ready to start!

---
```

---

## 🎯 WORKFLOW: How to Use This System

### Session Start (Every New Chat)
```
1. Open docs/PROJECT-HUB.md
2. Read "Current Status" (30 seconds)
3. Check "Top 3 Priorities" (30 seconds)
4. Copy NEW-CHAT-TEMPLATE.md prompt
5. Paste into Claude
6. Start working
```

### Session End (Every Time)
```
1. Update PROJECT-HUB.md:
   - Last Updated date
   - Move completed items to ✅
   - Update priorities if needed
   - Add any decisions made

2. Create feature handoff if applicable:
   - docs/features/[name]/handoffs/sessionX-handoff.md

3. Commit everything:
   git add docs/
   git commit -m "docs: Update project status [date]"
   git push

4. Close chat
```

### Weekly Review
```
1. Read PROJECT-HUB.md top-to-bottom
2. Update backlog based on learnings
3. Reprioritize "Top 3 Priorities"
4. Review metrics vs goals
5. Plan next week's work
```

### Monthly Review
```
1. Review all completed phases
2. Update roadmap (planned phases)
3. Archive old ideas from backlog
4. Update ARCHITECTURE.md if needed
5. Check all docs are current
```

---

## 🚀 PROJECT STARTUP CHECKLIST

**When starting a NEW project:**

- [ ] Create `docs/` folder
- [ ] Copy PROJECT-HUB.md template
- [ ] Create ARCHITECTURE.md (can be minimal at start)
- [ ] Create SETUP.md (even if simple)
- [ ] Create DEPLOYMENT.md (even if just "TODO")
- [ ] Create `docs/features/` folder
- [ ] Create `docs/guides/` folder
- [ ] Create NEW-CHAT-TEMPLATE.md
- [ ] Customize PROJECT-HUB.md for your project
- [ ] Commit initial docs structure
- [ ] Start building!

---

## 💡 KEY PRINCIPLES

### 1. Single Source of Truth
**PROJECT-HUB.md is the GPS.** Everything else is detail.

### 2. Living Documentation
**Update docs as you work,** not after. Stale docs are worse than no docs.

### 3. Minimal but Complete
**Include what's needed,** nothing more. If it doesn't help you, delete it.

### 4. Context Travels in Files
**Not in chat history.** Handoffs and PROJECT-HUB.md carry context between sessions.

### 5. Consistency Across Projects
**Use this structure for EVERY project.** Muscle memory = efficiency.

---

## 📊 DECISION FRAMEWORK

**When to document a decision:**
- ✅ Architectural choice (database, framework, etc.)
- ✅ Product direction (feature priority, UX approach)
- ✅ Trade-off made (performance vs simplicity)
- ✅ Anything you might revisit later

**Decision template:**
```
### DEC-XXX: [Title]
**Date:** YYYY-MM-DD
**Decision:** What was decided
**Reasoning:** Why this choice
**Alternatives Considered:** What else was an option
**Trade-offs:** What we gave up
**Status:** ✅ Final / 🟡 Pending / 🔴 Revisit
```

---

## 🎯 PHASE COMPLETION TEMPLATE

**When finishing a phase:**

```
### Phase X: [Name] ✅
**Completed:** [Date]
**Status:** LIVE in production
**Docs:** docs/features/[name]/

**Delivered:**
- [Feature 1]
- [Feature 2]
- [Feature 3]

**Impact:**
- [Metric]: [Change]
- [Metric]: [Change]

**Known Issues:**
- [Issue] - See docs/features/[name]/KNOWN-ISSUES.md
```

---

## 🔧 MAINTENANCE

**Keep docs healthy:**
- 🟢 **Green:** Updated within 7 days
- 🟡 **Yellow:** Updated within 30 days
- 🔴 **Red:** Older than 30 days → needs update

**Review quarterly:**
- Are all docs current?
- Can we archive anything?
- Do new devs understand them?
- Are templates still relevant?

---

## 🎓 EXAMPLES

**Good Projects Using This System:**
- Rent-A-Vacation (this project!)
- Splitbi (expense sharing)
- TripBi (trip planning)

**Check their `docs/` folders for real-world examples**

---

## ✅ TEMPLATE CHECKLIST

**This template includes:**
- [x] Clear folder structure
- [x] File naming conventions
- [x] Content templates
- [x] Workflow instructions
- [x] Decision framework
- [x] Maintenance guidelines
- [x] Real examples

**Ready to use for your next project!**

---

**Version:** 1.0  
**Last Updated:** March 13, 2026
**Maintained by:** Sujit + Claude Team
