import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../services/database';
import { Matter, Meeting } from '../../types';
import MeetingCard from '../../components/MeetingCard';
import { theme } from '../../theme/tokens';

export default function MatterDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [matter, setMatter] = useState<Matter | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
            <TouchableOpacity onPress={handleDeleteMatter}>
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meetings</Text>
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
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.palette.lilacMist },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: theme.palette.accentGrey, fontSize: 16 },
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
});
