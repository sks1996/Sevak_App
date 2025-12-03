import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { MeetingItem } from '../../components/meetings/MeetingItem';
import { useAuth } from '../../contexts/AuthContext';
import { useMeetings } from '../../contexts/MeetingContext';
import { Meeting, MeetingStatus, MeetingType, MeetingPriority } from '../../types/meetings';

export const MeetingDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { authState, logout } = useAuth();
  const { 
    meetingState, 
    setFilter, 
    clearFilter, 
    refreshMeetings,
    getMeetingsByUser,
    getUpcomingMeetings,
    getTodaysMeetings,
    getMeetingsByRole,
    canCreateMeeting,
    canDeleteMeeting,
  } = useMeetings();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'my' | 'today' | 'upcoming'>('all');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMeetings();
    setIsRefreshing(false);
  };

  const handleCreateMeeting = () => {
    navigation.navigate('CreateMeeting' as never);
  };

  const handleMeetingPress = (meeting: Meeting) => {
    navigation.navigate('MeetingDetails' as never, { meeting });
  };

  const getFilteredMeetings = () => {
    const userRole = authState.user?.role || 'user';
    const userId = authState.user?.id || '';
    
    // Get meetings based on user role
    const roleBasedMeetings = getMeetingsByRole(userRole, userId);
    
    switch (activeFilter) {
      case 'my':
        return getMeetingsByUser(userId);
      case 'today':
        return getTodaysMeetings().filter(meeting => 
          userRole === 'admin' || userRole === 'hod' || 
          meeting.organizerId === userId || 
          meeting.attendees.some(a => a.userId === userId)
        );
      case 'upcoming':
        return getUpcomingMeetings(7).filter(meeting => 
          userRole === 'admin' || userRole === 'hod' || 
          meeting.organizerId === userId || 
          meeting.attendees.some(a => a.userId === userId)
        );
      default:
        return roleBasedMeetings;
    }
  };

  const renderFilterButton = (
    label: string,
    value: 'all' | 'my' | 'today' | 'upcoming',
    icon: string,
    count?: number
  ) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === value && styles.filterButtonActive,
      ]}
      onPress={() => setActiveFilter(value)}
    >
      <Ionicons 
        name={icon as any} 
        size={16} 
        color={activeFilter === value ? theme.colors.textWhite : theme.colors.primary} 
      />
      <Text style={[
        styles.filterButtonText,
        activeFilter === value && styles.filterButtonTextActive,
      ]}>
        {label}
        {count !== undefined && ` (${count})`}
      </Text>
    </TouchableOpacity>
  );

  const renderMeeting = ({ item }: { item: Meeting }) => {
    const userRole = authState.user?.role || 'user';
    const canDelete = canDeleteMeeting(userRole);
    
    return (
      <MeetingItem
        meeting={item}
        onPress={() => handleMeetingPress(item)}
        onEdit={() => navigation.navigate('EditMeeting' as never, { meetingId: item.id })}
        onDelete={canDelete ? () => navigation.navigate('DeleteMeeting' as never, { meetingId: item.id }) : undefined}
        showDeleteButton={canDelete}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color={theme.colors.textMuted} />
      <Text style={styles.emptyTitle}>No Meetings Found</Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === 'my' 
          ? "You don't have any meetings scheduled yet."
          : activeFilter === 'today'
          ? "No meetings scheduled for today."
          : activeFilter === 'upcoming'
          ? "No upcoming meetings in the next 7 days."
          : "No meetings available. Create your first meeting to get started."
        }
      </Text>
      <Button
        title="Create Meeting"
        onPress={handleCreateMeeting}
        style={styles.emptyButton}
        leftIcon="add-outline"
      />
    </View>
  );

  const filteredMeetings = getFilteredMeetings();
  const myMeetingsCount = getMeetingsByUser(authState.user?.id || '').length;
  const todayCount = getTodaysMeetings().length;
  const upcomingCount = getUpcomingMeetings(7).length;

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Meetings"
        user={authState.user ? {
          name: authState.user.name,
          role: authState.user.role,
        } : undefined}
        onLogoutPress={logout}
        rightButton={{
          icon: 'add-outline',
          onPress: handleCreateMeeting,
        }}
      />
      
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{meetingState.stats.totalMeetings}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {meetingState.stats.upcomingMeetings}
          </Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>
            {meetingState.stats.completedMeetings}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: theme.colors.warning }]}>
            {Math.round(meetingState.stats.averageMeetingDuration)}
          </Text>
          <Text style={styles.statLabel}>Avg Duration</Text>
        </Card>
      </View>

      {/* Filter Buttons */}
      <Card style={styles.filterCard}>
        <View style={styles.filterRow}>
          {renderFilterButton('All', 'all', 'list-outline', meetingState.stats.totalMeetings)}
          {renderFilterButton('My Meetings', 'my', 'person-outline', myMeetingsCount)}
          {renderFilterButton('Today', 'today', 'today-outline', todayCount)}
          {renderFilterButton('Upcoming', 'upcoming', 'calendar-outline', upcomingCount)}
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        {canCreateMeeting(authState.user?.role || 'user') ? (
          <Button
            title="Create Meeting"
            onPress={handleCreateMeeting}
            style={styles.actionButton}
            leftIcon="add-outline"
          />
        ) : (
          <View style={[styles.actionButton, styles.disabledButton]}>
            <Text style={styles.disabledText}>Only HoD & Admin can create meetings</Text>
          </View>
        )}
        <Button
          title="Calendar View"
          variant="outline"
          onPress={() => navigation.navigate('CalendarView' as never)}
          style={styles.actionButton}
          leftIcon="calendar-outline"
        />
      </View>

      {/* Meetings List */}
      <FlatList
        data={filteredMeetings}
        renderItem={renderMeeting}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  filterCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: theme.colors.textWhite,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxxl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  disabledButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  disabledText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
