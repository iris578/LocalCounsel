export interface Matter {
  id: string;
  name: string;
  createdAt: Date;
  meetingCount: number;
  lastMeetingAt?: Date;
}

export interface Meeting {
  id: string;
  matterId: string;
  recordedAt: Date;
  durationSeconds: number;
  audioPath?: string;
  transcript: string;
  extractedInfo: ExtractedInfo;
}

export interface ExtractedInfo {
  keyFacts: string[];
  people: { name: string; role?: string }[];
  dates: { date: string; context: string }[];
  actionItems: string[];
  aiNoticed?: string;
}

export interface SearchResult {
  meetingId: string;
  matterName: string;
  meetingDate: Date;
  snippet: string;
  relevanceScore: number;
}

export interface EmbeddingRecord {
  meetingId: string;
  chunkText: string;
  embedding: number[];
}
