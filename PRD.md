# CounselVault - Product Requirements Document

## Overview

CounselVault is a privacy-first legal assistant mobile app that enables attorneys to record, transcribe, and analyze client meetings entirely on-device. Using Cactus on-device LLM technology, all AI processing happens locally, ensuring attorney-client privilege is maintained and sensitive legal data never leaves the device.

---

## Problem Statement

Attorneys face a critical challenge: they need AI assistance to manage client meetings efficiently, but cannot use cloud-based AI services due to:

1. **Attorney-client privilege** - Confidential communications must remain private
2. **Bar association regulations** - Many jurisdictions prohibit storing client data on third-party servers
3. **Data breach liability** - Cloud services create unnecessary risk exposure
4. **Client trust** - Clients expect their legal matters to remain confidential

---

## Solution

CounselVault provides a complete on-device solution for:

- **Recording** client meetings with high-quality audio
- **Transcribing** recordings locally using on-device AI
- **Extracting** key information (people, dates, facts, action items)
- **Detecting** potential concerns or contradictions
- **Searching** across all meetings using semantic search
- **Organizing** meetings by legal matter/case

---

## Tech Stack

```
React Native (Expo)
├── cactus-react-native    # On-device LLM & embeddings
├── expo-av                # Audio recording
├── @react-native-async-storage/async-storage
├── expo-router            # File-based navigation
└── zustand                # State management
```

---

## Project Structure

```
CounselVault/
├── app/
│   ├── _layout.tsx              # Root layout with initialization
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigation
│   │   ├── index.tsx            # Home / Matters list
│   │   ├── search.tsx           # Semantic search
│   │   └── settings.tsx         # Settings & demo data
│   ├── matter/
│   │   └── [id].tsx             # Matter detail (meeting list)
│   ├── meeting/
│   │   └── [id].tsx             # Meeting detail (extracted info)
│   └── record.tsx               # Recording screen
│
├── src/
│   ├── components/
│   │   ├── MatterCard.tsx       # Matter list item
│   │   ├── MeetingCard.tsx      # Meeting list item
│   │   └── ProcessingModal.tsx  # Processing steps modal
│   │
│   ├── services/
│   │   ├── cactus.ts            # Cactus SDK wrapper
│   │   ├── transcription.ts     # Audio → text
│   │   ├── extraction.ts        # Extract key info from transcript
│   │   ├── embeddings.ts        # Generate & search embeddings
│   │   └── database.ts          # AsyncStorage operations
│   │
│   ├── stores/
│   │   └── appStore.ts          # Zustand state management
│   │
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   │
│   └── utils/
│       └── demoData.ts          # Pre-loaded demo data
│
└── assets/
    └── models/                   # Downloaded GGUF models
```

---

## Core Features

### 1. Matter Management

**Purpose:** Organize client meetings by legal matter/case

**Features:**
- Create new matters with descriptive names
- View all matters sorted by recent activity
- See meeting count and last activity date
- Delete matters (cascades to meetings)

**Data Model:**
```typescript
interface Matter {
  id: string;
  name: string;
  createdAt: Date;
  meetingCount: number;
  lastMeetingAt?: Date;
}
```

---

### 2. Meeting Recording

**Purpose:** Capture client meetings with on-device audio recording

**Features:**
- Record audio using device microphone
- Display recording duration in real-time
- Select matter before recording
- Create new matter during recording flow
- Visual waveform feedback during recording

**Privacy:**
- Audio stored locally only
- No cloud upload capability
- Clear privacy indicators in UI

---

### 3. AI Extraction

**Purpose:** Automatically extract legally relevant information from transcripts

**Extracted Elements:**
- **Key Facts** - Important factual statements
- **People** - Names and roles mentioned
- **Dates** - Dates with context
- **Action Items** - Follow-up tasks
- **AI Noticed** - Concerns, contradictions, hesitations

**Prompt Strategy:**
```
You are a legal assistant analyzing a meeting transcript.
Extract the following information in JSON format:
{
  "keyFacts": ["Important factual statements about the case"],
  "people": [{"name": "Person Name", "role": "Their role if mentioned"}],
  "dates": [{"date": "Date mentioned", "context": "What the date refers to"}],
  "actionItems": ["Tasks or follow-ups needed"],
  "aiNoticed": "Any concerns, contradictions, hesitations worth following up"
}
Be concise. Focus on legally relevant information.
```

