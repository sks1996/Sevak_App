import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../../contexts/OfflineContext';
import { theme } from '../../constants/theme';

interface OfflineIndicatorProps {
  onSyncPress?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onSyncPress }) => {
  const { isOnline, isSyncing, pendingActionsCount, syncError } = useOffline();
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (!isOnline || pendingActionsCount > 0 || syncError) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, pendingActionsCount, syncError]);

  if (isOnline && pendingActionsCount === 0 && !syncError) {
    return null;
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: 'cloud-offline-outline',
        text: 'You\'re offline',
        color: theme.colors.error,
        backgroundColor: theme.colors.errorLight,
      };
    }
    
    if (syncError) {
      return {
        icon: 'warning-outline',
        text: 'Sync failed',
        color: theme.colors.warning,
        backgroundColor: theme.colors.warningLight,
      };
    }
    
    if (isSyncing) {
      return {
        icon: 'sync-outline',
        text: 'Syncing...',
        color: theme.colors.primary,
        backgroundColor: theme.colors.primaryLight,
      };
    }
    
    if (pendingActionsCount > 0) {
      return {
        icon: 'cloud-upload-outline',
        text: `${pendingActionsCount} pending`,
        color: theme.colors.warning,
        backgroundColor: theme.colors.warningLight,
      };
    }

    return null;
  };

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[styles.indicator, { backgroundColor: statusInfo.backgroundColor }]}>
        <View style={styles.content}>
          <Ionicons 
            name={statusInfo.icon as any} 
            size={16} 
            color={statusInfo.color} 
          />
          <Text style={[styles.text, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
          {pendingActionsCount > 0 && !isSyncing && (
            <TouchableOpacity onPress={onSyncPress} style={styles.syncButton}>
              <Ionicons name="refresh-outline" size={14} color={statusInfo.color} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  indicator: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomLeftRadius: theme.borderRadius.md,
    borderBottomRightRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
  },
  syncButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
});
