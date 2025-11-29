# LocalCounsel

A privacy-first mobile app for attorneys to record, transcribe, and analyze client meetings — all on-device with no cloud dependency.

## Features

- **On-Device Recording** — Record meetings directly on your phone with high-quality audio
- **Local AI Transcription** — Speech-to-text powered by Whisper, running entirely on your device
- **Smart Extraction** — Automatically identifies key facts, people, dates, and action items from transcripts
- **Semantic Search** — Find information across all your meetings using natural language queries
- **Matter Organization** — Group meetings by client matter for easy case management
- **Complete Privacy** — All data stays on your device. No cloud uploads, no third-party access

## Tech Stack

- **React Native / Expo** — Cross-platform mobile development
- **Cactus SDK** — On-device LLM and STT inference
- **Whisper** — Speech recognition model
- **Qwen3** — Language model for extraction and Q&A
- **SQLite** — Local database for meetings and matters
- **Zustand** — State management

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator or Android device/emulator

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

### First Launch

On first launch, the app will download the AI models (~500MB total):
1. Whisper model for speech recognition
2. Qwen3 model for text extraction and Q&A

This is a one-time download. After that, everything runs offline.

## Usage

1. **Create a Matter** — Organize your work by client or case
2. **Record a Meeting** — Tap the record button to capture audio
3. **Review Transcript** — The AI automatically transcribes and extracts key information
4. **Ask Questions** — Use the Q&A feature to query your meeting transcripts
5. **Search Across Meetings** — Find information across all your matters

## Privacy

LocalCounsel is designed with attorney-client privilege in mind:

- All recordings stay on your device
- Transcription happens locally using on-device AI
- No internet connection required after initial model download
- No analytics or telemetry

## Development

```bash
# Type check
npx tsc --noEmit

# Run on web (limited functionality)
npx expo start --web
```

## License

MIT
