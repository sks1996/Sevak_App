import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../../components/common/Header';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { theme } from '../../constants/theme';
import { ROLE_COLORS, USER_ROLES } from '../../constants';

export const ProfileScreen: React.FC = () => {
  const { authState, logout } = useAuth();
  const { user } = authState;

  if (!user) return null;

  const getRoleColor = (role: string) => ROLE_COLORS[role as keyof typeof ROLE_COLORS];

  const handleEditProfile = () => {
    console.log('Edit profile');
  };

  const handleChangePassword = () => {
    console.log('Change password');
  };

  const handleNotifications = () => {
    console.log('Notification settings');
  };

  const handleBackPress = () => {
    console.log('Go back');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Profile"
        showBackButton
        onBackPress={handleBackPress}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Card style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: getRoleColor(user.role) }]}>
              <Ionicons name="person" size={40} color={theme.colors.textWhite} />
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color={theme.colors.textWhite} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          
          <View style={styles.roleBadge}>
            <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
              {USER_ROLES[user.role]}
            </Text>
          </View>
          
          {user.department && (
            <Text style={styles.departmentText}>{user.department}</Text>
          )}
        </Card>

        {/* Profile Information */}
        <Card style={styles.infoCard}>
          <CardHeader title="Profile Information" />
          
          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.infoLabelText}>Full Name</Text>
            </View>
            <Text style={styles.infoValue}>{user.name}</Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.infoLabelText}>Email Address</Text>
            </View>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Ionicons name="shield-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.infoLabelText}>Role</Text>
            </View>
            <Text style={styles.infoValue}>{USER_ROLES[user.role]}</Text>
          </View>

          {user.department && (
            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="business-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.infoLabelText}>Department</Text>
              </View>
              <Text style={styles.infoValue}>{user.department}</Text>
            </View>
          )}

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.success} />
              <Text style={styles.infoLabelText}>Status</Text>
            </View>
            <Text style={[styles.infoValue, { color: theme.colors.success }]}>
              {user.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>

          {user.lastLogin && (
            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.infoLabelText}>Last Login</Text>
              </View>
              <Text style={styles.infoValue}>
                {new Date(user.lastLogin).toLocaleDateString()}
              </Text>
            </View>
          )}
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <CardHeader title="Account Settings" />
          
          <TouchableOpacity style={styles.actionItem} onPress={handleEditProfile}>
            <View style={styles.actionLeft}>
              <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.actionText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleChangePassword}>
            <View style={styles.actionLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.warning} />
              <Text style={styles.actionText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleNotifications}>
            <View style={styles.actionLeft}>
              <Ionicons name="notifications-outline" size={20} color={theme.colors.info} />
              <Text style={styles.actionText}>Notification Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Logout Button */}
        <Button
          title="Sign Out"
          onPress={logout}
          variant="outline"
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  roleBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.sm,
  },
  roleText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
  },
  departmentText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  infoCard: {
    marginBottom: theme.spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabelText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  actionsCard: {
    marginBottom: theme.spacing.lg,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  logoutButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
});
