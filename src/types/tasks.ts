export type TaskStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'on_hold';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskCategory = 
  | 'general' 
  | 'development' 
  | 'design' 
  | 'marketing' 
  | 'hr' 
  | 'finance' 
  | 'operations' 
  | 'maintenance';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  assignedTo: string; // User ID
  assignedBy: string; // User ID
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  subtasks: Task[];
  parentTaskId?: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  dependencies: string[]; // Task IDs this task depends on
  progress: number; // 0-100
}

export interface TaskAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
  fileUrl: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months/years
  daysOfWeek?: number[]; // For weekly: [0,1,2,3,4,5,6] (Sunday=0)
  dayOfMonth?: number; // For monthly: 1-31
  endDate?: Date;
  maxOccurrences?: number;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  category?: TaskCategory[];
  assignedTo?: string[];
  assignedBy?: string[];
  dueDateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  searchQuery?: string;
}

export interface TaskStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByPriority: Record<TaskPriority, number>;
  tasksByCategory: Record<TaskCategory, number>;
  tasksByStatus: Record<TaskStatus, number>;
  averageCompletionTime: number; // in hours
  completionRate: number; // percentage
}

export interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  filter: TaskFilter;
  stats: TaskStats;
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
}

export interface TaskContextType {
  taskState: TaskState;
  
  // Task CRUD Operations
  createTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  duplicateTask: (taskId: string) => Promise<void>;
  
  // Task Status Management
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  updateTaskProgress: (taskId: string, progress: number) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  closeTask: (taskId: string) => Promise<void>;
  
  // Task Assignment
  assignTask: (taskId: string, userId: string) => Promise<void>;
  reassignTask: (taskId: string, fromUserId: string, toUserId: string) => Promise<void>;
  
  // Comments and Attachments
  addComment: (taskId: string, content: string) => Promise<void>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  addAttachment: (taskId: string, file: any) => Promise<void>;
  removeAttachment: (attachmentId: string) => Promise<void>;
  
  // Subtasks
  addSubtask: (parentTaskId: string, subtaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) => Promise<void>;
  removeSubtask: (subtaskId: string) => Promise<void>;
  
  // Filtering and Search
  setFilter: (filter: Partial<TaskFilter>) => void;
  clearFilter: () => void;
  searchTasks: (query: string) => Task[];
  
  // Data Management
  loadTasks: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  syncTasks: () => Promise<void>;
  
  // Utility Functions
  getTasksByUser: (userId: string) => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByPriority: (priority: TaskPriority) => Task[];
  getOverdueTasks: () => Task[];
  getUpcomingTasks: (days: number) => Task[];
  calculateTaskStats: () => TaskStats;
  
  // Role-based Functions
  getTasksByRole: (userRole: string, userId: string) => Task[];
  canCloseTask: (userRole: string) => boolean;
  canAssignTask: (userRole: string) => boolean;
  canDeleteTask: (userRole: string) => boolean;
  canEditTask: (userRole: string, task: Task) => boolean;
}

// Default task filter
export const DEFAULT_TASK_FILTER: TaskFilter = {
  status: [],
  priority: [],
  category: [],
  assignedTo: [],
  assignedBy: [],
  dueDateRange: undefined,
  tags: [],
  searchQuery: '',
};

// Task status configurations
export const TASK_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: '#FFA726',
    icon: 'time-outline',
    description: 'Task is waiting to be started',
  },
  in_progress: {
    label: 'In Progress',
    color: '#42A5F5',
    icon: 'play-outline',
    description: 'Task is currently being worked on',
  },
  completed: {
    label: 'Completed',
    color: '#66BB6A',
    icon: 'checkmark-circle-outline',
    description: 'Task has been completed',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#EF5350',
    icon: 'close-circle-outline',
    description: 'Task has been cancelled',
  },
  on_hold: {
    label: 'On Hold',
    color: '#AB47BC',
    icon: 'pause-circle-outline',
    description: 'Task is temporarily paused',
  },
} as const;

// Task priority configurations
export const TASK_PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    color: '#26A69A',
    icon: 'arrow-down-outline',
    description: 'Low priority task',
  },
  medium: {
    label: 'Medium',
    color: '#FFA726',
    icon: 'remove-outline',
    description: 'Medium priority task',
  },
  high: {
    label: 'High',
    color: '#FF7043',
    icon: 'arrow-up-outline',
    description: 'High priority task',
  },
  urgent: {
    label: 'Urgent',
    color: '#EF5350',
    icon: 'warning-outline',
    description: 'Urgent task requiring immediate attention',
  },
} as const;

// Task category configurations
export const TASK_CATEGORY_CONFIG = {
  general: {
    label: 'General',
    color: '#78909C',
    icon: 'folder-outline',
  },
  development: {
    label: 'Development',
    color: '#42A5F5',
    icon: 'code-outline',
  },
  design: {
    label: 'Design',
    color: '#AB47BC',
    icon: 'color-palette-outline',
  },
  marketing: {
    label: 'Marketing',
    color: '#66BB6A',
    icon: 'megaphone-outline',
  },
  hr: {
    label: 'Human Resources',
    color: '#FFA726',
    icon: 'people-outline',
  },
  finance: {
    label: 'Finance',
    color: '#26A69A',
    icon: 'cash-outline',
  },
  operations: {
    label: 'Operations',
    color: '#FF7043',
    icon: 'settings-outline',
  },
  maintenance: {
    label: 'Maintenance',
    color: '#78909C',
    icon: 'construct-outline',
  },
} as const;

// Helper functions
export const getTaskStatusConfig = (status: TaskStatus) => {
  return TASK_STATUS_CONFIG[status];
};

export const getTaskPriorityConfig = (priority: TaskPriority) => {
  return TASK_PRIORITY_CONFIG[priority];
};

export const getTaskCategoryConfig = (category: TaskCategory) => {
  return TASK_CATEGORY_CONFIG[category];
};

export const formatTaskDueDate = (dueDate: Date): string => {
  const now = new Date();
  const diff = dueDate.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `Due in ${days} days`;
  
  return dueDate.toLocaleDateString();
};

export const isTaskOverdue = (task: Task): boolean => {
  return task.status !== 'completed' && task.dueDate < new Date();
};

export const calculateTaskProgress = (task: Task): number => {
  if (task.status === 'completed') return 100;
  if (task.subtasks.length === 0) return task.progress;
  
  const completedSubtasks = task.subtasks.filter(subtask => subtask.status === 'completed').length;
  return Math.round((completedSubtasks / task.subtasks.length) * 100);
};
