import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components/common/Header';
import { Card, StatCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { theme } from '../../constants/theme';
import { AttendanceRecord } from '../../types/attendance';

export const AttendanceScreen: React.FC = () => {
  const { authState } = useAuth();
  const { attendanceState, checkIn, checkOut, getCurrentLocation, takePhoto } = useAttendance();
  const navigation = useNavigation();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { currentRecord, settings, isLoading } = attendanceState;

  useEffect(() => {
    // Request location permission on mount
    if (authState.user) {
      getCurrentLocation();
    }
  }, [authState.user]);

  const handleCheckIn = async () => {
    if (!authState.user) return;

    setIsCheckingIn(true);
    try {
      const location = await getCurrentLocation();
      const photo = settings?.photoRequired ? await takePhoto() : undefined;
      
      await checkIn(location || undefined, photo);
      
      Alert.alert(
        'Check-in Successful',
        'You have successfully checked in for today!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Check-in Failed',
        error instanceof Error ? error.message : 'Failed to check in. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!authState.user) return;

    setIsCheckingOut(true);
    try {
      const location = await getCurrentLocation();
      const photo = settings?.photoRequired ? await takePhoto() : undefined;
      
      await checkOut(location || undefined, photo);
      
      Alert.alert(
        'Check-out Successful',
        'You have successfully checked out for today!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Check-out Failed',
        error instanceof Error ? error.message : 'Failed to check out. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh logic would go here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return theme.colors.success;
      case 'late':
        return theme.colors.warning;
      case 'absent':
        return theme.colors.error;
      case 'half-day':
        return theme.colors.info;
      default:
        return theme.colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return 'checkmark-circle';
      case 'late':
        return 'time';
      case 'absent':
        return 'close-circle';
      case 'half-day':
        return 'hourglass';
      default:
        return 'help-circle';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderTodayStatus = () => {
    if (!currentRecord) {
      return (
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.statusTitle}>Today's Attendance</Text>
          </View>
          <Text style={styles.statusText}>Not checked in yet</Text>
          <Text style={styles.statusSubtext}>
            Expected check-in time: {settings?.checkInTime || '09:00'}
          </Text>
        </Card>
      );
    }

    return (
      <Card style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons 
            name={getStatusIcon(currentRecord.status)} 
            size={24} 
            color={getStatusColor(currentRecord.status)} 
          />
          <Text style={styles.statusTitle}>Today's Attendance</Text>
        </View>
        
        <View style={styles.statusInfo}>
          <Text style={[styles.statusText, { color: getStatusColor(currentRecord.status) }]}>
            {currentRecord.status.charAt(0).toUpperCase() + currentRecord.status.slice(1)}
          </Text>
          
          {currentRecord.checkIn && (
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Check-in:</Text>
              <Text style={styles.timeValue}>{formatTime(currentRecord.checkIn.timestamp)}</Text>
            </View>
          )}
          
          {currentRecord.checkOut && (
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Check-out:</Text>
              <Text style={styles.timeValue}>{formatTime(currentRecord.checkOut.timestamp)}</Text>
            </View>
          )}
          
          {currentRecord.totalHours && (
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Total Hours:</Text>
              <Text style={styles.timeValue}>{currentRecord.totalHours.toFixed(1)}h</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const renderActionButtons = () => {
    // Hide check-in/check-out buttons for HOD and Admin roles
    const userRole = authState.user?.role;
    if (userRole === 'hod' || userRole === 'admin') {
      return (
        <View style={styles.completedContainer}>
          <Ionicons name="shield-outline" size={48} color={theme.colors.textMuted} />
          <Text style={styles.completedText}>View Only</Text>
          <Text style={styles.completedSubtext}>
            Check-in/out is not available for {userRole.toUpperCase()} role
          </Text>
        </View>
      );
    }

    if (!currentRecord) {
      return (
        <Button
          title="Check In"
          onPress={handleCheckIn}
          loading={isCheckingIn}
          style={styles.actionButton}
        />
      );
    }

    if (!currentRecord.checkOut) {
      return (
        <View style={styles.buttonRow}>
          <Button
            title="Check Out"
            onPress={handleCheckOut}
            loading={isCheckingOut}
            style={[styles.actionButton, styles.checkOutButton]}
          />
        </View>
      );
    }

    return (
      <View style={styles.completedContainer}>
        <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
        <Text style={styles.completedText}>Attendance Complete</Text>
        <Text style={styles.completedSubtext}>
          You have completed your attendance for today
        </Text>
      </View>
    );
  };

  const renderQuickStats = () => {
    const stats = attendanceState.stats[0];
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>This Month</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Present Days"
            value={stats.presentDays.toString()}
            icon="checkmark-circle"
            color={theme.colors.success}
          />
          <StatCard
            title="Absent Days"
            value={stats.absentDays.toString()}
            icon="close-circle"
            color={theme.colors.error}
          />
          <StatCard
            title="Late Days"
            value={stats.lateDays.toString()}
            icon="time"
            color={theme.colors.warning}
          />
          <StatCard
            title="Attendance %"
            value={`${stats.attendancePercentage.toFixed(1)}%`}
            icon="trending-up"
            color={theme.colors.info}
          />
        </View>
      </View>
    );
  };

  if (!authState.user) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Attendance" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please log in to view attendance</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Attendance" 
        rightButton={{
          icon: 'calendar-outline',
          onPress: () => navigation.navigate('AttendanceHistory' as never),
        }}
      />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Status */}
        {renderTodayStatus()}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {renderActionButtons()}
        </View>

        {/* Quick Stats */}
        {renderQuickStats()}

        {/* Settings Info */}
        {settings && (
          <Card style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Attendance Settings</Text>
            <View style={styles.settingsInfo}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Check-in Time:</Text>
                <Text style={styles.settingValue}>{settings.checkInTime}</Text>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Check-out Time:</Text>
                <Text style={styles.settingValue}>{settings.checkOutTime}</Text>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Late Threshold:</Text>
                <Text style={styles.settingValue}>{settings.lateThreshold} minutes</Text>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Location Required:</Text>
                <Text style={styles.settingValue}>{settings.locationRequired ? 'Yes' : 'No'}</Text>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  statusCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  statusSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  statusInfo: {
    marginTop: theme.spacing.sm,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  timeLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  timeValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  actionsContainer: {
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  checkOutButton: {
    backgroundColor: theme.colors.warning,
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  completedText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.success,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  completedSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: theme.spacing.lg,
  },
  statsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  settingsCard: {
    marginBottom: theme.spacing.lg,
  },
  settingsTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  settingsInfo: {
    gap: theme.spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  settingValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.error,
  },
});
