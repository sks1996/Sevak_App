export interface AdminUser extends User {
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  department?: string;
  permissions: string[];
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  headId?: string; // HOD user ID
  memberIds: string[];
  createdAt: Date;
  isActive: boolean;
}

export interface SystemSettings {
  appName: string;
  version: string;
  maintenanceMode: boolean;
  attendanceSettings: {
    checkInTime: string;
    checkOutTime: string;
    workplaceLocation: {
      latitude: number;
      longitude: number;
      radiusMeters: number;
    };
    allowPhotoVerification: boolean;
    allowLocationVerification: boolean;
    maxLateMinutes: number;
  };
  notificationSettings: {
    enablePushNotifications: boolean;
    enableEmailNotifications: boolean;
    enableSMSNotifications: boolean;
    reminderTimes: string[];
  };
  securitySettings: {
    passwordMinLength: number;
    passwordRequireSpecialChars: boolean;
    sessionTimeoutMinutes: number;
    maxLoginAttempts: number;
  };
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: {
    sevak: number;
    hod: number;
    admin: number;
  };
  totalDepartments: number;
  recentActivity: AdminActivity[];
}

export interface AdminActivity {
  id: string;
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'role_changed' | 'department_created' | 'settings_updated';
  description: string;
  userId?: string;
  adminId: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export interface AdminState {
  users: AdminUser[];
  departments: Department[];
  settings: SystemSettings;
  stats: AdminStats;
  isLoading: boolean;
  error: string | null;
}

export interface AdminContextType {
  adminState: AdminState;
  // User Management
  createUser: (userData: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUser: (userId: string, updates: Partial<AdminUser>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  assignRole: (userId: string, role: UserRole) => Promise<void>;
  assignDepartment: (userId: string, departmentId: string) => Promise<void>;
  
  // Department Management
  createDepartment: (departmentData: Omit<Department, 'id' | 'createdAt'>) => Promise<void>;
  updateDepartment: (departmentId: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (departmentId: string) => Promise<void>;
  assignDepartmentHead: (departmentId: string, userId: string) => Promise<void>;
  
  // System Settings
  updateSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  
  // Data Management
  refreshAdminData: () => Promise<void>;
  getUsersByDepartment: (departmentId: string) => AdminUser[];
  getDepartmentStats: (departmentId: string) => any;
}
