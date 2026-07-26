import { HistoryItem } from '../types';

export interface CloudSyncConfig {
  provider: 'google-drive' | 'onedrive' | 'local';
  autoSync: boolean;
  syncInterval: number; // minutes
  lastSyncTime?: string;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSync?: Date;
  error?: string;
  conflictResolution?: 'local' | 'remote' | 'merge';
}

export class CloudSyncManager {
  private config: CloudSyncConfig;
  private syncInterval?: NodeJS.Timeout;
  private storageKey = 'rpm_cloud_sync_config';

  constructor() {
    const saved = localStorage.getItem(this.storageKey);
    this.config = saved ? JSON.parse(saved) : {
      provider: 'local',
      autoSync: false,
      syncInterval: 15
    };
  }

  getConfig(): CloudSyncConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<CloudSyncConfig>): void {
    this.config = { ...this.config, ...config };
    localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    
    if (this.config.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  async syncToCloud(history: HistoryItem[]): Promise<boolean> {
    if (this.config.provider === 'local') {
      return false;
    }

    try {
      const data = {
        history,
        timestamp: new Date().toISOString(),
        version: '2.0'
      };

      if (this.config.provider === 'google-drive') {
        return await this.syncToGoogleDrive(data);
      }

      return false;
    } catch (error) {
      console.error('Cloud sync error:', error);
      return false;
    }
  }

  private async syncToGoogleDrive(data: any): Promise<boolean> {
    // This will use the Firebase auth that's already set up
    try {
      const auth = await import('../lib/firebase').then(m => m.auth);
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      
      // Use Google Drive API
      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'rpm-backup.json',
          mimeType: 'application/json',
          parents: ['appDataFolder']
        })
      });

      if (!response.ok) {
        throw new Error('Failed to sync to Google Drive');
      }

      const fileMetadata = await response.json();
      
      // Upload file content
      const uploadResponse = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileMetadata.id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );

      this.config.lastSyncTime = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));

      return uploadResponse.ok;
    } catch (error) {
      console.error('Google Drive sync error:', error);
      return false;
    }
  }

  async syncFromCloud(): Promise<HistoryItem[] | null> {
    if (this.config.provider === 'local') {
      return null;
    }

    try {
      if (this.config.provider === 'google-drive') {
        return await this.syncFromGoogleDrive();
      }

      return null;
    } catch (error) {
      console.error('Cloud sync download error:', error);
      return null;
    }
  }

  private async syncFromGoogleDrive(): Promise<HistoryItem[] | null> {
    try {
      const auth = await import('../lib/firebase').then(m => m.auth);
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      
      // Search for backup file
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='rpm-backup.json' and 'appDataFolder' in parents&spaces=appDataFolder`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const searchData = await searchResponse.json();
      
      if (!searchData.files || searchData.files.length === 0) {
        return null;
      }

      const fileId = searchData.files[0].id;
      
      // Download file content
      const downloadResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await downloadResponse.json();
      return data.history || null;
    } catch (error) {
      console.error('Google Drive download error:', error);
      return null;
    }
  }

  startAutoSync(): void {
    this.stopAutoSync();
    
    if (this.config.autoSync && this.config.syncInterval > 0) {
      this.syncInterval = setInterval(() => {
        const history = JSON.parse(localStorage.getItem('rpmHistory') || '[]');
        this.syncToCloud(history);
      }, this.config.syncInterval * 60 * 1000);
    }
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  async resolveConflict(
    localHistory: HistoryItem[],
    remoteHistory: HistoryItem[],
    strategy: 'local' | 'remote' | 'merge'
  ): Promise<HistoryItem[]> {
    switch (strategy) {
      case 'local':
        return localHistory;
      case 'remote':
        return remoteHistory;
      case 'merge':
        // Merge by ID, keep newest based on date
        const merged = [...localHistory];
        remoteHistory.forEach(remoteItem => {
          const localIndex = merged.findIndex(item => item.id === remoteItem.id);
          if (localIndex === -1) {
            merged.push(remoteItem);
          } else {
            const localDate = new Date(merged[localIndex].date);
            const remoteDate = new Date(remoteItem.date);
            if (remoteDate > localDate) {
              merged[localIndex] = remoteItem;
            }
          }
        });
        return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      default:
        return localHistory;
    }
  }

  getLastSyncTime(): string | null {
    return this.config.lastSyncTime || null;
  }

  isOnline(): boolean {
    return navigator.onLine;
  }
}

export const cloudSyncManager = new CloudSyncManager();
