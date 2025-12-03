import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import {
  Meeting,
  MeetingFilter,
  MeetingStats,
  MeetingState,
  MeetingContextType,
  MeetingStatus,
  MeetingType,
  MeetingPriority,
  MeetingAttendee,
  MeetingAgendaItem,
  MeetingAttachment,
  MeetingReminder,
  DEFAULT_MEETING_FILTER,
  calculateMeetingDuration,
  isMeetingUpcoming,
  isMeetingOverdue,
} from '../types/meetings';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { MOCK_USERS } from '../constants';
import MeetingNotificationService from '../services/MeetingNotificationService';
import { HybridNotificationManager } from '../services/HybridNotificationManager';
import { HybridNotification, NotificationType, NotificationPriority } from '../types/hybridNotifications';

// Mock meetings for demonstration
const MOCK_MEETINGS: Meeting[] = [
  {
    id: '1',
    title: 'Weekly Team Standup',
    description: 'Daily standup meeting to discuss progress and blockers',
    type: 'standup',
    status: 'scheduled',
    priority: 'medium',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000), // 2.5 hours from now
    duration: 30,
    location: 'Conference Room A',
    organizerId: '1',
    attendees: [
      {
        id: 'a1',
        userId: '1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        role: 'organizer',
        status: 'accepted',
        responseTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        id: 'a2',
        userId: '2',
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        role: 'required',
        status: 'accepted',
        responseTime: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        id: 'a3',
        userId: '3',
        userName: 'Mike Johnson',
        userEmail: 'mike@example.com',
        role: 'required',
        status: 'pending',
      },
    ],
    agenda: [
      {
        id: 'ag1',
        title: 'Project Updates',
        description: 'Each team member shares their progress',
        duration: 15,
        presenter: 'John Doe',
        order: 1,
        isCompleted: false,
      },
      {
        id: 'ag2',
        title: 'Blockers Discussion',
        description: 'Discuss any blockers or issues',
        duration: 10,
        order: 2,
        isCompleted: false,
      },
      {
        id: 'ag3',
        title: 'Next Steps',
        description: 'Plan for the next day',
        duration: 5,
        order: 3,
        isCompleted: false,
      },
    ],
    isVirtual: false,
    isRecurring: true,
    recurrencePattern: 'weekly',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    attachments: [],
    reminders: [
      {
        id: 'r1',
        type: 'email',
        timeBeforeMeeting: 15,
        isSent: false,
      },
      {
        id: 'r2',
        type: 'push',
        timeBeforeMeeting: 5,
        isSent: false,
      },
    ],
    tags: ['standup', 'team', 'daily'],
  },
  {
    id: '2',
    title: 'Project Review Meeting',
    description: 'Monthly project review and planning session',
    type: 'project_review',
    status: 'scheduled',
    priority: 'high',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endTime: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
    duration: 60,
    location: 'Virtual Meeting',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    organizerId: '2',
    attendees: [
      {
        id: 'a4',
        userId: '2',
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        role: 'organizer',
        status: 'accepted',
        responseTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: 'a5',
        userId: '1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        role: 'required',
        status: 'accepted',
        responseTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        id: 'a6',
        userId: '3',
        userName: 'Mike Johnson',
        userEmail: 'mike@example.com',
        role: 'required',
        status: 'tentative',
        responseTime: new Date(Date.now() - 30 * 60 * 1000),
      },
    ],
    agenda: [
      {
        id: 'ag4',
        title: 'Project Status Review',
        description: 'Review current project status and milestones',
        duration: 20,
        presenter: 'Jane Smith',
        order: 1,
        isCompleted: false,
      },
      {
        id: 'ag5',
        title: 'Budget Analysis',
        description: 'Review budget utilization and forecasts',
        duration: 15,
        presenter: 'Mike Johnson',
        order: 2,
        isCompleted: false,
      },
      {
        id: 'ag6',
        title: 'Next Month Planning',
        description: 'Plan activities for the next month',
        duration: 25,
        presenter: 'John Doe',
        order: 3,
        isCompleted: false,
      },
    ],
    isVirtual: true,
    isRecurring: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    attachments: [],
    reminders: [
      {
        id: 'r3',
        type: 'email',
        timeBeforeMeeting: 60,
        isSent: true,
        sentAt: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        id: 'r4',
        type: 'push',
        timeBeforeMeeting: 15,
        isSent: false,
      },
    ],
    tags: ['project', 'review', 'planning'],
  },
  {
    id: '3',
    title: 'Client Presentation',
    description: 'Present project progress to client',
    type: 'client_meeting',
    status: 'completed',
    priority: 'urgent',
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 2 days ago + 45 min
    duration: 45,
    location: 'Client Office',
    organizerId: '3',
    attendees: [
      {
        id: 'a7',
        userId: '3',
        userName: 'Mike Johnson',
        userEmail: 'mike@example.com',
        role: 'organizer',
        status: 'accepted',
        responseTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'a8',
        userId: '1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        role: 'required',
        status: 'accepted',
        responseTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
    agenda: [
      {
        id: 'ag7',
        title: 'Project Overview',
        description: 'Present project overview and current status',
        duration: 20,
        presenter: 'Mike Johnson',
        order: 1,
        isCompleted: true,
      },
      {
        id: 'ag8',
        title: 'Demo Session',
        description: 'Demonstrate key features and functionality',
        duration: 20,
        presenter: 'John Doe',
        order: 2,
        isCompleted: true,
      },
      {
        id: 'ag9',
        title: 'Q&A Session',
        description: 'Answer client questions and concerns',
        duration: 5,
        order: 3,
        isCompleted: true,
      },
    ],
    isVirtual: false,
    isRecurring: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    attachments: [],
    reminders: [
      {
        id: 'r5',
        type: 'email',
        timeBeforeMeeting: 30,
        isSent: true,
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000),
      },
    ],
    tags: ['client', 'presentation', 'demo'],
  },
];

