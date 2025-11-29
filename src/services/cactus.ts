// Cactus SDK wrapper for on-device LLM
// Uses cactus-react-native for local AI inference

import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

// Conditional import - cactus-react-native is native only
let CactusLM: any = null;
let CactusSTT: any = null;

if (!isWeb) {
  const cactusModule = require('cactus-react-native');
  CactusLM = cactusModule.CactusLM;
  CactusSTT = cactusModule.CactusSTT;
}

interface CactusMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CompletionParams {
  maxTokens?: number;
  temperature?: number;
  onToken?: (token: string) => void;
}

interface CompletionResult {
  response: string;
  tokensPerSecond?: number;
  totalTimeMs?: number;
}

// Singleton instances
let lmInstance: CactusLM | null = null;
let sttInstance: CactusSTT | null = null;
let isInitialized = false;
let isDownloaded = false;

// Download progress callback type
type ProgressCallback = (progress: number) => void;

/**
 * Initialize Cactus LLM for text completion and embeddings
 */
export const initializeCactus = async (
  onProgress?: ProgressCallback
): Promise<void> => {
  if (isWeb) {
    console.log('Cactus LLM not available on web - using mock mode');
    isInitialized = true;
    return;
  }

  console.log('Initializing Cactus LLM...');

  try {
    // Create CactusLM instance with qwen3 model (good for extraction tasks)
    lmInstance = new CactusLM({
      model: 'qwen3-0.6', // Small but capable model
      contextSize: 4096,
    });

    // Download model if not already downloaded
    if (!isDownloaded) {
      console.log('Downloading Cactus model...');
      await lmInstance.download((progress: number) => {
        console.log(`Download progress: ${Math.round(progress * 100)}%`);
        onProgress?.(progress);
      });
      isDownloaded = true;
    }

    // Initialize the model
    await lmInstance.init();
    isInitialized = true;
    console.log('Cactus LLM initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Cactus LLM:', error);
    throw error;
  }
};

/**
 * Initialize Cactus STT for speech-to-text transcription
 */
export const initializeCactusSTT = async (
  onProgress?: ProgressCallback
): Promise<void> => {
  if (isWeb) {
    console.log('Cactus STT not available on web - using mock mode');
    return;
  }

  console.log('Initializing Cactus STT...');

  try {
    sttInstance = new CactusSTT();

    await sttInstance.download((progress: number) => {
      console.log(`STT Download progress: ${Math.round(progress * 100)}%`);
      onProgress?.(progress);
    });

    await sttInstance.init();
    console.log('Cactus STT initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Cactus STT:', error);
    throw error;
  }
};

/**
 * Generate text completion using Cactus LLM
 * On web, returns a mock response indicating AI is unavailable
 */
export const completion = async (
  messages: CactusMessage[],
  params: CompletionParams = {}
): Promise<string> => {
  if (isWeb) {
    console.log('[Web Mock] Completion requested - returning placeholder');
    // Return mock JSON that the extraction parser can handle
    return JSON.stringify({
      keyFacts: ['[AI extraction not available on web - use mobile app for full functionality]'],
      people: [],
      dates: [],
      actionItems: ['Test on mobile device for AI-powered extraction'],
    });
  }

  if (!lmInstance || !isInitialized) {
    throw new Error('Cactus not initialized. Call initializeCactus first.');
  }

  const { maxTokens = 1500, temperature = 0.3, onToken } = params;

  try {
    const result = await lmInstance.complete(
      { messages },
      {
        maxTokens,
        temperature,
        topP: 0.9,
        topK: 40,
      },
      undefined, // tools
      onToken ? (token: string) => onToken(token) : undefined
    );

    if (result.success) {
      console.log(`Completion: ${result.tokensPerSecond?.toFixed(1)} tokens/sec`);
      return result.response;
    } else {
      throw new Error('Completion failed');
    }
  } catch (error) {
    console.error('Completion error:', error);
    throw error;
  }
};

