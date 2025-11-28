# Cactus Integration in CounselVault

CounselVault leverages **Cactus** (on-device LLM technology) to provide privacy-first AI capabilities for legal professionals. All AI processing happens locally on the device, ensuring attorney-client privilege is maintained.

## Why Cactus?

Legal professionals handle highly sensitive client communications that cannot be sent to cloud services due to:
- **Attorney-client privilege** requirements
- **Bar association regulations** on data handling
- **Client confidentiality** expectations
- **Data breach liability** concerns

Cactus enables powerful AI features while keeping all data on-device.

---

## Cactus Features Used

### 1. LLM Completion (Text Generation)

**Purpose:** Extract structured legal information from meeting transcripts

**Location:** `src/services/cactus.ts` → `completion()`

**Used by:** `src/services/extraction.ts`

**What it does:**
After a meeting is transcribed, Cactus analyzes the transcript and extracts:

```json
{
  "keyFacts": ["Contract signed March 15th", "Damages estimated at $50,000"],
  "people": [{"name": "Tom Richards", "role": "HR Director"}],
  "dates": [{"date": "September 1st", "context": "Email requesting file deletion"}],
  "actionItems": ["Obtain original contract", "Interview witnesses"],
  "aiNoticed": "Client showed hesitation discussing timeline - worth following up"
}
```

**Legal Value:**
- Automatically identifies key facts for case building
- Tracks all people mentioned with their roles
- Captures important dates with context
- Generates action items for follow-up
- **AI Noticed**: Flags concerns, contradictions, or hesitations

---

### 2. Embeddings (Semantic Search)

**Purpose:** Enable natural language search across all meetings

**Location:** `src/services/cactus.ts` → `generateEmbedding()`

**Used by:** `src/services/embeddings.ts`

**What it does:**
- Converts transcript text into vector representations
- Enables semantic similarity search (meaning-based, not keyword)
- Queries like "when did the client mention damages?" find relevant passages

**Legal Value:**
- Find information across dozens of client meetings
- Search by concept, not just exact keywords

---

## Privacy Guarantees

1. **No network calls** - All inference happens locally
2. **No cloud storage** - Data stays in app sandbox
3. **Offline capable** - Works without internet
4. **Attorney-client safe** - Privilege maintained

---

*Built for the Cactus AI Hackathon*
