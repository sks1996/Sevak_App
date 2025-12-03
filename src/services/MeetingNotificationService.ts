import AsyncStorage from '@react-native-async-storage/async-storage';
import { Meeting, MeetingAttendee } from '../types/meetings';
import { NotificationType, NotificationPriority } from '../types/notifications';

export interface MeetingReminder {
  id: string;
  meetingId: string;
  userId: string;
  type: 'invitation' | 'reminder_1day' | 'reminder_1hour' | 'reminder_15min' | 'starting_soon';
  scheduledTime: Date;
  isSent: boolean;
  sentAt?: Date;
  message: string;
  priority: NotificationPriority;
}

export interface UserNotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  reminderTimings: {
    oneDayBefore: boolean;
    oneHourBefore: boolean;
    fifteenMinutesBefore: boolean;
    startingSoon: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
}

class MeetingNotificationService {
  private static instance: MeetingNotificationService;
  private reminders: MeetingReminder[] = [];
  private userPreferences: Map<string, UserNotificationPreferences> = new Map();

  static getInstance(): MeetingNotificationService {
    if (!MeetingNotificationService.instance) {
      MeetingNotificationService.instance = new MeetingNotificationService();
    }
    return MeetingNotificationService.instance;
  }

  async initialize() {
    await this.loadReminders();
    await this.loadUserPreferences();
    this.startReminderScheduler();
  }

  private async loadReminders() {
    try {
      const stored = await AsyncStorage.getItem('meetingReminders');
      if (stored) {
        this.reminders = JSON.parse(stored).map((r: any) => ({
          ...r,
          scheduledTime: new Date(r.scheduledTime),
          sentAt: r.sentAt ? new Date(r.sentAt) : undefined,
        }));
      }
    } catch (error) {
      console.error('Failed to load meeting reminders:', error);
    }
  }

  private async saveReminders() {
    try {
      await AsyncStorage.setItem('meetingReminders', JSON.stringify(this.reminders));
    } catch (error) {
      console.error('Failed to save meeting reminders:', error);
    }
  }