const initialState: MeetingState = {
  meetings: MOCK_MEETINGS,
  currentMeeting: null,
  filter: DEFAULT_MEETING_FILTER,
  stats: {
    totalMeetings: 0,
    upcomingMeetings: 0,
    completedMeetings: 0,
    cancelledMeetings: 0,
    meetingsByType: {
      team_meeting: 0,
      one_on_one: 0,
      project_review: 0,
      client_meeting: 0,
      training: 0,
      standup: 0,
      retrospective: 0,
      planning: 0,
      other: 0,
    },
    meetingsByStatus: {
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      postponed: 0,
    },
    meetingsByPriority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    },
    averageMeetingDuration: 0,
    attendanceRate: 0,
    mostActiveOrganizer: '',
    busiestDay: '',
    busiestTimeSlot: '',
  },
  isLoading: true,
  error: null,
  lastSyncTime: null,
};

type MeetingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MEETINGS'; payload: Meeting[] }
  | { type: 'ADD_MEETING'; payload: Meeting }
  | { type: 'UPDATE_MEETING'; payload: { id: string; updates: Partial<Meeting> } }
  | { type: 'DELETE_MEETING'; payload: string }
  | { type: 'SET_CURRENT_MEETING'; payload: Meeting | null }
  | { type: 'SET_FILTER'; payload: Partial<MeetingFilter> }
  | { type: 'CLEAR_FILTER' }
  | { type: 'SET_STATS'; payload: MeetingStats }
  | { type: 'SET_LAST_SYNC'; payload: Date };

