import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Matter } from '../types';

interface MatterCardProps {
  matter: Matter;
  onPress: () => void;
}

export default function MatterCard({ matter, onPress }: MatterCardProps) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'No meetings yet';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>📁</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {matter.name}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {matter.meetingCount} {matter.meetingCount === 1 ? 'meeting' : 'meetings'}
          </Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>
            {formatDate(matter.lastMeetingAt)}
          </Text>
        </View>
      </View>
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#888',
  },
  metaDot: {
    color: '#555',
    marginHorizontal: 6,
  },
  arrow: {
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 24,
    color: '#555',
    fontWeight: '300',
  },
});
