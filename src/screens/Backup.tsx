import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePets, PetData } from '@context/PetContext';
import { useInventory, EquippedItems } from '@context/InventoryContext';
import { useGems } from '@context/GemContext';
import Header from '../components/Header';
import Button from '../components/Button';
import DataService from '../services/DataService';
import { formatRelativeTime } from '../utils/dateUtils';

interface BackupData {
  pets: PetData[];
  inventory: {
    ownedItems: string[];
    equippedItems: EquippedItems;
  };
  gems: number;
}

const BackupScreen: React.FC = () => {
  const navigation = useNavigation();
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { pets, setPets } = usePets();
  const { ownedItems, equippedItems, setOwnedItems, setEquippedItems } = useInventory();
  const { gemBalance, setGemBalance } = useGems();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadLastBackupTime();
  }, []);

  const loadLastBackupTime = async () => {
    try {
      const time = await DataService.getLastBackupTime();
      setLastBackup(time);
    } catch (error) {
      console.error('Error loading last backup time:', error);
    }
  };

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      const backupData: BackupData = {
        pets,
        inventory: {
          ownedItems,
          equippedItems,
        },
        gems: gemBalance,
      };

      const backupString = JSON.stringify(backupData, null, 2);
      const backupPath = `${FileSystem.documentDirectory}step_pet_backup.json`;

      await FileSystem.writeAsStringAsync(backupPath, backupString);
      Alert.alert('Success', 'Backup created successfully!');
    } catch (error) {
      console.error('Backup error:', error);
      Alert.alert('Error', 'Failed to create backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async () => {
    try {
      setIsRestoring(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });

      if (result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const backupString = await FileSystem.readAsStringAsync(uri);
        const backupData: BackupData = JSON.parse(backupString);

        // Restore pets
        if (backupData.pets) {
          setPets(backupData.pets);
        }

        // Restore inventory
        if (backupData.inventory) {
          setOwnedItems(backupData.inventory.ownedItems);
          setEquippedItems(backupData.inventory.equippedItems);
        }

        // Restore gems
        if (backupData.gems !== undefined) {
          setGemBalance(backupData.gems);
        }

        Alert.alert('Success', 'Backup restored successfully!');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your pet data, user data, and friends. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await DataService.clearUserData();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                'Success',
                'All data has been cleared.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header
        title="Backup & Restore"
        showBackButton
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backup Your Data</Text>
          <Text style={styles.description}>
            Create a backup of your pet data, user information, and friends list.
          </Text>
          <Button
            title="Create Backup"
            onPress={handleBackup}
            loading={isBackingUp}
            style={styles.button}
          />
          {lastBackup && (
            <Text style={styles.lastBackupText}>
              Last backup: {formatRelativeTime(lastBackup)}
            </Text>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restore from Backup</Text>
          <Text style={styles.description}>
            Restore your data from a previous backup file.
          </Text>
          <Button
            title="Restore Backup"
            onPress={handleRestoreBackup}
            loading={isRestoring}
            type="outline"
            style={styles.button}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clear All Data</Text>
          <Text style={styles.description}>
            Permanently delete all your data from this device.
          </Text>
          <Button
            title="Clear All Data"
            onPress={handleClearData}
            type="danger"
            style={styles.button}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  button: {
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 24,
  },
  lastBackupText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default BackupScreen; 