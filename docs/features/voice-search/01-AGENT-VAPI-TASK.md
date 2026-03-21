---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# AGENT 1: VAPI Integration Specialist

**Role:** Voice AI Integration Expert  
**Mission:** Set up VAPI assistant for voice property search  
**Deliverables:** VAPI assistant ID, function calling config, handoff package  
**Estimated Time:** 1-2 hours

---

## Your Responsibilities

You are the **VAPI Integration Specialist** on this project. Your job is to:

1. ✅ Create and configure a VAPI assistant via their API
2. ✅ Define the function calling schema for property search
3. ✅ Configure the LLM (GPT-4o-mini) and voice settings
4. ✅ Test the assistant in VAPI dashboard
5. ✅ Document the configuration for the Backend Agent
6. ✅ Deliver a complete handoff package

---

## Context You Need

**Read the Project Brief first:**  
The user will paste `00-PROJECT-BRIEF.md` content into this conversation. Read it carefully to understand:
- The voice search architecture
- Database schema (listings + properties tables)
- Sample mock data (5 vacation rentals)
- Expected user queries

**Key Information:**
- **Platform:** Rent-A-Vacation (vacation rental marketplace)
- **User Type:** Travelers searching for timeshare rentals
- **Tech Stack:** React frontend, Supabase backend, VAPI for voice
- **LLM Model:** GPT-4o-mini (cost-effective for beta)
- **Transcription:** Deepgram (VAPI default)

---

## What VAPI Assistant Does

The assistant handles this conversation flow:

```
USER: "Find me a beachfront condo in Maui for Spring Break under $2000"
  ↓
VAPI ASSISTANT:
  1. Transcribes speech (Deepgram)
  2. Extracts intent (GPT-4o-mini):
     {
       destination: "Maui, HI",
       check_in_date: "2026-03-09",  // Inferred from "Spring Break"
       check_out_date: "2026-03-16",
       max_price: 2000,
       property_type: "condo",
       amenities: ["beachfront"]
     }
  3. Calls function: search_properties(...)
  4. Receives results from Edge Function
  5. Responds: "I found 3 beachfront condos in Maui..."
```

---

## Technical Requirements

### **VAPI Assistant Configuration**

**Use VAPI API to create the assistant** (not manual dashboard):

```bash
# Example using curl (you can use any HTTP client)
curl -X POST https://api.vapi.ai/assistant \
  -H "Authorization: Bearer $VAPI_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rent-A-Vacation Search Assistant",
    "model": {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "temperature": 0.7,
      "systemPrompt": "..."
    },
    "voice": {
      "provider": "11labs",
      "voiceId": "..."
    },
    "functions": [...]
  }'
```

### **System Prompt Template**

```
You are a helpful vacation rental search assistant for Rent-A-Vacation, a marketplace for timeshare and vacation club properties.

Your role:
- Help travelers find vacation rentals by asking clarifying questions if needed
- Extract search parameters from natural language queries
- Always call the search_properties function with structured data
- Summarize results in a friendly, conversational way

Guidelines:
- If the user says "cheap" or "affordable", assume max_price = 1500
- If the user mentions a season (e.g., "Spring Break"), infer approximate dates
- If bedrooms/guests not specified, don't assume - ask for clarification
- Always mention the top 2-3 results, not all of them (avoid overwhelming)
- If no results found, suggest nearby destinations or adjusting filters

Example interactions:
User: "Find something in Orlando for my family of 4"
You: "I'd be happy to help! When are you planning to visit Orlando, and what's your budget?"

User: "Next month, around $1500"
You: [Call search_properties with appropriate params]

Be warm, helpful, and concise. Don't mention technical details like function names or API calls.
```

### **Function Calling Schema**

