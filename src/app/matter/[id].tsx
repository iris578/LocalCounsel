import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../services/database';
import { Matter, Meeting } from '../../types';
import MeetingCard from '../../components/MeetingCard';
import { theme } from '../../theme/tokens';
import { askGlobalQuestion } from '../../services/cactus';

interface QAMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function MatterDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [matter, setMatter] = useState<Matter | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'meetings' | 'ask'>('meetings');
  const [qaMessages, setQaMessages] = useState<QAMessage[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      if (id) loadData();
    }, [id])
  );

  const loadData = async () => {
    if (!id) return;
    const [matterData, meetingsData] = await Promise.all([db.getMatter(id), db.getMeetingsByMatter(id)]);
    setMatter(matterData);
    setMeetings(meetingsData);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeleteMatter = () => {
    Alert.alert('Delete Matter', `Delete "${matter?.name}"? This will also delete all meetings.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (id) {
            await db.deleteMatter(id);
            router.back();
          }
        },
      },
    ]);
  };

  const handleAskQuestion = async () => {
    if (!questionInput.trim() || meetings.length === 0) return;

    const question = questionInput.trim();
    setQuestionInput('');
    setQaMessages((prev) => [...prev, { role: 'user', content: question }]);
    setIsAsking(true);
    setStreamingResponse('');

    try {
      // Prepare contexts from all meetings in this matter
      const contexts = meetings.map((m) => ({
        meetingId: m.id,
        transcript: m.transcript || '[No transcript available]',
        matterName: matter?.name || 'Unknown',
      }));

      console.log('Asking question with', contexts.length, 'meeting contexts');

      // Accumulate streaming response
      let fullResponse = '';
      const streamCallback = (token: string) => {
        fullResponse += token;
        setStreamingResponse(fullResponse);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      };

      const result = await askGlobalQuestion(question, contexts, streamCallback);

      // Final response: prefer accumulated streaming, fallback to result
      const finalResponse = fullResponse.length > 0 ? fullResponse : (result || 'No response generated');
      console.log('Final response length:', finalResponse.length);

      setQaMessages((prev) => [...prev, { role: 'assistant', content: finalResponse }]);
      setStreamingResponse('');
    } catch (error: any) {
      console.error('Ask question error:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      setQaMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }]);
      setStreamingResponse('');
    } finally {
      setIsAsking(false);
    }
  };

  if (!matter)
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );

  return (
    <>
      <Stack.Screen
        options={{
          title: matter.name,
          headerRight: () => (
            <TouchableOpacity onPress={handleDeleteMatter} style={styles.headerAction} hitSlop={{ top: 10, right: 14, bottom: 10, left: 10 }}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: theme.palette.creamLight },
          headerTintColor: theme.palette.charcoal,
          headerTitleStyle: { color: theme.palette.charcoal, fontWeight: '700' },
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerEmoji}>M</Text>
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.matterName}>{matter.name}</Text>
            <Text style={styles.matterMeta}>
              {meetings.length} {meetings.length === 1 ? 'meeting' : 'meetings'} recorded
            </Text>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tab, activeTab === 'meetings' && styles.tabActive]} onPress={() => setActiveTab('meetings')}>
            <Text style={[styles.tabText, activeTab === 'meetings' && styles.tabTextActive]}>Meetings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'ask' && styles.tabActive]} onPress={() => setActiveTab('ask')}>
            <Text style={[styles.tabText, activeTab === 'ask' && styles.tabTextActive]}>Ask</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'meetings' ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Meetings</Text>
              <TouchableOpacity onPress={() => router.push({ pathname: '/record', params: { matterId: matter.id, matterName: matter.name } })}>
                <Text style={styles.addButton}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={meetings}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <MeetingCard meeting={item} onPress={() => router.push({ pathname: '/meeting/[id]', params: { id: item.id } })} />}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>:)</Text>
                  <Text style={styles.emptyText}>No meetings yet</Text>
                  <TouchableOpacity
                    style={styles.recordButton}
                    onPress={() => router.push({ pathname: '/record', params: { matterId: matter.id, matterName: matter.name } })}
                  >
                    <Text style={styles.recordButtonText}>Record Meeting</Text>
                  </TouchableOpacity>
                </View>
              }
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.palette.olive} />}
            />
          </>
        ) : (
          <KeyboardAvoidingView style={styles.askContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
            <ScrollView ref={scrollViewRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
              {qaMessages.length === 0 && !streamingResponse && (
                <View style={styles.askEmptyState}>
                  <Text style={styles.askEmptyIcon}>?</Text>
                  <Text style={styles.askEmptyTitle}>Ask about this matter</Text>
                  <Text style={styles.askEmptyText}>
                    {meetings.length === 0
                      ? 'Record some meetings first to ask questions about them.'
                      : `Ask questions across all ${meetings.length} meeting${meetings.length === 1 ? '' : 's'} in this matter.`}
                  </Text>
                </View>
              )}
              {qaMessages.map((msg, index) => (
                <View key={index} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={[styles.messageText, msg.role === 'user' && styles.userMessageText]}>{msg.content}</Text>
                </View>
              ))}
              {streamingResponse && (
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <Text style={styles.messageText}>{streamingResponse}</Text>
                </View>
              )}
            </ScrollView>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.questionInput}
                placeholder={meetings.length === 0 ? 'Record meetings first...' : 'Ask about this matter...'}
                placeholderTextColor={theme.palette.accentGrey}
                value={questionInput}
                onChangeText={setQuestionInput}
                editable={!isAsking && meetings.length > 0}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, (!questionInput.trim() || isAsking || meetings.length === 0) && styles.sendButtonDisabled]}
                onPress={handleAskQuestion}
                disabled={!questionInput.trim() || isAsking || meetings.length === 0}
              >
                {isAsking ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.sendButtonText}>Ask</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.palette.lilacMist },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: theme.palette.accentGrey, fontSize: 16 },
  headerAction: { paddingHorizontal: 10, paddingVertical: 6 },
  deleteText: { color: theme.palette.coral, fontSize: 16, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.sandBase,
    backgroundColor: theme.palette.creamLight,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.palette.sandBase,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  headerEmoji: { fontSize: 20, fontWeight: '700', color: theme.palette.charcoal },
  headerContent: { flex: 1 },
  matterName: { fontSize: 20, fontWeight: '700', color: theme.palette.charcoal, marginBottom: 4 },
  matterMeta: { fontSize: 14, color: theme.palette.accentGrey },
  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.palette.creamLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.sandBase,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.palette.olive,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.palette.accentGrey,
  },
  tabTextActive: {
    color: theme.palette.olive,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.palette.accentGrey, textTransform: 'uppercase', letterSpacing: 0.5 },
  addButton: { color: theme.palette.deepBlue, fontSize: 14, fontWeight: '700' },
  list: { padding: theme.spacing.lg, paddingTop: 0, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 36, marginBottom: 16, color: theme.palette.accentGrey },
  emptyText: { color: theme.palette.charcoal, fontSize: 18, fontWeight: '700', marginBottom: 24 },
  recordButton: {
    backgroundColor: theme.palette.olive,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radii.pill,
    ...theme.shadows.soft,
  },
  recordButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  // Ask Tab
  askContainer: { flex: 1 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: theme.spacing.lg, paddingBottom: 20 },
  askEmptyState: { alignItems: 'center', paddingTop: 60 },
  askEmptyIcon: { fontSize: 48, color: theme.palette.accentGrey, marginBottom: 16 },
  askEmptyTitle: { fontSize: 20, fontWeight: '700', color: theme.palette.charcoal, marginBottom: 8 },
  askEmptyText: { fontSize: 14, color: theme.palette.accentGrey, textAlign: 'center', paddingHorizontal: 40 },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: theme.radii.xl,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: theme.palette.deepBlue,
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: theme.palette.creamLight,
    alignSelf: 'flex-start',
    ...theme.shadows.soft,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.palette.charcoal,
  },
  userMessageText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.palette.sandBase,
    backgroundColor: theme.palette.creamLight,
    alignItems: 'flex-end',
    gap: 10,
  },
  questionInput: {
    flex: 1,
    backgroundColor: theme.palette.sandBase,
    borderRadius: theme.radii.xl,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.palette.charcoal,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: theme.palette.olive,
    borderRadius: theme.radii.xl,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.palette.accentGrey,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
