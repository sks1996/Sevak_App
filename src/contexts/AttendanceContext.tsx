import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AttendanceState, AttendanceContextType, AttendanceRecord, AttendanceStats } from '../types/attendance';
import { User } from '../types';
import { useAuth } from './AuthContext';
import { locationService, LocationData } from '../services/LocationService';
import { 
  MOCK_ATTENDANCE_RECORDS,
  MOCK_ATTENDANCE_STATS,
  MOCK_ATTENDANCE_SETTINGS,
  getUserAttendanceRecords,
  getTodayAttendanceRecord,
  getUserAttendanceStats,
  canUserCheckIn,
  canUserCheckOut,
  calculateAttendanceStatus,
} from '../constants/attendance';

const initialState: AttendanceState = {
  records: [],
  stats: [],
  settings: null,
  currentRecord: null,
  isLoading: true,
  error: null,
  location: null,
  locationPermission: false,
};

type AttendanceAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_RECORDS'; payload: AttendanceRecord[] }
  | { type: 'SET_STATS'; payload: AttendanceStats[] }
  | { type: 'SET_SETTINGS'; payload: typeof MOCK_ATTENDANCE_SETTINGS }
  | { type: 'SET_CURRENT_RECORD'; payload: AttendanceRecord | null }
  | { type: 'ADD_RECORD'; payload: AttendanceRecord }
  | { type: 'UPDATE_RECORD'; payload: AttendanceRecord }
  | { type: 'SET_LOCATION'; payload: { latitude: number; longitude: number; address?: string } | null }
  | { type: 'SET_LOCATION_PERMISSION'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const attendanceReducer = (state: AttendanceState, action: AttendanceAction): AttendanceState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_RECORDS':
      return { ...state, records: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_CURRENT_RECORD':
      return { ...state, currentRecord: action.payload };
    case 'ADD_RECORD':
      return { ...state, records: [...state.records, action.payload] };
    case 'UPDATE_RECORD':
      const updatedRecords = state.records.map(record =>
        record.id === action.payload.id ? action.payload : record
      );
      return { ...state, records: updatedRecords };
    case 'SET_LOCATION':
      return { ...state, location: action.payload };
    case 'SET_LOCATION_PERMISSION':
      return { ...state, locationPermission: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [attendanceState, dispatch] = useReducer(attendanceReducer, initialState);
  const { authState } = useAuth();

  useEffect(() => {
    loadAttendanceData();
  }, [authState.user]);

  const loadAttendanceData = async () => {
    if (!authState.user) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Load user's attendance records
      const userRecords = getUserAttendanceRecords(authState.user.id);
      
      // Load user's attendance stats
      const userStats = getUserAttendanceStats(authState.user.id, 'monthly');
      
      // Get today's attendance record
      const todayRecord = getTodayAttendanceRecord(authState.user.id);

      dispatch({ type: 'SET_RECORDS', payload: userRecords });
      dispatch({ type: 'SET_STATS', payload: userStats ? [userStats] : [] });
      dispatch({ type: 'SET_SETTINGS', payload: MOCK_ATTENDANCE_SETTINGS });
      dispatch({ type: 'SET_CURRENT_RECORD', payload: todayRecord });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load attendance data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const checkIn = async (location?: { latitude: number; longitude: number; address?: string }, photo?: string): Promise<void> => {
    if (!authState.user) throw new Error('User not authenticated');

    if (!canUserCheckIn(authState.user.id)) {
      throw new Error('You have already checked in today');
    }

    const now = new Date();
    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}`,
      userId: authState.user.id,
      userName: authState.user.name,
      userRole: authState.user.role,
      date: now,
      checkIn: {
        timestamp: now,
        location,
        photo,
        method: location ? 'automatic' : 'manual',
        verified: !!location,
      },
      status: 'present',
      createdAt: now,
      updatedAt: now,
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    dispatch({ type: 'ADD_RECORD', payload: newRecord });
    dispatch({ type: 'SET_CURRENT_RECORD', payload: newRecord });
  };

  const checkOut = async (location?: { latitude: number; longitude: number; address?: string }, photo?: string): Promise<void> => {
    if (!authState.user) throw new Error('User not authenticated');

    if (!canUserCheckOut(authState.user.id)) {
      throw new Error('You must check in first or have already checked out');
    }

    const now = new Date();
    const currentRecord = getTodayAttendanceRecord(authState.user.id);
    
    if (!currentRecord) {
      throw new Error('No check-in record found for today');
    }

    const updatedRecord: AttendanceRecord = {
      ...currentRecord,
      checkOut: {
        timestamp: now,
        location,
        photo,
        method: location ? 'automatic' : 'manual',
        verified: !!location,
      },
      totalHours: (now.getTime() - currentRecord.checkIn!.timestamp.getTime()) / (1000 * 60 * 60),
      status: calculateAttendanceStatus(currentRecord.checkIn!.timestamp, now),
      updatedAt: now,
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    dispatch({ type: 'UPDATE_RECORD', payload: updatedRecord });
    dispatch({ type: 'SET_CURRENT_RECORD', payload: updatedRecord });
  };

  const getAttendanceHistory = async (userId: string, startDate: Date, endDate: Date): Promise<AttendanceRecord[]> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return getUserAttendanceRecords(userId).filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });
  };

  const getAttendanceStats = async (userId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<AttendanceStats> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const stats = getUserAttendanceStats(userId, period);
    if (!stats) {
      throw new Error('No attendance statistics found');
    }
    return stats;
  };

  const updateAttendanceRecord = async (recordId: string, updates: Partial<AttendanceRecord>): Promise<void> => {
    if (!authState.user) throw new Error('User not authenticated');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    const record = attendanceState.records.find(r => r.id === recordId);
    if (!record) {
      throw new Error('Attendance record not found');
    }

    const updatedRecord = { ...record, ...updates, updatedAt: new Date() };
    dispatch({ type: 'UPDATE_RECORD', payload: updatedRecord });
  };

  const approveAttendanceRecord = async (recordId: string, approvedBy: string): Promise<void> => {
    if (!authState.user) throw new Error('User not authenticated');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    const record = attendanceState.records.find(r => r.id === recordId);
    if (!record) {
      throw new Error('Attendance record not found');
    }

    const updatedRecord = { 
      ...record, 
      approvedBy,
      updatedAt: new Date(),
      checkIn: record.checkIn ? { ...record.checkIn, verified: true } : undefined,
      checkOut: record.checkOut ? { ...record.checkOut, verified: true } : undefined,
    };
    dispatch({ type: 'UPDATE_RECORD', payload: updatedRecord });
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const result = await locationService.requestPermission();
      const granted = result.status === 'granted';
      dispatch({ type: 'SET_LOCATION_PERMISSION', payload: granted });
      return granted;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      dispatch({ type: 'SET_LOCATION_PERMISSION', payload: false });
      return false;
    }
  };

  const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number; address?: string } | null> => {
    try {
      const permission = await locationService.getPermissionStatus();
      if (permission.status !== 'granted') {
        const granted = await requestLocationPermission();
        if (!granted) {
          return null;
        }
      }

      const location = await locationService.getCurrentLocation();
      
      // Validate location accuracy
      const isValidAccuracy = locationService.validateLocationAccuracy(location, 50);
      if (!isValidAccuracy) {
        throw new Error('Location accuracy is not sufficient for attendance tracking');
      }

      // Check if within workplace
      const isWithinWorkplace = await locationService.isWithinWorkplace();
      if (!isWithinWorkplace) {
        throw new Error('You must be at the workplace to check in/out');
      }

      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      };

      dispatch({ type: 'SET_LOCATION', payload: locationData });
      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  };

  const takePhoto = async (): Promise<string | null> => {
    // Simulate taking a photo
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return a mock base64 photo string
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
  };

  const getMonthlyStats = (month: number, year: number): AttendanceStats => {
    if (!authState.user) return MOCK_ATTENDANCE_STATS;
    
    return getUserAttendanceStats(authState.user.id, month, year);
  };

  const getRecordsByDateRange = (startDate: Date, endDate: Date): AttendanceRecord[] => {
    if (!authState.user) return [];
    
    return getUserAttendanceRecords(authState.user.id, startDate, endDate);
  };

  const refreshAttendanceData = async (): Promise<void> => {
    await loadAttendanceData();
  };

  const value: AttendanceContextType = {
    attendanceState,
    checkIn,
    checkOut,
    getRecordsByDateRange,
    getMonthlyStats,
    updateRecordNotes: updateAttendanceRecord,
    verifyAttendanceRecord: approveAttendanceRecord,
    requestLocationPermission,
    getCurrentLocation,
    takePhoto,
    refreshAttendanceData,
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = (): AttendanceContextType => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
