export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  joinDate: Date;
  lastUpdated: Date;
}

export interface AppPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'hi' | 'gu'; // English, Hindi, Gujarati
  fontSize: 'small' | 'medium' | 'large';
  notifications: {
    attendanceReminders: boolean;
    messageNotifications: boolean;
    systemUpdates: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  display: {
    showProfilePicture: boolean;
    showDepartment: boolean;
    compactMode: boolean;
    animations: boolean;
  };
  privacy: {
    shareLocation: boolean;
    shareAttendanceData: boolean;
    allowDirectMessages: boolean;
    showOnlineStatus: boolean;
  };
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number; // minutes
  loginNotifications: boolean;
  passwordChangeRequired: boolean;
  lastPasswordChange: Date;
  loginHistory: LoginRecord[];
}

export interface LoginRecord {
  id: string;
  timestamp: Date;
  device: string;
  location?: string;
  ipAddress?: string;
  success: boolean;
}

export interface SystemSettings {
  appVersion: string;
  buildNumber: string;
  lastUpdate: Date;
  storageUsed: number; // bytes
  cacheSize: number; // bytes
  dataBackup: {
    enabled: boolean;
    lastBackup: Date;
    frequency: 'daily' | 'weekly' | 'monthly';
  };
  debugMode: boolean;
}

export interface SettingsState {
  userProfile: UserProfile;
  appPreferences: AppPreferences;
  securitySettings: SecuritySettings;
  systemSettings: SystemSettings;
  isLoading: boolean;
  error: string | null;
}

export interface SettingsContextType {
  settingsState: SettingsState;
  // Profile Management
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateAvatar: (avatarUri: string) => Promise<void>;
  
  // App Preferences
  updatePreferences: (preferences: Partial<AppPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
  
  // Security Settings
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => Promise<void>;
  enableTwoFactorAuth: () => Promise<void>;
  disableTwoFactorAuth: () => Promise<void>;
  
  // System Settings
  clearCache: () => Promise<void>;
  clearData: () => Promise<void>;
  exportData: () => Promise<void>;
  resetApp: () => Promise<void>;
  
  // Data Management
  refreshSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}
