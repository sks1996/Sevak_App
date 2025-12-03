import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import { MessagingProvider } from './src/contexts/MessagingContext';
import { AttendanceProvider } from './src/contexts/AttendanceContext';
import { AdminProvider } from './src/contexts/AdminContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { OfflineProvider } from './src/contexts/OfflineContext';
import { FileSharingProvider } from './src/contexts/FileSharingContext';
import { AnalyticsProvider } from './src/contexts/AnalyticsContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { TaskProvider } from './src/contexts/TaskContext';
import { MeetingProvider } from './src/contexts/MeetingContext';
import { LocationPermissionProvider, useLocationPermission } from './src/contexts/LocationPermissionContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LocationPermissionScreen } from './src/screens/permissions/LocationPermissionScreen';
import { HybridNotificationManager } from './src/services/HybridNotificationManager';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';

// Initialize notification system
const initializeNotifications = async () => {
  try {
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Request notification permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('⚠️ Notification permissions not granted');
    }

    // Initialize hybrid notification manager
    const hybridManager = HybridNotificationManager.getInstance();
    
    // Perform health check
    const health = await hybridManager.healthCheck();
    console.log('🔔 Hybrid Notification System Health:', health);

    console.log('✅ Notification system initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing notification system:', error);
  }
};

const AppContent = () => {
  const { locationState, requestPermission } = useLocationPermission();
  const [showPermissionScreen, setShowPermissionScreen] = useState(false);
  const [bypassLocationCheck, setBypassLocationCheck] = useState(false);

  useEffect(() => {
    // Initialize notification permissions and hybrid notification system
    initializeNotifications();
    
    // TEMPORARY FIX: Skip location permission check for development
    setBypassLocationCheck(true);
    setShowPermissionScreen(false);
    return;

    // Original location check logic (commented out for now)
    // const shouldBypass = localStorage?.getItem('bypassLocationCheck') === 'true';
    // if (shouldBypass) {
    //   setBypassLocationCheck(true);
    //   setShowPermissionScreen(false);
    //   return;
    // }

    // if (!locationState.isLoading && !locationState.hasPermission) {
    //   setShowPermissionScreen(true);
    // } else if (locationState.hasPermission) {
    //   setShowPermissionScreen(false);
    // }
  }, [locationState.hasPermission, locationState.isLoading]);

  const handlePermissionGranted = () => {
    setShowPermissionScreen(false);
  };

  const handleBypassLocation = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('bypassLocationCheck', 'true');
    }
    setBypassLocationCheck(true);
    setShowPermissionScreen(false);
  };

  if (showPermissionScreen && !bypassLocationCheck) {
    return (
      <LocationPermissionScreen 
        onPermissionGranted={handlePermissionGranted}
        onBypassLocation={handleBypassLocation}
      />
    );
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
        <SafeAreaProvider>
          <LocationPermissionProvider>
            <AuthProvider>
              <MessagingProvider>
                <AttendanceProvider>
                  <AdminProvider>
                    <SettingsProvider>
                      <OfflineProvider>
                        <FileSharingProvider>
                          <AnalyticsProvider>
                            <NotificationProvider>
                              <TaskProvider>
                                <MeetingProvider>
                                  <AppContent />
                                </MeetingProvider>
                              </TaskProvider>
                            </NotificationProvider>
                          </AnalyticsProvider>
                        </FileSharingProvider>
                      </OfflineProvider>
                    </SettingsProvider>
                  </AdminProvider>
                </AttendanceProvider>
              </MessagingProvider>
            </AuthProvider>
          </LocationPermissionProvider>
        </SafeAreaProvider>
    </ErrorBoundary>
  );
}
