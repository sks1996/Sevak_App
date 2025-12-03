import { AttendanceRecord, AttendanceStats, AttendanceSettings } from '../types/attendance';

// Mock Attendance Settings
export const MOCK_ATTENDANCE_SETTINGS: AttendanceSettings = {
  id: 'settings_1',
  organizationId: 'org_1',
  checkInTime: '09:00',
  checkOutTime: '18:00',
  lateThreshold: 15, // 15 minutes
  halfDayThreshold: 4, // 4 hours
  workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  holidays: [
    new Date('2024-01-01'), // New Year
    new Date('2024-03-29'), // Good Friday
    new Date('2024-04-01'), // Easter Monday
    new Date('2024-05-01'), // Labor Day
    new Date('2024-12-25'), // Christmas
  ],
  locationRequired: true,
  photoRequired: false,
  gpsAccuracy: 100, // 100 meters
  autoCheckout: false,
  autoCheckoutTime: '18:00',
};

// Mock Attendance Records
export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: 'att_1',
    userId: '1',
    userName: 'John Doe',
    userRole: 'sevak',
    date: new Date('2024-01-15'),
    checkIn: {
      timestamp: new Date('2024-01-15T09:05:00'),
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY, USA',
      },
      method: 'automatic',
      verified: true,
    },
    checkOut: {
      timestamp: new Date('2024-01-15T18:10:00'),
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY, USA',
      },
      method: 'automatic',
      verified: true,
    },
    totalHours: 9.08,
    status: 'late',
    notes: 'Arrived 5 minutes late due to traffic',
    createdAt: new Date('2024-01-15T09:05:00'),
    updatedAt: new Date('2024-01-15T18:10:00'),
  },
  {
    id: 'att_2',
    userId: '1',
    userName: 'John Doe',
    userRole: 'sevak',
    date: new Date('2024-01-16'),
    checkIn: {
      timestamp: new Date('2024-01-16T08:55:00'),
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY, USA',
      },
      method: 'automatic',
      verified: true,
    },
    checkOut: {
      timestamp: new Date('2024-01-16T17:45:00'),
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY, USA',
      },
      method: 'automatic',
      verified: true,
    },
    totalHours: 8.83,
    status: 'present',
    createdAt: new Date('2024-01-16T08:55:00'),
    updatedAt: new Date('2024-01-16T17:45:00'),
  },
  {
    id: 'att_3',
    userId: '2',
    userName: 'Jane Smith',
    userRole: 'hod',
    date: new Date('2024-01-15'),
    checkIn: {
      timestamp: new Date('2024-01-15T08:45:00'),
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY, USA',
      },
      method: 'automatic',
      verified: true,
    },
    checkOut: {
      timestamp: new Date('2024-01-15T18:30:00'),
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY, USA',
      },
      method: 'automatic',
      verified: true,
    },
    totalHours: 9.75,
    status: 'present',
    createdAt: new Date('2024-01-15T08:45:00'),
    updatedAt: new Date('2024-01-15T18:30:00'),
  },
  {
    id: 'att_4',
    userId: '1',
    userName: 'John Doe',
    userRole: 'sevak',
    date: new Date('2024-01-17'),
    checkIn: {
      timestamp: new Date('2024-01-17T09:20:00'),
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY, USA',
      },
      method: 'manual',
      verified: false,
    },
    status: 'late',
    notes: 'Manual check-in due to GPS issues',
    approvedBy: '2', // Jane Smith (HOD)
    createdAt: new Date('2024-01-17T09:20:00'),
    updatedAt: new Date('2024-01-17T09:20:00'),
  },
  {
    id: 'att_5',
    userId: '3',
    userName: 'Admin User',
    userRole: 'admin',
    date: new Date('2024-01-15'),
    checkIn: {
      timestamp: new Date('2024-01-15T08:30:00'),
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY, USA',
      },
      method: 'automatic',
      verified: true,
    },
    checkOut: {
      timestamp: new Date('2024-01-15T19:00:00'),
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY, USA',
      },
      method: 'automatic',
      verified: true,
    },
    totalHours: 10.5,
    status: 'present',
    createdAt: new Date('2024-01-15T08:30:00'),
    updatedAt: new Date('2024-01-15T19:00:00'),
  },
];

// Mock Attendance Statistics
export const MOCK_ATTENDANCE_STATS: AttendanceStats[] = [
  {
    userId: '1',
    period: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    totalDays: 22, // Working days in January
    presentDays: 20,
    absentDays: 1,
    lateDays: 2,
    halfDays: 0,
    leaveDays: 1,
    totalHours: 176.5,
    averageHoursPerDay: 8.83,
    attendancePercentage: 90.9,
  },
  {
    userId: '2',
    period: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    totalDays: 22,
    presentDays: 22,
    absentDays: 0,
    lateDays: 0,
    halfDays: 0,
    leaveDays: 0,
    totalHours: 198.0,
    averageHoursPerDay: 9.0,
    attendancePercentage: 100.0,
  },
  {
    userId: '3',
    period: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    totalDays: 22,
    presentDays: 21,
    absentDays: 0,
    lateDays: 0,
    halfDays: 0,
    leaveDays: 1,
    totalHours: 189.0,
    averageHoursPerDay: 9.0,
    attendancePercentage: 95.5,
  },
];

// Helper functions
export const getUserAttendanceRecords = (userId: string): AttendanceRecord[] => {
  return MOCK_ATTENDANCE_RECORDS.filter(record => record.userId === userId);
};

export const getTodayAttendanceRecord = (userId: string): AttendanceRecord | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return MOCK_ATTENDANCE_RECORDS.find(record => {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    return record.userId === userId && recordDate.getTime() === today.getTime();
  }) || null;
};

export const getUserAttendanceStats = (userId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly'): AttendanceStats | null => {
  return MOCK_ATTENDANCE_STATS.find(stat => stat.userId === userId && stat.period === period) || null;
};

export const canUserCheckIn = (userId: string): boolean => {
  const todayRecord = getTodayAttendanceRecord(userId);
  return !todayRecord || !todayRecord.checkIn;
};

export const canUserCheckOut = (userId: string): boolean => {
  const todayRecord = getTodayAttendanceRecord(userId);
  return todayRecord && todayRecord.checkIn && !todayRecord.checkOut;
};

export const calculateAttendanceStatus = (checkInTime: Date, checkOutTime?: Date): 'present' | 'late' | 'half-day' | 'absent' => {
  const settings = MOCK_ATTENDANCE_SETTINGS;
  const checkInHour = checkInTime.getHours();
  const checkInMinute = checkInTime.getMinutes();
  const expectedCheckInHour = parseInt(settings.checkInTime.split(':')[0]);
  const expectedCheckInMinute = parseInt(settings.checkInTime.split(':')[1]);
  
  const checkInMinutes = checkInHour * 60 + checkInMinute;
  const expectedCheckInMinutes = expectedCheckInHour * 60 + expectedCheckInMinute;
  
  if (checkInMinutes > expectedCheckInMinutes + settings.lateThreshold) {
    return 'late';
  }
  
  if (checkOutTime) {
    const totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    if (totalHours < settings.halfDayThreshold) {
      return 'half-day';
    }
  }
  
  return 'present';
};
