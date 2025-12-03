import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import {
  Notification,
  NotificationSettings,
  NotificationStats,
  NotificationState,
  NotificationContextType,
  NotificationType,
  NotificationPriority,
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationTypeConfig,
  shouldShowNotification,
} from '../types/notifications';
import { useAuth } from './AuthContext';

// Mock notifications for demonstration
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'message',
    title: 'New Message',
    message: 'John Doe sent you a message in Education Group',
    timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
    status: 'unread',
    priority: 'high',
    senderId: '1',
    senderName: 'John Doe',
    groupId: 'group1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
  {
    id: '2',
    type: 'attendance',
    title: 'Attendance Reminder',
    message: 'Don\'t forget to check in for today\'s work',
    timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
    status: 'unread',
    priority: 'medium',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    type: 'task',
    title: 'Task Assigned',
    message: 'You have been assigned a new task: Complete monthly report',
    timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
    status: 'read',
    priority: 'high',
    taskId: 'task1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    type: 'meeting',
    title: 'Meeting Reminder',
    message: 'Team meeting starts in 15 minutes',
    timestamp: new Date(Date.now() - 4 * 60 * 60000), // 4 hours ago
    status: 'read',
    priority: 'medium',
    meetingId: 'meeting1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    type: 'system',
    title: 'System Update',
    message: 'App has been updated with new features',
    timestamp: new Date(Date.now() - 24 * 60 * 60000), // 1 day ago
    status: 'dismissed',
    priority: 'low',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
];

const initialState: NotificationState = {
  notifications: MOCK_NOTIFICATIONS,
  settings: DEFAULT_NOTIFICATION_SETTINGS,
  stats: {
    totalNotifications: 0,
    unreadCount: 0,
    readCount: 0,
    dismissedCount: 0,
    byType: {
      message: 0,
      attendance: 0,
      task: 0,
      meeting: 0,
      system: 0,
      announcement: 0,
      reminder: 0,
    },
    byPriority: {
      high: 0,
      medium: 0,
      low: 0,
    },
  },
  isLoading: true,
  error: null,
  lastSyncTime: null,
};

