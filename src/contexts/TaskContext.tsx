import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import {
  Task,
  TaskFilter,
  TaskStats,
  TaskState,
  TaskContextType,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  TaskComment,
  TaskAttachment,
  DEFAULT_TASK_FILTER,
  calculateTaskProgress,
  isTaskOverdue,
} from '../types/tasks';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { MOCK_USERS } from '../constants';

// Mock tasks for demonstration
const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Complete monthly report',
    description: 'Prepare and submit the monthly attendance report for all departments',
    status: 'in_progress',
    priority: 'high',
    category: 'operations',
    assignedTo: '1',
    assignedBy: '2',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    estimatedHours: 8,
    actualHours: 3,
    tags: ['report', 'monthly', 'attendance'],
    attachments: [],
    comments: [
      {
        id: 'c1',
        taskId: '1',
        userId: '1',
        userName: 'John Doe',
        content: 'Started working on the report. Will need data from HR department.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isEdited: false,
      },
    ],
    subtasks: [],
    isRecurring: false,
    dependencies: [],
    progress: 30,
  },
  {
    id: '2',
    title: 'Update user documentation',
    description: 'Update the user manual with new features and improvements',
    status: 'pending',
    priority: 'medium',
    category: 'development',
    assignedTo: '1',
    assignedBy: '3',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    estimatedHours: 4,
    tags: ['documentation', 'user-manual'],
    attachments: [],
    comments: [],
    subtasks: [],
    isRecurring: false,
    dependencies: ['1'],
    progress: 0,
  },
  {
    id: '3',
    title: 'Organize team meeting',
    description: 'Schedule and organize the weekly team meeting',
    status: 'completed',
    priority: 'medium',
    category: 'general',
    assignedTo: '2',
    assignedBy: '3',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    estimatedHours: 2,
    actualHours: 2,
    tags: ['meeting', 'team'],
    attachments: [],
    comments: [
      {
        id: 'c2',
        taskId: '3',
        userId: '2',
        userName: 'Jane Smith',
        content: 'Meeting completed successfully. All team members attended.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isEdited: false,
      },
    ],
    subtasks: [],
    isRecurring: true,
    dependencies: [],
    progress: 100,
  },
  {
    id: '4',
    title: 'Review budget proposal',
    description: 'Review and provide feedback on the Q2 budget proposal',
    status: 'pending',
    priority: 'urgent',
    category: 'finance',
    assignedTo: '3',
    assignedBy: '3',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    estimatedHours: 6,
    tags: ['budget', 'finance', 'review'],
    attachments: [],
    comments: [],
    subtasks: [],
    isRecurring: false,
    dependencies: [],
    progress: 0,
  },
];

const initialState: TaskState = {
  tasks: MOCK_TASKS,
  currentTask: null,
  filter: DEFAULT_TASK_FILTER,
  stats: {
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    tasksByPriority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    },
    tasksByCategory: {
      general: 0,
      development: 0,
      design: 0,
      marketing: 0,
      hr: 0,
      finance: 0,
      operations: 0,
      maintenance: 0,
    },
    tasksByStatus: {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      on_hold: 0,
    },
    averageCompletionTime: 0,
    completionRate: 0,
  },
  isLoading: true,
  error: null,
  lastSyncTime: null,
};

type TaskAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_CURRENT_TASK'; payload: Task | null }
  | { type: 'SET_FILTER'; payload: Partial<TaskFilter> }
  | { type: 'CLEAR_FILTER' }
  | { type: 'SET_STATS'; payload: TaskStats }
  | { type: 'SET_LAST_SYNC'; payload: Date };

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates, updatedAt: new Date() }
            : task
        ),
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    
    case 'SET_CURRENT_TASK':
      return { ...state, currentTask: action.payload };
    
    case 'SET_FILTER':
      return { ...state, filter: { ...state.filter, ...action.payload } };
    
    case 'CLEAR_FILTER':
      return { ...state, filter: DEFAULT_TASK_FILTER };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    
    case 'SET_LAST_SYNC':
      return { ...state, lastSyncTime: action.payload };
    
    default:
      return state;
  }
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [taskState, dispatch] = useReducer(taskReducer, initialState);
  const { authState } = useAuth();
  const { createTaskNotification } = useNotifications();

  useEffect(() => {
    if (authState.user) {
      loadTasks();
    }
  }, [authState.user]);

  // Calculate stats whenever tasks change
  useEffect(() => {
    calculateStats();
  }, [taskState.tasks]);

  const calculateStats = () => {
    const tasks = taskState.tasks;
    const stats: TaskStats = {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      overdueTasks: tasks.filter(t => isTaskOverdue(t)).length,
      tasksByPriority: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
        urgent: tasks.filter(t => t.priority === 'urgent').length,
      },
      tasksByCategory: {
        general: tasks.filter(t => t.category === 'general').length,
        development: tasks.filter(t => t.category === 'development').length,
        design: tasks.filter(t => t.category === 'design').length,
        marketing: tasks.filter(t => t.category === 'marketing').length,
        hr: tasks.filter(t => t.category === 'hr').length,
        finance: tasks.filter(t => t.category === 'finance').length,
        operations: tasks.filter(t => t.category === 'operations').length,
        maintenance: tasks.filter(t => t.category === 'maintenance').length,
      },
      tasksByStatus: {
        pending: tasks.filter(t => t.status === 'pending').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        cancelled: tasks.filter(t => t.status === 'cancelled').length,
        on_hold: tasks.filter(t => t.status === 'on_hold').length,
      },
      averageCompletionTime: calculateAverageCompletionTime(tasks),
      completionRate: tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0,
    };
    dispatch({ type: 'SET_STATS', payload: stats });
  };

  const calculateAverageCompletionTime = (tasks: Task[]): number => {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.actualHours);
    if (completedTasks.length === 0) return 0;
    
    const totalHours = completedTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
    return totalHours / completedTasks.length;
  };

  const loadTasks = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Load tasks from AsyncStorage
      const storedTasks = await AsyncStorage.getItem('tasks');
      
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks).map((t: any) => ({
          ...t,
          dueDate: new Date(t.dueDate),
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
          comments: t.comments.map((c: any) => ({
            ...c,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
          })),
        }));
        dispatch({ type: 'SET_TASKS', payload: tasks });
      }
      
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load tasks' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveTasks = async () => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(taskState.tasks));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) => {
    try {
      const task: Task = {
        ...taskData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        progress: 0,
      };

      dispatch({ type: 'ADD_TASK', payload: task });
      await saveTasks();

      // Create notification for assigned user
      const assignedUser = MOCK_USERS.find(u => u.id === task.assignedTo);
      if (assignedUser) {
        await createTaskNotification(task.title, task.id, task.priority);
      }

      Alert.alert('Success', 'Task created successfully');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create task' });
      Alert.alert('Error', 'Failed to create task');
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates } });
      await saveTasks();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update task' });
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      dispatch({ type: 'DELETE_TASK', payload: taskId });
      await saveTasks();
      Alert.alert('Success', 'Task deleted successfully');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete task' });
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  const duplicateTask = async (taskId: string) => {
    try {
      const originalTask = taskState.tasks.find(t => t.id === taskId);
      if (!originalTask) return;

      const duplicatedTask: Task = {
        ...originalTask,
        id: Date.now().toString(),
        title: `${originalTask.title} (Copy)`,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: undefined,
        progress: 0,
        comments: [],
        attachments: [],
      };

      dispatch({ type: 'ADD_TASK', payload: duplicatedTask });
      await saveTasks();
      Alert.alert('Success', 'Task duplicated successfully');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to duplicate task' });
      Alert.alert('Error', 'Failed to duplicate task');
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      const updates: Partial<Task> = { status };
      if (status === 'completed') {
        updates.completedAt = new Date();
        updates.progress = 100;
      }
      
      dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates } });
      await saveTasks();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update task status' });
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const updateTaskProgress = async (taskId: string, progress: number) => {
    try {
      dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates: { progress } } });
      await saveTasks();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update task progress' });
      Alert.alert('Error', 'Failed to update task progress');
    }
  };

  const completeTask = async (taskId: string) => {
    await updateTaskStatus(taskId, 'completed');
  };

  const closeTask = async (taskId: string) => {
    await updateTaskStatus(taskId, 'cancelled');
  };

  const assignTask = async (taskId: string, userId: string) => {
    try {
      dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates: { assignedTo: userId } } });
      await saveTasks();
      
      // Create notification for assigned user
      const task = taskState.tasks.find(t => t.id === taskId);
      if (task) {
        await createTaskNotification(task.title, taskId, task.priority);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to assign task' });
      Alert.alert('Error', 'Failed to assign task');
    }
  };

  const reassignTask = async (taskId: string, fromUserId: string, toUserId: string) => {
    await assignTask(taskId, toUserId);
  };

  const addComment = async (taskId: string, content: string) => {
    try {
      const comment: TaskComment = {
        id: Date.now().toString(),
        taskId,
        userId: authState.user?.id || '',
        userName: authState.user?.name || '',
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEdited: false,
      };

      const task = taskState.tasks.find(t => t.id === taskId);
      if (task) {
        const updatedTask = {
          ...task,
          comments: [...task.comments, comment],
        };
        dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates: updatedTask } });
        await saveTasks();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add comment' });
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const updateComment = async (commentId: string, content: string) => {
    try {
      const task = taskState.tasks.find(t => t.comments.some(c => c.id === commentId));
      if (task) {
        const updatedComments = task.comments.map(comment =>
          comment.id === commentId
            ? { ...comment, content, updatedAt: new Date(), isEdited: true }
            : comment
        );
        dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { comments: updatedComments } } });
        await saveTasks();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update comment' });
      Alert.alert('Error', 'Failed to update comment');
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const task = taskState.tasks.find(t => t.comments.some(c => c.id === commentId));
      if (task) {
        const updatedComments = task.comments.filter(comment => comment.id !== commentId);
        dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { comments: updatedComments } } });
        await saveTasks();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete comment' });
      Alert.alert('Error', 'Failed to delete comment');
    }
  };

  const addAttachment = async (taskId: string, file: any) => {
    try {
      const attachment: TaskAttachment = {
        id: Date.now().toString(),
        fileName: file.name || 'attachment',
        fileSize: file.size || 0,
        fileType: file.type || 'unknown',
        uploadedBy: authState.user?.id || '',
        uploadedAt: new Date(),
        fileUrl: file.uri || '',
      };

      const task = taskState.tasks.find(t => t.id === taskId);
      if (task) {
        const updatedTask = {
          ...task,
          attachments: [...task.attachments, attachment],
        };
        dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates: updatedTask } });
        await saveTasks();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add attachment' });
      Alert.alert('Error', 'Failed to add attachment');
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    try {
      const task = taskState.tasks.find(t => t.attachments.some(a => a.id === attachmentId));
      if (task) {
        const updatedAttachments = task.attachments.filter(attachment => attachment.id !== attachmentId);
        dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { attachments: updatedAttachments } } });
        await saveTasks();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove attachment' });
      Alert.alert('Error', 'Failed to remove attachment');
    }
  };

  const addSubtask = async (parentTaskId: string, subtaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) => {
    try {
      const subtask: Task = {
        ...subtaskData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        progress: 0,
        parentTaskId,
      };

      const parentTask = taskState.tasks.find(t => t.id === parentTaskId);
      if (parentTask) {
        const updatedTask = {
          ...parentTask,
          subtasks: [...parentTask.subtasks, subtask],
        };
        dispatch({ type: 'UPDATE_TASK', payload: { id: parentTaskId, updates: updatedTask } });
        await saveTasks();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add subtask' });
      Alert.alert('Error', 'Failed to add subtask');
    }
  };

  const removeSubtask = async (subtaskId: string) => {
    try {
      const parentTask = taskState.tasks.find(t => t.subtasks.some(s => s.id === subtaskId));
      if (parentTask) {
        const updatedSubtasks = parentTask.subtasks.filter(subtask => subtask.id !== subtaskId);
        dispatch({ type: 'UPDATE_TASK', payload: { id: parentTask.id, updates: { subtasks: updatedSubtasks } } });
        await saveTasks();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove subtask' });
      Alert.alert('Error', 'Failed to remove subtask');
    }
  };

  const setFilter = (filter: Partial<TaskFilter>) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  };

  const clearFilter = () => {
    dispatch({ type: 'CLEAR_FILTER' });
  };

  const searchTasks = (query: string): Task[] => {
    if (!query.trim()) return taskState.tasks;
    
    return taskState.tasks.filter(task =>
      task.title.toLowerCase().includes(query.toLowerCase()) ||
      task.description.toLowerCase().includes(query.toLowerCase()) ||
      task.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const refreshTasks = async () => {
    await loadTasks();
  };

  const syncTasks = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Simulate server sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sync tasks' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Utility Functions
  const getTasksByUser = (userId: string): Task[] => {
    return taskState.tasks.filter(task => task.assignedTo === userId);
  };

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return taskState.tasks.filter(task => task.status === status);
  };

  const getTasksByPriority = (priority: TaskPriority): Task[] => {
    return taskState.tasks.filter(task => task.priority === priority);
  };

  const getOverdueTasks = (): Task[] => {
    return taskState.tasks.filter(task => isTaskOverdue(task));
  };

  const getUpcomingTasks = (days: number): Task[] => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return taskState.tasks.filter(task =>
      task.dueDate <= futureDate &&
      task.status !== 'completed' &&
      task.status !== 'cancelled'
    );
  };

  // Role-based Functions
  const getTasksByRole = (userRole: string, userId: string): Task[] => {
    // Admin and HoD can see all tasks
    if (userRole === 'admin' || userRole === 'hod') {
      return taskState.tasks;
    }
    // Regular users can only see their own tasks
    return taskState.tasks.filter(task => task.assignedTo === userId);
  };

  const canCloseTask = (userRole: string): boolean => {
    return userRole === 'admin' || userRole === 'hod';
  };

  const canAssignTask = (userRole: string): boolean => {
    return userRole === 'admin' || userRole === 'hod';
  };

  const canDeleteTask = (userRole: string): boolean => {
    return userRole === 'admin' || userRole === 'hod';
  };

  const canEditTask = (userRole: string, task: Task): boolean => {
    // Admin and HoD can edit any task
    if (userRole === 'admin' || userRole === 'hod') {
      return true;
    }
    // Regular users can only edit their own tasks
    return task.assignedTo === authState.user?.id;
  };

  const value: TaskContextType = {
    taskState,
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    updateTaskStatus,
    updateTaskProgress,
    completeTask,
    closeTask,
    assignTask,
    reassignTask,
    addComment,
    updateComment,
    deleteComment,
    addAttachment,
    removeAttachment,
    addSubtask,
    removeSubtask,
    setFilter,
    clearFilter,
    searchTasks,
    loadTasks,
    refreshTasks,
    syncTasks,
    getTasksByUser,
    getTasksByStatus,
    getTasksByPriority,
    getOverdueTasks,
    getUpcomingTasks,
    calculateTaskStats: calculateStats,
    // Role-based functions
    getTasksByRole,
    canCloseTask,
    canAssignTask,
    canDeleteTask,
    canEditTask,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
