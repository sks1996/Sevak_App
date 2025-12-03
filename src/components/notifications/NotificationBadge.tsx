import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../constants/theme';
import { useNotifications } from '../../contexts/NotificationContext';

interface NotificationBadgeProps {
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  maxCount?: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  onPress,
  size = 'medium',
  showCount = true,
  maxCount = 99,
}) => {
  const { getUnreadCount } = useNotifications();
  const unreadCount = getUnreadCount();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          icon: styles.smallIcon,
          badge: styles.smallBadge,
          text: styles.smallText,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          icon: styles.largeIcon,
          badge: styles.largeBadge,
          text: styles.largeText,
        };
      default:
        return {
          container: styles.mediumContainer,
          icon: styles.mediumIcon,
          badge: styles.mediumBadge,
          text: styles.mediumText,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString();

  return (
    <TouchableOpacity
      style={[styles.container, sizeStyles.container]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name="notifications-outline"
        size={size === 'small' ? 20 : size === 'large' ? 28 : 24}
        color={theme.colors.textPrimary}
        style={sizeStyles.icon}
      />
      
      {unreadCount > 0 && showCount && (
        <View style={[styles.badge, sizeStyles.badge]}>
          <Text style={[styles.badgeText, sizeStyles.text]}>
            {displayCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Small size styles
  smallContainer: {
    width: 32,
    height: 32,
  },
  smallIcon: {
    // Icon size handled by Ionicons prop
  },
  smallBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  smallText: {
    fontSize: 10,
  },
  // Medium size styles
  mediumContainer: {
    width: 40,
    height: 40,
  },
  mediumIcon: {
    // Icon size handled by Ionicons prop
  },
  mediumBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
  },
  mediumText: {
    fontSize: 11,
  },
  // Large size styles
  largeContainer: {
    width: 48,
    height: 48,
  },
  largeIcon: {
    // Icon size handled by Ionicons prop
  },
  largeBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  largeText: {
    fontSize: 12,
  },
  // Common badge styles
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.textWhite,
  },
  badgeText: {
    color: theme.colors.textWhite,
    fontWeight: '700',
    textAlign: 'center',
  },
});
