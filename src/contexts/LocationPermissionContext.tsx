import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { locationService } from '../services/LocationService';
import * as Location from 'expo-location';

interface LocationPermissionState {
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
  isLocationEnabled: boolean;
}

interface LocationPermissionContextType {
  locationState: LocationPermissionState;
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<void>;
  openSettings: () => Promise<void>;
}

const LocationPermissionContext = createContext<LocationPermissionContextType | undefined>(undefined);

export const LocationPermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locationState, setLocationState] = useState<LocationPermissionState>({
    hasPermission: false,
    isLoading: true,
    error: null,
    isLocationEnabled: false,
  });

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    setLocationState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if location services are enabled
      const isEnabled = await locationService.isLocationEnabled();
      
      if (!isEnabled) {
        setLocationState({
          hasPermission: false,
          isLoading: false,
          error: 'Location services are disabled',
          isLocationEnabled: false,
        });
        return;
      }

      // Check permission status
      const permission = await locationService.getPermissionStatus();
      const hasPermission = permission.status === 'granted';

      setLocationState({
        hasPermission,
        isLoading: false,
        error: null,
        isLocationEnabled: true,
      });
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationState({
        hasPermission: false,
        isLoading: false,
        error: 'Failed to check location permission',
        isLocationEnabled: false,
      });
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    setLocationState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await locationService.requestPermission();
      const granted = result.status === 'granted';

      setLocationState(prev => ({
        ...prev,
        hasPermission: granted,
        isLoading: false,
        error: granted ? null : 'Location permission denied',
      }));

      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Location access is required for attendance tracking. Please grant permission to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
      }

      return granted;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to request location permission',
      }));
      return false;
    }
  };

  const openSettings = async () => {
    try {
      await locationService.openLocationSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
      Alert.alert(
        'Error',
        'Unable to open settings. Please manually enable location services.',
        [{ text: 'OK' }]
      );
    }
  };

  const value: LocationPermissionContextType = {
    locationState,
    requestPermission,
    checkPermission,
    openSettings,
  };

  return (
    <LocationPermissionContext.Provider value={value}>
      {children}
    </LocationPermissionContext.Provider>
  );
};

export const useLocationPermission = (): LocationPermissionContextType => {
  const context = useContext(LocationPermissionContext);
  if (context === undefined) {
    throw new Error('useLocationPermission must be used within a LocationPermissionProvider');
  }
  return context;
};
