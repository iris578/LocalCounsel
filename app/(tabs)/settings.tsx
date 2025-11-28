import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../src/services/database';
import { useAppStore } from '../../src/stores/appStore';
import { loadDemoData } from '../../src/utils/demoData';

export default function SettingsScreen() {
  const { setMatters } = useAppStore();
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all matters, meetings, and recordings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await db.clear();
            setMatters([]);
            Alert.alert('Done', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  const handleLoadDemoData = async () => {
    Alert.alert(
      'Load Demo Data',
      'This will add sample matters and meetings with realistic legal scenarios. Existing data will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load Demo',
          onPress: async () => {
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
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.aboutHeader}>
              <Text style={styles.appName}>CounselVault</Text>
              <Text style={styles.version}>v1.0.0</Text>
            </View>
            <Text style={styles.aboutDescription}>
              Your private legal assistant powered by on-device AI. All your client
              meeting recordings, transcripts, and notes stay on your device.
            </Text>
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.card}>
            <View style={styles.privacyRow}>
              <View style={styles.privacyIcon}>
                <Text style={styles.privacyEmoji}>🔒</Text>
              </View>
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>100% On-Device</Text>
                <Text style={styles.privacyText}>
                  All AI processing happens locally. Your data never leaves your device.
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.privacyRow}>
              <View style={styles.privacyIcon}>
                <Text style={styles.privacyEmoji}>🚫</Text>
              </View>
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>No Cloud Storage</Text>
                <Text style={styles.privacyText}>
                  Recordings and transcripts are stored only on this device.
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.privacyRow}>
              <View style={styles.privacyIcon}>
                <Text style={styles.privacyEmoji}>🛡️</Text>
              </View>
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>Attorney-Client Privilege</Text>
                <Text style={styles.privacyText}>
                  Designed to maintain confidentiality of sensitive legal communications.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.dataRow}
              onPress={handleLoadDemoData}
              disabled={isLoadingDemo}
            >
              <Text style={styles.dataIcon}>📥</Text>
              <View style={styles.dataContent}>
                <Text style={styles.dataTitle}>Load Demo Data</Text>
                <Text style={styles.dataSubtitle}>
                  {isLoadingDemo ? 'Loading...' : 'Add sample matters and meetings'}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.dataRow} onPress={handleClearData}>
              <Text style={styles.dataIcon}>🗑️</Text>
              <View style={styles.dataContent}>
                <Text style={[styles.dataTitle, styles.dangerText]}>Clear All Data</Text>
                <Text style={styles.dataSubtitle}>
                  Delete all matters, meetings, and recordings
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tech Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technology</Text>
          <View style={styles.card}>
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>AI Engine</Text>
              <Text style={styles.techValue}>Cactus (On-device LLM)</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>Model</Text>
              <Text style={styles.techValue}>Qwen 3 (Optimized)</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>Framework</Text>
              <Text style={styles.techValue}>React Native (Expo)</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Built for Cactus AI Hackathon</Text>
          <Text style={styles.footerSubtext}>
            Demonstrating privacy-first legal tech with on-device AI
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  version: {
    fontSize: 14,
    color: '#666',
  },
  aboutDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  privacyRow: {
    flexDirection: 'row',
    padding: 16,
  },
  privacyIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  privacyEmoji: {
    fontSize: 18,
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  privacyText: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#252525',
    marginLeft: 16,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dataIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  dataContent: {
    flex: 1,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  dataSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  dangerText: {
    color: '#ef4444',
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  techLabel: {
    fontSize: 15,
    color: '#888',
  },
  techValue: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    padding: 40,
    paddingBottom: 60,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#444',
    marginTop: 6,
    textAlign: 'center',
  },
});
