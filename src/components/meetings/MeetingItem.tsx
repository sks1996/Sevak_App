import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../constants/theme';
import { 
  Meeting, 
  getMeetingStatusConfig, 
  getMeetingTypeConfig, 
  getMeetingPriorityConfig,
  formatMeetingTime,
  formatMeetingDate,
  isMeetingUpcoming,
  isMeetingOverdue,
} from '../../types/meetings';
import { useMeetings } from '../../contexts/MeetingContext';
import { MOCK_USERS } from '../../constants';

interface MeetingItemProps {
  meeting: Meeting;
  onPress?: () => void;
  onStatusChange?: (status: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStart?: () => void;
  onEnd?: () => void;
  showActions?: boolean;
  showStartButton?: boolean;
  showEndButton?: boolean;
  showDeleteButton?: boolean;
}

export const MeetingItem: React.FC<MeetingItemProps> = ({
  meeting,
  onPress,
  onStatusChange,
  onEdit,
  onDelete,
  onStart,
  onEnd,
  showActions = true,
  showStartButton = true,
  showEndButton = true,
  showDeleteButton = true,
}) => {
  const { updateMeetingStatus, deleteMeeting, duplicateMeeting, startMeeting, endMeeting } = useMeetings();
  
  const statusConfig = getMeetingStatusConfig(meeting.status);
  const typeConfig = getMeetingTypeConfig(meeting.type);
  const priorityConfig = getMeetingPriorityConfig(meeting.priority);
  
  const organizer = MOCK_USERS.find(u => u.id === meeting.organizerId);
  const isUpcoming = isMeetingUpcoming(meeting);
  const isOverdue = isMeetingOverdue(meeting);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateMeetingStatus(meeting.id, newStatus as any);
      onStatusChange?.(newStatus);
    } catch (error) {
      Alert.alert('Error', 'Failed to update meeting status');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Meeting',
      'Are you sure you want to delete this meeting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMeeting(meeting.id);
              onDelete?.();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete meeting');
            }
          },
        },
      ]
    );
  };

  const handleDuplicate = async () => {
    try {
      await duplicateMeeting(meeting.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to duplicate meeting');
    }
  };

  const handleStart = async () => {
    try {
      await startMeeting(meeting.id);
      onStart?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to start meeting');
    }
  };

  const handleEnd = async () => {
    try {
      await endMeeting(meeting.id);
      onEnd?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to end meeting');
    }
  };

  const getStatusOptions = () => {
    const allStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'];
    return allStatuses.filter(status => status !== meeting.status);
  };

  const getAcceptedAttendeesCount = () => {
    return meeting.attendees.filter(a => a.status === 'accepted').length;
  };

  const getPendingAttendeesCount = () => {
    return meeting.attendees.filter(a => a.status === 'pending').length;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isOverdue && styles.overdueContainer,
        meeting.status === 'completed' && styles.completedContainer,
        meeting.status === 'in_progress' && styles.inProgressContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Header with Status and Priority */}
        <View style={styles.header}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
              <Ionicons name={statusConfig.icon as any} size={16} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
          
          <View style={styles.priorityContainer}>
            <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.color + '20' }]}>
              <Ionicons name={priorityConfig.icon as any} size={14} color={priorityConfig.color} />
              <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
                {priorityConfig.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Meeting Title and Description */}
        <View style={styles.textContainer}>
          <Text style={[
            styles.title,
            meeting.status === 'completed' && styles.completedTitle,
          ]}>
            {meeting.title}
          </Text>
          
          {meeting.description && (
            <Text style={[
              styles.description,
              meeting.status === 'completed' && styles.completedDescription,
            ]}>
              {meeting.description}
            </Text>
          )}
        </View>

        {/* Meeting Time and Duration */}
        <View style={styles.timeContainer}>
          <View style={styles.timeItem}>
            <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.timeText}>
              {formatMeetingTime(meeting.startTime, meeting.endTime)}
            </Text>
          </View>
          <View style={styles.timeItem}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.timeText}>
              {formatMeetingDate(meeting.startTime)}
            </Text>
          </View>
          <View style={styles.timeItem}>
            <Ionicons name="hourglass-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.timeText}>
              {meeting.duration} min
            </Text>
          </View>
        </View>

        {/* Meta Information */}
        <View style={styles.metaContainer}>
          {/* Meeting Type */}
          <View style={styles.metaItem}>
            <Ionicons name={typeConfig.icon as any} size={14} color={typeConfig.color} />
            <Text style={[styles.metaText, { color: typeConfig.color }]}>
              {typeConfig.label}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.metaItem}>
            <Ionicons 
              name={meeting.isVirtual ? "videocam-outline" : "location-outline"} 
              size={14} 
              color={theme.colors.textSecondary} 
            />
            <Text style={styles.metaText}>
              {meeting.isVirtual ? 'Virtual' : meeting.location}
            </Text>
          </View>

          {/* Organizer */}
          {organizer && (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{organizer.name}</Text>
            </View>
          )}
        </View>

        {/* Attendees Status */}
        <View style={styles.attendeesContainer}>
          <View style={styles.attendeesItem}>
            <Ionicons name="people-outline" size={14} color={theme.colors.success} />
            <Text style={[styles.attendeesText, { color: theme.colors.success }]}>
              {getAcceptedAttendeesCount()} accepted
            </Text>
          </View>
          {getPendingAttendeesCount() > 0 && (
            <View style={styles.attendeesItem}>
              <Ionicons name="time-outline" size={14} color={theme.colors.warning} />
              <Text style={[styles.attendeesText, { color: theme.colors.warning }]}>
                {getPendingAttendeesCount()} pending
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {meeting.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {meeting.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Agenda Count */}
        {meeting.agenda.length > 0 && (
          <View style={styles.agendaContainer}>
            <Ionicons name="list-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.agendaText}>
              {meeting.agenda.length} agenda item{meeting.agenda.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        {showActions && (
          <View style={styles.actionContainer}>
            {/* Status Change */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                const options = getStatusOptions();
                Alert.alert(
                  'Change Status',
                  'Select new status:',
                  options.map(status => ({
                    text: getMeetingStatusConfig(status as any).label,
                    onPress: () => handleStatusChange(status),
                  }))
                );
              }}
            >
              <Ionicons name="refresh-outline" size={16} color={theme.colors.primary} />
            </TouchableOpacity>

            {/* Start Meeting - Only show if meeting is scheduled */}
            {showStartButton && meeting.status === 'scheduled' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleStart}
              >
                <Ionicons name="play-outline" size={16} color={theme.colors.success} />
              </TouchableOpacity>
            )}

            {/* End Meeting - Only show if meeting is in progress */}
            {showEndButton && meeting.status === 'in_progress' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleEnd}
              >
                <Ionicons name="stop-outline" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            )}

            {/* Edit */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onEdit}
            >
              <Ionicons name="create-outline" size={16} color={theme.colors.warning} />
            </TouchableOpacity>

            {/* Duplicate */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDuplicate}
            >
              <Ionicons name="copy-outline" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            {/* Delete - Only show if user has permission */}
            {showDeleteButton && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.textWhite,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  overdueContainer: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  completedContainer: {
    opacity: 0.7,
  },
  inProgressContainer: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  content: {
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusContainer: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  priorityContainer: {
    marginLeft: theme.spacing.sm,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  priorityText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  textContainer: {
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  completedDescription: {
    color: theme.colors.textMuted,
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  timeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  metaText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  attendeesContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  attendeesItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    fontSize: theme.typography.fontSize.xs,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  tag: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  agendaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  agendaText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
});
