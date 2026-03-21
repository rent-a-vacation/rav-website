---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Voice Search - Production Deployment Checklist

**Feature:** Voice-powered property search  
**Target:** Production deployment to Vercel + Supabase PROD  
**Date:** [Fill in deployment date]

---

## Pre-Deployment Verification

### **Code Quality**

- [ ] All TypeScript errors resolved (`npm run build` succeeds)
- [ ] No console.errors in production code
- [ ] Environment variables use production values
- [ ] No hardcoded test data or API keys in code
- [ ] Git branch merged to `main`
- [ ] All commits pushed to GitHub

### **Testing**

- [ ] QA Agent has marked feature as "Ready for Production"
- [ ] All critical (P0) bugs fixed
- [ ] E2E voice search tested successfully (10+ queries)
- [ ] Tested in Chrome, Firefox, Safari, Edge
- [ ] Mobile testing complete (iOS + Android)
- [ ] Accessibility validation passed
- [ ] Performance benchmarks met (<5s search time)

### **VAPI Configuration**

- [ ] VAPI assistant tested in dashboard
- [ ] System prompt finalized
- [ ] Function calling schema validated
- [ ] Voice settings optimized (ElevenLabs voice selected)
- [ ] Test conversations logged (no errors)
- [ ] VAPI account has sufficient credits

### **Backend (Supabase)**

- [ ] Edge Function `voice-search` working in DEV
- [ ] Edge Function tested with curl (5+ test cases)
- [ ] Database schema finalized (no pending migrations)
- [ ] RLS policies tested (if applicable)
- [ ] Supabase PROD project accessible
- [ ] Supabase CLI linked to PROD: `npx supabase link --project-ref xzfllqndrlmhclqfybew`

### **Frontend (React)**

- [ ] Voice button renders on `/rentals` page
- [ ] `useVoiceSearch` hook tested
- [ ] Status indicators working
- [ ] Error handling validated
- [ ] No console errors during voice search
- [ ] Build size acceptable (no massive bundle bloat)

---

## Deployment Steps

### **Step 1: Deploy Edge Function to PROD**

```bash
# From project root
npx supabase functions deploy voice-search --project-ref xzfllqndrlmhclqfybew
```

**Verify:**
```bash
curl -X POST \
  https://xzfllqndrlmhclqfybew.supabase.co/functions/v1/voice-search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PROD_ANON_KEY" \
  -d '{"destination": "Maui"}'
```

**Expected:** Valid JSON response (even if results empty)

- [ ] Edge Function deployed successfully
- [ ] curl test returns 200 status
- [ ] Function logs show no errors

---

### **Step 2: Update VAPI Assistant (PROD Function URL)**

**Option A: Via VAPI Dashboard**
1. Go to https://vapi.ai/dashboard
2. Select "Rent-A-Vacation Search Assistant"
3. Edit function calling config
4. Update `search_properties` function URL to:
   ```
   https://xzfllqndrlmhclqfybew.supabase.co/functions/v1/voice-search
   ```
5. Save changes

**Option B: Via VAPI API**
```bash
curl -X PATCH https://api.vapi.ai/assistant/asst_xxxxx \
  -H "Authorization: Bearer $VAPI_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "functions": [{
      "name": "search_properties",
      "url": "https://xzfllqndrlmhclqfybew.supabase.co/functions/v1/voice-search",
      ...
    }]
  }'
```

- [ ] VAPI assistant updated with PROD URL
- [ ] Test conversation in VAPI dashboard works
- [ ] Function calls reach PROD Edge Function (check logs)

---

### **Step 3: Set Production Environment Variables**

**In Vercel Dashboard:**

1. Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. Add/update for **Production** environment:

```bash
VITE_SUPABASE_URL=https://xzfllqndrlmhclqfybew.supabase.co
VITE_SUPABASE_ANON_KEY=your_prod_anon_key
VITE_VAPI_PUBLIC_KEY=your_vapi_public_key
VITE_VAPI_ASSISTANT_ID=asst_xxxxx
```

3. Save changes
4. Trigger redeployment (or next Git push will use new vars)

- [ ] All production env vars set in Vercel
- [ ] No DEV credentials in production environment
- [ ] Redeploy triggered

---

### **Step 4: Deploy Frontend to Production**

**If using Vercel auto-deploy from GitHub:**

```bash
# Ensure you're on main branch
git checkout main
git pull origin main

# Merge feature branch (if not done)
git merge feature/voice-search

# Push to trigger deployment
git push origin main
```

**Vercel will automatically:**
- Build the React app
- Use production environment variables
- Deploy to production URL

**Monitor deployment:**
- Go to Vercel dashboard
- Watch build logs
- Verify deployment succeeds

