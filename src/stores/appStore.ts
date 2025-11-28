import { create } from 'zustand';
import { Matter, Meeting } from '../types';

interface AppState {
  // Initialization
  isInitialized: boolean;
  setInitialized: (value: boolean) => void;

  // Current matter being recorded to
  currentMatterId: string | null;
  setCurrentMatterId: (id: string | null) => void;

  // Processing state
  isProcessing: boolean;
  processingStep: string;
  setProcessing: (isProcessing: boolean, step?: string) => void;

  // Recording state
  isRecording: boolean;
  recordingDuration: number;
  setRecording: (isRecording: boolean) => void;
  setRecordingDuration: (duration: number) => void;

  // Cached data for quick access
  matters: Matter[];
  setMatters: (matters: Matter[]) => void;

  // Selected matter's meetings
  currentMeetings: Meeting[];
  setCurrentMeetings: (meetings: Meeting[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initialization
  isInitialized: false,
  setInitialized: (value) => set({ isInitialized: value }),

  // Current matter
  currentMatterId: null,
  setCurrentMatterId: (id) => set({ currentMatterId: id }),

  // Processing
  isProcessing: false,
  processingStep: '',
  setProcessing: (isProcessing, step = '') =>
    set({ isProcessing, processingStep: step }),

  // Recording
  isRecording: false,
  recordingDuration: 0,
  setRecording: (isRecording) => set({ isRecording }),
  setRecordingDuration: (recordingDuration) => set({ recordingDuration }),

  // Cached data
  matters: [],
  setMatters: (matters) => set({ matters }),

  // Current meetings
  currentMeetings: [],
  setCurrentMeetings: (currentMeetings) => set({ currentMeetings }),
}));
