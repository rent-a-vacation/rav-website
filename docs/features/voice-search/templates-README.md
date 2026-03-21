---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Multi-Agent Feature Development Template

This template provides a **repeatable process** for building features using sequential agent sessions with Claude Code.

---

## What This Template Provides

1. **Project Brief Template** - Architecture and requirements doc
2. **4 Agent Task Templates** - Specialized prompts for each development phase
3. **Handoff Templates** - Standard format for passing context between agents
4. **Production Checklist** - Pre-launch validation

---

## When to Use This Template

Use this approach when building features that involve:

- **Multiple technical layers** (API + Backend + Frontend + Testing)
- **Complex integration** (third-party services like VAPI, Stripe, etc.)
- **Sequential dependencies** (Frontend needs API to be built first)
- **Requires deep focus** (each agent specializes in one area)

**Examples:**
- Voice search integration
- Payment processing flow
- AI-powered recommendations
- Email notification system

---

## How to Use This Template

### **Step 1: Copy Template Folder**

```bash
# For a new feature called "payment-flow"
cp -r templates/multi-agent-feature/ docs/features/payment-flow/
```

### **Step 2: Fill Out Project Brief**

Edit `00-PROJECT-BRIEF.md`:

1. **Executive Summary** - What problem does this solve?
2. **Technical Architecture** - How will it work?
3. **Database Schema** - What tables/data are involved?
4. **API Contracts** - What endpoints/functions needed?
5. **Success Criteria** - How do you know each agent succeeded?

**Time Investment:** 1-2 hours of careful planning

### **Step 3: Customize Agent Tasks**

Edit each `0X-AGENT-Y-TASK.md`:

- Update role-specific requirements
- Add any special tools/libraries needed
- Define deliverables for each agent

### **Step 4: Run Agent Sessions Sequentially**

```bash
# Session 1: Integration/API Work
claude-code
# Paste: 00-PROJECT-BRIEF.md + 01-AGENT-1-TASK.md
# Wait for completion
# Review handoff package

# Session 2: Backend Development
claude-code  # NEW session
# Paste: 00-PROJECT-BRIEF.md + 02-AGENT-2-TASK.md + Agent 1 handoff
# Wait for completion
# Review handoff package

# Session 3: Frontend Development
claude-code  # NEW session
# Paste: 00-PROJECT-BRIEF.md + 03-AGENT-3-TASK.md + All previous handoffs
# Wait for completion
# Review handoff package

# Session 4: QA & Testing
claude-code  # NEW session
# Paste: 00-PROJECT-BRIEF.md + 04-AGENT-4-TASK.md + All previous handoffs
# Wait for completion
# Review final report
```

### **Step 5: Deploy to Production**

Use `PRODUCTION-CHECKLIST.md` to validate:

- All tests passing
- Environment variables set
- Deployment successful
- Monitoring configured

---

## File Structure for Each Feature

```
docs/features/YOUR-FEATURE/
├─ 00-PROJECT-BRIEF.md          # Master architecture doc
├─ 01-AGENT-INTEGRATION-TASK.md # Agent 1 prompt
├─ 02-AGENT-BACKEND-TASK.md     # Agent 2 prompt
├─ 03-AGENT-FRONTEND-TASK.md    # Agent 3 prompt
├─ 04-AGENT-QA-TASK.md          # Agent 4 prompt
├─ sample-data/                 # Mock data for testing
├─ handoffs/                    # Agent deliverables
│  ├─ agent1-handoff.md
│  ├─ agent2-handoff.md
│  ├─ agent3-handoff.md
│  └─ agent4-handoff.md
└─ PRODUCTION-CHECKLIST.md      # Pre-launch validation
```

---

## Agent Roles & Responsibilities

### **Agent 1: Integration Specialist**

**Focus:** External services, API configuration, third-party SDKs

**Delivers:**
- Service account setup
- API configuration
- Integration documentation
- Test credentials

**Example:** VAPI assistant setup, Stripe webhook config

---

### **Agent 2: Backend Engineer**

**Focus:** Server-side logic, database queries, Edge Functions

**Delivers:**
- API endpoints
- Database operations
- Business logic
- API documentation

**Example:** Supabase Edge Function for voice search

---

### **Agent 3: Frontend Developer**

**Focus:** User interface, React components, state management

**Delivers:**
- UI components
- Custom hooks
- State management
- User flow integration

**Example:** Voice search button and status indicators

---

### **Agent 4: QA Engineer**

**Focus:** Testing, validation, production readiness

**Delivers:**
- Test results
- Bug reports
- Production checklist
- Deployment recommendation

**Example:** E2E voice search testing, accessibility validation

---

## Best Practices

### **Planning Phase**

✅ **Do:**
- Invest 1-2 hours in detailed Project Brief
- Define clear success criteria for each agent
- Create realistic mock data
- Document API contracts precisely