/**
 * Generate text embedding using Cactus LLM
 * On web, returns a simple hash-based mock embedding
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (isWeb) {
    console.log('[Web Mock] Embedding requested - returning mock vector');
    // Generate a deterministic mock embedding based on text hash
    // This allows basic search functionality to work for UI testing
    const mockDimension = 384;
    const embedding: number[] = [];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash;
    }
    for (let i = 0; i < mockDimension; i++) {
      // Generate pseudo-random but deterministic values
      const val = Math.sin(hash * (i + 1)) * 0.5;
      embedding.push(val);
    }
    return embedding;
  }

  if (!lmInstance || !isInitialized) {
    throw new Error('Cactus not initialized. Call initializeCactus first.');
  }

  try {
    const result = await lmInstance.embed({ text });
    return result.embedding;
  } catch (error) {
    console.error('Embedding error:', error);
    throw error;
  }
};

/**
 * Transcribe audio file to text using Cactus STT
 * On web, returns a placeholder message
 */
export const transcribeAudio = async (
  audioPath: string,
  onToken?: (token: string) => void
): Promise<string> => {
  if (isWeb) {
    console.log('[Web Mock] Transcription requested - returning placeholder');
    return '[Audio transcription not available on web. Use mobile app for recording and transcription functionality.]';
  }

  if (!sttInstance) {
    throw new Error('Cactus STT not initialized. Call initializeCactusSTT first.');
  }

  // Validate audioPath before passing to native SDK
  // The cactus SDK may call .replace() internally on the path
  if (!audioPath || typeof audioPath !== 'string' || audioPath.length === 0) {
    throw new Error(`Invalid audio path passed to transcribeAudio: ${JSON.stringify(audioPath)}`);
  }

  // Ensure we have an absolute file path (not a file:// URI)
  // Some Android devices return paths without file:// prefix
  let filePath = audioPath;
  if (filePath.startsWith('file://')) {
    filePath = filePath.replace('file://', '');
  }

  // Validate the processed path
  if (!filePath || filePath.length === 0) {
    throw new Error(`Failed to process audio path: original=${audioPath}, processed=${filePath}`);
  }

  console.log('Cactus STT transcribing:', filePath);

  try {
    const result = await sttInstance.transcribe(
      filePath,
      undefined, // prompt
      undefined, // options
      onToken
    );

    // Validate result before returning
    if (!result) {
      throw new Error('Cactus STT returned null/undefined result');
    }

    if (typeof result.transcription !== 'string') {
      console.error('Unexpected transcription type:', typeof result.transcription, result);
      throw new Error(`Invalid transcription result: ${JSON.stringify(result)}`);
    }

    return result.transcription;
  } catch (error: any) {
    console.error('Transcription error:', error);
    // Check if this is the "replace of undefined" error from inside cactus SDK
    if (error?.message?.includes('replace') && error?.message?.includes('undefined')) {
      throw new Error('Audio transcription failed - the recording file may be corrupted or in an unsupported format. Try recording again.');
    }
    throw error;
  }
};

/**
 * Clean up qwen3 model response - removes thinking tokens and special tokens
 */
