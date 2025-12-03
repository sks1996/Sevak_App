import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { useMeetings } from '../../contexts/MeetingContext';
import { useAuth } from '../../contexts/AuthContext';
import { Meeting } from '../../types/meetings';

interface CalendarViewScreenProps {
  navigation: any;
}

export const CalendarViewScreen: React.FC<CalendarViewScreenProps> = ({
  navigation,
}) => {
  const { meetings, getMeetingsByDate, updateMeetingStatus } = useMeetings();
  const { user } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getWeekDays = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    
    return week;
  };

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.startTime);
      return meetingDate.toDateString() === date.toDateString();
    });
  };

  const getMeetingsForWeek = (date: Date) => {
    const weekDays = getWeekDays(date);
    const weekMeetings = [];
    
    weekDays.forEach(day => {
      const dayMeetings = getMeetingsForDate(day);
      weekMeetings.push({
        date: day,
        meetings: dayMeetings,
      });
    });
    
    return weekMeetings;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (viewMode === 'month') {
      setCurrentDate(date);
    }
  };

  const handleMeetingPress = (meeting: Meeting) => {
    navigation.navigate('MeetingDetails', { meeting });
  };

  const handleMeetingStatusChange = async (meetingId: string, status: 'accepted' | 'declined') => {
    try {
      await updateMeetingStatus(meetingId, status);
      Alert.alert('Success', `Meeting ${status} successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update meeting status');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.monthView}>
        {/* Week day headers */}
        <View style={styles.weekHeader}>
          {weekDays.map((day) => (
            <Text key={day} style={styles.weekDayHeader}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => {
            if (!day) {
              return <View key={index} style={styles.dayCell} />;
            }

            const dayMeetings = getMeetingsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = day.toDateString() === selectedDate.toDateString();

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isToday && styles.todayCell,
                  isSelected && styles.selectedCell,
                ]}
                onPress={() => handleDateSelect(day)}
              >
                <Text style={[
                  styles.dayText,
                  isToday && styles.todayText,
                  isSelected && styles.selectedText,
                ]}>
                  {day.getDate()}
                </Text>
                
                {/* Meeting indicators */}
                {dayMeetings.length > 0 && (
                  <View style={styles.meetingIndicators}>
                    {dayMeetings.slice(0, 3).map((meeting, meetingIndex) => (
                      <View
                        key={meetingIndex}
                        style={[
                          styles.meetingDot,
                          { backgroundColor: getPriorityColor(meeting.priority) }
                        ]}
                      />
                    ))}
                    {dayMeetings.length > 3 && (
                      <Text style={styles.moreMeetings}>+{dayMeetings.length - 3}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const weekMeetings = getMeetingsForWeek(currentDate);

    return (
      <View style={styles.weekView}>
        {weekMeetings.map((dayData, index) => {
          const isToday = dayData.date.toDateString() === new Date().toDateString();
          const isSelected = dayData.date.toDateString() === selectedDate.toDateString();

          return (
            <View key={index} style={styles.weekDay}>
              <TouchableOpacity
                style={[
                  styles.weekDayHeader,
                  isToday && styles.todayHeader,
                  isSelected && styles.selectedHeader,
                ]}
                onPress={() => handleDateSelect(dayData.date)}
              >
                <Text style={[
                  styles.weekDayName,
                  isToday && styles.todayText,
                  isSelected && styles.selectedText,
                ]}>
                  {dayData.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={[
                  styles.weekDayNumber,
                  isToday && styles.todayText,
                  isSelected && styles.selectedText,
                ]}>
                  {dayData.date.getDate()}
                </Text>
              </TouchableOpacity>

              <ScrollView style={styles.weekMeetings} showsVerticalScrollIndicator={false}>
                {dayData.meetings.map((meeting) => (
                  <TouchableOpacity
                    key={meeting.id}
                    style={styles.weekMeetingItem}
                    onPress={() => handleMeetingPress(meeting)}
                  >
                    <View style={styles.meetingTime}>
                      <Text style={styles.meetingTimeText}>
                        {formatTime(meeting.startTime)}
                      </Text>
                    </View>
                    <View style={styles.meetingInfo}>
                      <Text style={styles.meetingTitle} numberOfLines={1}>
                        {meeting.title}
                      </Text>
                      <Text style={styles.meetingLocation} numberOfLines={1}>
                        {meeting.location || 'No location'}
                      </Text>
                    </View>
                    <View style={[
                      styles.priorityIndicator,
                      { backgroundColor: getPriorityColor(meeting.priority) }
                    ]} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        })}
      </View>
    );
  };

  const renderDayView = () => {
    const dayMeetings = getMeetingsForDate(currentDate);

    return (
      <View style={styles.dayView}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayDate}>
            {currentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <ScrollView style={styles.dayMeetings} showsVerticalScrollIndicator={true}>
          {dayMeetings.length === 0 ? (
            <View style={styles.noMeetings}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.textMuted} />
              <Text style={styles.noMeetingsText}>No meetings scheduled</Text>
            </View>
          ) : (
            dayMeetings.map((meeting) => (
              <TouchableOpacity
                key={meeting.id}
                style={styles.dayMeetingItem}
                onPress={() => handleMeetingPress(meeting)}
              >
                <View style={styles.meetingTimeContainer}>
                  <Text style={styles.meetingTime}>
                    {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                  </Text>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(meeting.priority) }
                  ]}>
                    <Text style={styles.priorityText}>{meeting.priority}</Text>
                  </View>
                </View>
                
                <Text style={styles.meetingTitle}>{meeting.title}</Text>
                <Text style={styles.meetingDescription} numberOfLines={2}>
                  {meeting.description}
                </Text>
                
                <View style={styles.meetingMeta}>
                  <View style={styles.meetingMetaItem}>
                    <Ionicons name="location-outline" size={16} color={theme.colors.textMuted} />
                    <Text style={styles.meetingMetaText}>
                      {meeting.location || 'No location'}
                    </Text>
                  </View>
                  <View style={styles.meetingMetaItem}>
                    <Ionicons name="people-outline" size={16} color={theme.colors.textMuted} />
                    <Text style={styles.meetingMetaText}>
                      {meeting.attendees.length} attendees
                    </Text>
                  </View>
                </View>

                {/* Action buttons for user's meetings */}
                {meeting.attendees.some(attendee => attendee.userId === user?.id) && (
                  <View style={styles.meetingActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleMeetingStatusChange(meeting.id, 'accepted')}
                    >
                      <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                      <Text style={styles.actionButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.declineButton]}
                      onPress={() => handleMeetingStatusChange(meeting.id, 'declined')}
                    >
                      <Ionicons name="close" size={16} color={theme.colors.white} />
                      <Text style={styles.actionButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  const renderNavigation = () => {
    const handleNavigate = (direction: 'prev' | 'next') => {
      switch (viewMode) {
        case 'month':
          navigateMonth(direction);
          break;
        case 'week':
          navigateWeek(direction);
          break;
        case 'day':
          navigateDay(direction);
          break;
      }
    };

    return (
      <View style={styles.navigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigate('prev')}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        <Text style={styles.navigationTitle}>
          {viewMode === 'month' && formatDate(currentDate)}
          {viewMode === 'week' && `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigate('next')}
        >
          <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Calendar View"
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateMeeting')}
          >
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        }
      />

      {/* View Mode Selector */}
      <View style={styles.viewModeSelector}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'month' && styles.activeViewMode]}
          onPress={() => setViewMode('month')}
        >
          <Text style={[styles.viewModeText, viewMode === 'month' && styles.activeViewModeText]}>
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'week' && styles.activeViewMode]}
          onPress={() => setViewMode('week')}
        >
          <Text style={[styles.viewModeText, viewMode === 'week' && styles.activeViewModeText]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'day' && styles.activeViewMode]}
          onPress={() => setViewMode('day')}
        >
          <Text style={[styles.viewModeText, viewMode === 'day' && styles.activeViewModeText]}>
            Day
          </Text>
        </TouchableOpacity>
      </View>

      {/* Navigation */}
      {renderNavigation()}

      {/* Calendar Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
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
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  activeViewMode: {
    backgroundColor: theme.colors.primary,
  },
  viewModeText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textMuted,
  },
  activeViewModeText: {
    color: theme.colors.white,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  navigationTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  // Month View Styles
  monthView: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  weekDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textMuted,
    paddingVertical: theme.spacing.sm,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  todayCell: {
    backgroundColor: theme.colors.primaryLight,
  },
  selectedCell: {
    backgroundColor: theme.colors.primary,
  },
  dayText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
  },
  todayText: {
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  selectedText: {
    color: theme.colors.white,
  },
  meetingIndicators: {
    position: 'absolute',
    bottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  meetingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  moreMeetings: {
    fontSize: 8,
    color: theme.colors.textMuted,
    marginLeft: 2,
  },
  // Week View Styles
  weekView: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  weekDay: {
    flex: 1,
    marginHorizontal: 2,
  },
  weekDayHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  todayHeader: {
    backgroundColor: theme.colors.primaryLight,
  },
  selectedHeader: {
    backgroundColor: theme.colors.primary,
  },
  weekDayName: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  weekDayNumber: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  weekMeetings: {
    maxHeight: 200,
  },
  weekMeetingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
  },
  meetingTime: {
    marginRight: theme.spacing.xs,
  },
  meetingTimeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  meetingInfo: {
    flex: 1,
  },
  meetingTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  meetingLocation: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Day View Styles
  dayView: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  dayHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dayDate: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  dayMeetings: {
    maxHeight: 400,
  },
  noMeetings: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  noMeetingsText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  dayMeetingItem: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  meetingTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  meetingTime: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  priorityBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  priorityText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
    textTransform: 'uppercase',
  },
  meetingTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  meetingDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  meetingMeta: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  meetingMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  meetingMetaText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  meetingActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  acceptButton: {
    backgroundColor: theme.colors.success,
  },
  declineButton: {
    backgroundColor: theme.colors.error,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
  },
});