type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UPDATE_NOTIFICATION'; payload: { id: string; updates: Partial<Notification> } }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'SET_SETTINGS'; payload: NotificationSettings }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<NotificationSettings> }
  | { type: 'SET_STATS'; payload: NotificationStats }
  | { type: 'SET_LAST_SYNC'; payload: Date };

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    
    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications];
      // Keep only last 5 notifications in memory
      const limitedNotifications = newNotifications.slice(0, 5);
      return { ...state, notifications: limitedNotifications };
    
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id
            ? { ...notification, ...action.payload.updates }
            : notification
        ),
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload),
      };
    
    case 'CLEAR_ALL_NOTIFICATIONS':
      return { ...state, notifications: [] };
    
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    
    case 'SET_LAST_SYNC':
      return { ...state, lastSyncTime: action.payload };
    
    default:
      return state;
  }
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notificationState, dispatch] = useReducer(notificationReducer, initialState);
  const { authState } = useAuth();

  useEffect(() => {
    if (authState.user) {
      loadLocalNotifications();
    }
  }, [authState.user]);

  // Calculate stats whenever notifications change
  useEffect(() => {
    calculateStats();
  }, [notificationState.notifications]);

  const calculateStats = () => {
    const notifications = notificationState.notifications;
    const stats: NotificationStats = {
      totalNotifications: notifications.length,
      unreadCount: notifications.filter(n => n.status === 'unread').length,
      readCount: notifications.filter(n => n.status === 'read').length,
      dismissedCount: notifications.filter(n => n.status === 'dismissed').length,
      byType: {
        message: notifications.filter(n => n.type === 'message').length,
        attendance: notifications.filter(n => n.type === 'attendance').length,
        task: notifications.filter(n => n.type === 'task').length,
        meeting: notifications.filter(n => n.type === 'meeting').length,
        system: notifications.filter(n => n.type === 'system').length,
        announcement: notifications.filter(n => n.type === 'announcement').length,
        reminder: notifications.filter(n => n.type === 'reminder').length,
      },
      byPriority: {
        high: notifications.filter(n => n.priority === 'high').length,
        medium: notifications.filter(n => n.priority === 'medium').length,
        low: notifications.filter(n => n.priority === 'low').length,
      },
    };
    dispatch({ type: 'SET_STATS', payload: stats });
  };

  const loadLocalNotifications = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Load notifications from AsyncStorage
      const storedNotifications = await AsyncStorage.getItem('notifications');
      const storedSettings = await AsyncStorage.getItem('notificationSettings');
      
      if (storedNotifications) {
        const notifications = JSON.parse(storedNotifications).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
          expiresAt: new Date(n.expiresAt),
        }));
        dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
      }
      
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        dispatch({ type: 'SET_SETTINGS', payload: settings });
      }
      
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load notifications' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveLocalNotifications = async () => {
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify(notificationState.notifications));
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(notificationState.settings));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  };

  const addNotification = async (notificationData: Omit<Notification, 'id' | 'timestamp' | 'status'>) => {
    try {
      const notification: Notification = {
        ...notificationData,
        id: Date.now().toString(),
        timestamp: new Date(),
        status: 'unread',
      };

      // Check if notification should be shown based on settings
      if (!shouldShowNotification(notification, notificationState.settings)) {
        return;
      }

      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      await saveLocalNotifications();

      // Show alert for high priority notifications
      if (notification.priority === 'high') {
        Alert.alert(notification.title, notification.message);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add notification' });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      dispatch({ type: 'UPDATE_NOTIFICATION', payload: { id: notificationId, updates: { status: 'read' } } });
      await saveLocalNotifications();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to mark notification as read' });
    }
  };

  const markAllAsRead = async () => {
    try {
      const updatedNotifications = notificationState.notifications.map(notification => ({
        ...notification,
        status: 'read' as const,
      }));
      dispatch({ type: 'SET_NOTIFICATIONS', payload: updatedNotifications });
      await saveLocalNotifications();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to mark all notifications as read' });
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      dispatch({ type: 'UPDATE_NOTIFICATION', payload: { id: notificationId, updates: { status: 'dismissed' } } });
      await saveLocalNotifications();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to dismiss notification' });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
      await saveLocalNotifications();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete notification' });
    }
  };

  const clearAllNotifications = async () => {
    try {
      dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
      await saveLocalNotifications();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear notifications' });
    }
  };

  const updateSettings = async (settings: Partial<NotificationSettings>) => {
    try {
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
      await saveLocalNotifications();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update settings' });
    }
  };

  const resetSettings = async () => {
    try {
      dispatch({ type: 'SET_SETTINGS', payload: DEFAULT_NOTIFICATION_SETTINGS });
      await saveLocalNotifications();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to reset settings' });
    }
  };

  const syncWithServer = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Simulate server sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sync with server' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Utility Functions
  const getUnreadCount = () => {
    return notificationState.notifications.filter(n => n.status === 'unread').length;
  };

  const getNotificationsByType = (type: NotificationType) => {
    return notificationState.notifications.filter(n => n.type === type);
  };

  const getNotificationsByPriority = (priority: NotificationPriority) => {
    return notificationState.notifications.filter(n => n.priority === priority);
  };

  const isQuietHours = () => {
    const { quietHours } = notificationState.settings;
    if (!quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = parseInt(quietHours.startTime.split(':')[0]) * 60 + parseInt(quietHours.startTime.split(':')[1]);
    const endTime = parseInt(quietHours.endTime.split(':')[0]) * 60 + parseInt(quietHours.endTime.split(':')[1]);

    return currentTime >= startTime || currentTime <= endTime;
  };

  // Notification Creation Helpers
  const createMessageNotification = async (senderName: string, message: string, groupId?: string) => {
    await addNotification({
      type: 'message',
      title: 'New Message',
      message: `${senderName}: ${message}`,
      priority: 'high',
      senderName,
      groupId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  };

  const createAttendanceReminder = async (type: 'checkin' | 'checkout') => {
    await addNotification({
      type: 'attendance',
      title: 'Attendance Reminder',
      message: `Don't forget to ${type === 'checkin' ? 'check in' : 'check out'} for today`,
      priority: 'medium',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  };

  const createTaskNotification = async (taskTitle: string, taskId: string, priority: NotificationPriority) => {
    await addNotification({
      type: 'task',
      title: 'Task Assigned',
      message: `You have been assigned: ${taskTitle}`,
      priority,
      taskId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  };

  const createMeetingReminder = async (meetingTitle: string, meetingId: string, minutesBefore: number) => {
    await addNotification({
      type: 'meeting',
      title: 'Meeting Reminder',
      message: `${meetingTitle} starts in ${minutesBefore} minutes`,
      priority: 'medium',
      meetingId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  };

  const createSystemAnnouncement = async (title: string, message: string) => {
    await addNotification({
      type: 'system',
      title,
      message,
      priority: 'low',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  };

  const value: NotificationContextType = {
    notificationState,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    deleteNotification,
    clearAllNotifications,
    updateSettings,
    resetSettings,
    loadLocalNotifications,
    saveLocalNotifications,
    syncWithServer,
    getUnreadCount,
    getNotificationsByType,
    getNotificationsByPriority,
    isQuietHours,
    createMessageNotification,
    createAttendanceReminder,
    createTaskNotification,
    createMeetingReminder,
    createSystemAnnouncement,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
