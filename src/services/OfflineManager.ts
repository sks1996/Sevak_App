import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface OfflineData {
  messages: any[];
  attendanceRecords: any[];
  userProfile: any;
  settings: any;
  lastSync: Date;
  pendingActions: PendingAction[];
}

export interface PendingAction {
  id: string;
  type: 'message' | 'attendance' | 'profile' | 'settings';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  retryCount: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingActionsCount: number;
  syncError: string | null;
}

export class OfflineManager {
  private static instance: OfflineManager;
  private syncStatus: SyncStatus = {
    isOnline: true,
    isSyncing: false,
    lastSyncTime: null,
    pendingActionsCount: 0,
    syncError: null,
  };
  private listeners: ((status: SyncStatus) => void)[] = [];

  private constructor() {
    this.initializeNetworkListener();
    this.loadOfflineData();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private async initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.syncStatus.isOnline;
      this.syncStatus.isOnline = state.isConnected ?? false;
      
      if (wasOffline && this.syncStatus.isOnline) {
        // Connection restored, trigger sync
        this.syncPendingActions();
      }
      
      this.notifyListeners();
    });
  }

  private async loadOfflineData() {
    try {
      const data = await AsyncStorage.getItem('offlineData');
      if (data) {
        const offlineData: OfflineData = JSON.parse(data);
        this.syncStatus.pendingActionsCount = offlineData.pendingActions.length;
        this.syncStatus.lastSyncTime = new Date(offlineData.lastSync);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }

  async saveOfflineData(data: Partial<OfflineData>) {
    try {
      const existingData = await this.getOfflineData();
      const updatedData = { ...existingData, ...data };
      await AsyncStorage.setItem('offlineData', JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  async getOfflineData(): Promise<OfflineData> {
    try {
      const data = await AsyncStorage.getItem('offlineData');
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error getting offline data:', error);
    }
    
    return {
      messages: [],
      attendanceRecords: [],
      userProfile: null,
      settings: null,
      lastSync: new Date(),
      pendingActions: [],
    };
  }

  async addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>) {
    const pendingAction: PendingAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: new Date(),
      retryCount: 0,
    };

    const offlineData = await this.getOfflineData();
    offlineData.pendingActions.push(pendingAction);
    await this.saveOfflineData(offlineData);

    this.syncStatus.pendingActionsCount = offlineData.pendingActions.length;
    this.notifyListeners();

    // Try to sync immediately if online
    if (this.syncStatus.isOnline) {
      this.syncPendingActions();
    }
  }

  async syncPendingActions() {
    if (this.syncStatus.isSyncing || !this.syncStatus.isOnline) {
      return;
    }

    this.syncStatus.isSyncing = true;
    this.syncStatus.syncError = null;
    this.notifyListeners();

    try {
      const offlineData = await this.getOfflineData();
      const successfulActions: string[] = [];

      for (const action of offlineData.pendingActions) {
        try {
          await this.executePendingAction(action);
          successfulActions.push(action.id);
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          action.retryCount++;
          
          // Remove action if it has failed too many times
          if (action.retryCount >= 3) {
            successfulActions.push(action.id);
          }
        }
      }

      // Remove successful actions
      offlineData.pendingActions = offlineData.pendingActions.filter(
        action => !successfulActions.includes(action.id)
      );
      offlineData.lastSync = new Date();

      await this.saveOfflineData(offlineData);
      this.syncStatus.pendingActionsCount = offlineData.pendingActions.length;
      this.syncStatus.lastSyncTime = new Date();
    } catch (error) {
      this.syncStatus.syncError = error instanceof Error ? error.message : 'Sync failed';
      console.error('Sync error:', error);
    } finally {
      this.syncStatus.isSyncing = false;
      this.notifyListeners();
    }
  }

  private async executePendingAction(action: PendingAction) {
    // Simulate API calls - in a real app, these would be actual API calls
    await new Promise(resolve => setTimeout(resolve, 500));
    
    switch (action.type) {
      case 'message':
        console.log('Syncing message:', action.data);
        break;
      case 'attendance':
        console.log('Syncing attendance:', action.data);
        break;
      case 'profile':
        console.log('Syncing profile:', action.data);
        break;
      case 'settings':
        console.log('Syncing settings:', action.data);
        break;
    }
  }

  async clearOfflineData() {
    try {
      await AsyncStorage.removeItem('offlineData');
      this.syncStatus.pendingActionsCount = 0;
      this.syncStatus.lastSyncTime = null;
      this.notifyListeners();
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  // Utility methods for specific data types
  async cacheMessages(messages: any[]) {
    const offlineData = await this.getOfflineData();
    offlineData.messages = messages;
    await this.saveOfflineData(offlineData);
  }

  async getCachedMessages(): Promise<any[]> {
    const offlineData = await this.getOfflineData();
    return offlineData.messages;
  }

  async cacheAttendanceRecords(records: any[]) {
    const offlineData = await this.getOfflineData();
    offlineData.attendanceRecords = records;
    await this.saveOfflineData(offlineData);
  }

  async getCachedAttendanceRecords(): Promise<any[]> {
    const offlineData = await this.getOfflineData();
    return offlineData.attendanceRecords;
  }

  async cacheUserProfile(profile: any) {
    const offlineData = await this.getOfflineData();
    offlineData.userProfile = profile;
    await this.saveOfflineData(offlineData);
  }

  async getCachedUserProfile(): Promise<any> {
    const offlineData = await this.getOfflineData();
    return offlineData.userProfile;
  }

  async cacheSettings(settings: any) {
    const offlineData = await this.getOfflineData();
    offlineData.settings = settings;
    await this.saveOfflineData(offlineData);
  }

  async getCachedSettings(): Promise<any> {
    const offlineData = await this.getOfflineData();
    return offlineData.settings;
  }
}
