import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import { Button } from '../../components/common/Button';
import { TaskItem } from '../../components/tasks/TaskItem';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../contexts/TaskContext';
import { Task, TaskStatus, TaskPriority, TaskCategory } from '../../types/tasks';

export const TaskDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { authState, logout } = useAuth();
  const { 
    taskState, 
    setFilter, 
    clearFilter, 
    refreshTasks,
    getTasksByUser,
    getOverdueTasks,
    getUpcomingTasks,
    getTasksByRole,
    canAssignTask,
    canDeleteTask,
    canCloseTask,
  } = useTasks();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'my' | 'overdue' | 'upcoming'>('all');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTasks();
    setIsRefreshing(false);
  };

  const handleCreateTask = () => {
    navigation.navigate('CreateTask' as never);
  };

  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetails' as never, { taskId: task.id });
  };

  const getFilteredTasks = () => {
    const userRole = authState.user?.role || 'user';
    const userId = authState.user?.id || '';
    
    // Get tasks based on user role
    const roleBasedTasks = getTasksByRole(userRole, userId);
    
    switch (activeFilter) {
      case 'my':
        return getTasksByUser(userId);
      case 'overdue':
        return getOverdueTasks().filter(task => 
          userRole === 'admin' || userRole === 'hod' || task.assignedTo === userId
        );
      case 'upcoming':
        return getUpcomingTasks(7).filter(task => 
          userRole === 'admin' || userRole === 'hod' || task.assignedTo === userId
        );
      default:
        return roleBasedTasks;
    }
  };

  const renderFilterButton = (
    label: string,
    value: 'all' | 'my' | 'overdue' | 'upcoming',
    icon: string,
    count?: number
  ) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === value && styles.filterButtonActive,
      ]}
      onPress={() => setActiveFilter(value)}
    >
      <Ionicons 
        name={icon as any} 
        size={16} 
        color={activeFilter === value ? theme.colors.textWhite : theme.colors.primary} 
      />
      <Text style={[
        styles.filterButtonText,
        activeFilter === value && styles.filterButtonTextActive,
      ]}>
        {label}
        {count !== undefined && ` (${count})`}
      </Text>
    </TouchableOpacity>
  );

  const renderTask = ({ item }: { item: Task }) => {
    const userRole = authState.user?.role || 'user';
    const canAssign = canAssignTask(userRole);
    const canDelete = canDeleteTask(userRole);
    const canClose = canCloseTask(userRole);
    
    return (
      <TaskItem
        task={item}
        onPress={() => handleTaskPress(item)}
        onEdit={() => navigation.navigate('EditTask' as never, { taskId: item.id })}
        onAssign={canAssign ? () => navigation.navigate('AssignTask' as never, { taskId: item.id }) : undefined}
        onDelete={canDelete ? () => navigation.navigate('DeleteTask' as never, { taskId: item.id }) : undefined}
        showAssignButton={canAssign}
        showDeleteButton={canDelete}
        showCloseButton={canClose}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="checkmark-circle-outline" size={64} color={theme.colors.textMuted} />
      <Text style={styles.emptyTitle}>No Tasks Found</Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === 'my' 
          ? "You don't have any assigned tasks yet."
          : activeFilter === 'overdue'
          ? "Great! No overdue tasks."
          : activeFilter === 'upcoming'
          ? "No upcoming tasks in the next 7 days."
          : "No tasks available. Create your first task to get started."
        }
      </Text>
      <Button
        title="Create Task"
        onPress={handleCreateTask}
        style={styles.emptyButton}
        leftIcon="add-outline"
      />
    </View>
  );

  const filteredTasks = getFilteredTasks();
  const myTasksCount = getTasksByUser(authState.user?.id || '').length;
  const overdueCount = getOverdueTasks().length;
  const upcomingCount = getUpcomingTasks(7).length;

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Tasks"
        user={authState.user ? {
          name: authState.user.name,
          role: authState.user.role,
        } : undefined}
        onLogoutPress={logout}
        rightButton={{
          icon: 'add-outline',
          onPress: handleCreateTask,
        }}
      />
      
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{taskState.stats.totalTasks}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {taskState.stats.inProgressTasks}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>
            {taskState.stats.completedTasks}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: theme.colors.error }]}>
            {taskState.stats.overdueTasks}
          </Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </Card>
      </View>

      {/* Filter Buttons */}
      <Card style={styles.filterCard}>
        <View style={styles.filterRow}>
          {renderFilterButton('All', 'all', 'list-outline', taskState.stats.totalTasks)}
          {renderFilterButton('My Tasks', 'my', 'person-outline', myTasksCount)}
          {renderFilterButton('Overdue', 'overdue', 'warning-outline', overdueCount)}
          {renderFilterButton('Upcoming', 'upcoming', 'calendar-outline', upcomingCount)}
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Button
          title="Create Task"
          onPress={handleCreateTask}
          style={styles.actionButton}
          leftIcon="add-outline"
        />
        <Button
          title="Filter Tasks"
          variant="outline"
          onPress={() => navigation.navigate('TaskFilters' as never)}
          style={styles.actionButton}
          leftIcon="filter-outline"
        />
      </View>

      {/* Tasks List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  filterCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: theme.colors.textWhite,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxxl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: theme.spacing.lg,
  },
});
