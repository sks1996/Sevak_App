import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Task, TaskStatus, TaskPriority, TaskCategory } from '../../types/tasks';

interface TaskItemProps {
  task: Task;
  onPress: () => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onDelete?: (taskId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canClose?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onPress,
  onStatusChange,
  onDelete,
  canEdit = false,
  canDelete = false,
  canClose = false,
}) => {
  const getPriorityColor = (priority: TaskPriority) => {
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

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'in_progress':
        return theme.colors.info;
      case 'pending':
        return theme.colors.warning;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textMuted;
    }
  };

  const getCategoryIcon = (category: TaskCategory) => {
    switch (category) {
      case 'development':
        return 'code-outline';
      case 'design':
        return 'color-palette-outline';
      case 'testing':
        return 'checkmark-circle-outline';
      case 'documentation':
        return 'document-text-outline';
      case 'meeting':
        return 'people-outline';
      case 'other':
        return 'ellipse-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = task.dueDate && new Date() > task.dueDate && task.status !== 'completed';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={styles.badges}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
              <Text style={styles.priorityText}>{task.priority.toUpperCase()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
              <Text style={styles.statusText}>{task.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.actions}>
          {canEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onStatusChange?.(task.id, 'in_progress')}
            >
              <Ionicons name="play-outline" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          
          {canClose && task.status !== 'completed' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onStatusChange?.(task.id, 'completed')}
            >
              <Ionicons name="checkmark-outline" size={16} color={theme.colors.success} />
            </TouchableOpacity>
          )}
          
          {canDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onDelete?.(task.id)}
            >
              <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {task.description && (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.categoryContainer}>
          <Ionicons 
            name={getCategoryIcon(task.category)} 
            size={16} 
            color={theme.colors.textMuted} 
          />
          <Text style={styles.categoryText}>{task.category}</Text>
        </View>

        <View style={styles.dateContainer}>
          {task.dueDate && (
            <View style={styles.dueDateContainer}>
              <Ionicons 
                name="calendar-outline" 
                size={16} 
                color={isOverdue ? theme.colors.error : theme.colors.textMuted} 
              />
              <Text style={[
                styles.dueDateText,
                isOverdue && styles.overdueText
              ]}>
                {formatDate(task.dueDate)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {task.assignee && (
        <View style={styles.assigneeContainer}>
          <Ionicons name="person-outline" size={14} color={theme.colors.textMuted} />
          <Text style={styles.assigneeText}>{task.assignee}</Text>
        </View>
      )}

      {task.tags && task.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {task.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  titleContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
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
  statusBadge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
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
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  categoryText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    textTransform: 'capitalize',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dueDateText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  overdueText: {
    color: theme.colors.error,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  assigneeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  tag: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
});