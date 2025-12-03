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
import { Header } from '../../components/common/Header';
import { Card, StatCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { AdminUser, Department } from '../../types/admin';

export const AdminDashboardScreen: React.FC = () => {
  const { authState, logout } = useAuth();
  const { adminState, refreshAdminData } = useAdmin();
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshAdminData();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatsCards = () => {
    const { stats } = adminState;
    
    const statsData = [
      {
        title: 'Total Users',
        value: stats.totalUsers.toString(),
        icon: 'people-outline',
        color: theme.colors.primary,
        subtitle: `${stats.activeUsers} active`,
      },
      {
        title: 'Departments',
        value: stats.totalDepartments.toString(),
        icon: 'business-outline',
        color: theme.colors.info,
        subtitle: 'Organized teams',
      },
      {
        title: 'Sevaks',
        value: stats.usersByRole.sevak.toString(),
        icon: 'person-outline',
        color: theme.colors.success,
        subtitle: 'Field workers',
      },
      {
        title: 'HODs',
        value: stats.usersByRole.hod.toString(),
        icon: 'shield-outline',
        color: theme.colors.warning,
        subtitle: 'Department heads',
      },
    ];

    return (
      <View style={styles.statsContainer}>
        {statsData.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </View>
    );
  };

  const renderQuickActions = () => (
    <Card style={styles.quickActionsCard}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="person-add-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.actionText}>Add User</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="business-outline" size={24} color={theme.colors.info} />
          <Text style={styles.actionText}>Create Department</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.secondary} />
          <Text style={styles.actionText}>System Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="analytics-outline" size={24} color={theme.colors.success} />
          <Text style={styles.actionText}>View Reports</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderRecentActivity = () => (
    <Card style={styles.activityCard}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <ScrollView style={styles.activityList} showsVerticalScrollIndicator={false}>
        {adminState.stats.recentActivity.slice(0, 5).map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons 
                name={getActivityIcon(activity.type)} 
                size={16} 
                color={theme.colors.primary} 
              />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityDescription}>{activity.description}</Text>
              <Text style={styles.activityTime}>
                {formatTimeAgo(activity.timestamp)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </Card>
  );

  const renderUserOverview = () => {
    const recentUsers = adminState.users.slice(0, 3);
    
    return (
      <Card style={styles.userOverviewCard}>
        <Text style={styles.sectionTitle}>Recent Users</Text>
        {recentUsers.map((user) => (
          <View key={user.id} style={styles.userItem}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={20} color={theme.colors.textWhite} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>{user.role.toUpperCase()}</Text>
            </View>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: user.isActive ? theme.colors.success : theme.colors.error }
            ]} />
          </View>
        ))}
      </Card>
    );
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_created':
        return 'person-add';
      case 'user_updated':
        return 'person';
      case 'user_deleted':
        return 'person-remove';
      case 'role_changed':
        return 'shield';
      case 'department_created':
        return 'business';
      default:
        return 'ellipse';
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (adminState.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Admin Dashboard" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading admin data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Admin Dashboard" 
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
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {renderStatsCards()}
        {renderQuickActions()}
        {renderUserOverview()}
        {renderRecentActivity()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  quickActionsCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  actionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  userOverviewCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  userRole: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  activityCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  activityList: {
    maxHeight: 200,
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
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  activityTime: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
});
