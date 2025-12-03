export type MeetingStatus = 
  | 'scheduled' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'postponed';

export type MeetingType = 
  | 'team_meeting' 
  | 'one_on_one' 
  | 'project_review' 
  | 'client_meeting' 
  | 'training' 
  | 'standup' 
  | 'retrospective' 
  | 'planning' 
  | 'other';

export type MeetingPriority = 'low' | 'medium' | 'high' | 'urgent';

export type RecurrencePattern = 
  | 'none' 
  | 'daily' 
  | 'weekly' 
  | 'biweekly' 
  | 'monthly' 
  | 'quarterly';

export interface Meeting {
  id: string;
  title: string;
  description: string;
  type: MeetingType;
  status: MeetingStatus;
  priority: MeetingPriority;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  location: string;
  meetingRoom?: string;
  organizerId: string; // User ID
  attendees: MeetingAttendee[];
  agenda: MeetingAgendaItem[];
  meetingLink?: string; // For virtual meetings
  isVirtual: boolean;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: Date;
  parentMeetingId?: string; // For recurring meetings
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  completedAt?: Date;
  notes?: string;
  attachments: MeetingAttachment[];
  reminders: MeetingReminder[];
  tags: string[];
}

export interface MeetingAttendee {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: 'organizer' | 'required' | 'optional';
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
  responseTime?: Date;
  notes?: string;
}

export interface MeetingAgendaItem {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  presenter?: string;
  order: number;
  isCompleted: boolean;
  notes?: string;
}

export interface MeetingAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
  fileUrl: string;
}

export interface MeetingReminder {
  id: string;
  type: 'email' | 'push' | 'sms';
  timeBeforeMeeting: number; // in minutes
  isSent: boolean;
  sentAt?: Date;
}

export interface MeetingFilter {
  status?: MeetingStatus[];
  type?: MeetingType[];
  priority?: MeetingPriority[];
  organizerId?: string[];
  attendeeId?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  searchQuery?: string;
}

export interface MeetingStats {
  totalMeetings: number;
  upcomingMeetings: number;
  completedMeetings: number;
  cancelledMeetings: number;
  meetingsByType: Record<MeetingType, number>;
  meetingsByStatus: Record<MeetingStatus, number>;
  meetingsByPriority: Record<MeetingPriority, number>;
  averageMeetingDuration: number; // in minutes
  attendanceRate: number; // percentage
  mostActiveOrganizer: string;
  busiestDay: string;
  busiestTimeSlot: string;
}

export interface MeetingState {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  filter: MeetingFilter;
  stats: MeetingStats;
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
}

export interface MeetingContextType {
  meetingState: MeetingState;
  
