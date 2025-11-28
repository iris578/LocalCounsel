import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../src/services/database';
import { useAppStore } from '../../src/stores/appStore';
import MatterCard from '../../src/components/MatterCard';
import { Matter } from '../../src/types';

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

      // Navigate to record with the new matter selected
      router.push({
        pathname: '/record',
        params: { matterId: matter.id, matterName: matter.name },
      });
    } catch (error) {
      console.error('Failed to create matter:', error);
      Alert.alert('Error', 'Failed to create matter');
    }
  };

  const handleNewMeeting = () => {
    if (matters.length === 0) {
      setShowNewMatterModal(true);
    } else {
      // Show matter selection or go to record
      router.push('/record');
    }
  };

  const handleMatterPress = (matter: Matter) => {
    router.push({
      pathname: '/matter/[id]',
      params: { id: matter.id },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>CounselVault</Text>
          <Text style={styles.subtitle}>Your private legal assistant</Text>
        </View>
        <View style={styles.offlineIndicator}>
          <View style={styles.dotGreen} />
          <Text style={styles.offlineText}>Offline</Text>
        </View>
      </View>

      {/* Matter List */}
      <FlatList
        data={matters}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MatterCard matter={item} onPress={() => handleMatterPress(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyText}>No matters yet</Text>
            <Text style={styles.emptySubtext}>
              Record your first client meeting to get started
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
          />
        }
      />

      {/* New Meeting Button */}
      <TouchableOpacity style={styles.fab} onPress={handleNewMeeting}>
        <Text style={styles.fabIcon}>🎤</Text>
        <Text style={styles.fabText}>New Meeting</Text>
      </TouchableOpacity>

      {/* Privacy Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          All data stays on your device
        </Text>
      </View>

      {/* New Matter Modal */}
      <Modal
        visible={showNewMatterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewMatterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Matter</Text>
            <Text style={styles.modalSubtitle}>
              Create a matter to organize your client meetings
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Smith v. Acme Corp"
              placeholderTextColor="#666"
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
              <TouchableOpacity
                style={styles.modalButtonCreate}
                onPress={createNewMatter}
              >
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
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2e1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  offlineText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '500',
  },
  list: {
    padding: 20,
    paddingBottom: 160,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#555',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
  },
  footerText: {
    color: '#444',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonCreate: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  modalButtonCreateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
