import { APNSPayload, HybridNotification, NotificationDeliveryResult } from '../types/hybridNotifications';

export class APNsService {
  private static instance: APNsService;
  private keyId: string;
  private teamId: string;
  private bundleId: string;
  private production: boolean;
  private baseUrl: string;

  private constructor() {
    this.keyId = process.env.EXPO_PUBLIC_APNS_KEY_ID || '';
    this.teamId = process.env.EXPO_PUBLIC_APNS_TEAM_ID || '';
    this.bundleId = process.env.EXPO_PUBLIC_APNS_BUNDLE_ID || '';
    this.production = process.env.EXPO_PUBLIC_APNS_PRODUCTION === 'true';
    this.baseUrl = this.production 
      ? 'https://api.push.apple.com:443'
      : 'https://api.sandbox.push.apple.com:443';
  }

  static getInstance(): APNsService {
    if (!APNsService.instance) {
      APNsService.instance = new APNsService();
    }
    return APNsService.instance;
  }

  async sendNotification(
    notification: HybridNotification,
    deviceToken: string
  ): Promise<NotificationDeliveryResult> {
    const result: NotificationDeliveryResult = {
      notificationId: notification.id,
      channel: 'apns',
      success: false,
      retryCount: 0,
    };

    try {
      const payload: APNSPayload = {
        aps: {
          alert: {
            title: notification.title,
            body: notification.message,
          },
          badge: await this.getBadgeCount(),
          sound: 'default',
          category: this.getCategory(notification.type),
        },
        data: {
          notificationId: notification.id,
          type: notification.type,
          priority: notification.priority,
          ...notification.data,
        },
      };

      const url = `${this.baseUrl}/3/device/${deviceToken}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.generateJWT()}`,
          'Content-Type': 'application/json',
          'apns-priority': this.getAPNsPriority(notification.priority),
          'apns-expiration': this.getExpiration(notification.priority).toString(),
          'apns-topic': this.bundleId,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        result.success = true;
        result.deliveredAt = new Date();
        console.log('✅ APNs notification sent successfully');
      } else {
        const errorData = await response.text();
        result.error = `APNs error: ${response.status} - ${errorData}`;
        console.error('❌ APNs notification failed:', response.status, errorData);
      }

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ APNs service error:', error);
    }

    return result;
  }

  async sendToMultipleDevices(
    notification: HybridNotification,
    deviceTokens: string[]
  ): Promise<NotificationDeliveryResult[]> {
    const results: NotificationDeliveryResult[] = [];

    // APNs doesn't support batch sending, so we send individually
    const promises = deviceTokens.map(token => 
      this.sendNotification(notification, token)
    );

    const batchResults = await Promise.allSettled(promises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          notificationId: notification.id,
          channel: 'apns',
          success: false,
          error: result.reason?.message || 'Unknown error',
          retryCount: 0,
        });
      }
    });

    return results;
  }

  private async generateJWT(): Promise<string> {
    // In a real implementation, you would generate a JWT token using your APNs key
    // This is a simplified version - you'd need to implement proper JWT generation
    const header = {
      alg: 'ES256',
      kid: this.keyId,
    };

    const payload = {
      iss: this.teamId,
      iat: Math.floor(Date.now() / 1000),
    };

    // Note: This is a placeholder - you need to implement actual JWT signing
    // with your APNs private key
    return 'placeholder_jwt_token';
  }

  private getAPNsPriority(priority: string): string {
    switch (priority) {
      case 'urgent':
      case 'high':
        return '10';
      case 'medium':
      case 'low':
      default:
        return '5';
    }
  }

  private getExpiration(priority: string): number {
    const now = Math.floor(Date.now() / 1000);
    
    switch (priority) {
      case 'urgent':
        return now + 3600; // 1 hour
      case 'high':
        return now + 7200; // 2 hours
      case 'medium':
        return now + 14400; // 4 hours
      case 'low':
        return now + 28800; // 8 hours
      default:
        return now + 14400; // 4 hours
    }
  }

  private getCategory(type: string): string {
    switch (type) {
      case 'meeting_reminder':
        return 'MEETING_REMINDER';
      case 'meeting_invitation':
        return 'MEETING_INVITATION';
      case 'task_assigned':
        return 'TASK_ASSIGNED';
      case 'task_due':
        return 'TASK_DUE';
      case 'attendance_check':
        return 'ATTENDANCE_CHECK';
      case 'message_received':
        return 'MESSAGE_RECEIVED';
      case 'system_alert':
        return 'SYSTEM_ALERT';
      default:
        return 'GENERAL';
    }
  }

  private async getBadgeCount(): Promise<number> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const notifications = await AsyncStorage.getItem('notifications');
      const notificationList = notifications ? JSON.parse(notifications) : [];
      
      // Count unread notifications
      return notificationList.filter((n: any) => !n.read).length;
    } catch (error) {
      return 0;
    }
  }

  // Validate APNs configuration
  isConfigured(): boolean {
    return !!(this.keyId && this.teamId && this.bundleId);
  }

  // Get device token (this would be called during app initialization)
  async getDeviceToken(): Promise<string | null> {
    try {
      const Notifications = require('expo-notifications');
      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch (error) {
      console.error('❌ Error getting device token:', error);
      return null;
    }
  }

  // Test APNs connection
  async testConnection(): Promise<boolean> {
    try {
      // Send a test notification to verify APNs configuration
      const testNotification: HybridNotification = {
        id: 'test_' + Date.now(),
        userId: 'test_user',
        title: 'APNs Test',
        message: 'This is a test notification',
        type: 'system_alert',
        priority: 'low',
        createdAt: new Date(),
        deliveryStatus: 'pending',
        channels: ['apns'],
      };

      // This would require a valid device token
      // For testing purposes, we'll just validate the configuration
      return this.isConfigured();
    } catch (error) {
      console.error('❌ APNs connection test failed:', error);
      return false;
    }
  }
}