---

### 4. Semantic Search

**Purpose:** Find information across all meetings using natural language

**Features:**
- Search using conversational queries
- Results ranked by relevance score
- Show relevant snippet from transcript
- Navigate directly to meeting detail
- Example queries provided for guidance

**Technology:**
- Embeddings generated using Cactus on-device
- Cosine similarity for ranking
- Chunked transcript indexing (500 char chunks)

---

### 5. Meeting Detail View

**Purpose:** Display all extracted information from a single meeting

**Views:**
- **Summary Tab** - Extracted info (facts, people, dates, actions, AI notices)
- **Transcript Tab** - Full transcript text

**Visual Elements:**
- AI Notice highlighted in warning colors
- People shown with avatar initials
- Dates with context
- Checkboxes for action items

---

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                           HOME                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ CounselVault                            [Offline Mode ●] │  │
│  │ Your private legal assistant                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 📁 Smith v. Acme Corporation                          ›  │  │
│  │    2 meetings • Nov 26, 2024                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 📁 Johnson Estate Planning                            ›  │  │
│  │    1 meeting • Nov 21, 2024                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│                   [🎤 New Meeting]                               │
│                                                                  │
│              All data stays on your device                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        RECORD MEETING                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Matter: Smith v. Acme Corporation                     ›  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│                         ● 02:34                                  │
│                     [RECORDING...]                               │
│                                                                  │
│                    ▂ ▅ ▃ ▇ ▅ ▂ ▄ ▆ ▃ ▅                          │
│                                                                  │
│                        [⏹ STOP]                                  │
│                                                                  │
│           🔒 Recording stays on this device                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PROCESSING MODAL                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Processing Recording                         │  │
│  │           Your data stays on this device                  │  │
│  │                                                           │  │
│  │  ✓ Transcribing audio                                    │  │
│  │  ● Extracting key information...                         │  │
│  │  ○ Building search index                                  │  │
│  │  ○ Saving meeting                                         │  │
│  │                                                           │  │
│  │           🔒 100% on-device processing                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MEETING DETAIL                             │
│  Smith v. Acme Corporation                                      │
│  Wednesday, November 27, 2024                                   │
│  2:30 PM • 30 min 47 sec                                        │
│                                                                  │
│  [Summary] [Transcript]                                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ⚠️ AI Noticed                                             │  │
│  │ Client showed hesitation when discussing timeline         │  │
│  │ between March and September. Consider following up.       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  📋 Key Facts                                                    │
│  • Employment contract signed March 15th, 2024                  │
│  • Client refused to delete files                               │
│  • Estimated damages $50,000                                     │
│                                                                  │
│  👥 People Mentioned                                             │
│  [T] Tom Richards - HR Director                                 │
│  [J] Janet Williams - Direct Supervisor                         │
│                                                                  │
│  📅 Important Dates                                              │
│  March 15th, 2024 - Contract signing                            │
│  September 1st - File deletion request                          │
│                                                                  │
│  ✓ Action Items                                                  │
│  □ Obtain copy of original contract                             │
│  □ Request email records from September                         │
│  □ Interview Sarah Chen                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Privacy Features

### Visual Indicators
- **Green "Offline" badge** - Always visible on home screen
- **Lock icons** - Throughout UI emphasizing local storage
- **Processing modal** - Shows "100% on-device processing"
- **Footer text** - "All data stays on your device"

### Technical Implementation
- All AI processing via Cactus on-device LLM
- Audio files stored in app sandbox
- Database uses AsyncStorage (local only)
- No network permissions for data upload
- No analytics or telemetry

---

## Data Models

### Matter
```typescript
interface Matter {
  id: string;
  name: string;
  createdAt: Date;
  meetingCount: number;
  lastMeetingAt?: Date;
}
```

### Meeting
```typescript
interface Meeting {
  id: string;
  matterId: string;
  recordedAt: Date;
  durationSeconds: number;
  audioPath?: string;
  transcript: string;
  extractedInfo: ExtractedInfo;
}
```

