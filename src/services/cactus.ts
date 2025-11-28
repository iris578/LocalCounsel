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
      aiNoticed: 'Running in web mock mode - Cactus AI requires native mobile device',
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

  try {
    const result = await sttInstance.transcribe(
      audioPath,
      undefined, // prompt
      undefined, // options
      onToken
    );

    return result.transcription;
  } catch (error) {
    console.error('Transcription error:', error);
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
