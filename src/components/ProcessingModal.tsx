import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { theme } from '../theme/tokens';

interface ProcessingModalProps {
  visible: boolean;
  step: string;
}

export default function ProcessingModal({ visible, step }: ProcessingModalProps) {
  const steps = [
    { key: 'transcribe', label: 'Transcribing audio' },
    { key: 'extract', label: 'Extracting key information' },
    { key: 'index', label: 'Building search index' },
    { key: 'save', label: 'Saving meeting' },
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
            <ActivityIndicator size="large" color={theme.palette.olive} />
          </View>

          <Text style={styles.title}>Processing Recording</Text>
          <Text style={styles.subtitle}>Your data stays on this device</Text>

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
                    <Text style={styles.stepCheck}>OK</Text>
                  ) : index === currentStepIndex ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, index <= currentStepIndex && styles.stepLabelActive]}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.privacyBadge}>
            <Text style={styles.privacyIcon}>LC</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: theme.palette.creamLight,
    borderRadius: theme.radii.xl,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...theme.shadows.lifted,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.palette.sandBase,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    color: theme.palette.charcoal,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: theme.palette.accentGrey,
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
    backgroundColor: theme.palette.sandBase,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepComplete: {
    backgroundColor: theme.palette.olive,
  },
  stepActive: {
    backgroundColor: theme.palette.deepBlue,
  },
  stepCheck: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepNumber: {
    color: theme.palette.accentGrey,
    fontSize: 12,
    fontWeight: '700',
  },
  stepLabel: {
    color: theme.palette.accentGrey,
    fontSize: 15,
  },
  stepLabelActive: {
    color: theme.palette.charcoal,
    fontWeight: '700',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.palette.tealMint,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radii.pill,
  },
  privacyIcon: {
    fontSize: 14,
    marginRight: 8,
    color: theme.palette.charcoal,
    fontWeight: '700',
  },
  privacyText: {
    color: theme.palette.charcoal,
    fontSize: 13,
    fontWeight: '600',
  },
});
