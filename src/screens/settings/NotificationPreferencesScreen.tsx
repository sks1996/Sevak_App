import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import MeetingNotificationService, { UserNotificationPreferences } from '../../services/MeetingNotificationService';

export const NotificationPreferencesScreen: React.FC = () => {
  const { authState } = useAuth();
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const notificationService = MeetingNotificationService.getInstance();
      const userPreferences = notificationService.getUserNotificationPreferences(authState.user?.id || '');
      setPreferences(userPreferences);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserNotificationPreferences>) => {
    if (!preferences) return;

    try {
      const updatedPreferences = { ...preferences, ...updates };
      setPreferences(updatedPreferences);

      const notificationService = MeetingNotificationService.getInstance();
      await notificationService.updateUserPreferences(authState.user?.id || '', updatedPreferences);

      Alert.alert('Success', 'Notification preferences updated successfully');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      Alert.alert('Error', 'Failed to update preferences');
    }
  };

  const toggleReminderTiming = (timing: keyof UserNotificationPreferences['reminderTimings']) => {
    if (!preferences) return;
    
    updatePreferences({
      reminderTimings: {
        ...preferences.reminderTimings,
        [timing]: !preferences.reminderTimings[timing],
      },
    });
  };

  const toggleNotificationType = (type: 'emailNotifications' | 'pushNotifications' | 'smsNotifications') => {
    if (!preferences) return;
    
    updatePreferences({
      [type]: !preferences[type],
    });
  };

  const toggleQuietHours = () => {
    if (!preferences) return;
    
    updatePreferences({
      quietHours: {
        ...preferences.quietHours,
        enabled: !preferences.quietHours.enabled,
      },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Notification Preferences" />
        <View style={styles.loadingContainer}>
          <Text>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Notification Preferences" />
        <View style={styles.errorContainer}>
          <Text>Failed to load preferences</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Meeting Notifications" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        {/* Notification Types */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingDescription}>Receive meeting reminders via email</Text>
              </View>
            </View>
            <Switch
              value={preferences.emailNotifications}
              onValueChange={() => toggleNotificationType('emailNotifications')}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={preferences.emailNotifications ? theme.colors.primary : theme.colors.textMuted}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="phone-portrait-outline" size={20} color={theme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Receive meeting reminders as push notifications</Text>
              </View>
            </View>
            <Switch
              value={preferences.pushNotifications}
              onValueChange={() => toggleNotificationType('pushNotifications')}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={preferences.pushNotifications ? theme.colors.primary : theme.colors.textMuted}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="chatbubble-outline" size={20} color={theme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>SMS Notifications</Text>
                <Text style={styles.settingDescription}>Receive meeting reminders via SMS</Text>
              </View>
            </View>
            <Switch
              value={preferences.smsNotifications}
              onValueChange={() => toggleNotificationType('smsNotifications')}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={preferences.smsNotifications ? theme.colors.primary : theme.colors.textMuted}
            />
          </View>
        </Card>

        {/* Reminder Timings */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Reminder Timings</Text>
          <Text style={styles.sectionDescription}>
            Choose when you want to receive meeting reminders
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.success} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>1 Day Before</Text>
                <Text style={styles.settingDescription}>Remind me 24 hours before the meeting</Text>
              </View>
            </View>
            <Switch
              value={preferences.reminderTimings.oneDayBefore}
              onValueChange={() => toggleReminderTiming('oneDayBefore')}
              trackColor={{ false: theme.colors.border, true: theme.colors.success + '40' }}
              thumbColor={preferences.reminderTimings.oneDayBefore ? theme.colors.success : theme.colors.textMuted}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="time-outline" size={20} color={theme.colors.warning} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>1 Hour Before</Text>
                <Text style={styles.settingDescription}>Remind me 1 hour before the meeting</Text>
              </View>
            </View>
            <Switch
              value={preferences.reminderTimings.oneHourBefore}
              onValueChange={() => toggleReminderTiming('oneHourBefore')}
              trackColor={{ false: theme.colors.border, true: theme.colors.warning + '40' }}
              thumbColor={preferences.reminderTimings.oneHourBefore ? theme.colors.warning : theme.colors.textMuted}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="hourglass-outline" size={20} color={theme.colors.error} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>15 Minutes Before</Text>
                <Text style={styles.settingDescription}>Remind me 15 minutes before the meeting</Text>
              </View>
            </View>
            <Switch
              value={preferences.reminderTimings.fifteenMinutesBefore}
              onValueChange={() => toggleReminderTiming('fifteenMinutesBefore')}
              trackColor={{ false: theme.colors.border, true: theme.colors.error + '40' }}
              thumbColor={preferences.reminderTimings.fifteenMinutesBefore ? theme.colors.error : theme.colors.textMuted}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="play-outline" size={20} color={theme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Starting Soon</Text>
                <Text style={styles.settingDescription}>Notify me when the meeting starts</Text>
              </View>
            </View>
            <Switch
              value={preferences.reminderTimings.startingSoon}
              onValueChange={() => toggleReminderTiming('startingSoon')}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={preferences.reminderTimings.startingSoon ? theme.colors.primary : theme.colors.textMuted}
            />
          </View>
        </Card>

        {/* Quiet Hours */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <Text style={styles.sectionDescription}>
            Set times when you don't want to receive notifications
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon-outline" size={20} color={theme.colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Enable Quiet Hours</Text>
                <Text style={styles.settingDescription}>
                  {preferences.quietHours.enabled 
                    ? `${preferences.quietHours.startTime} - ${preferences.quietHours.endTime}`
                    : 'No quiet hours set'
                  }
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.quietHours.enabled}
              onValueChange={toggleQuietHours}
              trackColor={{ false: theme.colors.border, true: theme.colors.textSecondary + '40' }}
              thumbColor={preferences.quietHours.enabled ? theme.colors.textSecondary : theme.colors.textMuted}
            />
          </View>
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.infoTitle}>How It Works</Text>
          </View>
          <Text style={styles.infoText}>
            • Only HoD and Admin can create meetings{'\n'}
            • You'll receive invitations when added to meetings{'\n'}
            • Reminders are sent based on your preferences{'\n'}
            • Quiet hours prevent notifications during sleep time{'\n'}
            • All settings are saved automatically
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  sectionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  infoCard: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.primaryLight + '20',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
