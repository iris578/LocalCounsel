import { generateEmbedding } from './cactus';
import { db } from './database';
import { EmbeddingRecord } from '../types';

// Cosine similarity between two vectors
const cosineSimilarity = (a: number[], b: number[]): number => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Chunk transcript into searchable pieces
const chunkText = (text: string, chunkSize: number = 500): string[] => {
  const sentences = text.split(/[.!?]+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((currentChunk + trimmed).length > chunkSize) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = trimmed + '. ';
    } else {
      currentChunk += trimmed + '. ';
    }
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
};

export const indexMeeting = async (
  meetingId: string,
  transcript: string
): Promise<void> => {
  const chunks = chunkText(transcript);
  console.log(`Indexing ${chunks.length} chunks for meeting ${meetingId}`);

  for (let i = 0; i < chunks.length; i++) {
    try {
      const embedding = await generateEmbedding(chunks[i]);
      await db.saveEmbedding(meetingId, i, chunks[i], embedding);
    } catch (error) {
      console.error(`Failed to index chunk ${i}:`, error);
    }
  }
};

export const searchMeetings = async (
  query: string,
  topK: number = 5
): Promise<{ meetingId: string; chunk: string; score: number }[]> => {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const allEmbeddings = await db.getAllEmbeddings();

    if (allEmbeddings.length === 0) {
      console.log('No embeddings found in database');
      return [];
    }

    const results = allEmbeddings.map((item: EmbeddingRecord) => ({
      meetingId: item.meetingId,
      chunk: item.chunkText,
      score: cosineSimilarity(queryEmbedding, item.embedding),
    }));

    // Sort by score descending, take top K
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
};

// Batch index multiple meetings (useful for demo data)
export const batchIndexMeetings = async (
  meetings: { id: string; transcript: string }[]
): Promise<void> => {
  console.log(`Batch indexing ${meetings.length} meetings...`);

  for (const meeting of meetings) {
    await indexMeeting(meeting.id, meeting.transcript);
  }

  console.log('Batch indexing complete');
};
