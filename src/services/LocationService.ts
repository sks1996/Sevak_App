import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  timestamp: Date;
}

export interface GeofenceData {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  name: string;
}

export class LocationService {
  private static instance: LocationService;
  private currentLocation: LocationData | null = null;
  private watchId: Location.LocationSubscription | null = null;
  private isTracking = false;

  // Default workplace geofence (can be configured)
  private static readonly DEFAULT_WORKPLACE: GeofenceData = {
    latitude: 40.7128, // New York coordinates for demo
    longitude: -74.0060,
    radius: 100, // 100 meters radius
    name: 'Workplace',
  };

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Check if location services are enabled
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  /**
   * Check current location permission status
   */
  async getPermissionStatus(): Promise<Location.LocationPermissionResponse> {
    try {
      return await Location.getForegroundPermissionsAsync();
    } catch (error) {
      console.error('Error getting permission status:', error);
      throw error;
    }
  }

  /**
   * Request location permission
   */
  async requestPermission(): Promise<Location.LocationPermissionResponse> {
    try {
      // Check if location services are enabled first
      const isEnabled = await this.isLocationEnabled();
      if (!isEnabled) {
        throw new Error('Location services are disabled');
      }

      // Request foreground permission
      const result = await Location.requestForegroundPermissionsAsync();
      
      if (result.status === 'granted') {
        console.log('Location permission granted');
      } else {
        console.log('Location permission denied');
      }

      return result;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      throw error;
    }
  }

  /**
   * Get current location with high accuracy
   */
  async getCurrentLocation(): Promise<LocationData> {
    try {
      const permission = await this.getPermissionStatus();
      if (permission.status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // Get current position with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000, // 10 seconds
        timeout: 15000, // 15 seconds timeout
      });

      // Reverse geocoding to get address
      let address: string | undefined;
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          address = `${addr.street || ''} ${addr.city || ''} ${addr.region || ''} ${addr.country || ''}`.trim();
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError);
      }

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        address,
        timestamp: new Date(),
      };

      this.currentLocation = locationData;
      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  /**
   * Start watching location changes
   */
  async startLocationTracking(
    onLocationUpdate: (location: LocationData) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      const permission = await this.getPermissionStatus();
      if (permission.status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      if (this.isTracking) {
        console.log('Location tracking already started');
        return;
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            timestamp: new Date(),
          };

          this.currentLocation = locationData;
          onLocationUpdate(locationData);
        }
      );

      this.isTracking = true;
      console.log('Location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      if (onError) {
        onError(error as Error);
      }
      throw error;
    }
  }

  /**
   * Stop watching location changes
   */
  stopLocationTracking(): void {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
      this.isTracking = false;
      console.log('Location tracking stopped');
    }
  }

  /**
   * Check if current location is within workplace geofence
   */
  async isWithinWorkplace(workplace?: GeofenceData): Promise<boolean> {
    try {
      const currentLocation = await this.getCurrentLocation();
      const geofence = workplace || LocationService.DEFAULT_WORKPLACE;

      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        geofence.latitude,
        geofence.longitude
      );

      return distance <= geofence.radius;
    } catch (error) {
      console.error('Error checking workplace geofence:', error);
      return false;
    }
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Validate location accuracy
   */
  validateLocationAccuracy(location: LocationData, requiredAccuracy: number = 50): boolean {
    if (!location.accuracy) {
      return false; // No accuracy data available
    }
    return location.accuracy <= requiredAccuracy;
  }

  /**
   * Get formatted location string
   */
  getFormattedLocation(location: LocationData): string {
    if (location.address) {
      return location.address;
    }
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }

  /**
   * Open device location settings
   */
  async openLocationSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
      Alert.alert(
        'Error',
        'Unable to open settings. Please manually enable location services.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Get current cached location
   */
  getCachedLocation(): LocationData | null {
    return this.currentLocation;
  }

  /**
   * Check if location is recent (within specified minutes)
   */
  isLocationRecent(location: LocationData, maxAgeMinutes: number = 5): boolean {
    const now = new Date();
    const ageMinutes = (now.getTime() - location.timestamp.getTime()) / (1000 * 60);
    return ageMinutes <= maxAgeMinutes;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopLocationTracking();
    this.currentLocation = null;
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();