  private async loadUserPreferences() {
    try {
      const stored = await AsyncStorage.getItem('userNotificationPreferences');
      if (stored) {
        const preferences = JSON.parse(stored);
        preferences.forEach((pref: UserNotificationPreferences) => {
          this.userPreferences.set(pref.userId, pref);
        });
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  }

  private async saveUserPreferences() {
    try {
      const preferences = Array.from(this.userPreferences.values());
      await AsyncStorage.setItem('userNotificationPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  // Schedule reminders for a new meeting
  async scheduleMeetingReminders(meeting: Meeting) {
    const meetingTime = meeting.startTime;
    const now = new Date();

    // Schedule reminders for each attendee
    for (const attendee of meeting.attendees) {
      const preferences = this.getUserPreferences(attendee.userId);
      
      // Invitation notification (immediate)
      await this.scheduleReminder({
        meetingId: meeting.id,
        userId: attendee.userId,
        type: 'invitation',
        scheduledTime: now,
        message: `You've been invited to "${meeting.title}" on ${meetingTime.toLocaleDateString()} at ${meetingTime.toLocaleTimeString()}`,
        priority: meeting.priority === 'urgent' ? 'urgent' : 'medium',
      });

      // 1 day before reminder
      if (preferences.reminderTimings.oneDayBefore) {
        const oneDayBefore = new Date(meetingTime.getTime() - 24 * 60 * 60 * 1000);
        if (oneDayBefore > now) {
          await this.scheduleReminder({
            meetingId: meeting.id,
            userId: attendee.userId,
            type: 'reminder_1day',
            scheduledTime: oneDayBefore,
            message: `Reminder: "${meeting.title}" is tomorrow at ${meetingTime.toLocaleTimeString()}`,
            priority: 'medium',
          });
        }
      }

      // 1 hour before reminder
      if (preferences.reminderTimings.oneHourBefore) {
        const oneHourBefore = new Date(meetingTime.getTime() - 60 * 60 * 1000);
        if (oneHourBefore > now) {
          await this.scheduleReminder({
            meetingId: meeting.id,
            userId: attendee.userId,
            type: 'reminder_1hour',
            scheduledTime: oneHourBefore,
            message: `Reminder: "${meeting.title}" starts in 1 hour`,
            priority: 'high',
          });
        }
      }

      // 15 minutes before reminder
      if (preferences.reminderTimings.fifteenMinutesBefore) {
        const fifteenMinBefore = new Date(meetingTime.getTime() - 15 * 60 * 1000);
        if (fifteenMinBefore > now) {
          await this.scheduleReminder({
            meetingId: meeting.id,
            userId: attendee.userId,
            type: 'reminder_15min',
            scheduledTime: fifteenMinBefore,
            message: `Meeting "${meeting.title}" starts in 15 minutes`,
            priority: 'high',
          });
        }
      }

      // Starting soon notification (at meeting time)
      if (preferences.reminderTimings.startingSoon) {
        await this.scheduleReminder({
          meetingId: meeting.id,
          userId: attendee.userId,
          type: 'starting_soon',
          scheduledTime: meetingTime,
          message: `"${meeting.title}" is starting now!`,
          priority: 'urgent',
        });
      }
    }
  }

  private async scheduleReminder(reminderData: Omit<MeetingReminder, 'id' | 'isSent'>) {
    const reminder: MeetingReminder = {
      ...reminderData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      isSent: false,
    };

    this.reminders.push(reminder);
    await this.saveReminders();

    // If it's an immediate notification (invitation), send it right away
    if (reminder.type === 'invitation' && reminder.scheduledTime <= new Date()) {
      await this.sendReminder(reminder);
    }
  }

  private async sendReminder(reminder: MeetingReminder) {
    try {
      const preferences = this.getUserPreferences(reminder.userId);
      
      // Check if we're in quiet hours
      if (this.isInQuietHours(preferences)) {
        console.log(`Skipping notification for user ${reminder.userId} - quiet hours`);
        return;
      }

      // Create notification based on user preferences
      const notification = {
        id: Date.now().toString(),
        title: 'Meeting Reminder',
        message: reminder.message,
        type: 'meeting_reminder' as NotificationType,
        priority: reminder.priority,
        data: {
          meetingId: reminder.meetingId,
          reminderType: reminder.type,
        },
        createdAt: new Date(),
        isRead: false,
      };

      // Store notification (this would integrate with your notification system)
      await this.storeNotification(reminder.userId, notification);

      // Mark reminder as sent
      reminder.isSent = true;
      reminder.sentAt = new Date();
      await this.saveReminders();

      console.log(`Sent ${reminder.type} reminder to user ${reminder.userId}`);
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  }

  private async storeNotification(userId: string, notification: any) {
    try {
      const key = `notifications_${userId}`;
      const existing = await AsyncStorage.getItem(key);
      const notifications = existing ? JSON.parse(existing) : [];
      
      notifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (notifications.length > 50) {
        notifications.splice(50);
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to store notification:', error);
    }
  }

  private getUserPreferences(userId: string): UserNotificationPreferences {
    return this.userPreferences.get(userId) || this.getDefaultPreferences(userId);
  }

  private getDefaultPreferences(userId: string): UserNotificationPreferences {
    return {
      userId,
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      reminderTimings: {
        oneDayBefore: true,
        oneHourBefore: true,
        fifteenMinutesBefore: true,
        startingSoon: true,
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
      },
    };
  }

  private isInQuietHours(preferences: UserNotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = this.parseTime(preferences.quietHours.startTime);
    const endTime = this.parseTime(preferences.quietHours.endTime);

    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 22:00 to 08:00 next day)
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Check and send due reminders
  private startReminderScheduler() {
    // Check every minute for due reminders
    setInterval(async () => {
      const now = new Date();
      const dueReminders = this.reminders.filter(
        reminder => !reminder.isSent && reminder.scheduledTime <= now
      );

      for (const reminder of dueReminders) {
        await this.sendReminder(reminder);
      }
    }, 60000); // Check every minute
  }

  // Update user notification preferences
  async updateUserPreferences(userId: string, preferences: Partial<UserNotificationPreferences>) {
    const current = this.getUserPreferences(userId);
    const updated = { ...current, ...preferences };
    this.userPreferences.set(userId, updated);
    await this.saveUserPreferences();
  }

  // Get user notification preferences
  getUserNotificationPreferences(userId: string): UserNotificationPreferences {
    return this.getUserPreferences(userId);
  }

  // Cancel reminders for a meeting
  async cancelMeetingReminders(meetingId: string) {
    this.reminders = this.reminders.filter(reminder => reminder.meetingId !== meetingId);
    await this.saveReminders();
  }

  // Reschedule reminders when meeting time changes
  async rescheduleMeetingReminders(meeting: Meeting) {
    // Cancel existing reminders
    await this.cancelMeetingReminders(meeting.id);
    // Schedule new ones
    await this.scheduleMeetingReminders(meeting);
  }

  // Get upcoming reminders for a user
  getUpcomingReminders(userId: string, limit: number = 10): MeetingReminder[] {
    const now = new Date();
    return this.reminders
      .filter(reminder => 
        reminder.userId === userId && 
        !reminder.isSent && 
        reminder.scheduledTime > now
      )
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
      .slice(0, limit);
  }

  // Get reminder statistics
  getReminderStats(userId: string) {
    const userReminders = this.reminders.filter(r => r.userId === userId);
    return {
      total: userReminders.length,
      sent: userReminders.filter(r => r.isSent).length,
      pending: userReminders.filter(r => !r.isSent).length,
      upcoming: userReminders.filter(r => !r.isSent && r.scheduledTime > new Date()).length,
    };
  }
}

export default MeetingNotificationService;