❌ **Don't:**
- Skip the Project Brief (agents need context)
- Use vague requirements ("make it work")
- Assume agents know your domain
- Leave edge cases undefined

---

### **Execution Phase**

✅ **Do:**
- Run agents sequentially (one at a time)
- Review each handoff package before proceeding
- Test agent deliverables immediately
- Commit progress after each agent

❌ **Don't:**
- Skip handoff reviews (catch issues early)
- Run agents in parallel (causes conflicts)
- Ignore warnings from agents
- Deploy without QA validation

---

### **Handoff Best Practices**

Each handoff package should include:

1. **What Was Built** - Files created/modified
2. **How to Test** - Verification steps
3. **API Contracts** - Endpoints, schemas, examples
4. **Known Issues** - Bugs or limitations
5. **Next Steps** - What the next agent needs to know

**Template:** See `handoffs/HANDOFF-TEMPLATE.md`

---

## Common Pitfalls & Solutions

### **Pitfall 1: Vague Requirements**

**Problem:** Agent builds wrong thing because requirements unclear

**Solution:** Use Project Brief template sections:
- Technical Architecture diagram
- API contracts with examples
- Success criteria checklist

---

### **Pitfall 2: Missing Context**

**Problem:** Agent 3 doesn't know what Agent 1 built

**Solution:** Always paste ALL previous handoffs into new sessions

---

### **Pitfall 3: Skipping QA**

**Problem:** Deploy to production with untested edge cases

**Solution:** Agent 4 is non-negotiable. Even if feature "works", run QA.

---

### **Pitfall 4: Over-Engineering**

**Problem:** Agents add unnecessary complexity

**Solution:** Define MVP scope in Project Brief. Defer "nice-to-haves" to Phase 2.

---

## Estimated Timeline

| Phase | Duration | Your Effort | Agent Effort |
|-------|----------|-------------|--------------|
| Planning (Project Brief) | 1-2 hours | 100% | 0% |
| Agent 1 Session | 1-2 hours | 10% | 90% |
| Agent 2 Session | 2-3 hours | 15% | 85% |
| Agent 3 Session | 2-3 hours | 15% | 85% |
| Agent 4 Session | 1-2 hours | 30% | 70% |
| Integration & Deploy | 2-4 hours | 80% | 20% |
| **Total** | **9-16 hours** | **30%** | **70%** |

**Your Time Breakdown:**
- Planning: 1-2 hours
- Reviewing handoffs: 1 hour
- Testing: 2 hours
- Deployment: 1 hour
- **Total Active Time: 5-6 hours over 2-3 days**

---

## Success Metrics

Track these to improve the process:

- **Handoff Quality** - How many times did you need to re-run an agent?
- **Bug Rate** - How many critical bugs did QA find?
- **Deployment Time** - How long from Agent 4 complete to production?
- **Post-Launch Issues** - Any rollbacks or hotfixes needed?

**Goal:** <2 agent re-runs, <3 critical bugs, <2 hours deployment, zero rollbacks

---

## Feedback Loop

After each feature, update this template:

1. **What worked well?** - Add to best practices
2. **What failed?** - Add to pitfalls section
3. **What was unclear?** - Improve Project Brief template
4. **New tools discovered?** - Update agent task templates

---

## Example Features Built with This Template

1. **Voice Search** - VAPI + Supabase + React (9 hours)
2. **Payment Flow** - Stripe + Edge Functions + React (12 hours)
3. **Email Notifications** - Resend + CRON + React (7 hours)
4. **AI Recommendations** - OpenAI + Vector DB + React (14 hours)

---

## Template Files Included

```
templates/multi-agent-feature/
├─ README.md                    # This file
├─ 00-TEMPLATE-BRIEF.md         # Project architecture template
├─ 01-TEMPLATE-AGENT-1.md       # Integration specialist prompt
├─ 02-TEMPLATE-AGENT-2.md       # Backend engineer prompt
├─ 03-TEMPLATE-AGENT-3.md       # Frontend developer prompt
├─ 04-TEMPLATE-AGENT-4.md       # QA engineer prompt
├─ handoffs/
│  └─ HANDOFF-TEMPLATE.md       # Standard handoff format
└─ PRODUCTION-CHECKLIST.md      # Deployment validation
```

---

## Getting Started

**First time using this template?**

1. Read this README thoroughly
2. Look at `docs/features/voice-search/` as a working example
3. Copy templates to `docs/features/YOUR-FEATURE/`
4. Fill out Project Brief
5. Run Agent 1 session
6. Follow the process!

**Questions or improvements?**  
Update this README with learnings from each project.

---

**Last Updated:** February 9, 2026  
**Version:** 1.0 (Initial template)  
**Created From:** Voice Search implementation
