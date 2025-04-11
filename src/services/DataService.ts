import AsyncStorage from '@react-native-async-storage/async-storage';
import { PetData } from '../types/petTypes';
import { UserData } from '../types/userTypes';
import { Friend } from '../types/petTypes';
import { Platform } from 'react-native';

export interface BackupData {
  petData: PetData | null;
  userData: UserData | null;
  friends: Friend[];
  lastBackup: string;
  version: string;
}

class DataService {
  private static instance: DataService;
  private readonly BACKUP_KEY = '@steppet_backup';
  private readonly VERSION_KEY = '@steppet_version';
  private readonly CURRENT_VERSION = '1.0.0';

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Save all user data to local storage
  async saveUserData(data: {
    petData: PetData | null;
    userData: UserData | null;
    friends: Friend[];
  }): Promise<void> {
    try {
      const backupData: BackupData = {
        ...data,
        lastBackup: new Date().toISOString(),
        version: this.CURRENT_VERSION,
      };

      await AsyncStorage.setItem(this.BACKUP_KEY, JSON.stringify(backupData));
      await AsyncStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
    } catch (error) {
      console.error('Error saving user data:', error);
      throw new Error('Failed to save user data');
    }
  }

  // Load all user data from local storage
  async loadUserData(): Promise<{
    petData: PetData | null;
    userData: UserData | null;
    friends: Friend[];
  }> {
    try {
      const backupString = await AsyncStorage.getItem(this.BACKUP_KEY);
      if (!backupString) {
        return {
          petData: null,
          userData: null,
          friends: [],
        };
      }

      const backupData: BackupData = JSON.parse(backupString);
      
      // Handle data migration if needed
      if (backupData.version !== this.CURRENT_VERSION) {
        return this.migrateData(backupData);
      }

      return {
        petData: backupData.petData,
        userData: backupData.userData,
        friends: backupData.friends,
      };
    } catch (error) {
      console.error('Error loading user data:', error);
      throw new Error('Failed to load user data');
    }
  }

  // Create a backup file that can be exported
  async createBackupFile(): Promise<string> {
    try {
      const data = await this.loadUserData();
      const backupData: BackupData = {
        ...data,
        lastBackup: new Date().toISOString(),
        version: this.CURRENT_VERSION,
      };

      return JSON.stringify(backupData, null, 2);
    } catch (error) {
      console.error('Error creating backup file:', error);
      throw new Error('Failed to create backup file');
    }
  }

  // Restore from a backup file
  async restoreFromBackup(backupString: string): Promise<void> {
    try {
      let backupData: BackupData = JSON.parse(backupString);
      
      // Validate backup data
      if (!this.isValidBackup(backupData)) {
        throw new Error('Invalid backup data');
      }

      // Handle data migration if needed
      if (backupData.version !== this.CURRENT_VERSION) {
        backupData = await this.migrateData(backupData);
      }

      await this.saveUserData({
        petData: backupData.petData,
        userData: backupData.userData,
        friends: backupData.friends,
      });
    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw new Error('Failed to restore from backup');
    }
  }

  // Check if backup data is valid
  private isValidBackup(data: any): data is BackupData {
    return (
      data &&
      typeof data === 'object' &&
      'version' in data &&
      'lastBackup' in data &&
      'petData' in data &&
      'userData' in data &&
      'friends' in data
    );
  }

  // Handle data migration between versions
  private async migrateData(backupData: BackupData): Promise<BackupData> {
    // Add migration logic here as needed
    // For now, just return the data as is
    return {
      ...backupData,
      lastBackup: new Date().toISOString(),
      version: this.CURRENT_VERSION,
    };
  }

  // Get the last backup timestamp
  async getLastBackupTime(): Promise<string | null> {
    try {
      const backupString = await AsyncStorage.getItem(this.BACKUP_KEY);
      if (!backupString) return null;

      const backupData: BackupData = JSON.parse(backupString);
      return backupData.lastBackup;
    } catch (error) {
      console.error('Error getting last backup time:', error);
      return null;
    }
  }

  // Clear all user data
  async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.BACKUP_KEY);
      await AsyncStorage.removeItem(this.VERSION_KEY);
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw new Error('Failed to clear user data');
    }
  }
}

export default DataService.getInstance(); 