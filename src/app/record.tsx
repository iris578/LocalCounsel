import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, FlatList, TextInput, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { v4 as uuid } from 'uuid';
import { db } from '../services/database';
import { extractInfo } from '../services/extraction';
import { indexMeeting } from '../services/embeddings';
import { transcribeAudio as cactusTranscribe, isSTTReady } from '../services/cactus';
import { useAppStore } from '../stores/appStore';
import ProcessingModal from '../components/ProcessingModal';
import { Matter } from '../types';
import { theme } from '../theme/tokens';
import { SvgIcon } from '../components/SvgIcon';

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
      setSelectedMatter({ id: params.matterId, name: params.matterName, createdAt: new Date(), meetingCount: 0 });
    }
  }, [params.matterId, params.matterName]);

  const loadMatters = async () => {
    const data = await db.getMatters();
    setMatters(data);
    if (!params.matterId && data.length > 0) setSelectedMatter(data[0]);
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
        Alert.alert('Permission Required', 'Microphone access is needed');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      // Use WAV format for compatibility with Whisper STT
      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      recordingRef.current = recording;
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
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
      if (!uri) {
        Alert.alert('Error', 'No audio file was created. Please try recording again.');
        return;
      }
      if (!selectedMatter) {
        Alert.alert('Select Matter', 'Please select a matter first');
        return;
      }
      await processRecording(uri);
    } catch (err) {
      console.error('Failed to stop recording:', err);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const processRecording = async (audioUri: string) => {
    if (!selectedMatter) return;
    setProcessing(true, 'Transcribing audio...');
    try {
      const transcript = await transcribeAudio(audioUri);
      setProcessing(true, 'Extracting key information...');
      const extractedInfo = await extractInfo(transcript);
      setProcessing(true, 'Building search index...');
      const meetingId = uuid();
      await indexMeeting(meetingId, transcript);
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
      router.replace({ pathname: '/meeting/[id]', params: { id: meetingId } });
    } catch (err: any) {
      console.error('Processing failed:', err);
      setProcessing(false);
      const errorMsg = err?.message || err?.toString() || 'Unknown error';
      Alert.alert('Error', `Failed to process recording: ${errorMsg}`);
    }
  };

  const transcribeAudio = async (uri: string): Promise<string> => {
    // Web fallback: STT is native-only, so return a placeholder transcript to keep the flow working
    if (Platform.OS === 'web') {
      return '[Transcription unavailable on web preview. Please use a mobile build for real recording and transcription.]';
    }

    // Check if STT is ready
    if (!isSTTReady()) {
      throw new Error('Speech recognition not initialized. Please restart the app.');
    }
    // Convert file:// URI to path for Cactus STT
    // Cactus expects a file path, not a URI
    const filePath = uri?.startsWith('file://') ? uri.replace('file://', '') : uri;
    if (!filePath) {
      throw new Error('Recording file path missing');
    }
    console.log('Transcribing audio from:', filePath);
    return await cactusTranscribe(filePath);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Meeting</Text>
        <View style={styles.placeholder} />
      </View>
      <TouchableOpacity style={styles.matterSelector} onPress={() => setShowMatterPicker(true)}>
        <Text style={styles.matterLabel}>Matter:</Text>
        <Text style={styles.matterName} numberOfLines={1}>
          {selectedMatter?.name || 'Select a matter'}
        </Text>
        <Text style={styles.matterChevron}>{'>'}</Text>
      </TouchableOpacity>
      <View style={styles.recordingArea}>
        <View style={styles.timerContainer}>
          {isRecording && <View style={styles.recordingDot} />}
          <Text style={styles.timer}>{formatDuration(duration)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? <View style={styles.stopIcon} /> : <Text style={styles.micEmoji}>REC</Text>}
        </TouchableOpacity>
        <Text style={styles.recordHint}>{isRecording ? 'Tap to stop recording' : 'Tap to start recording'}</Text>
      </View>
      <View style={styles.privacyNotice}>
        <Text style={styles.privacyIcon}>LC</Text>
        <Text style={styles.privacyText}>Recording stays on this device</Text>
      </View>
      <Modal visible={showMatterPicker} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Matter</Text>
              <TouchableOpacity onPress={() => setShowMatterPicker(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.newMatterButton} onPress={() => setShowNewMatterModal(true)}>
              <Text style={styles.newMatterIcon}>+</Text>
              <Text style={styles.newMatterText}>Create New Matter</Text>
            </TouchableOpacity>
            <FlatList
              data={matters}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.matterItem, selectedMatter?.id === item.id && styles.matterItemSelected]}
                  onPress={() => {
                    setSelectedMatter(item);
                    setShowMatterPicker(false);
                  }}
                >
                  <View style={styles.matterItemIcon}>
                    <SvgIcon name="briefcase" size={20} />
                  </View>
                  <View style={styles.matterItemContent}>
                    <Text style={styles.matterItemName}>{item.name}</Text>
                    <Text style={styles.matterItemMeta}>{item.meetingCount} meetings</Text>
                  </View>
                  {selectedMatter?.id === item.id && <Text style={styles.checkmark}>OK</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyMatters}>No matters yet. Create one to get started.</Text>}
            />
          </View>
        </View>
      </Modal>
      <Modal visible={showNewMatterModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.newMatterModal}>
            <Text style={styles.modalTitle}>New Matter</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Smith v. Acme Corp"
              placeholderTextColor={theme.palette.accentGrey}
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
              <TouchableOpacity style={styles.modalButtonCreate} onPress={createNewMatter}>
                <Text style={styles.modalButtonCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ProcessingModal visible={isProcessing} step={processingStep} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.palette.lilacMist },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.sandBase,
    backgroundColor: theme.palette.creamLight,
  },
  backButton: { padding: 4 },
  backText: { color: theme.palette.deepBlue, fontSize: 16, fontWeight: '700' },
  headerTitle: { color: theme.palette.charcoal, fontSize: 17, fontWeight: '700' },
  placeholder: { width: 60 },
  matterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.palette.creamLight,
    margin: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radii.xl,
    ...theme.shadows.soft,
  },
  matterLabel: { color: theme.palette.accentGrey, fontSize: 14, marginRight: 8 },
  matterName: { flex: 1, color: theme.palette.charcoal, fontSize: 16, fontWeight: '700' },
  matterChevron: { color: theme.palette.accentGrey, fontSize: 16 },
  recordingArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  timerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  recordingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.palette.coral, marginRight: 12 },
  timer: { fontSize: 56, fontWeight: '200', color: theme.palette.charcoal },
  recordButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.palette.olive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...theme.shadows.lifted,
  },
  recordButtonActive: { backgroundColor: theme.palette.coral },
  stopIcon: { width: 24, height: 24, backgroundColor: '#fff', borderRadius: 6 },
  micEmoji: { fontSize: 20, color: '#fff', fontWeight: '700' },
  recordHint: { color: theme.palette.accentGrey, fontSize: 14 },
  privacyNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, paddingBottom: 40 },
  privacyIcon: { fontSize: 14, marginRight: 8, color: theme.palette.accentGrey, fontWeight: '700' },
  privacyText: { color: theme.palette.accentGrey, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.35)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: theme.palette.creamLight,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    maxHeight: '70%',
    paddingBottom: 40,
    ...theme.shadows.lifted,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.sandBase,
  },
  modalTitle: { color: theme.palette.charcoal, fontSize: 18, fontWeight: '700' },
  modalClose: { color: theme.palette.deepBlue, fontSize: 16, fontWeight: '700' },
  newMatterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.sandBase,
  },
  newMatterIcon: { color: theme.palette.deepBlue, fontSize: 20, fontWeight: '700', marginRight: 12 },
  newMatterText: { color: theme.palette.deepBlue, fontSize: 16, fontWeight: '700' },
  matterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.sandBase,
  },
  matterItemSelected: { backgroundColor: theme.palette.sandBase },
  matterItemIcon: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  matterItemContent: { flex: 1 },
  matterItemName: { color: theme.palette.charcoal, fontSize: 16, fontWeight: '700' },
  matterItemMeta: { color: theme.palette.accentGrey, fontSize: 13, marginTop: 2 },
  checkmark: { color: theme.palette.olive, fontSize: 14, fontWeight: '700' },
  emptyMatters: { color: theme.palette.accentGrey, fontSize: 14, textAlign: 'center', padding: 24 },
  newMatterModal: {
    backgroundColor: theme.palette.creamLight,
    borderRadius: theme.radii.xl,
    padding: 24,
    margin: 20,
    marginBottom: 100,
    ...theme.shadows.lifted,
  },
  modalInput: {
    backgroundColor: theme.palette.sandBase,
    borderRadius: theme.radii.xl,
    padding: 16,
    fontSize: 16,
    color: theme.palette.charcoal,
    borderWidth: 1,
    borderColor: '#E1D5C7',
    marginTop: 16,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButtonCancel: { flex: 1, padding: 14, borderRadius: theme.radii.xl, backgroundColor: theme.palette.creamLight, alignItems: 'center', borderWidth: 1, borderColor: '#E1D5C7' },
  modalButtonCancelText: { color: theme.palette.charcoal, fontSize: 16, fontWeight: '700' },
  modalButtonCreate: { flex: 1, padding: 14, borderRadius: theme.radii.xl, backgroundColor: theme.palette.deepBlue, alignItems: 'center' },
  modalButtonCreateText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
