import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { theme } from '../../constants/theme';
import { HybridNotificationManager } from '../../services/HybridNotificationManager';
import { UserNotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from '../../types/hybridNotifications';

interface NotificationStatus {
  websocket: boolean;
  fcm: boolean;
  apns: boolean;
  local: boolean;
}

export const NotificationStatusScreen: React.FC = () => {
  const [status, setStatus] = useState<NotificationStatus>({
    websocket: false,
    fcm: false,
    apns: false,
    local: false,
  });
  const [preferences, setPreferences] = useState<UserNotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotificationStatus();
    loadUserPreferences();
  }, []);

  const loadNotificationStatus = async () => {
    try {
      const hybridManager = HybridNotificationManager.getInstance();
      const health = await hybridManager.healthCheck();
      setStatus(health);
    } catch (error) {
      console.error('Error loading notification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const hybridManager = HybridNotificationManager.getInstance();
      const userPrefs = await hybridManager.getUserPreferences('current_user');
      setPreferences(userPrefs);
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const testNotification = async () => {
    try {
      const hybridManager = HybridNotificationManager.getInstance();
      
      const testNotification = {
        id: `test_${Date.now()}`,
        userId: 'current_user',
        title: 'Test Notification',
        message: 'This is a test of the hybrid notification system',
        type: 'system_alert' as const,
        priority: 'medium' as const,
        createdAt: new Date(),
        deliveryStatus: 'pending' as const,
        channels: ['websocket', 'fcm', 'apns', 'local'],
      };

      const results = await hybridManager.sendNotification(testNotification);
      
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      Alert.alert(
        'Test Notification Sent',
        `Sent through ${successCount}/${totalCount} channels successfully`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const toggleChannel = async (channel: string) => {
    try {
      const updatedPreferences = {
        ...preferences,
        channels: preferences.channels.map(config => 
          config.channel === channel 
            ? { ...config, enabled: !config.enabled }
            : config
        ),
      };

      const hybridManager = HybridNotificationManager.getInstance();
      await hybridManager.updateUserPreferences('current_user', updatedPreferences);
      setPreferences(updatedPreferences);
    } catch (error) {
      Alert.alert('Error', 'Failed to update channel preferences');
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? theme.colors.success : theme.colors.error;
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const renderChannelStatus = (channel: string, isActive: boolean) => {
    const channelConfig = preferences.channels.find(c => c.channel === channel);
    const isEnabled = channelConfig?.enabled || false;

    return (
      <Card key={channel} style={styles.channelCard}>
        <View style={styles.channelHeader}>
          <View style={styles.channelInfo}>
            <Text style={styles.channelName}>{channel.toUpperCase()}</Text>
            <Text style={styles.channelDescription}>
              {channel === 'websocket' && 'Real-time notifications via WebSocket'}
              {channel === 'fcm' && 'Firebase Cloud Messaging for Android'}
              {channel === 'apns' && 'Apple Push Notification Service for iOS'}
              {channel === 'local' && 'Local device notifications'}
            </Text>
          </View>
          <View style={styles.channelStatus}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(isActive) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(isActive) }]}>
              {getStatusText(isActive)}
            </Text>
          </View>
        </View>
        
        <View style={styles.channelActions}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: isEnabled ? theme.colors.primary : theme.colors.border }
            ]}
            onPress={() => toggleChannel(channel)}
          >
            <Text style={[
              styles.toggleText,
              { color: isEnabled ? theme.colors.white : theme.colors.text }
            ]}>
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Notification Status" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading notification status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Notification Status" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>System Overview</Text>
          <Text style={styles.summaryText}>
            Hybrid notification system with multiple delivery channels for maximum reliability.
            The system automatically selects the best available channel based on your preferences.
          </Text>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Channel Status</Text>
          {renderChannelStatus('websocket', status.websocket)}
          {renderChannelStatus('fcm', status.fcm)}
          {renderChannelStatus('apns', status.apns)}
          {renderChannelStatus('local', status.local)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Notification</Text>
          <Card style={styles.testCard}>
            <Text style={styles.testDescription}>
              Send a test notification through all enabled channels to verify the system is working correctly.
            </Text>
            <Button
              title="Send Test Notification"
              onPress={testNotification}
              style={styles.testButton}
              leftIcon="notifications-outline"
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Card style={styles.preferencesCard}>
            <Text style={styles.preferencesTitle}>Quiet Hours</Text>
            <Text style={styles.preferencesText}>
              {preferences.quietHours.enabled 
                ? `Enabled: ${preferences.quietHours.startTime} - ${preferences.quietHours.endTime}`
                : 'Disabled'
              }
            </Text>
            
            <Text style={styles.preferencesTitle}>Meeting Reminders</Text>
            <Text style={styles.preferencesText}>
              {Object.entries(preferences.reminderTimings)
                .filter(([_, enabled]) => enabled)
                .map(([timing, _]) => timing.replace(/([A-Z])/g, ' $1').toLowerCase())
                .join(', ') || 'None enabled'
              }
            </Text>
          </Card>
        </View>
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
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
  },
  summaryCard: {
    marginBottom: theme.spacing.lg,
  },
  summaryTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  summaryText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  channelCard: {
    marginBottom: theme.spacing.md,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  channelDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  channelStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  channelActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  toggleButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  toggleText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  testCard: {
    marginBottom: theme.spacing.md,
  },
  testDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  testButton: {
    alignSelf: 'flex-start',
  },
  preferencesCard: {
    marginBottom: theme.spacing.md,
  },
  preferencesTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  preferencesText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
});
