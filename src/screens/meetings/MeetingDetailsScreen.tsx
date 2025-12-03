import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { useMeetings } from '../../contexts/MeetingContext';
import { useAuth } from '../../contexts/AuthContext';
import { Meeting } from '../../types/meetings';

interface MeetingDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      meeting: Meeting;
    };
  };
}

export const MeetingDetailsScreen: React.FC<MeetingDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { meeting } = route.params;
  const { updateMeetingStatus, deleteMeeting, duplicateMeeting } = useMeetings();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);

  const isOrganizer = meeting.organizerId === user?.id;
  const userAttendee = meeting.attendees.find(attendee => attendee.userId === user?.id);
  const userStatus = userAttendee?.status || 'pending';

  const handleStatusChange = async (status: 'accepted' | 'declined') => {
    setIsLoading(true);
    try {
      await updateMeetingStatus(meeting.id, status);
      Alert.alert('Success', `Meeting ${status} successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update meeting status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMeeting = () => {
    Alert.alert(
      'Delete Meeting',
      'Are you sure you want to delete this meeting? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteMeeting(meeting.id);
              Alert.alert('Success', 'Meeting deleted successfully!');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete meeting');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDuplicateMeeting = async () => {
    setIsLoading(true);
    try {
      await duplicateMeeting(meeting.id);
      Alert.alert('Success', 'Meeting duplicated successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to duplicate meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareMeeting = async () => {
    try {
      const shareContent = {
        title: meeting.title,
        message: `Meeting: ${meeting.title}\nDate: ${formatDateTime(meeting.startTime)}\nLocation: ${meeting.location || 'TBD'}`,
      };
      await Share.share(shareContent);
    } catch (error) {
      Alert.alert('Error', 'Failed to share meeting');
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return theme.colors.success;
      case 'declined': return theme.colors.error;
      case 'pending': return theme.colors.warning;
      default: return theme.colors.textMuted;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return theme.colors.error;
      case 'high': return theme.colors.warning;
      case 'medium': return theme.colors.info;
      case 'low': return theme.colors.success;
      default: return theme.colors.textMuted;
    }
  };

  const getMeetingStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return theme.colors.info;
      case 'in_progress': return theme.colors.warning;
      case 'completed': return theme.colors.success;
      case 'cancelled': return theme.colors.error;
      default: return theme.colors.textMuted;
    }
  };

  const isMeetingUpcoming = () => {
    return new Date(meeting.startTime) > new Date();
  };

  const isMeetingOverdue = () => {
    return new Date(meeting.endTime) < new Date() && meeting.status === 'scheduled';
  };

  const getTimeUntilMeeting = () => {
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const diffMs = startTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Meeting has started';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} remaining`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} remaining`;
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} remaining`;
  };

  return (
    <View style={styles.container}>
      <Header
        title="Meeting Details"
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareMeeting}
          >
            <Ionicons name="share-outline" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        {/* Meeting Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{meeting.title}</Text>
            <View style={styles.badges}>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(meeting.priority) }
              ]}>
                <Text style={styles.priorityText}>{meeting.priority}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getMeetingStatusColor(meeting.status) }
              ]}>
                <Text style={styles.statusText}>{meeting.status}</Text>
              </View>
            </View>
          </View>

          {meeting.description && (
            <Text style={styles.description}>{meeting.description}</Text>
          )}

          {/* Time Information */}
          <View style={styles.timeInfo}>
            <View style={styles.timeItem}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.timeText}>{formatDateTime(meeting.startTime)}</Text>
            </View>
            <View style={styles.timeItem}>
              <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.timeText}>
                {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
              </Text>
            </View>
            {meeting.location && (
              <View style={styles.timeItem}>
                <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.timeText}>{meeting.location}</Text>
              </View>
            )}
          </View>

          {/* Meeting Status Alert */}
          {isMeetingUpcoming() && (
            <View style={styles.alertContainer}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.info} />
              <Text style={styles.alertText}>{getTimeUntilMeeting()}</Text>
            </View>
          )}

          {isMeetingOverdue() && (
            <View style={[styles.alertContainer, styles.overdueAlert]}>
              <Ionicons name="warning-outline" size={20} color={theme.colors.error} />
              <Text style={[styles.alertText, styles.overdueText]}>Meeting is overdue</Text>
            </View>
          )}
        </View>

        {/* Meeting Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Information</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{meeting.type}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>
              {Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / (1000 * 60))} minutes
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Organizer</Text>
            <Text style={styles.detailValue}>
              {isOrganizer ? 'You' : 'Meeting Organizer'}
            </Text>
          </View>
          
          {meeting.meetingLink && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Meeting Link</Text>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkText}>Join Meeting</Text>
                <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Attendees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendees ({meeting.attendees.length})</Text>
          
          {meeting.attendees.map((attendee, index) => (
            <View key={index} style={styles.attendeeItem}>
              <View style={styles.attendeeInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {attendee.userId === user?.id ? 'You' : 'U'}
                  </Text>
                </View>
                <View style={styles.attendeeDetails}>
                  <Text style={styles.attendeeName}>
                    {attendee.userId === user?.id ? 'You' : `User ${attendee.userId}`}
                  </Text>
                  <Text style={styles.attendeeRole}>
                    {attendee.userId === user?.id ? 'You' : 'Attendee'}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.attendeeStatus,
                { backgroundColor: getStatusColor(attendee.status) }
              ]}>
                <Text style={styles.attendeeStatusText}>{attendee.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Agenda */}
        {meeting.agenda.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agenda</Text>
            
            {meeting.agenda.map((item, index) => (
              <View key={index} style={styles.agendaItem}>
                <View style={styles.agendaHeader}>
                  <Text style={styles.agendaTitle}>{item.title}</Text>
                  <Text style={styles.agendaDuration}>{item.duration} min</Text>
                </View>
                {item.description && (
                  <Text style={styles.agendaDescription}>{item.description}</Text>
                )}
                <View style={styles.agendaStatus}>
                  <View style={[
                    styles.agendaStatusDot,
                    { backgroundColor: item.completed ? theme.colors.success : theme.colors.textMuted }
                  ]} />
                  <Text style={styles.agendaStatusText}>
                    {item.completed ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {meeting.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{meeting.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* User Response Buttons */}
          {userAttendee && !isOrganizer && (
            <View style={styles.responseButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleStatusChange('accepted')}
                disabled={isLoading}
              >
                <Ionicons name="checkmark" size={20} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleStatusChange('declined')}
                disabled={isLoading}
              >
                <Ionicons name="close" size={20} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Organizer Actions */}
          {isOrganizer && (
            <View style={styles.organizerButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => navigation.navigate('CreateMeeting', { 
                  meeting, 
                  isEdit: true 
                })}
              >
                <Ionicons name="create-outline" size={20} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.duplicateButton]}
                onPress={handleDuplicateMeeting}
                disabled={isLoading}
              >
                <Ionicons name="copy-outline" size={20} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>Duplicate</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeleteMeeting}
                disabled={isLoading}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  titleContainer: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  priorityText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  timeInfo: {
    marginBottom: theme.spacing.md,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  timeText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    flex: 1,
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.infoLight || theme.colors.primaryLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  overdueAlert: {
    backgroundColor: theme.colors.errorLight || '#FEE2E2',
  },
  alertText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.info,
    flex: 1,
  },
  overdueText: {
    color: theme.colors.error,
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textMuted,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  linkText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  avatarText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
  },
  attendeeDetails: {
    flex: 1,
  },
  attendeeName: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  attendeeRole: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  attendeeStatus: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  attendeeStatusText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
    textTransform: 'uppercase',
  },
  agendaItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  agendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  agendaTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    flex: 1,
  },
  agendaDuration: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  agendaDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  agendaStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  agendaStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  agendaStatusText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  notes: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
  actionButtons: {
    marginTop: theme.spacing.md,
  },
  responseButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  organizerButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    flex: 1,
  },
  acceptButton: {
    backgroundColor: theme.colors.success,
  },
  declineButton: {
    backgroundColor: theme.colors.error,
  },
  editButton: {
    backgroundColor: theme.colors.info,
    flex: 1,
  },
  duplicateButton: {
    backgroundColor: theme.colors.warning,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    flex: 1,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
  },
});
