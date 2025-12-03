import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { theme } from '../../constants/theme';

interface LocationPermissionScreenProps {
  onPermissionGranted: () => void;
  onBypassLocation?: () => void;
}

export const LocationPermissionScreen: React.FC<LocationPermissionScreenProps> = ({
  onPermissionGranted,
  onBypassLocation,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Location.LocationPermissionResponse | null>(null);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus({ status } as Location.LocationPermissionResponse);
      
      if (status === 'granted') {
        onPermissionGranted();
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const requestLocationPermission = async () => {
    setIsRequesting(true);
    
    try {
      // First, check if location services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to use attendance tracking.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        setIsRequesting(false);
        return;
      }

      // Request foreground location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus({ status } as Location.LocationPermissionResponse);

      if (status === 'granted') {
        Alert.alert(
          'Permission Granted',
          'Location access has been granted. You can now use attendance tracking.',
          [{ text: 'OK', onPress: onPermissionGranted }]
        );
      } else {
        Alert.alert(
          'Permission Denied',
          'Location access is required for attendance tracking. Please grant permission to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: requestLocationPermission },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert(
        'Error',
        'Failed to request location permission. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const openAppSettings = () => {
    Linking.openSettings();
  };

  const getPermissionIcon = () => {
    if (permissionStatus?.status === 'granted') {
      return 'checkmark-circle';
    } else if (permissionStatus?.status === 'denied') {
      return 'close-circle';
    }
    return 'location-outline';
  };

  const getPermissionColor = () => {
    if (permissionStatus?.status === 'granted') {
      return theme.colors.success;
    } else if (permissionStatus?.status === 'denied') {
      return theme.colors.error;
    }
    return theme.colors.warning;
  };

  const getPermissionMessage = () => {
    if (permissionStatus?.status === 'granted') {
      return 'Location permission has been granted!';
    } else if (permissionStatus?.status === 'denied') {
      return 'Location permission was denied. Please enable it in settings.';
    }
    return 'Location permission is required for attendance tracking.';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="location" size={80} color={theme.colors.primary} />
          <Text style={styles.title}>Location Access Required</Text>
          <Text style={styles.subtitle}>
            Sevak App needs access to your location for accurate attendance tracking
          </Text>
        </View>

        {/* Permission Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={getPermissionIcon()} 
              size={32} 
              color={getPermissionColor()} 
            />
            <Text style={styles.statusTitle}>Permission Status</Text>
          </View>
          <Text style={styles.statusMessage}>{getPermissionMessage()}</Text>
        </Card>

        {/* Why We Need Location */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Why do we need your location?</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} />
              <Text style={styles.infoText}>Verify you're at the correct workplace</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color={theme.colors.info} />
              <Text style={styles.infoText}>Ensure accurate check-in/out times</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.warning} />
              <Text style={styles.infoText}>Prevent attendance fraud</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="analytics" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>Generate accurate reports</Text>
            </View>
          </View>
        </Card>

        {/* Privacy Notice */}
        <Card style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <Ionicons name="lock-closed" size={24} color={theme.colors.textSecondary} />
            <Text style={styles.privacyTitle}>Your Privacy is Protected</Text>
          </View>
          <Text style={styles.privacyText}>
            • We only use your location for attendance tracking{'\n'}
            • Location data is encrypted and securely stored{'\n'}
            • We never share your location with third parties{'\n'}
            • You can revoke permission anytime in settings
          </Text>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {permissionStatus?.status !== 'granted' && (
            <Button
              title="Grant Location Permission"
              onPress={requestLocationPermission}
              loading={isRequesting}
              style={styles.primaryButton}
            />
          )}
          
          {permissionStatus?.status === 'denied' && (
            <Button
              title="Open Settings"
              variant="outline"
              onPress={openAppSettings}
              style={styles.secondaryButton}
            />
          )}

          {permissionStatus?.status === 'granted' && (
            <Button
              title="Continue to App"
              onPress={onPermissionGranted}
              style={styles.primaryButton}
            />
          )}

          {/* Development Bypass Button */}
          {onBypassLocation && (
            <Button
              title="Skip for Testing (Dev Only)"
              variant="outline"
              onPress={onBypassLocation}
              style={styles.bypassButton}
            />
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Location access is mandatory for using Sevak App
          </Text>
          <Text style={styles.footerSubtext}>
            Without location permission, you cannot proceed to the main application
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  statusCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.md,
  },
  statusMessage: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  infoCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  infoList: {
    gap: theme.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  privacyCard: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  privacyTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.md,
  },
  privacyText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  actionsContainer: {
    marginBottom: theme.spacing.xl,
  },
  primaryButton: {
    marginBottom: theme.spacing.md,
  },
  secondaryButton: {
    marginBottom: theme.spacing.md,
  },
  bypassButton: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.warning,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  footerSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
