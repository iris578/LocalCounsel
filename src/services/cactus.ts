// Cactus SDK wrapper for on-device LLM
// Note: Using mock implementation for hackathon demo
// Replace with actual cactus-react-native when available

interface CactusMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CompletionParams {
  n_predict?: number;
  temperature?: number;
}

let isInitialized = false;
let modelPath: string | null = null;

export const initializeCactus = async (path: string): Promise<void> => {
  console.log('Initializing Cactus with model:', path);
  modelPath = path;

  // Simulate model loading delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  isInitialized = true;
  console.log('Cactus initialized successfully');
};

export const completion = async (
  messages: CactusMessage[],
  params: CompletionParams = {}
): Promise<string> => {
  if (!isInitialized) {
    throw new Error('Cactus not initialized. Call initializeCactus first.');
  }

  const { n_predict = 1000, temperature = 0.3 } = params;

  // For hackathon demo, we'll simulate LLM responses
  // Replace this with actual Cactus SDK call:
  // const { lm } = await CactusLM.init({ model: modelPath, n_ctx: 4096 });
  // return await lm.completion(messages, { n_predict, temperature });

  console.log('Generating completion with params:', { n_predict, temperature });

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const lastMessage = messages[messages.length - 1];

  // Mock extraction response for demo
  if (lastMessage.content.includes('Extract the following information')) {
    return JSON.stringify({
      keyFacts: [
        'Contract was signed on March 15th',
        'Estimated damages around $50,000',
        'Client was asked to delete certain files',
      ],
      people: [
        { name: 'Tom Richards', role: 'Former boss' },
      ],
      dates: [
        { date: 'March 15th', context: 'Contract signing date' },
        { date: 'September 1st', context: 'Email requesting file deletion' },
      ],
      actionItems: [
        'Obtain copy of the original contract',
        'Request email records from September',
        'Interview potential witnesses',
      ],
      aiNoticed: 'Client seemed hesitant when discussing the timeline of events. Worth following up on the sequence of file deletion requests.',
    });
  }

  return 'Mock completion response';
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (!isInitialized) {
    throw new Error('Cactus not initialized. Call initializeCactus first.');
  }

  // For hackathon demo, generate deterministic pseudo-embeddings
  // Replace with actual Cactus embedding call:
  // return await lm.embedding(text);

  const embedding: number[] = [];
  const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Generate 384-dimensional embedding (common size)
  for (let i = 0; i < 384; i++) {
    const value = Math.sin(seed * (i + 1) * 0.01) * 0.5;
    embedding.push(value);
  }

  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map((val) => val / magnitude);
};

export const isReady = (): boolean => isInitialized;

export const getModelPath = (): string | null => modelPath;
