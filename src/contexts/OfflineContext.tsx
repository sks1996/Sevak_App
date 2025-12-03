import React, { createContext, useContext, useEffect, useState } from 'react';
import { OfflineManager, SyncStatus } from '../services/OfflineManager';

interface OfflineContextType {
  syncStatus: SyncStatus;
  isOnline: boolean;
  isSyncing: boolean;
  pendingActionsCount: number;
  lastSyncTime: Date | null;
  syncError: string | null;
  syncNow: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    lastSyncTime: null,
    pendingActionsCount: 0,
    syncError: null,
  });

  const offlineManager = OfflineManager.getInstance();

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = offlineManager.subscribe((status) => {
      setSyncStatus(status);
    });

    // Get initial status
    setSyncStatus(offlineManager.getSyncStatus());

    return unsubscribe;
  }, []);

  const syncNow = async () => {
    await offlineManager.syncPendingActions();
  };

  const clearOfflineData = async () => {
    await offlineManager.clearOfflineData();
  };

  const value: OfflineContextType = {
    syncStatus,
    isOnline: syncStatus.isOnline,
    isSyncing: syncStatus.isSyncing,
    pendingActionsCount: syncStatus.pendingActionsCount,
    lastSyncTime: syncStatus.lastSyncTime,
    syncError: syncStatus.syncError,
    syncNow,
    clearOfflineData,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
