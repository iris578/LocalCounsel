import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Meeting } from '../types';
import { theme } from '../theme/tokens';

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

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.dateInfo}>
          <Text style={styles.date}>{formatDate(meeting.recordedAt)}</Text>
          <Text style={styles.time}>{formatTime(meeting.recordedAt)}</Text>
        </View>
        <View style={styles.badges}>
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
            <Text style={styles.stat}>People {meeting.extractedInfo.people.length}</Text>
          )}
          {meeting.extractedInfo.dates.length > 0 && (
            <Text style={styles.stat}>Dates {meeting.extractedInfo.dates.length}</Text>
          )}
          {meeting.extractedInfo.actionItems.length > 0 && (
            <Text style={styles.stat}>Actions {meeting.extractedInfo.actionItems.length}</Text>
          )}
        </View>
        <Text style={styles.arrow}>{'>'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.palette.creamLight,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
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
    fontWeight: '700',
    color: theme.palette.charcoal,
  },
  time: {
    fontSize: 13,
    color: theme.palette.accentGrey,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: theme.palette.sandBase,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.md,
  },
  badgeText: {
    color: theme.palette.charcoal,
    fontSize: 12,
    fontWeight: '600',
  },
  preview: {
    fontSize: 14,
    color: theme.palette.charcoal,
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
    color: theme.palette.accentGrey,
  },
  arrow: {
    fontSize: 18,
    color: theme.palette.accentGrey,
    fontWeight: '600',
  },
});
