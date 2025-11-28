import AsyncStorage from '@react-native-async-storage/async-storage';
import { Matter, Meeting, EmbeddingRecord } from '../types';

// Keys for AsyncStorage
const KEYS = {
  MATTERS: 'counselvault_matters',
  MEETINGS: 'counselvault_meetings',
  EMBEDDINGS: 'counselvault_embeddings',
};

// Helper to generate unique IDs
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const db = {
  // Initialize database (clear or load existing data)
  init: async (): Promise<void> => {
    console.log('Initializing database...');
    // Ensure keys exist
    const matters = await AsyncStorage.getItem(KEYS.MATTERS);
    if (!matters) {
      await AsyncStorage.setItem(KEYS.MATTERS, JSON.stringify([]));
    }
    const meetings = await AsyncStorage.getItem(KEYS.MEETINGS);
    if (!meetings) {
      await AsyncStorage.setItem(KEYS.MEETINGS, JSON.stringify([]));
    }
    const embeddings = await AsyncStorage.getItem(KEYS.EMBEDDINGS);
    if (!embeddings) {
      await AsyncStorage.setItem(KEYS.EMBEDDINGS, JSON.stringify([]));
    }
    console.log('Database initialized');
  },

  // Clear all data
  clear: async (): Promise<void> => {
    await AsyncStorage.multiRemove([KEYS.MATTERS, KEYS.MEETINGS, KEYS.EMBEDDINGS]);
    await db.init();
  },

  // Matter operations
  createMatter: async (name: string): Promise<Matter> => {
    const matters = await db.getMatters();
    const newMatter: Matter = {
      id: generateId(),
      name,
      createdAt: new Date(),
      meetingCount: 0,
    };
    matters.push(newMatter);
    await AsyncStorage.setItem(KEYS.MATTERS, JSON.stringify(matters));
    return newMatter;
  },

  getMatter: async (id: string): Promise<Matter | null> => {
    const matters = await db.getMatters();
    return matters.find((m) => m.id === id) || null;
  },

  getMatters: async (): Promise<Matter[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.MATTERS);
      if (!data) return [];
      const matters: Matter[] = JSON.parse(data);

      // Calculate meeting counts and last meeting dates
      const meetings = await db.getAllMeetings();
      return matters.map((matter) => {
        const matterMeetings = meetings.filter((m) => m.matterId === matter.id);
        const sortedMeetings = matterMeetings.sort(
          (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
        );
        return {
          ...matter,
          meetingCount: matterMeetings.length,
          lastMeetingAt: sortedMeetings[0]?.recordedAt,
        };
      }).sort((a, b) => {
        // Sort by last meeting date, then by created date
        const aDate = a.lastMeetingAt || a.createdAt;
        const bDate = b.lastMeetingAt || b.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
    } catch (error) {
      console.error('Failed to get matters:', error);
      return [];
    }
  },

  updateMatter: async (id: string, updates: Partial<Matter>): Promise<void> => {
    const matters = await db.getMatters();
    const index = matters.findIndex((m) => m.id === id);
    if (index !== -1) {
      matters[index] = { ...matters[index], ...updates };
      await AsyncStorage.setItem(KEYS.MATTERS, JSON.stringify(matters));
    }
  },

  deleteMatter: async (id: string): Promise<void> => {
    const matters = await db.getMatters();
    const filtered = matters.filter((m) => m.id !== id);
    await AsyncStorage.setItem(KEYS.MATTERS, JSON.stringify(filtered));

    // Also delete associated meetings and embeddings
    const meetings = await db.getAllMeetings();
    const filteredMeetings = meetings.filter((m) => m.matterId !== id);
    await AsyncStorage.setItem(KEYS.MEETINGS, JSON.stringify(filteredMeetings));
  },

  // Meeting operations
  saveMeeting: async (meeting: Omit<Meeting, 'id'> & { id?: string }): Promise<Meeting> => {
    const meetings = await db.getAllMeetings();
    const newMeeting: Meeting = {
      id: meeting.id || generateId(),
      matterId: meeting.matterId,
      recordedAt: meeting.recordedAt,
      durationSeconds: meeting.durationSeconds,
      audioPath: meeting.audioPath,
      transcript: meeting.transcript,
      extractedInfo: meeting.extractedInfo,
    };
    meetings.push(newMeeting);
    await AsyncStorage.setItem(KEYS.MEETINGS, JSON.stringify(meetings));
    return newMeeting;
  },

  getMeeting: async (id: string): Promise<Meeting | null> => {
    const meetings = await db.getAllMeetings();
    return meetings.find((m) => m.id === id) || null;
  },

  getAllMeetings: async (): Promise<Meeting[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.MEETINGS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to get meetings:', error);
      return [];
    }
  },

  getMeetingsByMatter: async (matterId: string): Promise<Meeting[]> => {
    const meetings = await db.getAllMeetings();
    return meetings
      .filter((m) => m.matterId === matterId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  },

  deleteMeeting: async (id: string): Promise<void> => {
    const meetings = await db.getAllMeetings();
    const filtered = meetings.filter((m) => m.id !== id);
    await AsyncStorage.setItem(KEYS.MEETINGS, JSON.stringify(filtered));

    // Also delete associated embeddings
    const embeddings = await db.getAllEmbeddings();
    const filteredEmbeddings = embeddings.filter((e) => e.meetingId !== id);
    await AsyncStorage.setItem(KEYS.EMBEDDINGS, JSON.stringify(filteredEmbeddings));
  },

  // Embedding operations
  saveEmbedding: async (
    meetingId: string,
    chunkIndex: number,
    chunkText: string,
    embedding: number[]
  ): Promise<void> => {
    const embeddings = await db.getAllEmbeddings();
    const record: EmbeddingRecord & { id: string; chunkIndex: number } = {
      id: `${meetingId}_${chunkIndex}`,
      meetingId,
      chunkIndex,
      chunkText,
      embedding,
    };

    // Remove existing embedding with same ID if exists
    const filtered = embeddings.filter((e: any) => e.id !== record.id);
    filtered.push(record);

    await AsyncStorage.setItem(KEYS.EMBEDDINGS, JSON.stringify(filtered));
  },

  getAllEmbeddings: async (): Promise<EmbeddingRecord[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.EMBEDDINGS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to get embeddings:', error);
      return [];
    }
  },

  getEmbeddingsByMeeting: async (meetingId: string): Promise<EmbeddingRecord[]> => {
    const embeddings = await db.getAllEmbeddings();
    return embeddings.filter((e) => e.meetingId === meetingId);
  },
};
