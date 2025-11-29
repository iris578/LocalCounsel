import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { db } from '../services/database';
import { initializeCactus, initializeCactusSTT } from '../services/cactus';
import { useAppStore } from '../stores/appStore';
import { theme } from '../theme/tokens';

const isWeb = Platform.OS === 'web';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState('Initializing...');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const setInitialized = useAppStore((state) => state.setInitialized);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize local database
      setLoadingStep('Setting up local database...');
      await db.init();

      // Skip Cactus initialization on web (native-only module)
      if (!isWeb) {
        // Download and initialize LLM for extraction/embeddings
        setLoadingStep('Downloading AI model...');
        await initializeCactus((progress) => {
          setDownloadProgress(Math.round(progress * 100));
        });

        // Download and initialize STT for transcription
        setLoadingStep('Downloading speech recognition...');
        setDownloadProgress(0);
        await initializeCactusSTT((progress) => {
          setDownloadProgress(Math.round(progress * 100));
        });
      } else {
        console.log('Web platform detected - skipping Cactus initialization');
      }

      setInitialized(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize app:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logo}>LC</Text>
          </View>
          <Text style={styles.appName}>LocalCounsel</Text>
        </View>
        <ActivityIndicator size="large" color={theme.palette.olive} />
        <Text style={styles.loadingText}>{loadingStep}</Text>
        {downloadProgress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${downloadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{downloadProgress}%</Text>
          </View>
        )}
        <Text style={styles.loadingSubtext}>All AI runs locally on your device</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <Text style={styles.errorText}>Failed to initialize</Text>
        <Text style={styles.loadingSubtext}>{error}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.palette.creamLight },
          headerTintColor: theme.palette.charcoal,
          headerTitleStyle: { fontWeight: '600', color: theme.palette.charcoal },
          contentStyle: { backgroundColor: theme.palette.lilacMist },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="matter/[id]" options={{ title: 'Matter Details', presentation: 'card' }} />
        <Stack.Screen name="meeting/[id]" options={{ title: 'Meeting Details', presentation: 'card' }} />
        <Stack.Screen name="record" options={{ title: 'Record Meeting', presentation: 'fullScreenModal', headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: theme.palette.lilacMist, alignItems: 'center', justifyContent: 'center', padding: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoBadge: { width: 72, height: 72, borderRadius: 20, backgroundColor: theme.palette.creamLight, alignItems: 'center', justifyContent: 'center', ...theme.shadows.soft },
  logo: { fontSize: 28, fontWeight: '700', color: theme.palette.charcoal },
  appName: { fontSize: 28, fontWeight: '700', color: theme.palette.charcoal, marginTop: 14 },
  loadingText: { color: theme.palette.charcoal, fontSize: 16, marginTop: 20, fontWeight: '500', textAlign: 'center' },
  loadingSubtext: { color: theme.palette.accentGrey, fontSize: 13, marginTop: 16, textAlign: 'center' },
  progressContainer: { marginTop: 16, alignItems: 'center', width: '100%' },
  progressBar: { width: '80%', height: 6, backgroundColor: '#E6E0D9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.palette.olive, borderRadius: 4 },
  progressText: { color: theme.palette.accentGrey, fontSize: 12, marginTop: 8 },
  errorText: { color: theme.palette.coral, fontSize: 18, fontWeight: '600' },
});
