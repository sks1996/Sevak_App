import { UserRole } from '../types';

export const USER_ROLES: Record<UserRole, string> = {
  sevak: 'Sevak',
  hod: 'Head of Department',
  admin: 'Administrator',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  sevak: '#3B82F6',
  hod: '#FFD700',
  admin: '#1A365D',
};

export const ROLE_PERMISSIONS = {
  sevak: {
    canSendMessages: false,
    canViewAllAttendance: false,
    canManageUsers: false,
    canManageGroups: false,
  },
  hod: {
    canSendMessages: true,
    canViewAllAttendance: true,
    canManageUsers: false,
    canManageGroups: true,
  },
  admin: {
    canSendMessages: true,
    canViewAllAttendance: true,
    canManageUsers: true,
    canManageGroups: true,
  },
};

export const MOCK_USERS = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'sevak' as UserRole,
    department: 'Education',
    isActive: true,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'hod' as UserRole,
    department: 'Education',
    isActive: true,
  },
  {
    id: '3',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin' as UserRole,
    department: 'Administration',
    isActive: true,
  },
];

export const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_DATA: 'user_data',
  THEME_PREFERENCE: 'theme_preference',
};