  // Meeting CRUD Operations
  createMeeting: (meetingData: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMeeting: (meetingId: string, updates: Partial<Meeting>) => Promise<void>;
  deleteMeeting: (meetingId: string) => Promise<void>;
  duplicateMeeting: (meetingId: string) => Promise<void>;
  
  // Meeting Status Management
  updateMeetingStatus: (meetingId: string, status: MeetingStatus) => Promise<void>;
  startMeeting: (meetingId: string) => Promise<void>;
  endMeeting: (meetingId: string) => Promise<void>;
  cancelMeeting: (meetingId: string, reason?: string) => Promise<void>;
  
  // Attendee Management
  addAttendee: (meetingId: string, attendee: Omit<MeetingAttendee, 'id'>) => Promise<void>;
  removeAttendee: (meetingId: string, attendeeId: string) => Promise<void>;
  updateAttendeeStatus: (meetingId: string, attendeeId: string, status: MeetingAttendee['status']) => Promise<void>;
  
  // Agenda Management
  addAgendaItem: (meetingId: string, agendaItem: Omit<MeetingAgendaItem, 'id'>) => Promise<void>;
  updateAgendaItem: (meetingId: string, agendaItemId: string, updates: Partial<MeetingAgendaItem>) => Promise<void>;
  removeAgendaItem: (meetingId: string, agendaItemId: string) => Promise<void>;
  completeAgendaItem: (meetingId: string, agendaItemId: string) => Promise<void>;
  
  // Attachments
  addAttachment: (meetingId: string, file: any) => Promise<void>;
  removeAttachment: (attachmentId: string) => Promise<void>;
  
  // Reminders
  addReminder: (meetingId: string, reminder: Omit<MeetingReminder, 'id'>) => Promise<void>;
  removeReminder: (meetingId: string, reminderId: string) => Promise<void>;
  
  // Filtering and Search
  setFilter: (filter: Partial<MeetingFilter>) => void;
  clearFilter: () => void;
  searchMeetings: (query: string) => Meeting[];
  
  // Data Management
  loadMeetings: () => Promise<void>;
  refreshMeetings: () => Promise<void>;
  syncMeetings: () => Promise<void>;
  
  // Utility Functions
  getMeetingsByUser: (userId: string) => Meeting[];
  getMeetingsByStatus: (status: MeetingStatus) => Meeting[];
  getMeetingsByType: (type: MeetingType) => Meeting[];
  getUpcomingMeetings: (days: number) => Meeting[];
  getTodaysMeetings: () => Meeting[];
  getMeetingsByDateRange: (startDate: Date, endDate: Date) => Meeting[];
  calculateMeetingStats: () => MeetingStats;
  
  // Role-based Functions
  getMeetingsByRole: (userRole: string, userId: string) => Meeting[];
  canCreateMeeting: (userRole: string) => boolean;
  canEditMeeting: (userRole: string, meeting: Meeting) => boolean;
  canDeleteMeeting: (userRole: string) => boolean;
  canManageAttendees: (userRole: string, meeting: Meeting) => boolean;
}

// Default meeting filter
export const DEFAULT_MEETING_FILTER: MeetingFilter = {
  status: [],
  type: [],
  priority: [],
  organizerId: [],
  attendeeId: [],
  dateRange: undefined,
  tags: [],
  searchQuery: '',
};

// Meeting status configurations
export const MEETING_STATUS_CONFIG = {
  scheduled: {
    label: 'Scheduled',
    color: '#42A5F5',
    icon: 'calendar-outline',
    description: 'Meeting is scheduled and waiting to start',
  },
  in_progress: {
    label: 'In Progress',
    color: '#FFA726',
    icon: 'play-outline',
    description: 'Meeting is currently taking place',
  },
  completed: {
    label: 'Completed',
    color: '#66BB6A',
    icon: 'checkmark-circle-outline',
    description: 'Meeting has been completed',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#EF5350',
    icon: 'close-circle-outline',
    description: 'Meeting has been cancelled',
  },
  postponed: {
    label: 'Postponed',
    color: '#AB47BC',
    icon: 'pause-circle-outline',
    description: 'Meeting has been postponed',
  },
} as const;

// Meeting type configurations
export const MEETING_TYPE_CONFIG = {
  team_meeting: {
    label: 'Team Meeting',
    color: '#42A5F5',
    icon: 'people-outline',
  },
  one_on_one: {
    label: 'One-on-One',
    color: '#66BB6A',
    icon: 'person-outline',
  },
  project_review: {
    label: 'Project Review',
    color: '#FFA726',
    icon: 'document-outline',
  },
  client_meeting: {
    label: 'Client Meeting',
    color: '#AB47BC',
    icon: 'business-outline',
  },
  training: {
    label: 'Training',
    color: '#26A69A',
    icon: 'school-outline',
  },
  standup: {
    label: 'Standup',
    color: '#FF7043',
    icon: 'trending-up-outline',
  },
  retrospective: {
    label: 'Retrospective',
    color: '#78909C',
    icon: 'refresh-outline',
  },
  planning: {
    label: 'Planning',
    color: '#8D6E63',
    icon: 'list-outline',
  },
  other: {
    label: 'Other',
    color: '#90A4AE',
    icon: 'ellipsis-horizontal-outline',
  },
} as const;

// Meeting priority configurations
export const MEETING_PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    color: '#26A69A',
    icon: 'arrow-down-outline',
    description: 'Low priority meeting',
  },
  medium: {
    label: 'Medium',
    color: '#FFA726',
    icon: 'remove-outline',
    description: 'Medium priority meeting',
  },
  high: {
    label: 'High',
    color: '#FF7043',
    icon: 'arrow-up-outline',
    description: 'High priority meeting',
  },
  urgent: {
    label: 'Urgent',
    color: '#EF5350',
    icon: 'warning-outline',
    description: 'Urgent meeting requiring immediate attention',
  },
} as const;

// Helper functions
export const getMeetingStatusConfig = (status: MeetingStatus) => {
  return MEETING_STATUS_CONFIG[status];
};

export const getMeetingTypeConfig = (type: MeetingType) => {
  return MEETING_TYPE_CONFIG[type];
};

export const getMeetingPriorityConfig = (priority: MeetingPriority) => {
  return MEETING_PRIORITY_CONFIG[priority];
};

export const formatMeetingTime = (startTime: Date, endTime: Date): string => {
  const start = startTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  const end = endTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  return `${start} - ${end}`;
};

export const formatMeetingDate = (date: Date): string => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return `Past (${Math.abs(days)} days ago)`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `In ${days} days`;
  
  return date.toLocaleDateString();
};

export const isMeetingUpcoming = (meeting: Meeting): boolean => {
  const now = new Date();
  return meeting.startTime > now && meeting.status === 'scheduled';
};

export const isMeetingOverdue = (meeting: Meeting): boolean => {
  const now = new Date();
  return meeting.startTime < now && meeting.status === 'scheduled';
};

export const calculateMeetingDuration = (startTime: Date, endTime: Date): number => {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
};

export const getMeetingTimeSlot = (startTime: Date): string => {
  const hour = startTime.getHours();
  if (hour < 9) return 'Early Morning';
  if (hour < 12) return 'Morning';
  if (hour < 14) return 'Lunch Time';
  if (hour < 17) return 'Afternoon';
  if (hour < 19) return 'Evening';
  return 'Night';
};
