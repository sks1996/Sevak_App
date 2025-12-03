import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Alert } from 'react-native';
import { AnalyticsState, AnalyticsContextType, AnalyticsFilters, AttendanceAnalytics, DepartmentAnalytics, UserAnalytics, TimeSeriesData, ChartData, AnalyticsInsights, DEFAULT_ANALYTICS_FILTERS, CHART_COLORS } from '../types/analytics';
import { useAuth } from './AuthContext';
import { useAttendance } from './AttendanceContext';
import { useAdmin } from './AdminContext';

// Mock analytics data
const MOCK_ATTENDANCE_ANALYTICS: AttendanceAnalytics = {
  totalRecords: 1250,
  presentCount: 1100,
  absentCount: 100,
  lateCount: 50,
  averageHours: 8.5,
  totalHours: 9350,
  attendanceRate: 88.0,
  punctualityRate: 95.6,
};

const MOCK_DEPARTMENT_ANALYTICS: DepartmentAnalytics[] = [
  {
    departmentId: 'dpt1',
    departmentName: 'Education',
    totalUsers: 15,
    attendanceRate: 92.5,
    averageHours: 8.7,
    presentCount: 450,
    absentCount: 30,
    lateCount: 20,
  },
  {
    departmentId: 'dpt2',
    departmentName: 'Administration',
    totalUsers: 8,
    attendanceRate: 85.0,
    averageHours: 8.2,
    presentCount: 200,
    absentCount: 25,
    lateCount: 15,
  },
];

const MOCK_USER_ANALYTICS: UserAnalytics[] = [
  {
    userId: '1',
    userName: 'John Doe',
    userRole: 'sevak',
    department: 'Education',
    attendanceRate: 95.0,
    averageHours: 8.8,
    presentCount: 95,
    absentCount: 3,
    lateCount: 2,
    totalRecords: 100,
  },
  {
    userId: '2',
    userName: 'Jane Smith',
    userRole: 'hod',
    department: 'Education',
    attendanceRate: 98.0,
    averageHours: 9.0,
    presentCount: 98,
    absentCount: 1,
    lateCount: 1,
    totalRecords: 100,
  },
];

const MOCK_TIME_SERIES_DATA: TimeSeriesData[] = [
  { date: '2024-01-01', present: 45, absent: 3, late: 2, totalHours: 360 },
  { date: '2024-01-02', present: 48, absent: 1, late: 1, totalHours: 384 },
  { date: '2024-01-03', present: 47, absent: 2, late: 1, totalHours: 376 },
  { date: '2024-01-04', present: 46, absent: 3, late: 1, totalHours: 368 },
  { date: '2024-01-05', present: 49, absent: 0, late: 1, totalHours: 392 },
];

const initialState: AnalyticsState = {
  filters: DEFAULT_ANALYTICS_FILTERS,
  attendanceAnalytics: null,
  departmentAnalytics: [],
  userAnalytics: [],
  timeSeriesData: [],
  chartData: {
    attendanceChart: null,
    departmentChart: null,
    trendChart: null,
    hoursChart: null,
  },
  insights: null,
  isLoading: true,
  error: null,
};

type AnalyticsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_FILTERS'; payload: Partial<AnalyticsFilters> }
  | { type: 'SET_ATTENDANCE_ANALYTICS'; payload: AttendanceAnalytics }
  | { type: 'SET_DEPARTMENT_ANALYTICS'; payload: DepartmentAnalytics[] }
  | { type: 'SET_USER_ANALYTICS'; payload: UserAnalytics[] }
  | { type: 'SET_TIME_SERIES_DATA'; payload: TimeSeriesData[] }
  | { type: 'SET_CHART_DATA'; payload: { type: string; data: ChartData } }
  | { type: 'SET_INSIGHTS'; payload: AnalyticsInsights }
  | { type: 'RESET_FILTERS' };

