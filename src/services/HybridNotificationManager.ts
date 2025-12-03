import { 
  HybridNotification, 
  NotificationChannel, 
  NotificationDeliveryResult, 
  UserNotificationPreferences,
  NotificationServiceConfig,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_SERVICE_CONFIG
} from '../types/hybridNotifications';
import { WebSocketService } from './WebSocketService';
import { FCMService } from './FCMService';
import { APNsService } from './APNsService';

export class HybridNotificationManager {
  private static instance: HybridNotificationManager;
  private wsService: WebSocketService;
  private fcmService: FCMService;
  private apnsService: APNsService;
  private config: NotificationServiceConfig;
  private userPreferences: Map<string, UserNotificationPreferences> = new Map();
  private deliveryQueue: HybridNotification[] = [];
  private isProcessingQueue = false;

  private constructor() {
    this.wsService = WebSocketService.getInstance();
    this.fcmService = FCMService.getInstance();
    this.apnsService = APNsService.getInstance();
    this.config = DEFAULT_SERVICE_CONFIG;
    this.initializeServices();
  }

  static getInstance(): HybridNotificationManager {
    if (!HybridNotificationManager.instance) {
      HybridNotificationManager.instance = new HybridNotificationManager();
    }
    return HybridNotificationManager.instance;
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize WebSocket connection
      if (this.config.websocket.enabled) {
        await this.wsService.connect(this.config.websocket.url);
      }

      // Load user preferences
      await this.loadUserPreferences();

      // Start processing delivery queue
      this.startQueueProcessor();

      console.log('✅ Hybrid Notification Manager initialized');
    } catch (error) {
      console.error('❌ Error initializing Hybrid Notification Manager:', error);
    }
  }

  async sendNotification(
    notification: HybridNotification,
    userIds?: string[]
  ): Promise<NotificationDeliveryResult[]> {
    const results: NotificationDeliveryResult[] = [];

    try {
      // Get user preferences for notification
      const preferences = this.getUserPreferences(notification.userId);
      
      // Determine which channels to use based on preferences and availability
      const channels = this.selectChannels(notification, preferences);
      
      // Send notification through selected channels
      for (const channel of channels) {
        const channelResult = await this.sendThroughChannel(notification, channel, userIds);
        results.push(channelResult);
        
        // If successful, break (no need to try fallback channels)
        if (channelResult.success) {
          break;
        }
      }

      // Update notification status
      notification.deliveryStatus = results.some(r => r.success) ? 'delivered' : 'failed';
      notification.sentAt = new Date();

      // Store notification
      await this.storeNotification(notification);

    } catch (error) {
      console.error('❌ Error sending notification:', error);
      results.push({
        notificationId: notification.id,
        channel: 'websocket',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: 0,
      });
    }

    return results;
  }

  async scheduleNotification(
    notification: HybridNotification,
    scheduledTime: Date,
    userIds?: string[]
  ): Promise<boolean> {
    try {
      notification.scheduledTime = scheduledTime;
      notification.deliveryStatus = 'scheduled';
      
      // Store scheduled notification
      await this.storeNotification(notification);
      
      // Schedule local notification as backup
      await this.scheduleLocalNotification(notification, scheduledTime);
      
      console.log(`📅 Notification scheduled for ${scheduledTime.toISOString()}`);
      return true;
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      return false;
    }
  }

  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      // Cancel local notification
      const Notifications = require('expo-notifications');
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      
      // Remove from storage
      await this.removeNotification(notificationId);
      
      console.log(`❌ Notification ${notificationId} cancelled`);
      return true;
    } catch (error) {
      console.error('❌ Error cancelling notification:', error);
      return false;
    }
  }

  private async sendThroughChannel(
    notification: HybridNotification,
    channel: NotificationChannel,
    userIds?: string[]
  ): Promise<NotificationDeliveryResult> {
    const result: NotificationDeliveryResult = {
      notificationId: notification.id,
      channel,
      success: false,
      retryCount: 0,
    };

    try {
      switch (channel) {
        case 'websocket':
          if (this.wsService.isConnected()) {
            this.wsService.sendNotification(notification);
            result.success = true;
            result.deliveredAt = new Date();
          } else {
            result.error = 'WebSocket not connected';
          }
          break;

        case 'fcm':
          if (this.fcmService.isConfigured()) {
            const fcmToken = await this.fcmService.getFCMToken();
            if (fcmToken) {
              const fcmResult = await this.fcmService.sendNotification(notification, fcmToken);
              result.success = fcmResult.success;
              result.error = fcmResult.error;
              result.deliveredAt = fcmResult.deliveredAt;
            } else {
              result.error = 'FCM token not available';
            }
          } else {
            result.error = 'FCM not configured';
          }
          break;

        case 'apns':
          if (this.apnsService.isConfigured()) {
            const deviceToken = await this.apnsService.getDeviceToken();
            if (deviceToken) {
              const apnsResult = await this.apnsService.sendNotification(notification, deviceToken);
              result.success = apnsResult.success;
              result.error = apnsResult.error;
              result.deliveredAt = apnsResult.deliveredAt;
            } else {
              result.error = 'Device token not available';
            }
          } else {
            result.error = 'APNs not configured';
          }
          break;

        case 'local':
          await this.triggerLocalNotification(notification);
          result.success = true;
          result.deliveredAt = new Date();
          break;

        default:
          result.error = `Unsupported channel: ${channel}`;
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  private selectChannels(
    notification: HybridNotification,
    preferences: UserNotificationPreferences
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = [];
    
    // Sort channels by priority
    const sortedChannels = preferences.channels
      .filter(config => config.enabled)
      .sort((a, b) => a.priority - b.priority);

    // Select primary channel
    if (sortedChannels.length > 0) {
      channels.push(sortedChannels[0].channel);
    }

    // Add fallback channels
    sortedChannels.slice(1).forEach(config => {
      channels.push(config.channel);
    });

    return channels;
  }

  private async triggerLocalNotification(notification: HybridNotification): Promise<void> {
    try {
      const Notifications = require('expo-notifications');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          data: notification.data || {},
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('❌ Error triggering local notification:', error);
    }
  }

  private async scheduleLocalNotification(
    notification: HybridNotification,
    scheduledTime: Date
  ): Promise<void> {
    try {
      const Notifications = require('expo-notifications');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          data: notification.data || {},
        },
        trigger: {
          date: scheduledTime,
        },
      });
    } catch (error) {
      console.error('❌ Error scheduling local notification:', error);
    }
  }

  private async storeNotification(notification: HybridNotification): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const notifications = await AsyncStorage.getItem('notifications');
      const notificationList = notifications ? JSON.parse(notifications) : [];
      
      // Update existing notification or add new one
      const existingIndex = notificationList.findIndex((n: any) => n.id === notification.id);
      if (existingIndex >= 0) {
        notificationList[existingIndex] = notification;
      } else {
        notificationList.unshift(notification);
      }
      
      // Keep only last 100 notifications
      if (notificationList.length > 100) {
        notificationList.splice(100);
      }
      
      await AsyncStorage.setItem('notifications', JSON.stringify(notificationList));
    } catch (error) {
      console.error('❌ Error storing notification:', error);
    }
  }

  private async removeNotification(notificationId: string): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const notifications = await AsyncStorage.getItem('notifications');
      const notificationList = notifications ? JSON.parse(notifications) : [];
      
      const filteredList = notificationList.filter((n: any) => n.id !== notificationId);
      await AsyncStorage.setItem('notifications', JSON.stringify(filteredList));
    } catch (error) {
      console.error('❌ Error removing notification:', error);
    }
  }

  private async loadUserPreferences(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const preferences = await AsyncStorage.getItem('userNotificationPreferences');
      
      if (preferences) {
        const parsedPreferences = JSON.parse(preferences);
        Object.entries(parsedPreferences).forEach(([userId, prefs]) => {
          this.userPreferences.set(userId, prefs as UserNotificationPreferences);
        });
      }
    } catch (error) {
      console.error('❌ Error loading user preferences:', error);
    }
  }

  private getUserPreferences(userId: string): UserNotificationPreferences {
    return this.userPreferences.get(userId) || {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      userId,
    };
  }

  private startQueueProcessor(): void {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    setInterval(async () => {
      await this.processDeliveryQueue();
    }, 30000); // Process every 30 seconds
  }

  private async processDeliveryQueue(): Promise<void> {
    if (this.deliveryQueue.length === 0) return;

    const now = new Date();
    const dueNotifications = this.deliveryQueue.filter(
      notification => notification.scheduledTime && notification.scheduledTime <= now
    );

    for (const notification of dueNotifications) {
      await this.sendNotification(notification);
      
      // Remove from queue
      this.deliveryQueue = this.deliveryQueue.filter(n => n.id !== notification.id);
    }
  }

  // Public methods for managing preferences
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserNotificationPreferences>
  ): Promise<void> {
    try {
      const currentPreferences = this.getUserPreferences(userId);
      const updatedPreferences = { ...currentPreferences, ...preferences };
      
      this.userPreferences.set(userId, updatedPreferences);
      
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const allPreferences = Object.fromEntries(this.userPreferences);
      await AsyncStorage.setItem('userNotificationPreferences', JSON.stringify(allPreferences));
      
      console.log(`✅ User preferences updated for ${userId}`);
    } catch (error) {
      console.error('❌ Error updating user preferences:', error);
    }
  }

  async getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
    return this.getUserPreferences(userId);
  }

  // Health check for all services
  async healthCheck(): Promise<{
    websocket: boolean;
    fcm: boolean;
    apns: boolean;
    local: boolean;
  }> {
    const health = {
      websocket: false,
      fcm: false,
      apns: false,
      local: true, // Local notifications are always available
    };

    try {
      // Check WebSocket
      if (this.config.websocket.enabled) {
        health.websocket = await this.wsService.healthCheck();
      }

      // Check FCM
      if (this.config.fcm.enabled) {
        health.fcm = this.fcmService.isConfigured();
      }

      // Check APNs
      if (this.config.apns.enabled) {
        health.apns = this.apnsService.isConfigured();
      }
    } catch (error) {
      console.error('❌ Health check error:', error);
    }

    return health;
  }

  // Disconnect all services
  disconnect(): void {
    this.wsService.disconnect();
    this.isProcessingQueue = false;
    console.log('🔌 Hybrid Notification Manager disconnected');
  }
}
