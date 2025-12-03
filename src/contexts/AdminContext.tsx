import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AdminState, AdminContextType, AdminUser, Department, SystemSettings, AdminStats, AdminActivity } from '../types/admin';
import { UserRole } from '../types';
import { useAuth } from './AuthContext';
import { MOCK_USERS } from '../constants';

const initialState: AdminState = {
  users: [],
  departments: [],
  settings: {
    appName: 'Sevak App',
    version: '1.0.0',
    maintenanceMode: false,
    attendanceSettings: {
      checkInTime: '09:00',
      checkOutTime: '17:00',
      workplaceLocation: {
        latitude: 34.052235,
        longitude: -118.243683,
        radiusMeters: 100,
      },
      allowPhotoVerification: true,
      allowLocationVerification: true,
      maxLateMinutes: 15,
    },
    notificationSettings: {
      enablePushNotifications: true,
      enableEmailNotifications: true,
      enableSMSNotifications: false,
      reminderTimes: ['08:30', '16:30'],
    },
    securitySettings: {
      passwordMinLength: 8,
      passwordRequireSpecialChars: true,
      sessionTimeoutMinutes: 480,
      maxLoginAttempts: 5,
    },
  },
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    usersByRole: { sevak: 0, hod: 0, admin: 0 },
    totalDepartments: 0,
    recentActivity: [],
  },
  isLoading: true,
  error: null,
};

type AdminAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USERS'; payload: AdminUser[] }
  | { type: 'ADD_USER'; payload: AdminUser }
  | { type: 'UPDATE_USER'; payload: AdminUser }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'SET_DEPARTMENTS'; payload: Department[] }
  | { type: 'ADD_DEPARTMENT'; payload: Department }
  | { type: 'UPDATE_DEPARTMENT'; payload: Department }
  | { type: 'DELETE_DEPARTMENT'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<SystemSettings> }
  | { type: 'SET_STATS'; payload: AdminStats }
  | { type: 'ADD_ACTIVITY'; payload: AdminActivity }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const adminReducer = (state: AdminState, action: AdminAction): AdminState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_USERS':
      return { ...state, users: action.payload };
    
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id ? action.payload : user
        ),
      };
    
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload),
      };
    
    case 'SET_DEPARTMENTS':
      return { ...state, departments: action.payload };
    
    case 'ADD_DEPARTMENT':
      return { ...state, departments: [...state.departments, action.payload] };
    
    case 'UPDATE_DEPARTMENT':
      return {
        ...state,
        departments: state.departments.map(dept =>
          dept.id === action.payload.id ? action.payload : dept
        ),
      };
    
    case 'DELETE_DEPARTMENT':
      return {
        ...state,
        departments: state.departments.filter(dept => dept.id !== action.payload),
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    
    case 'ADD_ACTIVITY':
      return {
        ...state,
        stats: {
          ...state.stats,
          recentActivity: [action.payload, ...state.stats.recentActivity.slice(0, 9)],
        },
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminState, dispatch] = useReducer(adminReducer, initialState);
  const { authState } = useAuth();

  useEffect(() => {
    if (authState.user?.role === 'admin') {
      loadAdminData();
    }
  }, [authState.user]);

  const loadAdminData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Convert MOCK_USERS to AdminUser format
      const adminUsers: AdminUser[] = MOCK_USERS.map(user => ({
        ...user,
        isActive: true,
        lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random last login within last week
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        department: user.department || 'General',
        permissions: getUserPermissions(user.role),
      }));

      // Mock departments
      const departments: Department[] = [
        {
          id: 'dept1',
          name: 'IT Department',
          description: 'Information Technology',
          headId: '2', // Jane (HOD)
          memberIds: ['1', '4', '5'], // John, Mike, Sarah
          createdAt: new Date('2024-01-01'),
          isActive: true,
        },
        {
          id: 'dept2',
          name: 'HR Department',
          description: 'Human Resources',
          headId: '6', // Another HOD
          memberIds: ['7', '8'],
          createdAt: new Date('2024-01-01'),
          isActive: true,
        },
      ];

      // Calculate stats
      const stats: AdminStats = {
        totalUsers: adminUsers.length,
        activeUsers: adminUsers.filter(u => u.isActive).length,
        inactiveUsers: adminUsers.filter(u => !u.isActive).length,
        usersByRole: {
          sevak: adminUsers.filter(u => u.role === 'sevak').length,
          hod: adminUsers.filter(u => u.role === 'hod').length,
          admin: adminUsers.filter(u => u.role === 'admin').length,
        },
        totalDepartments: departments.length,
        recentActivity: generateMockActivity(adminUsers),
      };

      dispatch({ type: 'SET_USERS', payload: adminUsers });
      dispatch({ type: 'SET_DEPARTMENTS', payload: departments });
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load admin data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getUserPermissions = (role: UserRole): string[] => {
    switch (role) {
      case 'admin':
        return ['all'];
      case 'hod':
        return ['manage_department', 'view_reports', 'manage_attendance'];
      case 'sevak':
        return ['view_own_data', 'check_attendance'];
      default:
        return [];
    }
  };

  const generateMockActivity = (users: AdminUser[]): AdminActivity[] => {
    const activities: AdminActivity[] = [];
    const activityTypes: AdminActivity['type'][] = [
      'user_created', 'user_updated', 'role_changed', 'department_created'
    ];

    for (let i = 0; i < 10; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      
      activities.push({
        id: `activity_${i}`,
        type: randomType,
        description: getActivityDescription(randomType, randomUser.name),
        userId: randomUser.id,
        adminId: authState.user?.id || 'admin1',
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        details: { role: randomUser.role },
      });
    }

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const getActivityDescription = (type: AdminActivity['type'], userName: string): string => {
    switch (type) {
      case 'user_created':
        return `Created new user: ${userName}`;
      case 'user_updated':
        return `Updated user: ${userName}`;
      case 'role_changed':
        return `Changed role for: ${userName}`;
      case 'department_created':
        return `Created new department`;
      default:
        return `Activity for: ${userName}`;
    }
  };

  // User Management Functions
  const createUser = async (userData: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    if (!authState.user || authState.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const newUser: AdminUser = {
      ...userData,
      id: `user_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await new Promise(resolve => setTimeout(resolve, 300));
    dispatch({ type: 'ADD_USER', payload: newUser });
    
    // Add activity
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: `activity_${Date.now()}`,
        type: 'user_created',
        description: `Created new user: ${newUser.name}`,
        userId: newUser.id,
        adminId: authState.user.id,
        timestamp: new Date(),
        details: { role: newUser.role },
      },
    });
  };

  const updateUser = async (userId: string, updates: Partial<AdminUser>): Promise<void> => {
    if (!authState.user || authState.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const user = adminState.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    const updatedUser: AdminUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    await new Promise(resolve => setTimeout(resolve, 300));
    dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    
    // Add activity
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: `activity_${Date.now()}`,
        type: 'user_updated',
        description: `Updated user: ${updatedUser.name}`,
        userId: updatedUser.id,
        adminId: authState.user.id,
        timestamp: new Date(),
        details: updates,
      },
    });
  };

  const deleteUser = async (userId: string): Promise<void> => {
    if (!authState.user || authState.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const user = adminState.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    await new Promise(resolve => setTimeout(resolve, 300));
    dispatch({ type: 'DELETE_USER', payload: userId });
    
    // Add activity
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: `activity_${Date.now()}`,
        type: 'user_deleted',
        description: `Deleted user: ${user.name}`,
        userId: user.id,
        adminId: authState.user.id,
        timestamp: new Date(),
        details: { role: user.role },
      },
    });
  };

  const toggleUserStatus = async (userId: string): Promise<void> => {
    const user = adminState.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    await updateUser(userId, { isActive: !user.isActive });
  };

  const assignRole = async (userId: string, role: UserRole): Promise<void> => {
    await updateUser(userId, { 
      role, 
      permissions: getUserPermissions(role) 
    });
  };

  const assignDepartment = async (userId: string, departmentId: string): Promise<void> => {
    const department = adminState.departments.find(d => d.id === departmentId);
    if (!department) throw new Error('Department not found');

    await updateUser(userId, { department: department.name });
  };

  // Department Management Functions
  const createDepartment = async (departmentData: Omit<Department, 'id' | 'createdAt'>): Promise<void> => {
    if (!authState.user || authState.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const newDepartment: Department = {
      ...departmentData,
      id: `dept_${Date.now()}`,
      createdAt: new Date(),
    };

    await new Promise(resolve => setTimeout(resolve, 300));
    dispatch({ type: 'ADD_DEPARTMENT', payload: newDepartment });
    
    // Add activity
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: `activity_${Date.now()}`,
        type: 'department_created',
        description: `Created department: ${newDepartment.name}`,
        adminId: authState.user.id,
        timestamp: new Date(),
        details: { departmentName: newDepartment.name },
      },
    });
  };

  const updateDepartment = async (departmentId: string, updates: Partial<Department>): Promise<void> => {
    if (!authState.user || authState.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const department = adminState.departments.find(d => d.id === departmentId);
    if (!department) throw new Error('Department not found');

    const updatedDepartment: Department = {
      ...department,
      ...updates,
    };

    await new Promise(resolve => setTimeout(resolve, 300));
    dispatch({ type: 'UPDATE_DEPARTMENT', payload: updatedDepartment });
  };

  const deleteDepartment = async (departmentId: string): Promise<void> => {
    if (!authState.user || authState.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const department = adminState.departments.find(d => d.id === departmentId);
    if (!department) throw new Error('Department not found');

    await new Promise(resolve => setTimeout(resolve, 300));
    dispatch({ type: 'DELETE_DEPARTMENT', payload: departmentId });
  };

  const assignDepartmentHead = async (departmentId: string, userId: string): Promise<void> => {
    await updateDepartment(departmentId, { headId: userId });
  };

  // System Settings Functions
  const updateSettings = async (settings: Partial<SystemSettings>): Promise<void> => {
    if (!authState.user || authState.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  const resetSettings = async (): Promise<void> => {
    if (!authState.user || authState.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    dispatch({ type: 'UPDATE_SETTINGS', payload: initialState.settings });
  };

  // Data Management Functions
  const refreshAdminData = async (): Promise<void> => {
    await loadAdminData();
  };

  const getUsersByDepartment = (departmentId: string): AdminUser[] => {
    const department = adminState.departments.find(d => d.id === departmentId);
    if (!department) return [];
    
    return adminState.users.filter(user => department.memberIds.includes(user.id));
  };

  const getDepartmentStats = (departmentId: string) => {
    const users = getUsersByDepartment(departmentId);
    return {
      totalMembers: users.length,
      activeMembers: users.filter(u => u.isActive).length,
      membersByRole: {
        sevak: users.filter(u => u.role === 'sevak').length,
        hod: users.filter(u => u.role === 'hod').length,
        admin: users.filter(u => u.role === 'admin').length,
      },
    };
  };

  const value: AdminContextType = {
    adminState,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    assignRole,
    assignDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    assignDepartmentHead,
    updateSettings,
    resetSettings,
    refreshAdminData,
    getUsersByDepartment,
    getDepartmentStats,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
