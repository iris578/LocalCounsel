import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../services/database';
import { useAppStore } from '../../stores/appStore';
import { loadDemoData } from '../../utils/demoData';
import { theme } from '../../theme/tokens';
import { SvgIcon } from '../../components/SvgIcon';

export default function SettingsScreen() {
  const { setMatters } = useAppStore();
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const handleClearData = () => {
    Alert.alert('Clear All Data', 'This will permanently delete all matters, meetings, and recordings.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', style: 'destructive', onPress: async () => { await db.clear(); setMatters([]); Alert.alert('Done', 'All data has been cleared.'); } },
    ]);
  };

  const runLoadDemoData = async () => {
    setIsLoadingDemo(true);
    try {
      await loadDemoData();
      const matters = await db.getMatters();
      setMatters(matters);
      Alert.alert('Success', 'Demo data loaded successfully!');
    } catch (error) {
      console.error('Failed to load demo data:', error);
      Alert.alert('Error', 'Failed to load demo data');
    }
    setIsLoadingDemo(false);
  };

  const handleLoadDemoData = async () => {
    // On web, Alert multi-button prompts are unreliable, so run immediately
    if (Platform.OS === 'web') {
      await runLoadDemoData();
      return;
    }

    Alert.alert('Load Demo Data', 'This will add sample matters and meetings with realistic legal scenarios.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Load Demo', onPress: runLoadDemoData },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.aboutHeader}>
              <Text style={styles.appName}>LocalCounsel</Text>
              <Text style={styles.version}>v1.0.0</Text>
            </View>
            <Text style={styles.aboutDescription}>
              Your private legal assistant powered by on-device AI. All your client meeting recordings, transcripts, and notes stay on your device.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.card}>
            <View style={styles.privacyRow}>
              <View style={styles.privacyIcon}>
                <Text style={styles.privacyEmoji}>LC</Text>
              </View>
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>100% On-Device</Text>
                <Text style={styles.privacyText}>All AI processing happens locally. Your data never leaves your device.</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.privacyRow}>
              <View style={styles.privacyIcon}>
                <Text style={styles.privacyEmoji}>NO</Text>
              </View>
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>No Cloud Storage</Text>
                <Text style={styles.privacyText}>Recordings and transcripts are stored only on this device.</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.privacyRow}>
              <View style={styles.privacyIcon}>
                <Text style={styles.privacyEmoji}>AC</Text>
              </View>
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>Attorney-Client Privilege</Text>
                <Text style={styles.privacyText}>Designed to maintain confidentiality of sensitive legal communications.</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.dataRow} onPress={handleLoadDemoData} disabled={isLoadingDemo}>
              <SvgIcon name="download-simple" size={22} style={styles.dataIcon} />
              <View style={styles.dataContent}>
                <Text style={styles.dataTitle}>Load Demo Data</Text>
                <Text style={styles.dataSubtitle}>{isLoadingDemo ? 'Loading...' : 'Add sample matters and meetings'}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.dataRow} onPress={handleClearData}>
              <SvgIcon name="warning" size={22} style={styles.dataIcon} />
              <View style={styles.dataContent}>
                <Text style={[styles.dataTitle, styles.dangerText]}>Clear All Data</Text>
                <Text style={styles.dataSubtitle}>Delete all matters, meetings, and recordings</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Built for Cactus AI Hackathon</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.palette.lilacMist },
  header: { padding: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  title: { fontSize: 28, fontWeight: '700', color: theme.palette.charcoal },
  section: { paddingHorizontal: theme.spacing.lg, marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.palette.accentGrey,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: { backgroundColor: theme.palette.creamLight, borderRadius: theme.radii.xl, overflow: 'hidden', ...theme.shadows.soft },
  aboutHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 12 },
  appName: { fontSize: 18, fontWeight: '700', color: theme.palette.charcoal },
  version: { fontSize: 14, color: theme.palette.accentGrey },
  aboutDescription: { fontSize: 14, color: theme.palette.charcoal, lineHeight: 20, paddingHorizontal: 16, paddingBottom: 16 },
  privacyRow: { flexDirection: 'row', padding: 16 },
  privacyIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.palette.sandBase,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  privacyEmoji: { fontSize: 14, fontWeight: '700', color: theme.palette.charcoal },
  privacyContent: { flex: 1 },
  privacyTitle: { fontSize: 15, fontWeight: '700', color: theme.palette.charcoal, marginBottom: 4 },
  privacyText: { fontSize: 13, color: theme.palette.accentGrey, lineHeight: 18 },
  divider: { height: 1, backgroundColor: theme.palette.sandBase, marginLeft: 16 },
  dataRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  dataIcon: { marginRight: 14 },
  dataContent: { flex: 1 },
  dataTitle: { fontSize: 16, fontWeight: '700', color: theme.palette.charcoal, marginBottom: 2 },
  dataSubtitle: { fontSize: 13, color: theme.palette.accentGrey },
  dangerText: { color: theme.palette.coral },
  footer: { alignItems: 'center', padding: 40, paddingBottom: 60 },
  footerText: { fontSize: 14, color: theme.palette.accentGrey, fontWeight: '600' },
});
