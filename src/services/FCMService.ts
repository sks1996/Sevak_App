import { FCMPayload, HybridNotification, NotificationDeliveryResult } from '../types/hybridNotifications';

export class FCMService {
  private static instance: FCMService;
  private serverKey: string;
  private projectId: string;
  private baseUrl = 'https://fcm.googleapis.com/fcm/send';

  private constructor() {
    this.serverKey = process.env.EXPO_PUBLIC_FCM_SERVER_KEY || '';
    this.projectId = process.env.EXPO_PUBLIC_FCM_PROJECT_ID || '';
  }

  static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService();
    }
    return FCMService.instance;
  }

  async sendNotification(
    notification: HybridNotification,
    fcmToken: string
  ): Promise<NotificationDeliveryResult> {
    const result: NotificationDeliveryResult = {
      notificationId: notification.id,
      channel: 'fcm',
      success: false,
      retryCount: 0,
    };

    try {
      const payload: FCMPayload = {
        to: fcmToken,
        notification: {
          title: notification.title,
          body: notification.message,
          icon: 'ic_notification',
          sound: 'default',
          badge: await this.getBadgeCount(),
        },
        data: {
          notificationId: notification.id,
          type: notification.type,
          priority: notification.priority,
          ...notification.data,
        },
        priority: notification.priority === 'urgent' || notification.priority === 'high' ? 'high' : 'normal',
        ttl: this.getTTL(notification.priority),
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success === 1) {
        result.success = true;
        result.deliveredAt = new Date();
        console.log('✅ FCM notification sent successfully:', responseData);
      } else {
        result.error = responseData.error || 'Unknown FCM error';
        console.error('❌ FCM notification failed:', responseData);
      }

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ FCM service error:', error);
    }

    return result;
  }

  async sendToMultipleUsers(
    notification: HybridNotification,
    fcmTokens: string[]
  ): Promise<NotificationDeliveryResult[]> {
    const results: NotificationDeliveryResult[] = [];

    // FCM supports up to 1000 tokens per request
    const batchSize = 1000;
    const batches = this.chunkArray(fcmTokens, batchSize);

    for (const batch of batches) {
      const batchResults = await this.sendToBatch(notification, batch);
      results.push(...batchResults);
    }

    return results;
  }

  private async sendToBatch(
    notification: HybridNotification,
    fcmTokens: string[]
  ): Promise<NotificationDeliveryResult[]> {
    const results: NotificationDeliveryResult[] = [];

    try {
      const payload = {
        registration_ids: fcmTokens,
        notification: {
          title: notification.title,
          body: notification.message,
          icon: 'ic_notification',
          sound: 'default',
          badge: await this.getBadgeCount(),
        },
        data: {
          notificationId: notification.id,
          type: notification.type,
          priority: notification.priority,
          ...notification.data,
        },
        priority: notification.priority === 'urgent' || notification.priority === 'high' ? 'high' : 'normal',
        ttl: this.getTTL(notification.priority),
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (response.ok && responseData.results) {
        responseData.results.forEach((result: any, index: number) => {
          const deliveryResult: NotificationDeliveryResult = {
            notificationId: notification.id,
            channel: 'fcm',
            success: !result.error,
            error: result.error,
            deliveredAt: !result.error ? new Date() : undefined,
            retryCount: 0,
          };
          results.push(deliveryResult);
        });
      } else {
        // If batch fails, mark all as failed
        fcmTokens.forEach(() => {
          results.push({
            notificationId: notification.id,
            channel: 'fcm',
            success: false,
            error: responseData.error || 'Batch send failed',
            retryCount: 0,
          });
        });
      }

    } catch (error) {
      // If request fails, mark all as failed
      fcmTokens.forEach(() => {
        results.push({
          notificationId: notification.id,
          channel: 'fcm',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: 0,
        });
      });
    }

    return results;
  }

  async sendToTopic(
    notification: HybridNotification,
    topic: string
  ): Promise<NotificationDeliveryResult> {
    const result: NotificationDeliveryResult = {
      notificationId: notification.id,
      channel: 'fcm',
      success: false,
      retryCount: 0,
    };

    try {
      const payload = {
        to: `/topics/${topic}`,
        notification: {
          title: notification.title,
          body: notification.message,
          icon: 'ic_notification',
          sound: 'default',
          badge: await this.getBadgeCount(),
        },
        data: {
          notificationId: notification.id,
          type: notification.type,
          priority: notification.priority,
          ...notification.data,
        },
        priority: notification.priority === 'urgent' || notification.priority === 'high' ? 'high' : 'normal',
        ttl: this.getTTL(notification.priority),
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (response.ok && responseData.message_id) {
        result.success = true;
        result.deliveredAt = new Date();
        console.log('✅ FCM topic notification sent successfully:', responseData);
      } else {
        result.error = responseData.error || 'Unknown FCM error';
        console.error('❌ FCM topic notification failed:', responseData);
      }

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ FCM topic service error:', error);
    }

    return result;
  }

  async subscribeToTopic(fcmToken: string, topic: string): Promise<boolean> {
    try {
      const response = await fetch(`https://iid.googleapis.com/iid/v1/${fcmToken}/rel/topics/${topic}`, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.serverKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('❌ FCM topic subscription error:', error);
      return false;
    }
  }

  async unsubscribeFromTopic(fcmToken: string, topic: string): Promise<boolean> {
    try {
      const response = await fetch(`https://iid.googleapis.com/iid/v1/${fcmToken}/rel/topics/${topic}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `key=${this.serverKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('❌ FCM topic unsubscription error:', error);
      return false;
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

  private getTTL(priority: string): number {
    // TTL in seconds based on priority
    switch (priority) {
      case 'urgent':
        return 3600; // 1 hour
      case 'high':
        return 7200; // 2 hours
      case 'medium':
        return 14400; // 4 hours
      case 'low':
        return 28800; // 8 hours
      default:
        return 14400; // 4 hours
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Validate FCM configuration
  isConfigured(): boolean {
    return !!(this.serverKey && this.projectId);
  }

  // Get FCM token from device (this would be called during app initialization)
  async getFCMToken(): Promise<string | null> {
    try {
      const Notifications = require('expo-notifications');
      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }
}
