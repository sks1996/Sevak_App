import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { NotificationBadge } from '../../components/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  rightElement,
}) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
    <View style={styles.settingsItemLeft}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.settingsTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    <View style={styles.settingsItemRight}>
      {rightElement}
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      )}
    </View>
  </TouchableOpacity>
);

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { authState, logout } = useAuth();
  const { settingsState, refreshSettings } = useSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSettings();
    setIsRefreshing(false);
  };

  const navigateToProfile = () => {
    navigation.navigate('Profile' as never);
  };

  const navigateToProfileSettings = () => {
    navigation.navigate('ProfileSettings' as never);
  };

  const navigateToPreferences = () => {
    navigation.navigate('Preferences' as never);
  };

  const navigateToSecurity = () => {
    navigation.navigate('SecuritySettings' as never);
  };

  const navigateToPrivacy = () => {
    navigation.navigate('PrivacySettings' as never);
  };

  const navigateToNotificationSettings = () => {
    navigation.navigate('NotificationSettings' as never);
  };

  const navigateToSystemSettings = () => {
    navigation.navigate('SystemSettings' as never);
  };

  const navigateToAbout = () => {
    navigation.navigate('About' as never);
  };

  const navigateToHelp = () => {
    navigation.navigate('Help' as never);
  };

  const navigateToNotificationHistory = () => {
    navigation.navigate('NotificationHistory' as never);
  };

  const navigateToMeetingNotifications = () => {
    navigation.navigate('NotificationPreferences' as never);
  };

  const navigateToNotificationStatus = () => {
    navigation.navigate('NotificationStatus' as never);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getThemeDisplayName = (theme: string) => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'auto': return 'Auto';
      default: return 'Light';
    }
  };

  const getLanguageDisplayName = (lang: string) => {
    switch (lang) {
      case 'en': return 'English';
      case 'hi': return 'हिन्दी';
      case 'gu': return 'ગુજરાતી';
      default: return 'English';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Settings"
        user={authState.user ? {
          name: authState.user.name,
          role: authState.user.role,
        } : undefined}
        onLogoutPress={logout}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {/* Profile Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <SettingsItem
            icon="person-outline"
            title="View Profile"
            subtitle="View your profile information"
            onPress={navigateToProfile}
          />
          <SettingsItem
            icon="create-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={navigateToProfileSettings}
          />
        </Card>

        {/* App Preferences */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <SettingsItem
            icon="color-palette-outline"
            title="Theme"
            subtitle={getThemeDisplayName(settingsState.appPreferences.theme)}
            onPress={navigateToPreferences}
          />
          <SettingsItem
            icon="language-outline"
            title="Language"
            subtitle={getLanguageDisplayName(settingsState.appPreferences.language)}
            onPress={navigateToPreferences}
          />
          <SettingsItem
            icon="text-outline"
            title="Display"
            subtitle={`Font size: ${settingsState.appPreferences.fontSize}`}
            onPress={navigateToPreferences}
          />
        </Card>

        {/* Notifications */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingsItem
            icon="notifications-outline"
            title="Notification Settings"
            subtitle="Manage your notification preferences"
            onPress={navigateToNotificationSettings}
          />
          <SettingsItem
            icon="mail-outline"
            title="Email Notifications"
            subtitle={settingsState.appPreferences.notifications.emailNotifications ? 'Enabled' : 'Disabled'}
            onPress={navigateToNotificationSettings}
            rightElement={
              <View style={styles.toggleContainer}>
                <View style={[
                  styles.toggle,
                  settingsState.appPreferences.notifications.emailNotifications ? styles.toggleOn : styles.toggleOff
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    settingsState.appPreferences.notifications.emailNotifications ? styles.toggleThumbOn : styles.toggleThumbOff
                  ]} />
                </View>
              </View>
            }
            showArrow={false}
          />
        </Card>

        {/* Security & Privacy */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Security & Privacy</Text>
          <SettingsItem
            icon="shield-outline"
            title="Security Settings"
            subtitle="Password, 2FA, and security options"
            onPress={navigateToSecurity}
          />
          <SettingsItem
            icon="lock-closed-outline"
            title="Privacy Settings"
            subtitle="Control your data sharing preferences"
            onPress={navigateToPrivacy}
          />
          <SettingsItem
            icon="location-outline"
            title="Location Access"
            subtitle={settingsState.appPreferences.privacy.shareLocation ? 'Enabled' : 'Disabled'}
            onPress={navigateToPrivacy}
            rightElement={
              <View style={styles.toggleContainer}>
                <View style={[
                  styles.toggle,
                  settingsState.appPreferences.privacy.shareLocation ? styles.toggleOn : styles.toggleOff
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    settingsState.appPreferences.privacy.shareLocation ? styles.toggleThumbOn : styles.toggleThumbOff
                  ]} />
                </View>
              </View>
            }
            showArrow={false}
          />
        </Card>

        {/* Notifications */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notifications</Text>
            <SettingsItem
              icon="notifications-outline"
              title="Notification History"
              subtitle="View and manage your notifications"
              onPress={navigateToNotificationHistory}
              rightElement={<NotificationBadge size="small" />}
            />
            <SettingsItem
              icon="calendar-outline"
              title="Meeting Notifications"
              subtitle="Configure meeting reminders and preferences"
              onPress={navigateToMeetingNotifications}
            />
            <SettingsItem
              icon="stats-chart-outline"
              title="Notification Status"
              subtitle="View system status and test notifications"
              onPress={navigateToNotificationStatus}
            />
        </Card>

        {/* System Settings */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>System</Text>
          <SettingsItem
            icon="settings-outline"
            title="System Settings"
            subtitle="Storage, cache, and app management"
            onPress={navigateToSystemSettings}
          />
          <SettingsItem
            icon="information-circle-outline"
            title="About"
            subtitle={`Version ${settingsState.systemSettings.appVersion}`}
            onPress={navigateToAbout}
          />
          <SettingsItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="FAQ, contact, and troubleshooting"
            onPress={navigateToHelp}
          />
        </Card>

        {/* Account Actions */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingsItem
            icon="log-out-outline"
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            showArrow={false}
          />
        </Card>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>
            Sevak App v{settingsState.systemSettings.appVersion}
          </Text>
          <Text style={styles.appInfoText}>
            Built with ❤️ for the community
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleContainer: {
    marginRight: theme.spacing.sm,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: theme.colors.primary,
  },
  toggleOff: {
    backgroundColor: theme.colors.border,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.textWhite,
    shadowColor: theme.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  toggleThumbOff: {
    alignSelf: 'flex-start',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  appInfoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
});