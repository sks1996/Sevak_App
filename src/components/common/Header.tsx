import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { UserRole, ROLE_COLORS } from '../../constants';

interface HeaderProps {
  title: string;
  user?: {
    name: string;
    role: UserRole;
    avatar?: string;
  };
  onProfilePress?: () => void;
  onLogoutPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  style?: ViewStyle;
  rightButton?: {
    icon: string;
    onPress: () => void;
  };
}

export const Header: React.FC<HeaderProps> = ({
  title,
  user,
  onProfilePress,
  onLogoutPress,
  showBackButton = false,
  onBackPress,
  style,
  rightButton,
}) => {
  const getRoleColor = (role: UserRole) => ROLE_COLORS[role];

  return (
    <View style={[styles.header, style]}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textWhite} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.rightSection}>
        {rightButton && (
          <TouchableOpacity onPress={rightButton.onPress} style={styles.rightButton}>
            <Ionicons name={rightButton.icon as any} size={24} color={theme.colors.textWhite} />
          </TouchableOpacity>
        )}
        {onLogoutPress && (
          <TouchableOpacity onPress={onLogoutPress} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color={theme.colors.textWhite} />
          </TouchableOpacity>
        )}
        {user && (
          <TouchableOpacity onPress={onProfilePress} style={styles.profileSection}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={[styles.userRole, { color: getRoleColor(user.role) }]}>
                {user.role.toUpperCase()}
              </Text>
            </View>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={theme.colors.textWhite} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = theme.colors.primary,
  style,
}) => {
  return (
    <View style={[styles.loadingContainer, style]}>
      <View style={[styles.spinner, { borderTopColor: color }]} />
    </View>
  );
};

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.errorContainer, style]}>
      <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    shadowColor: theme.shadows.md.shadowColor,
    shadowOffset: theme.shadows.md.shadowOffset,
    shadowOpacity: theme.shadows.md.shadowOpacity,
    shadowRadius: theme.shadows.md.shadowRadius,
    elevation: theme.shadows.md.elevation,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textWhite,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightButton: {
    marginRight: theme.spacing.sm,
  },
  logoutButton: {
    marginRight: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'flex-end',
    marginRight: theme.spacing.sm,
  },
  userName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.textWhite,
  },
  userRole: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: theme.colors.primary,
  },
  errorContainer: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.error,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  retryText: {
    color: theme.colors.textWhite,
    fontWeight: '600',
  },
});
