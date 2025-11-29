import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../services/database';
import { Meeting, Matter } from '../../types';
import { theme } from '../../theme/tokens';

export default function MeetingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [matter, setMatter] = useState<Matter | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    const meetingData = await db.getMeeting(id);
    setMeeting(meetingData);
    if (meetingData) {
      const matterData = await db.getMatter(meetingData.matterId);
      setMatter(matterData);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Meeting', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (id) {
            await db.deleteMeeting(id);
            router.back();
          }
        },
      },
    ]);
  };

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const formatTime = (date: Date | string) => new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return mins > 0 ? `${mins} min ${seconds % 60} sec` : `${seconds} seconds`;
  };

  if (!meeting)
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );

  const { extractedInfo } = meeting;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Meeting',
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: theme.palette.creamLight },
          headerTintColor: theme.palette.charcoal,
          headerTitleStyle: { color: theme.palette.charcoal, fontWeight: '700' },
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.matterName}>{matter?.name || 'Unknown Matter'}</Text>
            <Text style={styles.date}>{formatDate(meeting.recordedAt)}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{formatTime(meeting.recordedAt)}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{formatDuration(meeting.durationSeconds)}</Text>
            </View>
          </View>
          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, activeTab === 'summary' && styles.tabActive]} onPress={() => setActiveTab('summary')}>
              <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>Summary</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'transcript' && styles.tabActive]} onPress={() => setActiveTab('transcript')}>
              <Text style={[styles.tabText, activeTab === 'transcript' && styles.tabTextActive]}>Transcript</Text>
            </TouchableOpacity>
          </View>
          {activeTab === 'summary' ? (
            <>
              {extractedInfo.aiNoticed && !extractedInfo.aiNoticed.includes('Unable') && (
                <View style={styles.aiNoticeCard}>
                  <View style={styles.aiNoticeHeader}>
                    <Text style={styles.aiNoticeIcon}>!</Text>
                    <Text style={styles.aiNoticeTitle}>AI Noticed</Text>
                  </View>
                  <Text style={styles.aiNoticeText}>{extractedInfo.aiNoticed}</Text>
                </View>
              )}
              {extractedInfo.keyFacts.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Key Facts</Text>
                  <View style={styles.card}>
                    {extractedInfo.keyFacts.map((fact, i) => (
                      <View key={i} style={styles.listItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.listText}>{fact}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {extractedInfo.people.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>People Mentioned</Text>
                  <View style={styles.card}>
                    {extractedInfo.people.map((person, i) => (
                      <View key={i} style={styles.personRow}>
                        <View style={styles.personAvatar}>
                          <Text style={styles.personInitial}>{person.name.charAt(0)}</Text>
                        </View>
                        <View style={styles.personInfo}>
                          <Text style={styles.personName}>{person.name}</Text>
                          {person.role && <Text style={styles.personRole}>{person.role}</Text>}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {extractedInfo.dates.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Important Dates</Text>
                  <View style={styles.card}>
                    {extractedInfo.dates.map((date, i) => (
                      <View key={i} style={styles.dateItem}>
                        <Text style={styles.dateValue}>{date.date}</Text>
                        <Text style={styles.dateContext}>{date.context}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {extractedInfo.actionItems.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Action Items</Text>
                  <View style={styles.card}>
                    {extractedInfo.actionItems.map((item, i) => (
                      <View key={i} style={styles.actionItem}>
                        <View style={styles.checkbox} />
                        <Text style={styles.actionText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Full Transcript</Text>
              <View style={styles.transcriptCard}>
                <Text style={styles.transcriptText}>{meeting.transcript}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.palette.lilacMist },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: theme.palette.accentGrey, fontSize: 16 },
  deleteText: { color: theme.palette.coral, fontSize: 16, fontWeight: '700' },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  header: { marginBottom: 20 },
  matterName: { fontSize: 14, color: theme.palette.deepBlue, fontWeight: '700', marginBottom: 8 },
  date: { fontSize: 22, fontWeight: '700', color: theme.palette.charcoal, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 14, color: theme.palette.accentGrey },
  metaDot: { color: theme.palette.accentGrey, marginHorizontal: 8 },
  tabs: { flexDirection: 'row', backgroundColor: theme.palette.creamLight, borderRadius: theme.radii.lg, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: theme.radii.md },
  tabActive: { backgroundColor: theme.palette.sandBase },
  tabText: { fontSize: 14, fontWeight: '700', color: theme.palette.accentGrey },
  tabTextActive: { color: theme.palette.charcoal },
  aiNoticeCard: {
    backgroundColor: theme.palette.softYellow,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.palette.warmBrown,
  },
  aiNoticeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  aiNoticeIcon: { fontSize: 16, marginRight: 8, color: theme.palette.warmBrown, fontWeight: '700' },
  aiNoticeTitle: { fontSize: 15, fontWeight: '700', color: theme.palette.warmBrown },
  aiNoticeText: { fontSize: 14, color: theme.palette.charcoal, lineHeight: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.palette.accentGrey, marginBottom: 10, marginLeft: 4 },
  card: { backgroundColor: theme.palette.creamLight, borderRadius: theme.radii.xl, padding: theme.spacing.lg, ...theme.shadows.soft },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.palette.deepBlue, marginRight: 12, marginTop: 7 },
  listText: { flex: 1, fontSize: 15, color: theme.palette.charcoal, lineHeight: 22 },
  personRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  personAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.palette.tealMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personInitial: { fontSize: 16, fontWeight: '700', color: theme.palette.charcoal },
  personInfo: { flex: 1 },
  personName: { fontSize: 15, fontWeight: '700', color: theme.palette.charcoal },
  personRole: { fontSize: 13, color: theme.palette.accentGrey, marginTop: 2 },
  dateItem: { marginBottom: 12 },
  dateValue: { fontSize: 15, fontWeight: '700', color: theme.palette.charcoal, marginBottom: 4 },
  dateContext: { fontSize: 14, color: theme.palette.accentGrey },
  actionItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 8, borderWidth: 2, borderColor: theme.palette.accentGrey, marginRight: 12, marginTop: 2 },
  actionText: { flex: 1, fontSize: 15, color: theme.palette.charcoal, lineHeight: 22 },
  transcriptCard: { backgroundColor: theme.palette.creamLight, borderRadius: theme.radii.xl, padding: theme.spacing.lg, ...theme.shadows.soft },
  transcriptText: { fontSize: 15, color: theme.palette.charcoal, lineHeight: 24 },
});
