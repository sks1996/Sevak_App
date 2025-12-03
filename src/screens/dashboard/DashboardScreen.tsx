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
import { Card, CardHeader, StatCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { theme } from '../../constants/theme';
import { ROLE_PERMISSIONS } from '../../constants';

export const DashboardScreen: React.FC = () => {
  const { authState, logout } = useAuth();
  const { user } = authState;

  if (!user) return null;

  const permissions = ROLE_PERMISSIONS[user.role];

  const handleProfilePress = () => {
    // Navigate to profile screen
    console.log('Navigate to profile');
  };

  const handleActionPress = (action: string) => {
    console.log(`Navigate to ${action}`);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'sevak': return theme.colors.sevak;
      case 'hod': return theme.colors.hod;
      case 'admin': return theme.colors.admin;
      default: return theme.colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Dashboard"
        user={{
          name: user.name,
          role: user.role,
        }}
        onProfilePress={handleProfilePress}
        onLogoutPress={logout}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {/* Welcome Section */}
        <Card style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>
            Welcome back, {user.name}!
          </Text>
          <Text style={styles.roleText}>
            {user.role.toUpperCase()} • {user.department}
          </Text>
        </Card>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsRow}>
            <StatCard
              title="Total Attendance"
              value="89%"
              subtitle="This month"
              icon="📈"
              color={theme.colors.success}
            />
            <StatCard
              title="Present Today"
              value="45"
              subtitle="Sevaks"
              icon="✅"
              color={theme.colors.info}
            />
            <StatCard
              title="This Week"
              value="6/7"
              subtitle="Days"
              icon="📅"
              color={theme.colors.warning}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            {permissions.canSendMessages && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleActionPress('messages')}
              >
                <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Ionicons name="chatbubbles" size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.actionTitle}>Send Message</Text>
                <Text style={styles.actionSubtitle}>Announce to department</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleActionPress('reports')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.info + '20' }]}>
                <Ionicons name="analytics" size={24} color={theme.colors.info} />
              </View>
              <Text style={styles.actionTitle}>View Reports</Text>
              <Text style={styles.actionSubtitle}>Attendance analytics</Text>
            </TouchableOpacity>

            {permissions.canManageUsers && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleActionPress('users')}
              >
                <View style={[styles.actionIcon, { backgroundColor: theme.colors.success + '20' }]}>
                  <Ionicons name="people" size={24} color={theme.colors.success} />
                </View>
                <Text style={styles.actionTitle}>Manage Users</Text>
                <Text style={styles.actionSubtitle}>User permissions</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Recent Activity */}
        <Card style={styles.activityCard}>
          <CardHeader title="Recent Activity" />
          
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="notifications" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Weekly Satsang Schedule</Text>
              <Text style={styles.activitySubtitle}>Posted 2 hours ago by Admin</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="chatbubble" size={20} color={theme.colors.info} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Department Group</Text>
              <Text style={styles.activitySubtitle}>"Meeting tomorrow at 6 PM"</Text>
            </View>
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>3</Text>
            </View>
          </View>
        </Card>

        {/* Additional Content for Testing Scrolling */}
        <Card style={styles.testCard}>
          <Text style={styles.testTitle}>Additional Content</Text>
          <Text style={styles.testText}>This content is added to test scrolling functionality.</Text>
          <Text style={styles.testText}>Scroll down to see more content below.</Text>
        </Card>

        <Card style={styles.testCard}>
          <Text style={styles.testTitle}>More Test Content</Text>
          <Text style={styles.testText}>If you can see this content by scrolling, then scrolling is working correctly!</Text>
        </Card>

        <Card style={styles.testCard}>
          <Text style={styles.testTitle}>Final Test Card</Text>
          <Text style={styles.testText}>This is the last test card to ensure scrolling works properly.</Text>
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
  welcomeCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  welcomeText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  roleText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  statsContainer: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionsContainer: {
    marginBottom: theme.spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  actionSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  activityCard: {
    marginBottom: theme.spacing.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  activitySubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  unreadText: {
    color: theme.colors.textWhite,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  testCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  testTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  testText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
});