- [ ] Code pushed to `main` branch
- [ ] Vercel build succeeded
- [ ] Production site accessible
- [ ] No build errors in Vercel logs

---

### **Step 5: Smoke Test Production**

Visit your production site: `https://rentavacation.lovable.app/rentals`

**Test:**
1. Voice button appears
2. Click voice button
3. Allow microphone (if prompted)
4. Speak: "Find me a beachfront condo in Maui"
5. Verify results display (or no results if DB empty)
6. Check browser console for errors

- [ ] Voice button renders on PROD
- [ ] VAPI session starts successfully
- [ ] Edge Function called (check Supabase logs)
- [ ] No console errors
- [ ] Voice assistant responds audibly

---

## Post-Deployment Monitoring

### **First 24 Hours**

**Monitor these:**

1. **VAPI Dashboard** (https://vapi.ai/dashboard)
   - Track: Number of calls
   - Track: Average call duration
   - Track: Error rate
   - Alert: If error rate >5%

2. **Supabase Logs** (https://supabase.com/dashboard)
   - Functions → voice-search → Logs
   - Look for: 4xx/5xx errors
   - Alert: If error rate >10%

3. **Vercel Logs** (https://vercel.com/dashboard)
   - Check: Frontend errors
   - Check: Failed requests
   - Alert: If error count spikes

4. **User Feedback**
   - Monitor support email
   - Check social media mentions
   - Track: Voice feature usage vs manual search

- [ ] VAPI usage tracking active
- [ ] Supabase function logs monitored
- [ ] Vercel error tracking configured
- [ ] User feedback mechanism in place

---

### **First Week Metrics**

**Track these KPIs:**

| Metric | Target | Actual |
|--------|--------|--------|
| Voice searches per day | 10+ | [Fill in] |
| Successful search rate | >80% | [Fill in] |
| Average session duration | <60s | [Fill in] |
| Error rate | <5% | [Fill in] |
| Mobile usage | >30% | [Fill in] |

**Action Items if Targets Missed:**
- [ ] Investigate error logs
- [ ] Collect user feedback
- [ ] Optimize voice prompts
- [ ] Fix critical bugs

---

## Rollback Plan

**If critical issues arise**, follow this rollback procedure:

### **Option 1: Feature Flag (Recommended)**

**Add feature flag to control voice button visibility:**

```typescript
// In .env.local (and Vercel env vars)
VITE_FEATURE_VOICE_SEARCH=false  // Disable voice

// In Rentals.tsx
const voiceSearchEnabled = import.meta.env.VITE_FEATURE_VOICE_SEARCH === "true";

return (
  <>
    {voiceSearchEnabled && (
      <VoiceSearchButton {...props} />
    )}
  </>
);
```

**To disable:**
1. Set `VITE_FEATURE_VOICE_SEARCH=false` in Vercel
2. Redeploy
3. Voice button hidden, manual search still works

- [ ] Feature flag implemented
- [ ] Tested toggling flag on/off

---

### **Option 2: Git Revert**

**If feature flag not available:**

```bash
# Find the merge commit
git log --oneline

# Revert the merge
git revert -m 1 <merge_commit_sha>

# Push to trigger redeployment
git push origin main
```

This removes voice search code entirely.

- [ ] Merge commit SHA documented: `[SHA here]`
- [ ] Revert tested in local environment
- [ ] Team notified of rollback procedure

---

## Documentation Updates

### **User-Facing**

- [ ] FAQ updated with "How to use voice search"
- [ ] User guide updated with voice search section
- [ ] Help center article published
- [ ] Announcement posted (blog/social media)

### **Internal**

- [ ] Architecture docs updated (ARCHITECTURE.md)
- [ ] Deployment guide updated (DEPLOYMENT.md)
- [ ] Troubleshooting guide created
- [ ] Runbook for on-call engineers

---

## Success Criteria

**This deployment is considered successful if:**

- ✅ Zero production-breaking bugs in first 48 hours
- ✅ Voice search used by 10+ users in first week
- ✅ <5% error rate
- ✅ Positive user feedback (no complaints about UX)
- ✅ No rollback required

---

## Sign-Off

**Technical Lead:** [ ] Approved  
**QA Lead:** [ ] Approved  
**Product Owner:** [ ] Approved  

**Deployment Date:** [Fill in]  
**Deployed By:** [Name]  
**Deployment Time:** [Timestamp]  
**Deployment Duration:** [X minutes]  

---

## Post-Launch Review (1 Week)

**Schedule a team review 1 week after launch to:**

- Review metrics vs targets
- Discuss user feedback
- Identify UX improvements
- Plan Phase 2 features (voice listing creation)
- Celebrate wins! 🎉

**Review Meeting Date:** [Schedule]

---

**END OF CHECKLIST**