const meetingReducer = (state: MeetingState, action: MeetingAction): MeetingState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_MEETINGS':
      return { ...state, meetings: action.payload };
    
    case 'ADD_MEETING':
      return { ...state, meetings: [action.payload, ...state.meetings] };
    
    case 'UPDATE_MEETING':
      return {
        ...state,
        meetings: state.meetings.map(meeting =>
          meeting.id === action.payload.id
            ? { ...meeting, ...action.payload.updates, updatedAt: new Date() }
            : meeting
        ),
      };
    
    case 'DELETE_MEETING':
      return {
        ...state,
        meetings: state.meetings.filter(meeting => meeting.id !== action.payload),
      };
    
    case 'SET_CURRENT_MEETING':
      return { ...state, currentMeeting: action.payload };
    
    case 'SET_FILTER':
      return { ...state, filter: { ...state.filter, ...action.payload } };
    
    case 'CLEAR_FILTER':
      return { ...state, filter: DEFAULT_MEETING_FILTER };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    
    case 'SET_LAST_SYNC':
      return { ...state, lastSyncTime: action.payload };
    
    default:
      return state;
  }
};

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export const MeetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [meetingState, dispatch] = useReducer(meetingReducer, initialState);
  const { authState } = useAuth();
  const { createTaskNotification } = useNotifications();

  useEffect(() => {
    if (authState.user) {
      loadMeetings();
      // Initialize meeting notification service
      const notificationService = MeetingNotificationService.getInstance();
      notificationService.initialize();
    }
  }, [authState.user]);

  // Calculate stats whenever meetings change
  useEffect(() => {
    calculateStats();
  }, [meetingState.meetings]);

  const calculateStats = () => {
    const meetings = meetingState.meetings;
    const stats: MeetingStats = {
      totalMeetings: meetings.length,
      upcomingMeetings: meetings.filter(m => isMeetingUpcoming(m)).length,
      completedMeetings: meetings.filter(m => m.status === 'completed').length,
      cancelledMeetings: meetings.filter(m => m.status === 'cancelled').length,
      meetingsByType: {
        team_meeting: meetings.filter(m => m.type === 'team_meeting').length,
        one_on_one: meetings.filter(m => m.type === 'one_on_one').length,
        project_review: meetings.filter(m => m.type === 'project_review').length,
        client_meeting: meetings.filter(m => m.type === 'client_meeting').length,
        training: meetings.filter(m => m.type === 'training').length,
        standup: meetings.filter(m => m.type === 'standup').length,
        retrospective: meetings.filter(m => m.type === 'retrospective').length,
        planning: meetings.filter(m => m.type === 'planning').length,
        other: meetings.filter(m => m.type === 'other').length,
      },
      meetingsByStatus: {
        scheduled: meetings.filter(m => m.status === 'scheduled').length,
        in_progress: meetings.filter(m => m.status === 'in_progress').length,
        completed: meetings.filter(m => m.status === 'completed').length,
        cancelled: meetings.filter(m => m.status === 'cancelled').length,
        postponed: meetings.filter(m => m.status === 'postponed').length,
      },
      meetingsByPriority: {
        low: meetings.filter(m => m.priority === 'low').length,
        medium: meetings.filter(m => m.priority === 'medium').length,
        high: meetings.filter(m => m.priority === 'high').length,
        urgent: meetings.filter(m => m.priority === 'urgent').length,
      },
      averageMeetingDuration: calculateAverageMeetingDuration(meetings),
      attendanceRate: calculateAttendanceRate(meetings),
      mostActiveOrganizer: getMostActiveOrganizer(meetings),
      busiestDay: getBusiestDay(meetings),
      busiestTimeSlot: getBusiestTimeSlot(meetings),
    };
    dispatch({ type: 'SET_STATS', payload: stats });
  };

  const calculateAverageMeetingDuration = (meetings: Meeting[]): number => {
    if (meetings.length === 0) return 0;
    const totalDuration = meetings.reduce((sum, meeting) => sum + meeting.duration, 0);
    return Math.round(totalDuration / meetings.length);
  };

  const calculateAttendanceRate = (meetings: Meeting[]): number => {
    if (meetings.length === 0) return 0;
    let totalAttendees = 0;
    let acceptedAttendees = 0;
    
    meetings.forEach(meeting => {
      meeting.attendees.forEach(attendee => {
        totalAttendees++;
        if (attendee.status === 'accepted') {
          acceptedAttendees++;
        }
      });
    });
    
    return totalAttendees > 0 ? Math.round((acceptedAttendees / totalAttendees) * 100) : 0;
  };

  const getMostActiveOrganizer = (meetings: Meeting[]): string => {
    if (meetings.length === 0) return '';
    const organizerCount: Record<string, number> = {};
    
    meetings.forEach(meeting => {
      organizerCount[meeting.organizerId] = (organizerCount[meeting.organizerId] || 0) + 1;
    });
    
    const mostActive = Object.entries(organizerCount).reduce((a, b) => 
      organizerCount[a[0]] > organizerCount[b[0]] ? a : b
    );
    
    const user = MOCK_USERS.find(u => u.id === mostActive[0]);
    return user ? user.name : '';
  };

  const getBusiestDay = (meetings: Meeting[]): string => {
    if (meetings.length === 0) return '';
    const dayCount: Record<string, number> = {};
    
    meetings.forEach(meeting => {
      const day = meeting.startTime.toLocaleDateString('en-US', { weekday: 'long' });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    
    const busiest = Object.entries(dayCount).reduce((a, b) => 
      dayCount[a[0]] > dayCount[b[0]] ? a : b
    );
    
    return busiest[0];
  };

  const getBusiestTimeSlot = (meetings: Meeting[]): string => {
    if (meetings.length === 0) return '';
    const timeSlotCount: Record<string, number> = {};
    
    meetings.forEach(meeting => {
      const hour = meeting.startTime.getHours();
      let timeSlot = '';
      if (hour < 9) timeSlot = 'Early Morning';
      else if (hour < 12) timeSlot = 'Morning';
      else if (hour < 14) timeSlot = 'Lunch Time';
      else if (hour < 17) timeSlot = 'Afternoon';
      else if (hour < 19) timeSlot = 'Evening';
      else timeSlot = 'Night';
      
      timeSlotCount[timeSlot] = (timeSlotCount[timeSlot] || 0) + 1;
    });
    
    const busiest = Object.entries(timeSlotCount).reduce((a, b) => 
      timeSlotCount[a[0]] > timeSlotCount[b[0]] ? a : b
    );
    
    return busiest[0];
  };

  const loadMeetings = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Load meetings from AsyncStorage
      const storedMeetings = await AsyncStorage.getItem('meetings');
      
      if (storedMeetings) {
        const meetings = JSON.parse(storedMeetings).map((m: any) => ({
          ...m,
          startTime: new Date(m.startTime),
          endTime: new Date(m.endTime),
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt),
          cancelledAt: m.cancelledAt ? new Date(m.cancelledAt) : undefined,
          completedAt: m.completedAt ? new Date(m.completedAt) : undefined,
          attendees: m.attendees.map((a: any) => ({
            ...a,
            responseTime: a.responseTime ? new Date(a.responseTime) : undefined,
          })),
          reminders: m.reminders.map((r: any) => ({
            ...r,
            sentAt: r.sentAt ? new Date(r.sentAt) : undefined,
          })),
        }));
        dispatch({ type: 'SET_MEETINGS', payload: meetings });
      }
      
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load meetings' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveMeetings = async () => {
    try {
      await AsyncStorage.setItem('meetings', JSON.stringify(meetingState.meetings));
    } catch (error) {
      console.error('Failed to save meetings:', error);
    }
  };

  const createMeeting = async (meetingData: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const meeting: Meeting = {
        ...meetingData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      dispatch({ type: 'ADD_MEETING', payload: meeting });
      await saveMeetings();

      // Initialize hybrid notification manager
      const hybridNotificationManager = HybridNotificationManager.getInstance();

      // Schedule smart meeting reminders for all attendees using hybrid system
      const notificationService = MeetingNotificationService.getInstance();
      await notificationService.scheduleMeetingReminders(meeting);

      // Create immediate hybrid notifications for attendees
      for (const attendee of meeting.attendees) {
        if (attendee.userId !== authState.user?.id) {
          // Create hybrid notification
          const hybridNotification: HybridNotification = {
            id: `meeting_invite_${meeting.id}_${attendee.userId}_${Date.now()}`,
            userId: attendee.userId,
            title: 'Meeting Invitation',
            message: `You've been invited to: ${meeting.title}`,
            type: 'meeting_invitation' as NotificationType,
            priority: meeting.priority === 'urgent' ? 'urgent' : 'medium' as NotificationPriority,
            data: {
              meetingId: meeting.id,
              meetingTitle: meeting.title,
              startTime: meeting.startTime.toISOString(),
              organizerId: meeting.organizerId,
            },
            createdAt: new Date(),
            deliveryStatus: 'pending',
            channels: ['websocket', 'fcm', 'apns', 'local'],
          };

          // Send through hybrid notification system
          await hybridNotificationManager.sendNotification(hybridNotification);

          // Also create legacy notification for backward compatibility
          await createTaskNotification(
            `You've been invited to: ${meeting.title}`,
            meeting.id,
            meeting.priority === 'urgent' ? 'urgent' : 'medium'
          );
        }
      }

      Alert.alert('Success', 'Meeting created successfully with hybrid notifications!');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create meeting' });
      Alert.alert('Error', 'Failed to create meeting');
    }
  };

  const updateMeeting = async (meetingId: string, updates: Partial<Meeting>) => {
    try {
      const originalMeeting = meetingState.meetings.find(m => m.id === meetingId);
      dispatch({ type: 'UPDATE_MEETING', payload: { id: meetingId, updates } });
      await saveMeetings();

      // If meeting time or attendees changed, reschedule reminders
      if (originalMeeting && (updates.startTime || updates.attendees)) {
        const updatedMeeting = { ...originalMeeting, ...updates };
        const notificationService = MeetingNotificationService.getInstance();
        await notificationService.rescheduleMeetingReminders(updatedMeeting);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update meeting' });
      Alert.alert('Error', 'Failed to update meeting');
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    try {
      dispatch({ type: 'DELETE_MEETING', payload: meetingId });
      await saveMeetings();

      // Cancel all reminders for this meeting
      const notificationService = MeetingNotificationService.getInstance();
      await notificationService.cancelMeetingReminders(meetingId);

      Alert.alert('Success', 'Meeting deleted successfully');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete meeting' });
      Alert.alert('Error', 'Failed to delete meeting');
    }
  };

  const duplicateMeeting = async (meetingId: string) => {
    try {
      const originalMeeting = meetingState.meetings.find(m => m.id === meetingId);
      if (!originalMeeting) return;

      const duplicatedMeeting: Meeting = {
        ...originalMeeting,
        id: Date.now().toString(),
        title: `${originalMeeting.title} (Copy)`,
        status: 'scheduled',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + originalMeeting.duration * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        cancelledAt: undefined,
        completedAt: undefined,
        attendees: originalMeeting.attendees.map(attendee => ({
          ...attendee,
          id: Date.now().toString() + Math.random(),
          status: 'pending',
          responseTime: undefined,
        })),
        agenda: originalMeeting.agenda.map(item => ({
          ...item,
          id: Date.now().toString() + Math.random(),
          isCompleted: false,
        })),
        reminders: originalMeeting.reminders.map(reminder => ({
          ...reminder,
          id: Date.now().toString() + Math.random(),
          isSent: false,
          sentAt: undefined,
        })),
      };

      dispatch({ type: 'ADD_MEETING', payload: duplicatedMeeting });
      await saveMeetings();
      Alert.alert('Success', 'Meeting duplicated successfully');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to duplicate meeting' });
      Alert.alert('Error', 'Failed to duplicate meeting');
    }
  };

  const updateMeetingStatus = async (meetingId: string, status: MeetingStatus) => {
    try {
      const updates: Partial<Meeting> = { status };
      if (status === 'completed') {
        updates.completedAt = new Date();
      } else if (status === 'cancelled') {
        updates.cancelledAt = new Date();
      }
      
      dispatch({ type: 'UPDATE_MEETING', payload: { id: meetingId, updates } });
      await saveMeetings();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update meeting status' });
      Alert.alert('Error', 'Failed to update meeting status');
    }
  };

  const startMeeting = async (meetingId: string) => {
    await updateMeetingStatus(meetingId, 'in_progress');
  };

  const endMeeting = async (meetingId: string) => {
    await updateMeetingStatus(meetingId, 'completed');
  };

  const cancelMeeting = async (meetingId: string, reason?: string) => {
    await updateMeetingStatus(meetingId, 'cancelled');
  };

  const addAttendee = async (meetingId: string, attendee: Omit<MeetingAttendee, 'id'>) => {
    try {
      const meeting = meetingState.meetings.find(m => m.id === meetingId);
      if (meeting) {
        const newAttendee: MeetingAttendee = {
          ...attendee,
          id: Date.now().toString(),
        };
        const updatedMeeting = {
          ...meeting,
          attendees: [...meeting.attendees, newAttendee],
        };
        dispatch({ type: 'UPDATE_MEETING', payload: { id: meetingId, updates: updatedMeeting } });
        await saveMeetings();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add attendee' });
      Alert.alert('Error', 'Failed to add attendee');
    }
  };

  const removeAttendee = async (meetingId: string, attendeeId: string) => {
    try {
      const meeting = meetingState.meetings.find(m => m.id === meetingId);
      if (meeting) {
        const updatedMeeting = {
          ...meeting,
          attendees: meeting.attendees.filter(a => a.id !== attendeeId),
        };
        dispatch({ type: 'UPDATE_MEETING', payload: { id: meetingId, updates: updatedMeeting } });
        await saveMeetings();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove attendee' });
      Alert.alert('Error', 'Failed to remove attendee');
    }
  };

  const updateAttendeeStatus = async (meetingId: string, attendeeId: string, status: MeetingAttendee['status']) => {
    try {
      const meeting = meetingState.meetings.find(m => m.id === meetingId);
      if (meeting) {
        const updatedAttendees = meeting.attendees.map(attendee =>
          attendee.id === attendeeId
            ? { ...attendee, status, responseTime: new Date() }
            : attendee
        );
        const updatedMeeting = {
          ...meeting,
          attendees: updatedAttendees,
        };
        dispatch({ type: 'UPDATE_MEETING', payload: { id: meetingId, updates: updatedMeeting } });
        await saveMeetings();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update attendee status' });
      Alert.alert('Error', 'Failed to update attendee status');
    }
  };

  const addAgendaItem = async (meetingId: string, agendaItem: Omit<MeetingAgendaItem, 'id'>) => {
    try {
      const meeting = meetingState.meetings.find(m => m.id === meetingId);
      if (meeting) {
        const newAgendaItem: MeetingAgendaItem = {
          ...agendaItem,
          id: Date.now().toString(),
        };
        const updatedMeeting = {
          ...meeting,
          agenda: [...meeting.agenda, newAgendaItem].sort((a, b) => a.order - b.order),
        };
        dispatch({ type: 'UPDATE_MEETING', payload: { id: meetingId, updates: updatedMeeting } });
        await saveMeetings();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add agenda item' });
      Alert.alert('Error', 'Failed to add agenda item');
    }
  };

  const updateAgendaItem = async (meetingId: string, agendaItemId: string, updates: Partial<MeetingAgendaItem>) => {
    try {
      const meeting = meetingState.meetings.find(m => m.id === meetingId);
      if (meeting) {
        const updatedAgenda = meeting.agenda.map(item =>
          item.id === agendaItemId ? { ...item, ...updates } : item
        );
        const updatedMeeting = {
          ...meeting,
          agenda: updatedAgenda.sort((a, b) => a.order - b.order),
        };
        dispatch({ type: 'UPDATE_MEETING', payload: { id: meetingId, updates: updatedMeeting } });
        await saveMeetings();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update agenda item' });
      Alert.alert('Error', 'Failed to update agenda item');
    }
  };

  const removeAgendaItem = async (meetingId: string, agendaItemId: string) => {
    try {
      const meeting = meetingState.meetings.find(m => m.id === meetingId);
      if (meeting) {
        const updatedMeeting = {
          ...meeting,
          agenda: meeting.agenda.filter(item => item.id !== agendaItemId),
        };
        dispatch({ type: 'UPDATE_MEETING', payload: { id: meetingId, updates: updatedMeeting } });
        await saveMeetings();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove agenda item' });
      Alert.alert('Error', 'Failed to remove agenda item');
    }
  };

  const completeAgendaItem = async (meetingId: string, agendaItemId: string) => {
    await updateAgendaItem(meetingId, agendaItemId, { isCompleted: true });
  };

  const addAttachment = async (meetingId: string, file: any) => {
    try {
      const attachment: MeetingAttachment = {
        id: Date.now().toString(),
        fileName: file.name || 'attachment',
        fileSize: file.size || 0,
        fileType: file.type || 'unknown',
        uploadedBy: authState.user?.id || '',
        uploadedAt: new Date(),
        fileUrl: file.uri || '',
      };

      const meeting = meetingState.meetings.find(m => m.id === meetingId);
      if (meeting) {
        const updatedMeeting = {
          ...meeting,
          attachments: [...meeting.attachments, attachment],
        };
        dispatch({ type: 'UPDATE_MEETING', payload: { id: meetingId, updates: updatedMeeting } });
        await saveMeetings();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add attachment' });
      Alert.alert('Error', 'Failed to add attachment');
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    try {
      const meeting = meetingState.meetings.find(m => m.attachments.some(a => a.id === attachmentId));
      if (meeting) {
        const updatedAttachments = meeting.attachments.filter(attachment => attachment.id !== attachmentId);
        const updatedMeeting = {
          ...meeting,
          attachments: updatedAttachments,
        };
        dispatch({ type: 'UPDATE_MEETING', payload: { id: meeting.id, updates: updatedMeeting } });
        await saveMeetings();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove attachment' });
      Alert.alert('Error', 'Failed to remove attachment');
    }
  };

  const addReminder = async (meetingId: string, reminder: Omit<MeetingReminder, 'id'>) => {
    try {
      const newReminder: MeetingReminder = {
        ...reminder,
        id: Date.now().toString(),
      };

      const meeting = meetingState.meetings.find(m => m.id === meetingId);
      if (meeting) {
        const updatedMeeting = {
          ...meeting,
          reminders: [...meeting.reminders, newReminder],
        };
        dispatch({ type: 'UPDATE_MEETING', payload: { id: meetingId, updates: updatedMeeting } });
        await saveMeetings();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add reminder' });
      Alert.alert('Error', 'Failed to add reminder');
    }
  };

  const removeReminder = async (meetingId: string, reminderId: string) => {
    try {
      const meeting = meetingState.meetings.find(m => m.id === meetingId);
      if (meeting) {
        const updatedMeeting = {
          ...meeting,
          reminders: meeting.reminders.filter(r => r.id !== reminderId),
        };
        dispatch({ type: 'UPDATE_MEETING', payload: { id: meetingId, updates: updatedMeeting } });
        await saveMeetings();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove reminder' });
      Alert.alert('Error', 'Failed to remove reminder');
    }
  };

  const setFilter = (filter: Partial<MeetingFilter>) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  };

  const clearFilter = () => {
    dispatch({ type: 'CLEAR_FILTER' });
  };

  const searchMeetings = (query: string): Meeting[] => {
    if (!query.trim()) return meetingState.meetings;
    
    return meetingState.meetings.filter(meeting =>
      meeting.title.toLowerCase().includes(query.toLowerCase()) ||
      meeting.description.toLowerCase().includes(query.toLowerCase()) ||
      meeting.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const refreshMeetings = async () => {
    await loadMeetings();
  };

  const syncMeetings = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Simulate server sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sync meetings' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Utility Functions
  const getMeetingsByUser = (userId: string): Meeting[] => {
    return meetingState.meetings.filter(meeting => 
      meeting.organizerId === userId || 
      meeting.attendees.some(attendee => attendee.userId === userId)
    );
  };

  const getMeetingsByStatus = (status: MeetingStatus): Meeting[] => {
    return meetingState.meetings.filter(meeting => meeting.status === status);
  };

  const getMeetingsByType = (type: MeetingType): Meeting[] => {
    return meetingState.meetings.filter(meeting => meeting.type === type);
  };

  const getUpcomingMeetings = (days: number): Meeting[] => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return meetingState.meetings.filter(meeting =>
      meeting.startTime <= futureDate &&
      meeting.startTime >= new Date() &&
      meeting.status === 'scheduled'
    );
  };

  const getTodaysMeetings = (): Meeting[] => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return meetingState.meetings.filter(meeting =>
      meeting.startTime >= startOfDay &&
      meeting.startTime < endOfDay
    );
  };

  const getMeetingsByDateRange = (startDate: Date, endDate: Date): Meeting[] => {
    return meetingState.meetings.filter(meeting =>
      meeting.startTime >= startDate &&
      meeting.startTime <= endDate
    );
  };

  // Role-based Functions
  const getMeetingsByRole = (userRole: string, userId: string): Meeting[] => {
    // Admin and HoD can see all meetings
    if (userRole === 'admin' || userRole === 'hod') {
      return meetingState.meetings;
    }
    // Regular users can only see meetings they're involved in
    return getMeetingsByUser(userId);
  };

  const canCreateMeeting = (userRole: string): boolean => {
    // Only HoD and Admin can create meetings
    return userRole === 'admin' || userRole === 'hod';
  };

  const canEditMeeting = (userRole: string, meeting: Meeting): boolean => {
    // Admin and HoD can edit any meeting
    if (userRole === 'admin' || userRole === 'hod') {
      return true;
    }
    // Regular users can only edit meetings they organized
    return meeting.organizerId === authState.user?.id;
  };

  const canDeleteMeeting = (userRole: string): boolean => {
    return userRole === 'admin' || userRole === 'hod';
  };

  const canManageAttendees = (userRole: string, meeting: Meeting): boolean => {
    // Admin and HoD can manage attendees for any meeting
    if (userRole === 'admin' || userRole === 'hod') {
      return true;
    }
    // Regular users can only manage attendees for meetings they organized
    return meeting.organizerId === authState.user?.id;
  };

  const getAvailableUsers = () => {
    return MOCK_USERS.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));
  };

  const value: MeetingContextType = {
    meetingState,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    duplicateMeeting,
    updateMeetingStatus,
    startMeeting,
    endMeeting,
    cancelMeeting,
    addAttendee,
    removeAttendee,
    updateAttendeeStatus,
    addAgendaItem,
    updateAgendaItem,
    removeAgendaItem,
    completeAgendaItem,
    addAttachment,
    removeAttachment,
    addReminder,
    removeReminder,
    setFilter,
    clearFilter,
    searchMeetings,
    loadMeetings,
    refreshMeetings,
    syncMeetings,
    getMeetingsByUser,
    getMeetingsByStatus,
    getMeetingsByType,
    getUpcomingMeetings,
    getTodaysMeetings,
    getMeetingsByDateRange,
    calculateMeetingStats: calculateStats,
    // Role-based functions
    getMeetingsByRole,
    canCreateMeeting,
    canEditMeeting,
    canDeleteMeeting,
    canManageAttendees,
    getAvailableUsers,
  };

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeetings = (): MeetingContextType => {
  const context = useContext(MeetingContext);
  if (context === undefined) {
    throw new Error('useMeetings must be used within a MeetingProvider');
  }
  return context;
};
