export type NotificationType = 
  | 'message' 
  | 'attendance' 
  | 'task' 
  | 'meeting' 
  | 'system' 
  | 'announcement' 
  | 'reminder';

export type NotificationPriority = 'high' | 'medium' | 'low';

export type NotificationStatus = 'unread' | 'read' | 'dismissed';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  status: NotificationStatus;
  priority: NotificationPriority;
  actionUrl?: string;
  senderId?: string;
  senderName?: string;
  groupId?: string;
  taskId?: string;
  meetingId?: string;
  expiresAt: Date;
  data?: Record<string, any>;
}

export interface NotificationSettings {
  enabled: boolean;
  messageNotifications: boolean;
  attendanceReminders: boolean;
  taskNotifications: boolean;
  meetingReminders: boolean;
  systemAnnouncements: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  };
}

export interface NotificationStats {
  totalNotifications: number;
  unreadCount: number;
  readCount: number;
  dismissedCount: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

export interface NotificationState {
  notifications: Notification[];
  settings: NotificationSettings;
  stats: NotificationStats;
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
}

export interface NotificationContextType {
  notificationState: NotificationState;
  // Notification Management
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Settings Management
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  
  // Local Storage Management
  loadLocalNotifications: () => Promise<void>;
  saveLocalNotifications: () => Promise<void>;
  syncWithServer: () => Promise<void>;
  
  // Utility Functions
  getUnreadCount: () => number;
  getNotificationsByType: (type: NotificationType) => Notification[];
  getNotificationsByPriority: (priority: NotificationPriority) => Notification[];
  isQuietHours: () => boolean;
  
  // Notification Creation Helpers
  createMessageNotification: (senderName: string, message: string, groupId?: string) => Promise<void>;
  createAttendanceReminder: (type: 'checkin' | 'checkout') => Promise<void>;
  createTaskNotification: (taskTitle: string, taskId: string, priority: NotificationPriority) => Promise<void>;
  createMeetingReminder: (meetingTitle: string, meetingId: string, minutesBefore: number) => Promise<void>;
  createSystemAnnouncement: (title: string, message: string) => Promise<void>;
}

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  messageNotifications: true,
  attendanceReminders: true,
  taskNotifications: true,
  meetingReminders: true,
  systemAnnouncements: true,
  pushNotifications: true,
  emailNotifications: false,
  soundEnabled: true,
  vibrationEnabled: true,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
};

// Notification type configurations
export const NOTIFICATION_TYPE_CONFIG = {
  message: {
    icon: 'chatbubble-outline',
    color: '#4ECDC4',
    defaultPriority: 'high' as NotificationPriority,
    soundEnabled: true,
  },
  attendance: {
    icon: 'time-outline',
    color: '#FF6B35',
    defaultPriority: 'medium' as NotificationPriority,
    soundEnabled: true,
  },
  task: {
    icon: 'checkmark-circle-outline',
    color: '#45B7D1',
    defaultPriority: 'high' as NotificationPriority,
    soundEnabled: true,
  },
  meeting: {
    icon: 'calendar-outline',
    color: '#AB47BC',
    defaultPriority: 'medium' as NotificationPriority,
    soundEnabled: true,
  },
  system: {
    icon: 'settings-outline',
    color: '#26A69A',
    defaultPriority: 'low' as NotificationPriority,
    soundEnabled: false,
  },
  announcement: {
    icon: 'megaphone-outline',
    color: '#FFA726',
    defaultPriority: 'medium' as NotificationPriority,
    soundEnabled: true,
  },
  reminder: {
    icon: 'alarm-outline',
    color: '#EF5350',
    defaultPriority: 'medium' as NotificationPriority,
    soundEnabled: true,
  },
} as const;

// Helper functions
export const getNotificationTypeConfig = (type: NotificationType) => {
  return NOTIFICATION_TYPE_CONFIG[type];
};

export const formatNotificationTime = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return timestamp.toLocaleDateString();
};

export const shouldShowNotification = (
  notification: Notification,
  settings: NotificationSettings
): boolean => {
  // Check if notifications are enabled
  if (!settings.enabled) return false;
  
  // Check if notification type is enabled
  switch (notification.type) {
    case 'message':
      return settings.messageNotifications;
    case 'attendance':
      return settings.attendanceReminders;
    case 'task':
      return settings.taskNotifications;
    case 'meeting':
      return settings.meetingReminders;
    case 'system':
    case 'announcement':
      return settings.systemAnnouncements;
    default:
      return true;
  }
};
