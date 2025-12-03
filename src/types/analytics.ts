export interface AnalyticsFilters {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  departments: string[];
  roles: string[];
  users: string[];
  attendanceStatus: ('present' | 'absent' | 'late')[];
}

export interface AttendanceAnalytics {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  averageHours: number;
  totalHours: number;
  attendanceRate: number;
  punctualityRate: number;
}

export interface DepartmentAnalytics {
  departmentId: string;
  departmentName: string;
  totalUsers: number;
  attendanceRate: number;
  averageHours: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

export interface UserAnalytics {
  userId: string;
  userName: string;
  userRole: string;
  department: string;
  attendanceRate: number;
  averageHours: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalRecords: number;
}

export interface TimeSeriesData {
  date: string;
  present: number;
  absent: number;
  late: number;
  totalHours: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
    backgroundColor?: string;
  }[];
}

export interface AnalyticsInsights {
  topPerformers: UserAnalytics[];
  needsAttention: UserAnalytics[];
  departmentComparison: DepartmentAnalytics[];
  trends: {
    attendanceTrend: 'improving' | 'declining' | 'stable';
    punctualityTrend: 'improving' | 'declining' | 'stable';
    hoursTrend: 'increasing' | 'decreasing' | 'stable';
  };
  recommendations: string[];
}

export interface AnalyticsState {
  filters: AnalyticsFilters;
  attendanceAnalytics: AttendanceAnalytics | null;
  departmentAnalytics: DepartmentAnalytics[];
  userAnalytics: UserAnalytics[];
  timeSeriesData: TimeSeriesData[];
  chartData: {
    attendanceChart: ChartData | null;
    departmentChart: ChartData | null;
    trendChart: ChartData | null;
    hoursChart: ChartData | null;
  };
  insights: AnalyticsInsights | null;
  isLoading: boolean;
  error: string | null;
}

export interface AnalyticsContextType {
  analyticsState: AnalyticsState;
  updateFilters: (filters: Partial<AnalyticsFilters>) => void;
  generateAnalytics: () => Promise<void>;
  exportAnalytics: (format: 'excel' | 'pdf' | 'csv') => Promise<void>;
  getCustomDateRangeAnalytics: (startDate: Date, endDate: Date) => Promise<void>;
  resetFilters: () => void;
}

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilters = {
  dateRange: {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  },
  departments: [],
  roles: [],
  users: [],
  attendanceStatus: ['present', 'absent', 'late'],
};

export const CHART_COLORS = {
  primary: '#FF6B35',
  secondary: '#4ECDC4',
  success: '#45B7D1',
  warning: '#FFA726',
  error: '#EF5350',
  info: '#26C6DA',
  purple: '#AB47BC',
  orange: '#FF7043',
  teal: '#26A69A',
  indigo: '#5C6BC0',
} as const;
