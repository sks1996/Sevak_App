export interface HybridNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  data?: Record<string, any>;
  scheduledTime?: Date;
  createdAt: Date;
  sentAt?: Date;
  deliveryStatus: DeliveryStatus;
  channels: NotificationChannel[];
}

export type NotificationType = 
  | 'meeting_reminder'
  | 'meeting_invitation'
  | 'task_assigned'
  | 'task_due'
  | 'attendance_check'
  | 'message_received'
  | 'system_alert'
  | 'general';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type DeliveryStatus = 
  | 'pending'
  | 'scheduled'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export type NotificationChannel = 
  | 'websocket'
  | 'fcm'
  | 'apns'
  | 'local'
  | 'email'
  | 'sms';

export interface NotificationChannelConfig {
  channel: NotificationChannel;
  enabled: boolean;
  priority: number; // 1 = highest priority
  fallbackChannels?: NotificationChannel[];
}

export interface UserNotificationPreferences {
  userId: string;
  channels: NotificationChannelConfig[];
  quietHours: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string;   // "08:00"
  };
  reminderTimings: {
    oneDayBefore: boolean;
    oneHourBefore: boolean;
    fifteenMinutesBefore: boolean;
    startingNow: boolean;
  };
  meetingNotifications: {
    invitations: boolean;
    reminders: boolean;
    updates: boolean;
    cancellations: boolean;
  };
  taskNotifications: {
    assignments: boolean;
    dueReminders: boolean;
    updates: boolean;
  };
  attendanceNotifications: {
    checkInReminders: boolean;
    checkOutReminders: boolean;
    locationAlerts: boolean;
  };
  messageNotifications: {
    directMessages: boolean;
    groupMessages: boolean;
    mentions: boolean;
  };
}

export interface WebSocketNotification {
  type: 'notification';
  payload: HybridNotification;
  timestamp: number;
}

export interface FCMPayload {
  to: string;
  notification: {
    title: string;
    body: string;
    icon?: string;
    sound?: string;
    badge?: number;
  };
  data: Record<string, string>;
  priority: 'high' | 'normal';
  ttl?: number;
}

export interface APNSPayload {
  aps: {
    alert: {
      title: string;
      body: string;
    };
    badge?: number;
    sound?: string;
    category?: string;
  };
  data: Record<string, any>;
}

export interface NotificationDeliveryResult {
  notificationId: string;
  channel: NotificationChannel;
  success: boolean;
  error?: string;
  deliveredAt?: Date;
  retryCount: number;
}

export interface NotificationServiceConfig {
  websocket: {
    enabled: boolean;
    url: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
  };
  fcm: {
    enabled: boolean;
    serverKey: string;
    projectId: string;
  };
  apns: {
    enabled: boolean;
    keyId: string;
    teamId: string;
    bundleId: string;
    production: boolean;
  };
  local: {
    enabled: boolean;
    maxScheduledNotifications: number;
  };
  email: {
    enabled: boolean;
    smtpConfig: any;
  };
  sms: {
    enabled: boolean;
    provider: string;
    apiKey: string;
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: UserNotificationPreferences = {
  userId: '',
  channels: [
    { channel: 'websocket', enabled: true, priority: 1 },
    { channel: 'fcm', enabled: true, priority: 2 },
    { channel: 'apns', enabled: true, priority: 3 },
    { channel: 'local', enabled: true, priority: 4 },
    { channel: 'email', enabled: false, priority: 5 },
    { channel: 'sms', enabled: false, priority: 6 },
  ],
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
  },
  reminderTimings: {
    oneDayBefore: true,
    oneHourBefore: true,
    fifteenMinutesBefore: true,
    startingNow: true,
  },
  meetingNotifications: {
    invitations: true,
    reminders: true,
    updates: true,
    cancellations: true,
  },
  taskNotifications: {
    assignments: true,
    dueReminders: true,
    updates: true,
  },
  attendanceNotifications: {
    checkInReminders: true,
    checkOutReminders: true,
    locationAlerts: true,
  },
  messageNotifications: {
    directMessages: true,
    groupMessages: true,
    mentions: true,
  },
};

export const DEFAULT_SERVICE_CONFIG: NotificationServiceConfig = {
  websocket: {
    enabled: true,
    url: 'ws://localhost:8080/notifications',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
  },
  fcm: {
    enabled: true,
    serverKey: process.env.EXPO_PUBLIC_FCM_SERVER_KEY || '',
    projectId: process.env.EXPO_PUBLIC_FCM_PROJECT_ID || '',
  },
  apns: {
    enabled: true,
    keyId: process.env.EXPO_PUBLIC_APNS_KEY_ID || '',
    teamId: process.env.EXPO_PUBLIC_APNS_TEAM_ID || '',
    bundleId: process.env.EXPO_PUBLIC_APNS_BUNDLE_ID || '',
    production: false,
  },
  local: {
    enabled: true,
    maxScheduledNotifications: 64,
  },
  email: {
    enabled: false,
    smtpConfig: {},
  },
  sms: {
    enabled: false,
    provider: 'twilio',
    apiKey: '',
  },
};