const cleanResponse = (response: string): string => {
  let cleaned = response;
  // Remove <think>...</think> blocks
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Remove qwen special tokens
  cleaned = cleaned.replace(/<\|im_end\|>/g, '');
  cleaned = cleaned.replace(/<\|im_start\|>/g, '');
  cleaned = cleaned.replace(/<\|endoftext\|>/g, '');
  // Remove common preamble phrases
  cleaned = cleaned.replace(/^(Okay,?\s*|Let me see,?\s*|Let's see,?\s*|Let me check,?\s*|Alright,?\s*)/i, '');
  return cleaned.trim();
};

/**
 * Ask a question about a meeting transcript
 * Uses the transcript as context to answer questions
 */
export const askQuestion = async (
  question: string,
  transcript: string,
  onToken?: (token: string) => void
): Promise<string> => {
  if (isWeb) {
    console.log('[Web Mock] Question requested - returning placeholder');
    return '[Q&A not available on web. Use mobile app for AI-powered answers.]';
  }

  if (!lmInstance || !isInitialized) {
    throw new Error('Cactus not initialized. Call initializeCactus first.');
  }

  const systemPrompt = `You are a legal assistant helping an attorney review a meeting transcript.
Answer questions based ONLY on the transcript provided. Be concise and factual.
If the information is not in the transcript, say so. Do not make up information.
IMPORTANT: Do NOT include any thinking, preamble, or phrases like "Okay", "Let me see", "Let's check" - just give the direct answer.`;

  const userPrompt = `/no_think
TRANSCRIPT:
${transcript}

QUESTION: ${question}

Answer directly without any preamble:`;

  const messages: CactusMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const result = await lmInstance.complete(
      { messages },
      {
        maxTokens: 500,
        temperature: 0.3,
        topP: 0.9,
        topK: 40,
      },
      undefined,
      onToken ? (token: string) => onToken(token) : undefined
    );

    if (result.success) {
      console.log(`Q&A: ${result.tokensPerSecond?.toFixed(1)} tokens/sec`);
      return cleanResponse(result.response);
    } else {
      throw new Error('Q&A completion failed');
    }
  } catch (error) {
    console.error('Q&A error:', error);
    throw error;
  }
};

/**
 * Ask a question across all meetings (global search with AI)
 * Uses multiple transcript contexts to answer questions
 */
export const askGlobalQuestion = async (
  question: string,
  contexts: { meetingId: string; transcript: string; matterName: string }[],
  onToken?: (token: string) => void
): Promise<string> => {
  if (isWeb) {
    console.log('[Web Mock] Global question requested - returning placeholder');
    return '[Global Q&A not available on web. Use mobile app for AI-powered answers.]';
  }

  if (!lmInstance || !isInitialized) {
    throw new Error('Cactus not initialized. Call initializeCactus first.');
  }

  // Combine contexts with matter info
  const combinedContext = contexts
    .map((ctx, i) => `--- Meeting ${i + 1} (${ctx.matterName}) ---\n${ctx.transcript}`)
    .join('\n\n');

  const systemPrompt = `You are a legal assistant helping an attorney search across multiple meeting transcripts.
Answer questions based ONLY on the transcripts provided. Be concise and factual.
When referencing information, mention which meeting it came from.
If the information is not in any transcript, say so. Do not make up information.
IMPORTANT: Do NOT include any thinking, preamble, or phrases like "Okay", "Let me see", "Let's check" - just give the direct answer.`;

  const userPrompt = `/no_think
MEETING TRANSCRIPTS:
${combinedContext}

QUESTION: ${question}

Answer directly without any preamble:`;

  const messages: CactusMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const result = await lmInstance.complete(
      { messages },
      {
        maxTokens: 800,
        temperature: 0.3,
        topP: 0.9,
        topK: 40,
      },
      undefined,
      onToken ? (token: string) => onToken(token) : undefined
    );

    if (result.success) {
      console.log(`Global Q&A: ${result.tokensPerSecond?.toFixed(1)} tokens/sec`);
      return cleanResponse(result.response);
    } else {
      throw new Error('Global Q&A completion failed');
    }
  } catch (error) {
    console.error('Global Q&A error:', error);
    throw error;
  }
};

/**
 * Stop any ongoing generation
 */
export const stopGeneration = async (): Promise<void> => {
  if (lmInstance) {
    await lmInstance.stop();
  }
  if (sttInstance) {
    await sttInstance.stop();
  }
};

/**
 * Reset context (clear conversation history)
 */
export const resetContext = async (): Promise<void> => {
  if (lmInstance) {
    await lmInstance.reset();
  }
};

/**
 * Clean up resources
 */
export const destroyCactus = async (): Promise<void> => {
  if (lmInstance) {
    await lmInstance.destroy();
    lmInstance = null;
  }
  if (sttInstance) {
    await sttInstance.destroy();
    sttInstance = null;
  }
  isInitialized = false;
};

/**
 * Check if Cactus is ready
 */
export const isReady = (): boolean => isInitialized;

/**
 * Check if model is downloaded
 */
export const isModelDownloaded = (): boolean => isDownloaded;

/**
 * Check if STT is available
 */
export const isSTTReady = (): boolean => sttInstance !== null;

/**
 * Get available models
 */
export const getAvailableModels = async (): Promise<string[]> => {
  if (!lmInstance) {
    const tempInstance = new CactusLM();
    const models = await tempInstance.getModels();
    return models.map((m: { name: string }) => m.name);
  }
  const models = await lmInstance.getModels();
  return models.map((m: { name: string }) => m.name);
};
