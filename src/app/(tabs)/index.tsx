import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, TextInput, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../services/database';
import { useAppStore } from '../../stores/appStore';
import MatterCard from '../../components/MatterCard';
import { Matter } from '../../types';
import { theme } from '../../theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const { matters, setMatters } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showNewMatterModal, setShowNewMatterModal] = useState(false);
  const [newMatterName, setNewMatterName] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadMatters();
    }, [])
  );

  const loadMatters = async () => {
    try {
      const data = await db.getMatters();
      setMatters(data);
    } catch (error) {
      console.error('Failed to load matters:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatters();
    setRefreshing(false);
  };

  const createNewMatter = async () => {
    if (!newMatterName.trim()) {
      Alert.alert('Error', 'Please enter a matter name');
      return;
    }
    try {
      const matter = await db.createMatter(newMatterName.trim());
      setShowNewMatterModal(false);
      setNewMatterName('');
      await loadMatters();
      router.push({ pathname: '/record', params: { matterId: matter.id, matterName: matter.name } });
    } catch (error) {
      console.error('Failed to create matter:', error);
      Alert.alert('Error', 'Failed to create matter');
    }
  };

  const handleNewMeeting = () => {
    if (matters.length === 0) {
      setShowNewMatterModal(true);
    } else {
      router.push('/record');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>LocalCounsel</Text>
          <Text style={styles.subtitle}>Your private legal assistant</Text>
        </View>
        <View style={styles.offlineIndicator}>
          <View style={styles.dotGreen} />
          <Text style={styles.offlineText}>Offline</Text>
        </View>
      </View>

      <FlatList
        data={matters}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MatterCard matter={item} onPress={() => router.push({ pathname: '/matter/[id]', params: { id: item.id } })} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>:)</Text>
            <Text style={styles.emptyText}>No matters yet</Text>
            <Text style={styles.emptySubtext}>Record your first client meeting to get started</Text>
          </View>
        }
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.palette.olive} />}
      />

      <TouchableOpacity style={styles.fab} onPress={handleNewMeeting}>
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>New Meeting</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>All data stays on your device</Text>
      </View>

      <Modal visible={showNewMatterModal} animationType="slide" transparent={true} onRequestClose={() => setShowNewMatterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Matter</Text>
            <Text style={styles.modalSubtitle}>Create a matter to organize your client meetings</Text>
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
                <Text style={styles.modalButtonCreateText}>Create & Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.palette.lilacMist },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: { fontSize: 28, fontWeight: '700', color: theme.palette.charcoal },
  subtitle: { fontSize: 14, color: theme.palette.accentGrey, marginTop: 4 },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.palette.tealMint,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
  },
  dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.palette.olive, marginRight: 6 },
  offlineText: { color: theme.palette.charcoal, fontSize: 12, fontWeight: '600' },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: 160 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 36, marginBottom: 16, color: theme.palette.accentGrey },
  emptyText: { color: theme.palette.charcoal, fontSize: 18, fontWeight: '700' },
  emptySubtext: { color: theme.palette.accentGrey, fontSize: 14, marginTop: 8, textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: theme.palette.olive,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: theme.radii.pill,
    ...theme.shadows.soft,
  },
  fabIcon: { fontSize: 18, marginRight: 8, color: '#fff', fontWeight: '700' },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 70, alignSelf: 'center' },
  footerText: { color: theme.palette.accentGrey, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.35)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: {
    backgroundColor: theme.palette.creamLight,
    borderRadius: theme.radii.xl,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    ...theme.shadows.lifted,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: theme.palette.charcoal, marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: theme.palette.accentGrey, marginBottom: 20 },
  modalInput: {
    backgroundColor: theme.palette.sandBase,
    borderRadius: theme.radii.xl,
    padding: 16,
    fontSize: 16,
    color: theme.palette.charcoal,
    borderWidth: 1,
    borderColor: '#E1D5C7',
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButtonCancel: { flex: 1, padding: 14, borderRadius: theme.radii.xl, backgroundColor: theme.palette.creamLight, alignItems: 'center', borderWidth: 1, borderColor: '#E1D5C7' },
  modalButtonCancelText: { color: theme.palette.charcoal, fontSize: 16, fontWeight: '600' },
  modalButtonCreate: { flex: 1, padding: 14, borderRadius: theme.radii.xl, backgroundColor: theme.palette.deepBlue, alignItems: 'center' },
  modalButtonCreateText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
