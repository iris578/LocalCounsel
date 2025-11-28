import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';

interface ProcessingModalProps {
  visible: boolean;
  step: string;
}

export default function ProcessingModal({ visible, step }: ProcessingModalProps) {
  const steps = [
    { key: 'transcribe', label: 'Transcribing audio', icon: '🎙️' },
    { key: 'extract', label: 'Extracting key information', icon: '🔍' },
    { key: 'index', label: 'Building search index', icon: '📊' },
    { key: 'save', label: 'Saving meeting', icon: '💾' },
  ];

  const getStepIndex = () => {
    if (step.toLowerCase().includes('transcrib')) return 0;
    if (step.toLowerCase().includes('extract')) return 1;
    if (step.toLowerCase().includes('index') || step.toLowerCase().includes('search')) return 2;
    if (step.toLowerCase().includes('sav')) return 3;
    return 0;
  };

  const currentStepIndex = getStepIndex();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>

          <Text style={styles.title}>Processing Recording</Text>
          <Text style={styles.subtitle}>
            Your data stays on this device
          </Text>

          <View style={styles.stepsContainer}>
            {steps.map((s, index) => (
              <View key={s.key} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepIndicator,
                    index < currentStepIndex && styles.stepComplete,
                    index === currentStepIndex && styles.stepActive,
                  ]}
                >
                  {index < currentStepIndex ? (
                    <Text style={styles.stepCheck}>✓</Text>
                  ) : index === currentStepIndex ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    index <= currentStepIndex && styles.stepLabelActive,
                  ]}
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.privacyBadge}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>100% on-device processing</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 24,
  },
  stepsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepComplete: {
    backgroundColor: '#22c55e',
  },
  stepActive: {
    backgroundColor: '#3b82f6',
  },
  stepCheck: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  stepNumber: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  stepLabel: {
    color: '#666',
    fontSize: 15,
  },
  stepLabelActive: {
    color: '#fff',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2e1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  privacyIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  privacyText: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '500',
  },
});
