import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Notification, NotificationType, NotificationPriority } from '../../types/notifications';

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
}) => {
  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return theme.colors.error;
      case 'high':
        return theme.colors.warning;
      case 'medium':
        return theme.colors.info;
      case 'low':
        return theme.colors.success;
      default:
        return theme.colors.textMuted;
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'meeting_reminder':
        return 'calendar-outline';
      case 'meeting_invitation':
        return 'people-outline';
      case 'task_assigned':
        return 'checkmark-circle-outline';
      case 'task_due':
        return 'time-outline';
      case 'attendance_check':
        return 'location-outline';
      case 'message_received':
        return 'chatbubble-outline';
      case 'system_alert':
        return 'warning-outline';
      case 'general':
        return 'notifications-outline';
      default:
        return 'notifications-outline';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        !notification.read && styles.unreadContainer
      ]} 
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getTypeIcon(notification.type)} 
            size={24} 
            color={getPriorityColor(notification.priority)} 
          />
        </View>
        
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[
              styles.title,
              !notification.read && styles.unreadTitle
            ]} numberOfLines={2}>
              {notification.title}
            </Text>
            
            <View style={styles.badges}>
              <View style={[
                styles.priorityBadge, 
                { backgroundColor: getPriorityColor(notification.priority) }
              ]}>
                <Text style={styles.priorityText}>
                  {notification.priority.toUpperCase()}
                </Text>
              </View>
              
              {!notification.read && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>NEW</Text>
                </View>
              )}
            </View>
          </View>
          
          <Text style={styles.message} numberOfLines={3}>
            {notification.message}
          </Text>
          
          <View style={styles.footer}>
            <Text style={styles.timeText}>
              {formatTime(notification.createdAt)}
            </Text>
            
            <View style={styles.actions}>
              {!notification.read && onMarkAsRead && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onMarkAsRead(notification.id)}
                >
                  <Ionicons name="checkmark-outline" size={16} color={theme.colors.success} />
                </TouchableOpacity>
              )}
              
              {onDelete && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onDelete(notification.id)}
                >
                  <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
      
      {notification.data && Object.keys(notification.data).length > 0 && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataLabel}>Additional Info:</Text>
          {Object.entries(notification.data).map(([key, value]) => (
            <Text key={key} style={styles.dataText}>
              {key}: {String(value)}
            </Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unreadContainer: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: theme.spacing.md,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  unreadTitle: {
    fontFamily: theme.typography.fontFamily.bold,
  },
  badges: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  priorityText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  unreadText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
  },
  message: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  actionButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
  },
  dataContainer: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  dataLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  dataText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
});