```json
{
  "type": "function",
  "function": {
    "name": "search_properties",
    "description": "Search vacation rental listings. Use this whenever the user provides destination and/or dates/price/preferences.",
    "parameters": {
      "type": "object",
      "properties": {
        "destination": {
          "type": "string",
          "description": "City, state, or region. Examples: 'Maui, HI', 'Orlando, FL', 'Smoky Mountains'. Extract from user query."
        },
        "check_in_date": {
          "type": "string",
          "description": "YYYY-MM-DD format. Infer from phrases like 'Spring Break 2026' (around March 9-16), 'next weekend', 'in July'."
        },
        "check_out_date": {
          "type": "string",
          "description": "YYYY-MM-DD format. If user says 'one week' or '7 nights', calculate from check_in_date."
        },
        "min_price": {
          "type": "number",
          "description": "Minimum weekly price in USD. Usually omit unless user specifies."
        },
        "max_price": {
          "type": "number",
          "description": "Maximum weekly price in USD. Extract from 'under $2000', 'around $1500', 'cheap' (assume 1500)."
        },
        "bedrooms": {
          "type": "integer",
          "description": "Minimum bedrooms. Extract from '2-bedroom', 'sleeps 6' (infer 2-3 bedrooms), 'studio' (0)."
        },
        "property_type": {
          "type": "string",
          "enum": ["condo", "villa", "cabin", "studio", "any"],
          "description": "Property type. Default to 'any' unless user specifies."
        },
        "amenities": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "beachfront", "pool", "wifi", "full_kitchen", "parking",
              "oceanview", "mountain_view", "hot_tub", "fireplace",
              "gym", "golf", "casino_nearby", "playground", "bbq"
            ]
          },
          "description": "Required amenities. Extract from 'beachfront', 'with pool', 'has wifi'. Be selective - only add if explicitly mentioned."
        },
        "max_guests": {
          "type": "integer",
          "description": "Maximum occupancy. Extract from 'family of 4', 'sleeps 6'."
        },
        "open_for_bidding": {
          "type": "boolean",
          "description": "Only show listings accepting bids. Set true if user says 'open to offers', 'can I bid', 'flexible on price'."
        },
        "flexible_dates": {
          "type": "boolean",
          "description": "User is flexible on dates. Set true if they say 'anytime in March', 'flexible', 'not picky about dates'."
        }
      },
      "required": ["destination"]
    }
  }
}
```

### **Voice Configuration**

```json
{
  "voice": {
    "provider": "11labs",
    "voiceId": "EXAVITQu4vr4xnSDxMaL",  // "Bella" - warm, friendly female voice
    "stability": 0.5,
    "similarityBoost": 0.75,
    "style": 0.0,
    "useSpeakerBoost": true
  },
  "transcriber": {
    "provider": "deepgram",
    "model": "nova-2",
    "language": "en"
  }
}
```

### **Other Settings**

```json
{
  "firstMessage": "Hi! I'm here to help you find the perfect vacation rental. What destination are you interested in?",
  "voicemailMessage": "Thanks for trying our voice search! Please try again or use the search filters on our website.",
  "endCallMessage": "Thanks for using Rent-A-Vacation! You can continue browsing your results on the page.",
  "endCallFunctionEnabled": false,
  "dialKeypadFunctionEnabled": false,
  "recordingEnabled": false,  // Privacy: don't record unless needed
  "hipaaEnabled": false,
  "clientMessages": [
    "transcript",
    "function-call",
    "hang",
    "speech-update"
  ],
  "serverMessages": [
    "conversation-update",
    "end-of-call-report",
    "function-call"
  ],
  "silenceTimeoutSeconds": 30,
  "maxDurationSeconds": 600,  // 10 min max per session
  "backgroundSound": "off"
}
```

---

## Step-by-Step Tasks

### **Task 1: Review Project Context**

1. Read the Project Brief (`00-PROJECT-BRIEF.md`)
2. Understand the mock data (5 sample listings)
3. Note the database schema (listings + properties tables)

### **Task 2: Create VAPI Assistant**

**You have two options:**

**Option A: Via VAPI Dashboard (Manual)**
1. Go to https://vapi.ai/dashboard
2. Click "Create Assistant"
3. Configure using the settings above
4. Note the Assistant ID

**Option B: Via API (Preferred)**
1. Use VAPI API to create assistant programmatically
2. Save the response (contains assistant ID)
3. Write a script that the user can re-run if needed

**Choose Option B if possible** - it's more reproducible.

