import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Matter } from '../types';
import { theme } from '../theme/tokens';
import { SvgIcon } from './SvgIcon';

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
        <SvgIcon name="briefcase" size={22} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {matter.name}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {matter.meetingCount} {matter.meetingCount === 1 ? 'meeting' : 'meetings'}
          </Text>
          <Text style={styles.metaDot}>.</Text>
          <Text style={styles.metaText}>{formatDate(matter.lastMeetingAt)}</Text>
        </View>
      </View>
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>{'>'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.palette.sandBase,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.palette.creamLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    ...theme.shadows.soft,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.palette.charcoal,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: theme.palette.accentGrey,
  },
  metaDot: {
    color: theme.palette.accentGrey,
    marginHorizontal: 8,
    fontWeight: '700',
  },
  arrow: {
    marginLeft: theme.spacing.sm,
  },
  arrowText: {
    fontSize: 18,
    color: theme.palette.accentGrey,
    fontWeight: '600',
  },
});
