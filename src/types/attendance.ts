export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: 'sevak' | 'hod' | 'admin';
  date: Date;
  checkIn?: {
    timestamp: Date;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    photo?: string; // Base64 encoded photo
    method: 'automatic' | 'manual' | 'photo';
    verified: boolean;
  };
  checkOut?: {
    timestamp: Date;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    photo?: string; // Base64 encoded photo
    method: 'automatic' | 'manual' | 'photo';
    verified: boolean;
  };
  totalHours?: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'leave';
  notes?: string;
  approvedBy?: string; // User ID who approved manual entry
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceStats {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  leaveDays: number;
  totalHours: number;
  averageHoursPerDay: number;
  attendancePercentage: number;
}

export interface AttendanceSettings {
  id: string;
  organizationId: string;
  checkInTime: string; // HH:MM format
  checkOutTime: string; // HH:MM format
  lateThreshold: number; // minutes
  halfDayThreshold: number; // hours
  workingDays: number[]; // 0-6 (Sunday-Saturday)
  holidays: Date[];
  locationRequired: boolean;
  photoRequired: boolean;
  gpsAccuracy: number; // meters
  autoCheckout: boolean;
  autoCheckoutTime: string; // HH:MM format
}

export interface AttendanceState {
  records: AttendanceRecord[];
  stats: AttendanceStats[];
  settings: AttendanceSettings | null;
  currentRecord: AttendanceRecord | null;
  isLoading: boolean;
  error: string | null;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  locationPermission: boolean;
}

export interface AttendanceContextType {
  attendanceState: AttendanceState;
  checkIn: (location?: { latitude: number; longitude: number; address?: string }, photo?: string) => Promise<void>;
  checkOut: (location?: { latitude: number; longitude: number; address?: string }, photo?: string) => Promise<void>;
  getAttendanceHistory: (userId: string, startDate: Date, endDate: Date) => Promise<AttendanceRecord[]>;
  getAttendanceStats: (userId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly') => Promise<AttendanceStats>;
  updateAttendanceRecord: (recordId: string, updates: Partial<AttendanceRecord>) => Promise<void>;
  approveAttendanceRecord: (recordId: string, approvedBy: string) => Promise<void>;
  requestLocationPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<{ latitude: number; longitude: number; address?: string } | null>;
  takePhoto: () => Promise<string | null>;
}