### **Task 3: Test the Assistant**

1. In VAPI dashboard, click "Test" on your assistant
2. Try these voice queries:
   - "Find me a beachfront condo in Maui"
   - "Show me something in Orlando under $2000"
   - "I need a cabin in the Smoky Mountains for Spring Break"
3. Verify the assistant calls `search_properties` function with correct params
4. Note: Function will fail (no Edge Function yet) - that's OK, just check the parameters

### **Task 4: Document Configuration**

Create a document with:
- Assistant ID
- Full configuration (JSON)
- Test conversation logs
- Any issues encountered

---

## Deliverables (Handoff Package)

Create a file called `vapi-handoff.md` with this structure:

```markdown
# VAPI Integration - Handoff Package

**Agent:** VAPI Integration Specialist  
**Completed:** [Date]  
**Handoff To:** Backend Agent

---

## Assistant Details

**Assistant ID:** `asst_xxxxxxxxxxxxx`

**Configuration:**
\`\`\`json
{
  "name": "Rent-A-Vacation Search Assistant",
  "model": { ... },
  "voice": { ... },
  "functions": [ ... ]
}
\`\`\`

---

## Function Calling Schema

**Function Name:** `search_properties`

**Expected Parameters:**
\`\`\`json
{
  "destination": "string (required)",
  "check_in_date": "YYYY-MM-DD",
  "check_out_date": "YYYY-MM-DD",
  "max_price": "number",
  "bedrooms": "integer",
  "amenities": ["array of strings"],
  ...
}
\`\`\`

---

## Test Results

**Test Query 1:** "Find me a beachfront condo in Maui under $2000"

**Extracted Parameters:**
\`\`\`json
{
  "destination": "Maui, HI",
  "max_price": 2000,
  "property_type": "condo",
  "amenities": ["beachfront"]
}
\`\`\`

**Result:** ✅ Function called with correct params

**Test Query 2:** [Add 2-3 more test queries]

---

## Edge Function Requirements

The Backend Agent needs to create an Edge Function at:
**URL:** `https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/voice-search`

**Expected Request:**
\`\`\`json
{
  "destination": "Maui, HI",
  "max_price": 2000,
  ...
}
\`\`\`

**Expected Response:**
\`\`\`json
{
  "success": true,
  "results": [ ... ],
  "total_count": 5
}
\`\`\`

---

## Integration Notes

1. **VAPI Public Key:** User must add to `.env.local` as `VITE_VAPI_PUBLIC_KEY`
2. **Frontend SDK:** Use `@vapi-ai/web` npm package
3. **Assistant ID:** Frontend needs this to initiate sessions
4. **Function Endpoint:** Backend must handle POST requests from VAPI

---

## Known Issues

- [List any issues encountered]
- [Workarounds or notes for next agent]

---

## Next Steps for Backend Agent

1. Create Supabase Edge Function: `voice-search`
2. Implement search logic using Supabase queries
3. Test with curl/Postman before integrating with VAPI
4. Update VAPI assistant with correct function URL (if needed)
```

---

## Success Criteria

Before marking this task complete, verify:

- ✅ VAPI assistant created and ID documented
- ✅ System prompt configured (warm, helpful, vacation rental context)
- ✅ Function calling schema defined (matches Project Brief contract)
- ✅ Voice settings configured (ElevenLabs, Deepgram)
- ✅ Test conversations logged (at least 3 different queries)
- ✅ Handoff package created (`vapi-handoff.md`)
- ✅ No critical errors in VAPI logs

---

## Resources

- **VAPI API Docs:** https://docs.vapi.ai
- **VAPI Dashboard:** https://vapi.ai/dashboard
- **ElevenLabs Voice Library:** https://elevenlabs.io/voice-library
- **Project Brief:** See `00-PROJECT-BRIEF.md` in this conversation

---

## Questions to Ask User Before Starting

1. Do you want me to create the assistant via API or manually in dashboard?
2. Any preference on voice personality (warm, professional, casual)?
3. Should I add any custom error messages or fallback responses?

---

**Ready to start? Ask the user to confirm you've received the Project Brief, then begin Task 1.**
