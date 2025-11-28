import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Meeting } from '../types';

interface MeetingCardProps {
  meeting: Meeting;
  onPress: () => void;
}

export default function MeetingCard({ meeting, onPress }: MeetingCardProps) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getPreview = () => {
    if (meeting.extractedInfo.keyFacts.length > 0) {
      return meeting.extractedInfo.keyFacts[0];
    }
    if (meeting.transcript) {
      return meeting.transcript.slice(0, 100) + '...';
    }
    return 'No transcript available';
  };

  const hasAiNotices = meeting.extractedInfo.aiNoticed &&
    meeting.extractedInfo.aiNoticed.length > 0 &&
    !meeting.extractedInfo.aiNoticed.includes('Unable to extract');

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.dateInfo}>
          <Text style={styles.date}>{formatDate(meeting.recordedAt)}</Text>
          <Text style={styles.time}>{formatTime(meeting.recordedAt)}</Text>
        </View>
        <View style={styles.badges}>
          {hasAiNotices && (
            <View style={styles.badgeWarning}>
              <Text style={styles.badgeWarningText}>AI noticed</Text>
            </View>
          )}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formatDuration(meeting.durationSeconds)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.preview} numberOfLines={2}>
        {getPreview()}
      </Text>

      <View style={styles.footer}>
        <View style={styles.stats}>
          {meeting.extractedInfo.people.length > 0 && (
            <Text style={styles.stat}>
              👤 {meeting.extractedInfo.people.length} people
            </Text>
          )}
          {meeting.extractedInfo.dates.length > 0 && (
            <Text style={styles.stat}>
              📅 {meeting.extractedInfo.dates.length} dates
            </Text>
          )}
          {meeting.extractedInfo.actionItems.length > 0 && (
            <Text style={styles.stat}>
              ✓ {meeting.extractedInfo.actionItems.length} actions
            </Text>
          )}
        </View>
        <Text style={styles.arrow}>›</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dateInfo: {
    flex: 1,
  },
  date: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  time: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#252525',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  badgeWarning: {
    backgroundColor: '#3d2f00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeWarningText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '500',
  },
  preview: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    fontSize: 12,
    color: '#666',
  },
  arrow: {
    fontSize: 20,
    color: '#555',
    fontWeight: '300',
  },
});