const analyticsReducer = (state: AnalyticsState, action: AnalyticsAction): AnalyticsState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    
    case 'SET_ATTENDANCE_ANALYTICS':
      return { ...state, attendanceAnalytics: action.payload };
    
    case 'SET_DEPARTMENT_ANALYTICS':
      return { ...state, departmentAnalytics: action.payload };
    
    case 'SET_USER_ANALYTICS':
      return { ...state, userAnalytics: action.payload };
    
    case 'SET_TIME_SERIES_DATA':
      return { ...state, timeSeriesData: action.payload };
    
    case 'SET_CHART_DATA':
      return {
        ...state,
        chartData: {
          ...state.chartData,
          [action.payload.type]: action.payload.data,
        },
      };
    
    case 'SET_INSIGHTS':
      return { ...state, insights: action.payload };
    
    case 'RESET_FILTERS':
      return { ...state, filters: DEFAULT_ANALYTICS_FILTERS };
    
    default:
      return state;
  }
};

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [analyticsState, dispatch] = useReducer(analyticsReducer, initialState);
  const { authState } = useAuth();
  const { getRecordsByDateRange, getMonthlyStats } = useAttendance();
  const { adminState } = useAdmin();

  useEffect(() => {
    if (authState.user) {
      generateAnalytics();
    }
  }, [authState.user]);

  const generateChartData = (data: any[], type: string): ChartData => {
    switch (type) {
      case 'attendance':
        return {
          labels: ['Present', 'Absent', 'Late'],
          datasets: [{
            label: 'Attendance',
            data: [data[0]?.presentCount || 0, data[0]?.absentCount || 0, data[0]?.lateCount || 0],
            color: CHART_COLORS.primary,
            backgroundColor: [CHART_COLORS.success, CHART_COLORS.error, CHART_COLORS.warning],
          }],
        };
      
      case 'department':
        return {
          labels: data.map(d => d.departmentName),
          datasets: [{
            label: 'Attendance Rate (%)',
            data: data.map(d => d.attendanceRate),
            color: CHART_COLORS.primary,
            backgroundColor: CHART_COLORS.primary,
          }],
        };
      
      case 'trend':
        return {
          labels: data.map(d => d.date),
          datasets: [
            {
              label: 'Present',
              data: data.map(d => d.present),
              color: CHART_COLORS.success,
              backgroundColor: CHART_COLORS.success,
            },
            {
              label: 'Absent',
              data: data.map(d => d.absent),
              color: CHART_COLORS.error,
              backgroundColor: CHART_COLORS.error,
            },
          ],
        };
      
      case 'hours':
        return {
          labels: data.map(d => d.date),
          datasets: [{
            label: 'Total Hours',
            data: data.map(d => d.totalHours),
            color: CHART_COLORS.info,
            backgroundColor: CHART_COLORS.info,
          }],
        };
      
      default:
        return { labels: [], datasets: [] };
    }
  };

  const generateInsights = (): AnalyticsInsights => {
    const topPerformers = analyticsState.userAnalytics
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 5);

    const needsAttention = analyticsState.userAnalytics
      .filter(user => user.attendanceRate < 80)
      .sort((a, b) => a.attendanceRate - b.attendanceRate)
      .slice(0, 5);

    const recommendations = [];
    if (analyticsState.attendanceAnalytics?.attendanceRate < 85) {
      recommendations.push('Overall attendance rate is below 85%. Consider implementing attendance improvement programs.');
    }
    if (needsAttention.length > 0) {
      recommendations.push(`${needsAttention.length} users need attention for low attendance rates.`);
    }
    if (analyticsState.departmentAnalytics.some(d => d.attendanceRate < 80)) {
      recommendations.push('Some departments have low attendance rates. Review department-specific policies.');
    }

    return {
      topPerformers,
      needsAttention,
      departmentComparison: analyticsState.departmentAnalytics,
      trends: {
        attendanceTrend: 'stable',
        punctualityTrend: 'improving',
        hoursTrend: 'stable',
      },
      recommendations,
    };
  };

  const generateAnalytics = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate analytics data
      dispatch({ type: 'SET_ATTENDANCE_ANALYTICS', payload: MOCK_ATTENDANCE_ANALYTICS });
      dispatch({ type: 'SET_DEPARTMENT_ANALYTICS', payload: MOCK_DEPARTMENT_ANALYTICS });
      dispatch({ type: 'SET_USER_ANALYTICS', payload: MOCK_USER_ANALYTICS });
      dispatch({ type: 'SET_TIME_SERIES_DATA', payload: MOCK_TIME_SERIES_DATA });

      // Generate chart data
      dispatch({
        type: 'SET_CHART_DATA',
        payload: {
          type: 'attendanceChart',
          data: generateChartData([MOCK_ATTENDANCE_ANALYTICS], 'attendance'),
        },
      });

      dispatch({
        type: 'SET_CHART_DATA',
        payload: {
          type: 'departmentChart',
          data: generateChartData(MOCK_DEPARTMENT_ANALYTICS, 'department'),
        },
      });

      dispatch({
        type: 'SET_CHART_DATA',
        payload: {
          type: 'trendChart',
          data: generateChartData(MOCK_TIME_SERIES_DATA, 'trend'),
        },
      });

      dispatch({
        type: 'SET_CHART_DATA',
        payload: {
          type: 'hoursChart',
          data: generateChartData(MOCK_TIME_SERIES_DATA, 'hours'),
        },
      });

      // Generate insights
      const insights = generateInsights();
      dispatch({ type: 'SET_INSIGHTS', payload: insights });

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to generate analytics' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateFilters = (filters: Partial<AnalyticsFilters>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  };

  const getCustomDateRangeAnalytics = async (startDate: Date, endDate: Date) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update filters with custom date range
      dispatch({
        type: 'UPDATE_FILTERS',
        payload: {
          dateRange: { startDate, endDate },
        },
      });

      // Regenerate analytics with new date range
      await generateAnalytics();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to generate custom analytics' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const exportAnalytics = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Export Successful',
        `Analytics data has been exported as ${format.toUpperCase()} file.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export analytics data');
      throw error;
    }
  };

  const resetFilters = () => {
    dispatch({ type: 'RESET_FILTERS' });
  };

  const value: AnalyticsContextType = {
    analyticsState,
    updateFilters,
    generateAnalytics,
    exportAnalytics,
    getCustomDateRangeAnalytics,
    resetFilters,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
