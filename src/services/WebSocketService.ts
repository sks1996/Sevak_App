import { WebSocketNotification, HybridNotification } from '../types/hybridNotifications';

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private isConnecting = false;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  async connect(url: string): Promise<void> {
    if (this.isConnecting || this.connectionState === 'connected') {
      return;
    }

    this.isConnecting = true;
    this.connectionState = 'connecting';

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.handleConnectionOpen();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.connectionState = 'disconnected';
        this.isConnecting = false;
        this.handleConnectionClose();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.connectionState = 'disconnected';
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      this.connectionState = 'disconnected';
      this.isConnecting = false;
      throw error;
    }
  }

  private handleConnectionOpen(): void {
    // Send authentication or initial setup message
    this.send({
      type: 'auth',
      payload: {
        userId: this.getCurrentUserId(),
        timestamp: Date.now(),
      },
    });
  }

  private handleConnectionClose(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect(this.getWebSocketUrl());
      }, this.reconnectInterval);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  private handleMessage(data: any): void {
    console.log('📨 WebSocket message received:', data);

    if (data.type === 'notification') {
      const notification: HybridNotification = data.payload;
      this.handleNotification(notification);
    } else if (data.type === 'pong') {
      // Handle ping-pong for connection health
      console.log('🏓 Pong received');
    } else {
      // Handle other message types
      const handler = this.messageHandlers.get(data.type);
      if (handler) {
        handler(data);
      }
    }
  }

  private handleNotification(notification: HybridNotification): void {
    // Process incoming notification
    console.log('🔔 Notification received via WebSocket:', notification);
    
    // Update notification status to delivered
    notification.deliveryStatus = 'delivered';
    notification.sentAt = new Date();
    
    // Store notification locally
    this.storeNotification(notification);
    
    // Trigger local notification if needed
    this.triggerLocalNotification(notification);
  }

  private async storeNotification(notification: HybridNotification): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const notifications = await AsyncStorage.getItem('notifications');
      const notificationList = notifications ? JSON.parse(notifications) : [];
      
      notificationList.unshift(notification);
      
      // Keep only last 100 notifications
      if (notificationList.length > 100) {
        notificationList.splice(100);
      }
      
      await AsyncStorage.setItem('notifications', JSON.stringify(notificationList));
    } catch (error) {
      console.error('❌ Error storing notification:', error);
    }
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

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }

  sendNotification(notification: HybridNotification): void {
    const wsNotification: WebSocketNotification = {
      type: 'notification',
      payload: notification,
      timestamp: Date.now(),
    };
    
    this.send(wsNotification);
  }

  subscribe(messageType: string, handler: (data: any) => void): void {
    this.messageHandlers.set(messageType, handler);
  }

  unsubscribe(messageType: string): void {
    this.messageHandlers.delete(messageType);
  }

  ping(): void {
    this.send({
      type: 'ping',
      timestamp: Date.now(),
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionState = 'disconnected';
    this.reconnectAttempts = 0;
  }

  getConnectionState(): string {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private getCurrentUserId(): string {
    // Get current user ID from auth context or storage
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      // This would be set during login
      return 'current_user_id'; // Replace with actual user ID
    } catch (error) {
      return 'anonymous';
    }
  }

  private getWebSocketUrl(): string {
    // Get WebSocket URL from config or environment
    return process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8080/notifications';
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);

      const pongHandler = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      this.subscribe('pong', pongHandler);
      this.ping();

      setTimeout(() => {
        this.unsubscribe('pong');
        clearTimeout(timeout);
        resolve(false);
      }, 5000);
    });
  }
}