### ExtractedInfo
```typescript
interface ExtractedInfo {
  keyFacts: string[];
  people: { name: string; role?: string }[];
  dates: { date: string; context: string }[];
  actionItems: string[];
  aiNoticed?: string;
}
```

### SearchResult
```typescript
interface SearchResult {
  meetingId: string;
  matterName: string;
  meetingDate: Date;
  snippet: string;
  relevanceScore: number;
}
```

---

## Demo Data

The app includes pre-loaded demo data for testing/demonstration:

### Matters
1. Smith v. Acme Corporation (2 meetings)
2. Johnson Estate Planning (1 meeting)
3. Tech Startup IP Dispute (1 meeting)
4. Martinez Employment Matter (1 meeting)

### Scenarios Covered
- Employment retaliation / whistleblower case
- Estate planning with family dynamics
- IP / trade secret dispute
- Workplace discrimination

---

## Development Timeline (Hackathon)

| Phase | Duration | Tasks |
|-------|----------|-------|
| Setup | 1 hour | Project init, dependencies, structure |
| Core Services | 3 hours | Cactus, database, extraction, embeddings |
| Recording | 2 hours | Audio capture, UI, matter selection |
| Processing | 2 hours | Transcription pipeline, progress UI |
| Display | 3 hours | Meeting detail, extracted info views |
| Search | 2 hours | Semantic search, results UI |
| Polish | 2 hours | Navigation, animations, error handling |
| Demo | 1 hour | Load demo data, test flows |

---

## Future Enhancements

### Post-Hackathon Roadmap
1. **Real transcription** - Integrate Cactus voice transcription
2. **Audio playback** - Play back recorded meetings
3. **Export** - Generate PDF reports of meetings
4. **Encryption** - Additional device encryption layer
5. **Backup** - Local encrypted backup/restore
6. **Templates** - Matter type templates (estate, litigation, etc.)
7. **Reminders** - Follow up on action items
8. **Cross-reference** - Link related meetings across matters

---

## Success Metrics

### Demo Goals
- [ ] Record meeting and see extraction in <60 seconds
- [ ] Search finds relevant results across all meetings
- [ ] Privacy messaging clear and consistent
- [ ] Professional, polished UI/UX
- [ ] All processing demonstrably on-device

### User Validation
- Attorneys understand the privacy value proposition
- Extracted information is accurate and useful
- Search results are relevant
- UI is intuitive without training

---

## Competitive Advantage

| Feature | CounselVault | Otter.ai | Fireflies | Rev |
|---------|--------------|----------|-----------|-----|
| On-device processing | ✅ | ❌ | ❌ | ❌ |
| No cloud storage | ✅ | ❌ | ❌ | ❌ |
| Attorney-client safe | ✅ | ❌ | ❌ | ❌ |
| Semantic search | ✅ | ✅ | ✅ | ❌ |
| Key info extraction | ✅ | ✅ | ✅ | ❌ |
| AI-detected concerns | ✅ | ❌ | ❌ | ❌ |
| Works offline | ✅ | ❌ | ❌ | ❌ |

---

## Technical Considerations

### Cactus SDK Integration
```typescript
// Initialize on app start
const { lm } = await CactusLM.init({
  model: 'path/to/model.gguf',
  n_ctx: 4096,
});

// Generate completion
const response = await lm.completion(messages, {
  n_predict: 1500,
  temperature: 0.2,
});

// Generate embedding
const embedding = await lm.embedding(text);
```

### Performance Optimization
- Chunk transcripts for embedding (500 chars)
- Pre-compute embeddings after transcription
- Cache matter/meeting data in Zustand store
- Lazy load meeting details

### Error Handling
- Graceful fallback if extraction fails
- Retry logic for embedding generation
- User feedback for all async operations

---

## Conclusion

CounselVault demonstrates that privacy-first AI is not only possible but can deliver a superior user experience for professionals handling sensitive information. By leveraging Cactus on-device LLM technology, we've created a tool that attorneys can trust with their most confidential client communications.

**Built for Cactus AI Hackathon**
*Demonstrating privacy-first legal tech with on-device AI*
