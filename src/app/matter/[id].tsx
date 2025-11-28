import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../services/database';
import { Matter, Meeting } from '../../types';
import MeetingCard from '../../components/MeetingCard';

export default function MatterDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [matter, setMatter] = useState<Matter | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { if (id) loadData(); }, [id]));

  const loadData = async () => {
    if (!id) return;
    const [matterData, meetingsData] = await Promise.all([db.getMatter(id), db.getMeetingsByMatter(id)]);
    setMatter(matterData);
    setMeetings(meetingsData);
  };

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleDeleteMatter = () => {
    Alert.alert('Delete Matter', `Delete "${matter?.name}"? This will also delete all meetings.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { if (id) { await db.deleteMatter(id); router.back(); } } },
    ]);
  };

  if (!matter) return <SafeAreaView style={styles.container}><View style={styles.loading}><Text style={styles.loadingText}>Loading...</Text></View></SafeAreaView>;

  return (
    <>
      <Stack.Screen options={{ title: matter.name, headerRight: () => <TouchableOpacity onPress={handleDeleteMatter}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity> }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <View style={styles.headerIcon}><Text style={styles.headerEmoji}>📁</Text></View>
          <View style={styles.headerContent}><Text style={styles.matterName}>{matter.name}</Text><Text style={styles.matterMeta}>{meetings.length} {meetings.length === 1 ? 'meeting' : 'meetings'} recorded</Text></View>
        </View>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Meetings</Text><TouchableOpacity onPress={() => router.push({ pathname: '/record', params: { matterId: matter.id, matterName: matter.name } })}><Text style={styles.addButton}>+ Add</Text></TouchableOpacity></View>
        <FlatList
          data={meetings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MeetingCard meeting={item} onPress={() => router.push({ pathname: '/meeting/[id]', params: { id: item.id } })} />}
          ListEmptyComponent={
            <View style={styles.empty}><Text style={styles.emptyIcon}>🎤</Text><Text style={styles.emptyText}>No meetings yet</Text>
              <TouchableOpacity style={styles.recordButton} onPress={() => router.push({ pathname: '/record', params: { matterId: matter.id, matterName: matter.name } })}><Text style={styles.recordButtonText}>Record Meeting</Text></TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#666', fontSize: 16 },
  deleteText: { color: '#ef4444', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerIcon: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  headerEmoji: { fontSize: 28 },
  headerContent: { flex: 1 },
  matterName: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 4 },
  matterMeta: { fontSize: 14, color: '#888' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  addButton: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
  list: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#888', fontSize: 18, fontWeight: '600', marginBottom: 24 },
  recordButton: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  recordButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
