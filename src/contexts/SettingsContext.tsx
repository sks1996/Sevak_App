import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Alert } from 'react-native';
import { SettingsState, SettingsContextType, UserProfile, AppPreferences, SecuritySettings, SystemSettings, LoginRecord } from '../types/settings';
import { useAuth } from './AuthContext';

const defaultPreferences: AppPreferences = {
  theme: 'light',
  language: 'en',
  fontSize: 'medium',
  notifications: {
    attendanceReminders: true,
    messageNotifications: true,
    systemUpdates: true,
    emailNotifications: true,
    pushNotifications: true,
  },
  display: {
    showProfilePicture: true,
    showDepartment: true,
    compactMode: false,
    animations: true,
  },
  privacy: {
    shareLocation: true,
    shareAttendanceData: false,
    allowDirectMessages: true,
    showOnlineStatus: true,
  },
};

const defaultSecuritySettings: SecuritySettings = {
  twoFactorAuth: false,
  sessionTimeout: 480, // 8 hours
  loginNotifications: true,
  passwordChangeRequired: false,
  lastPasswordChange: new Date(),
  loginHistory: [],
};

const defaultSystemSettings: SystemSettings = {
  appVersion: '1.0.0',
  buildNumber: '100',
  lastUpdate: new Date(),
  storageUsed: 0,
  cacheSize: 0,
  dataBackup: {
    enabled: true,
    lastBackup: new Date(),
    frequency: 'weekly',
  },
  debugMode: false,
};

const initialState: SettingsState = {
  userProfile: {
    id: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    avatar: '',
    bio: '',
    location: '',
    joinDate: new Date(),
    lastUpdated: new Date(),
  },
  appPreferences: defaultPreferences,
  securitySettings: defaultSecuritySettings,
  systemSettings: defaultSystemSettings,
  isLoading: true,
  error: null,
};

type SettingsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER_PROFILE'; payload: UserProfile }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'SET_APP_PREFERENCES'; payload: AppPreferences }
  | { type: 'UPDATE_APP_PREFERENCES'; payload: Partial<AppPreferences> }
  | { type: 'SET_SECURITY_SETTINGS'; payload: SecuritySettings }
  | { type: 'UPDATE_SECURITY_SETTINGS'; payload: Partial<SecuritySettings> }
  | { type: 'SET_SYSTEM_SETTINGS'; payload: SystemSettings }
  | { type: 'ADD_LOGIN_RECORD'; payload: LoginRecord }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const settingsReducer = (state: SettingsState, action: SettingsAction): SettingsState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload };
    
    case 'UPDATE_USER_PROFILE':
      return {
        ...state,
        userProfile: { ...state.userProfile, ...action.payload, lastUpdated: new Date() },
      };
    
    case 'SET_APP_PREFERENCES':
      return { ...state, appPreferences: action.payload };
    
    case 'UPDATE_APP_PREFERENCES':
      return {
        ...state,
        appPreferences: { ...state.appPreferences, ...action.payload },
      };
    
    case 'SET_SECURITY_SETTINGS':
      return { ...state, securitySettings: action.payload };
    
    case 'UPDATE_SECURITY_SETTINGS':
      return {
        ...state,
        securitySettings: { ...state.securitySettings, ...action.payload },
      };
    
    case 'SET_SYSTEM_SETTINGS':
      return { ...state, systemSettings: action.payload };
    
    case 'ADD_LOGIN_RECORD':
      return {
        ...state,
        securitySettings: {
          ...state.securitySettings,
          loginHistory: [action.payload, ...state.securitySettings.loginHistory.slice(0, 9)],
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

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settingsState, dispatch] = useReducer(settingsReducer, initialState);
  const { authState } = useAuth();

  useEffect(() => {
    if (authState.user) {
      loadSettings();
    }
  }, [authState.user]);

  const loadSettings = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Load user profile from auth state
      const userProfile: UserProfile = {
        id: authState.user!.id,
        name: authState.user!.name,
        email: authState.user!.email,
        phone: '+1 234 567 8900', // Mock phone
        department: authState.user!.department || 'General',
        avatar: '', // No avatar initially
        bio: `Welcome to Sevak App! I'm a ${authState.user!.role} in the ${authState.user!.department || 'General'} department.`,
        location: 'Mumbai, India', // Mock location
        joinDate: new Date('2024-01-01'),
        lastUpdated: new Date(),
      };

      // Load mock login history
      const loginHistory: LoginRecord[] = [
        {
          id: '1',
          timestamp: new Date(),
          device: 'Chrome Browser',
          location: 'Mumbai, India',
          ipAddress: '192.168.1.1',
          success: true,
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          device: 'Mobile App',
          location: 'Delhi, India',
          ipAddress: '192.168.1.2',
          success: true,
        },
      ];

      const securitySettings: SecuritySettings = {
        ...defaultSecuritySettings,
        loginHistory,
      };

      dispatch({ type: 'SET_USER_PROFILE', payload: userProfile });
      dispatch({ type: 'SET_APP_PREFERENCES', payload: defaultPreferences });
      dispatch({ type: 'SET_SECURITY_SETTINGS', payload: securitySettings });
      dispatch({ type: 'SET_SYSTEM_SETTINGS', payload: defaultSystemSettings });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load settings' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Profile Management Functions
  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      dispatch({ type: 'UPDATE_USER_PROFILE', payload: updates });
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      // Validate current password
      if (currentPassword !== 'password123') {
        throw new Error('Current password is incorrect');
      }

      // Validate new password
      if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long');
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      
      dispatch({
        type: 'UPDATE_SECURITY_SETTINGS',
        payload: {
          passwordChangeRequired: false,
          lastPasswordChange: new Date(),
        },
      });

      Alert.alert('Success', 'Password changed successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to change password');
      throw error;
    }
  };

  const updateAvatar = async (avatarUri: string): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      dispatch({ type: 'UPDATE_USER_PROFILE', payload: { avatar: avatarUri } });
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture');
      throw error;
    }
  };

  // App Preferences Functions
  const updatePreferences = async (preferences: Partial<AppPreferences>): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      dispatch({ type: 'UPDATE_APP_PREFERENCES', payload: preferences });
    } catch (error) {
      Alert.alert('Error', 'Failed to update preferences');
      throw error;
    }
  };

  const resetPreferences = async (): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      dispatch({ type: 'SET_APP_PREFERENCES', payload: defaultPreferences });
      Alert.alert('Success', 'Preferences reset to default');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset preferences');
      throw error;
    }
  };

  // Security Settings Functions
  const updateSecuritySettings = async (settings: Partial<SecuritySettings>): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      dispatch({ type: 'UPDATE_SECURITY_SETTINGS', payload: settings });
    } catch (error) {
      Alert.alert('Error', 'Failed to update security settings');
      throw error;
    }
  };

  const enableTwoFactorAuth = async (): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      dispatch({ type: 'UPDATE_SECURITY_SETTINGS', payload: { twoFactorAuth: true } });
      Alert.alert('Success', 'Two-factor authentication enabled');
    } catch (error) {
      Alert.alert('Error', 'Failed to enable two-factor authentication');
      throw error;
    }
  };

  const disableTwoFactorAuth = async (): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      dispatch({ type: 'UPDATE_SECURITY_SETTINGS', payload: { twoFactorAuth: false } });
      Alert.alert('Success', 'Two-factor authentication disabled');
    } catch (error) {
      Alert.alert('Error', 'Failed to disable two-factor authentication');
      throw error;
    }
  };

  // System Settings Functions
  const clearCache = async (): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      dispatch({
        type: 'SET_SYSTEM_SETTINGS',
        payload: {
          ...settingsState.systemSettings,
          cacheSize: 0,
        },
      });
      Alert.alert('Success', 'Cache cleared successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear cache');
      throw error;
    }
  };

  const clearData = async (): Promise<void> => {
    Alert.alert(
      'Clear All Data',
      'This will remove all app data including settings, cache, and offline data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await new Promise(resolve => setTimeout(resolve, 1000));
              dispatch({
                type: 'SET_SYSTEM_SETTINGS',
                payload: {
                  ...settingsState.systemSettings,
                  storageUsed: 0,
                  cacheSize: 0,
                },
              });
              Alert.alert('Success', 'All data cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const exportData = async (): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Data exported successfully. Check your downloads folder.');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
      throw error;
    }
  };

  const resetApp = async (): Promise<void> => {
    Alert.alert(
      'Reset App',
      'This will reset the app to its default state. All settings and preferences will be lost. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await new Promise(resolve => setTimeout(resolve, 1000));
              dispatch({ type: 'SET_APP_PREFERENCES', payload: defaultPreferences });
              dispatch({ type: 'SET_SECURITY_SETTINGS', payload: defaultSecuritySettings });
              Alert.alert('Success', 'App reset to default settings');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset app');
            }
          },
        },
      ]
    );
  };

  // Data Management Functions
  const refreshSettings = async (): Promise<void> => {
    await loadSettings();
  };

  const saveSettings = async (): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      // In a real app, this would save to backend/local storage
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
      throw error;
    }
  };

  const value: SettingsContextType = {
    settingsState,
    updateProfile,
    changePassword,
    updateAvatar,
    updatePreferences,
    resetPreferences,
    updateSecuritySettings,
    enableTwoFactorAuth,
    disableTwoFactorAuth,
    clearCache,
    clearData,
    exportData,
    resetApp,
    refreshSettings,
    saveSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
