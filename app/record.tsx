import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { v4 as uuid } from 'uuid';
import { db } from '../src/services/database';
import { extractInfo } from '../src/services/extraction';
import { indexMeeting } from '../src/services/embeddings';
import { useAppStore } from '../src/stores/appStore';
import ProcessingModal from '../src/components/ProcessingModal';
import { Matter } from '../src/types';

export default function RecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ matterId?: string; matterName?: string }>();
  const { setProcessing, isProcessing, processingStep } = useAppStore();

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null);
  const [showMatterPicker, setShowMatterPicker] = useState(false);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [showNewMatterModal, setShowNewMatterModal] = useState(false);
  const [newMatterName, setNewMatterName] = useState('');

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadMatters();
    if (params.matterId && params.matterName) {
      setSelectedMatter({
        id: params.matterId,
        name: params.matterName,
        createdAt: new Date(),
        meetingCount: 0,
      });
    }
  }, [params.matterId, params.matterName]);

  const loadMatters = async () => {
    const data = await db.getMatters();
    setMatters(data);
    if (!params.matterId && data.length > 0) {
      setSelectedMatter(data[0]);
    }
  };

  const startRecording = async () => {
    if (!selectedMatter) {
      Alert.alert('Select Matter', 'Please select a matter first');
      setShowMatterPicker(true);
      return;
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Microphone access is needed to record meetings');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri && selectedMatter) {
        await processRecording(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const processRecording = async (audioUri: string) => {
    if (!selectedMatter) return;

    setProcessing(true, 'Transcribing audio...');

    try {
      // Step 1: Transcribe (mock for demo)
      const transcript = await transcribeAudio(audioUri);

      // Step 2: Extract info
      setProcessing(true, 'Extracting key information...');
      const extractedInfo = await extractInfo(transcript);

      // Step 3: Generate embeddings
      setProcessing(true, 'Building search index...');
      const meetingId = uuid();
      await indexMeeting(meetingId, transcript);

      // Step 4: Save to database
      setProcessing(true, 'Saving meeting...');
      await db.saveMeeting({
        id: meetingId,
        matterId: selectedMatter.id,
        recordedAt: new Date(),
        durationSeconds: duration,
        audioPath: audioUri,
        transcript,
        extractedInfo,
      });

      setProcessing(false);

      // Navigate to the meeting detail
      router.replace({
        pathname: '/meeting/[id]',
        params: { id: meetingId },
      });
    } catch (err) {
      console.error('Processing failed:', err);
      setProcessing(false);
      Alert.alert('Error', 'Failed to process recording');
    }
  };

  // Mock transcription for demo
  const transcribeAudio = async (_uri: string): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Return realistic demo transcript
    return `Client stated that the contract was signed on March 15th. She mentioned that Tom Richards, her former boss, was present during the signing.

The client explained that on September 1st, she received an email from Mr. Richards explicitly asking her to delete certain files related to the Johnson account. She claims she refused to comply with this request.

When asked about the timeline of events, the client seemed hesitant and had difficulty recalling specific dates between March and September. She mentioned the estimated damages are around fifty thousand dollars based on lost commissions.

The client provided the names of two potential witnesses: Sarah Chen from accounting and Mike Johnson, the account manager. She indicated that Sarah might have copies of the original emails.

Action items discussed: obtain copy of the original contract, request email records from the company's IT department, and schedule interviews with the potential witnesses.`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const createNewMatter = async () => {
    if (!newMatterName.trim()) {
      Alert.alert('Error', 'Please enter a matter name');
      return;
    }

    try {
      const matter = await db.createMatter(newMatterName.trim());
      setSelectedMatter(matter);
      setShowNewMatterModal(false);
      setShowMatterPicker(false);
      setNewMatterName('');
      await loadMatters();
    } catch (error) {
      console.error('Failed to create matter:', error);
      Alert.alert('Error', 'Failed to create matter');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Meeting</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Matter Selector */}
      <TouchableOpacity
        style={styles.matterSelector}
        onPress={() => setShowMatterPicker(true)}
      >
        <Text style={styles.matterLabel}>Matter:</Text>
        <Text style={styles.matterName} numberOfLines={1}>
          {selectedMatter?.name || 'Select a matter'}
        </Text>
        <Text style={styles.matterChevron}>›</Text>
      </TouchableOpacity>

      {/* Recording UI */}
      <View style={styles.recordingArea}>
        <View style={styles.timerContainer}>
          {isRecording && <View style={styles.recordingDot} />}
          <Text style={styles.timer}>{formatDuration(duration)}</Text>
        </View>

        {isRecording && (
          <View style={styles.waveformContainer}>
            {[...Array(20)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.waveformBar,
                  {
                    height: Math.random() * 40 + 10,
                    opacity: 0.3 + Math.random() * 0.7,
                  },
                ]}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <View style={styles.stopIcon} />
          ) : (
            <View style={styles.micIcon}>
              <Text style={styles.micEmoji}>🎤</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.recordHint}>
          {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
        </Text>
      </View>

      {/* Privacy Notice */}
      <View style={styles.privacyNotice}>
        <Text style={styles.privacyIcon}>🔒</Text>
        <Text style={styles.privacyText}>
          Recording stays on this device. Never uploaded to any server.
        </Text>
      </View>

      {/* Matter Picker Modal */}
      <Modal
        visible={showMatterPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMatterPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Matter</Text>
              <TouchableOpacity onPress={() => setShowMatterPicker(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.newMatterButton}
              onPress={() => setShowNewMatterModal(true)}
            >
              <Text style={styles.newMatterIcon}>+</Text>
              <Text style={styles.newMatterText}>Create New Matter</Text>
            </TouchableOpacity>

            <FlatList
              data={matters}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.matterItem,
                    selectedMatter?.id === item.id && styles.matterItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedMatter(item);
                    setShowMatterPicker(false);
                  }}
                >
                  <Text style={styles.matterItemIcon}>📁</Text>
                  <View style={styles.matterItemContent}>
                    <Text style={styles.matterItemName}>{item.name}</Text>
                    <Text style={styles.matterItemMeta}>
                      {item.meetingCount} meetings
                    </Text>
                  </View>
                  {selectedMatter?.id === item.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyMatters}>
                  No matters yet. Create one to get started.
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* New Matter Modal */}
      <Modal
        visible={showNewMatterModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowNewMatterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.newMatterModal}>
            <Text style={styles.modalTitle}>New Matter</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Smith v. Acme Corp"
              placeholderTextColor="#666"
              value={newMatterName}
              onChangeText={setNewMatterName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowNewMatterModal(false);
                  setNewMatterName('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonCreate}
                onPress={createNewMatter}
              >
                <Text style={styles.modalButtonCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Processing Modal */}
      <ProcessingModal visible={isProcessing} step={processingStep} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    padding: 4,
  },
  backText: {
    color: '#3b82f6',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  matterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  matterLabel: {
    color: '#888',
    fontSize: 14,
    marginRight: 8,
  },
  matterName: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  matterChevron: {
    color: '#666',
    fontSize: 20,
  },
  recordingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    marginRight: 12,
  },
  timer: {
    fontSize: 64,
    fontWeight: '200',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    marginBottom: 40,
    gap: 4,
  },
  waveformBar: {
    width: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  micIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micEmoji: {
    fontSize: 32,
  },
  recordHint: {
    color: '#666',
    fontSize: 14,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  privacyIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  privacyText: {
    color: '#555',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalClose: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
  newMatterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  newMatterIcon: {
    color: '#3b82f6',
    fontSize: 20,
    fontWeight: '600',
    marginRight: 12,
  },
  newMatterText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
  matterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  matterItemSelected: {
    backgroundColor: '#252525',
  },
  matterItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  matterItemContent: {
    flex: 1,
  },
  matterItemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  matterItemMeta: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  checkmark: {
    color: '#3b82f6',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyMatters: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    padding: 24,
  },
  newMatterModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    marginBottom: 100,
  },
  modalInput: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginTop: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonCreate: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  modalButtonCreateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
