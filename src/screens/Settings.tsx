import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Share,
  BackHandler,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useData } from '../context/DataContext';
import Header from '../components/Header';
import { RootStackParamList } from '../types/navigationTypes';
import { savePetData, createNewPet } from '../utils/petUtils';
import { PET_CATEGORIES, PET_TYPES } from '../utils/petUtils';
import type { PetType, GrowthStage, PetData } from '../types/petTypes';
import { supabase } from '../lib/supabase';

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Settings: React.FC = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { petData, setPetData } = useData();
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [showGrowthStageSelector, setShowGrowthStageSelector] = useState(false);
  
  // Toggle handlers
  const toggleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications(!notifications);
  };
  
  const toggleSoundEffects = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSoundEffects(!soundEffects);
  };
  
  const toggleHapticFeedback = () => {
    if (hapticFeedback) {
      // If turning off, don't provide haptic feedback
      setHapticFeedback(false);
    } else {
      // If turning on, provide haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setHapticFeedback(true);
    }
  };
  
  const handleToggleBackgroundTheme = async () => {
    if (!petData) return;
    
    const updatedPet = { ...petData };
    if (updatedPet.appearance.backgroundTheme) {
      // Remove background theme
      updatedPet.appearance.backgroundTheme = '';
    } else {
      // Set default background theme
      updatedPet.appearance.backgroundTheme = '#34C759';
    }
    
    await savePetData(updatedPet);
    setPetData(updatedPet);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  // Reset data handler
  const handleResetData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to reset all data? This will delete your pet and all progress. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get the current session first
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.user?.id) {
                throw new Error('No user found');
              }

              // Update the profile in Supabase to reset pet data
              const { error: profileError } = await supabase
                .from('profiles')
                .update({
                  pet_name: 'Egg',
                  pet_type: '',
                  pet_level: 1,
                  weekly_steps: 0,
                  monthly_steps: 0,
                  all_time_steps: 0,
                  last_active: new Date().toISOString()
                })
                .eq('id', session.user.id);

              if (profileError) {
                console.error('Error updating profile:', profileError);
                throw profileError;
              }

              // Sign out first
              await supabase.auth.signOut();

              // Clear all data
              await AsyncStorage.clear();
              
              // Reset pet data in context
              setPetData(null);
              
              // Show confirmation
              Alert.alert(
                'Data Reset',
                'All data has been reset successfully. Please log in again to start fresh.',
                [{ 
                  text: 'OK',
                  onPress: () => {
                    // Navigate to login screen
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' as never }],
                    });
                  }
                }]
              );
            } catch (error) {
              console.error('Error resetting data:', error);
              Alert.alert(
                'Error',
                'There was an error resetting your data. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };
  
  // Share app handler
  const handleShareApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await Share.share({
        message: 'Check out StepPet, an app that turns your daily steps into a pet-nurturing adventure! Download it now!',
        // url: 'https://steppet.app', // App website URL when available
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };
  
  // Handle navigation
  const handleNavigate = (screen: 'AboutApp' | 'AddFriend' | 'QRCode' | 'Settings' | 'PetDetails') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(screen as never);
  };
  
  // Handle pet type selection
  const handlePetTypeSelect = async (selectedType: PetType) => {
    if (!petData) return;
    
    const updatedPet = {
      ...petData,
      type: selectedType,
      category: PET_TYPES[selectedType].category,
      // Preserve equipped items
      equippedItems: petData.equippedItems || {},
    };
    
    await savePetData(updatedPet);
    setPetData(updatedPet);
    setShowPetSelector(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  // Handle growth stage selection
  const handleGrowthStageSelect = async (selectedStage: GrowthStage) => {
    if (!petData) return;
    
    const updatedPet = {
      ...petData,
      growthStage: selectedStage,
    };
    
    await savePetData(updatedPet);
    setPetData(updatedPet);
    setShowGrowthStageSelector(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any local data if needed
      setPetData(null);
      
      // Navigate to the login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };
  
  // Render a settings item with a toggle switch
  const renderToggleItem = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: () => void,
    icon: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon as any} size={22} color="#8C52FF" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D0D0D0', true: '#C4A9FF' }}
        thumbColor={value ? '#8C52FF' : '#F4F4F4'}
        ios_backgroundColor="#D0D0D0"
      />
    </View>
  );
  
  // Render a settings item with a button action
  const renderActionItem = (
    title: string,
    description: string,
    onPress: () => void,
    icon: string,
    color: string = '#8C52FF'
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#909090" />
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header
        title="Settings"
        showBackButton
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* App Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          
          {renderToggleItem(
            'Notifications',
            'Receive reminders and updates about your pet',
            notifications,
            toggleNotifications,
            'notifications-outline'
          )}
          
          {renderToggleItem(
            'Sound Effects',
            'Play sounds for pet interactions and achievements',
            soundEffects,
            toggleSoundEffects,
            'volume-high-outline'
          )}
          
          {renderToggleItem(
            'Haptic Feedback',
            'Feel subtle vibrations when interacting with your pet',
            hapticFeedback,
            toggleHapticFeedback,
            'hand-left-outline'
          )}
          
          {renderToggleItem(
            'Background Theme',
            'Enable or disable the background theme for your pet',
            !!petData?.appearance.backgroundTheme,
            handleToggleBackgroundTheme,
            'color-palette-outline'
          )}
        </View>
        
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {renderActionItem(
            'Pet Details',
            'View and manage your pet information',
            () => navigation.navigate('PetDetails' as never),
            'paw-outline'
          )}
          
          {renderActionItem(
            'Share App',
            'Invite friends to join StepPet',
            handleShareApp,
            'share-social-outline'
          )}
          
          {renderActionItem(
            'About StepPet',
            'Learn more about the app and developers',
            () => navigation.navigate('AboutApp' as never),
            'information-circle-outline'
          )}

          {renderActionItem(
            'Log Out',
            'Sign out of your account',
            handleLogout,
            'log-out-outline',
            '#FF3B30'
          )}
        </View>
        
        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          
          {renderActionItem(
            'Reset All Data',
            'Delete your pet and all progress',
            handleResetData,
            'trash-outline',
            '#FF3B30'
          )}
        </View>
        
        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.versionText}>StepPet v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2025 StepPet Team</Text>
        </View>
      </ScrollView>

      {/* Pet Type Selector Modal */}
      <Modal
        visible={showPetSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPetSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Pet Type</Text>
              <TouchableOpacity
                onPress={() => setShowPetSelector(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={Object.entries(PET_CATEGORIES)}
              keyExtractor={(item) => item[0]}
              renderItem={({ item: [category, data] }) => (
                <View style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{data.name}</Text>
                  {data.pets.map((petType) => (
                    <TouchableOpacity
                      key={petType}
                      style={[
                        styles.petOption,
                        petData?.type === petType && styles.selectedPetOption
                      ]}
                      onPress={() => handlePetTypeSelect(petType)}
                    >
                      <Text style={[
                        styles.petOptionText,
                        petData?.type === petType && styles.selectedPetOptionText
                      ]}>
                        {PET_TYPES[petType].name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Growth Stage Selector Modal */}
      <Modal
        visible={showGrowthStageSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGrowthStageSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Growth Stage</Text>
              <TouchableOpacity
                onPress={() => setShowGrowthStageSelector(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            <View style={styles.growthStageOptions}>
              {['Baby', 'Juvenile', 'Adult'].map((stage) => (
                <TouchableOpacity
                  key={stage}
                  style={[
                    styles.growthStageOption,
                    petData?.growthStage === stage && styles.selectedGrowthStageOption
                  ]}
                  onPress={() => handleGrowthStageSelect(stage as GrowthStage)}
                >
                  <Text style={[
                    styles.growthStageOptionText,
                    petData?.growthStage === stage && styles.selectedGrowthStageOptionText
                  ]}>
                    {stage}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
  },
  settingDescription: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
  },
  appInfo: {
    marginTop: 24,
    alignItems: 'center',
  },
  versionText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#909090',
    marginBottom: 4,
  },
  copyrightText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#909090',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
  },
  modalCloseButton: {
    padding: 5,
  },
  categorySection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#666666',
    marginBottom: 12,
  },
  petOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F8F8F8',
  },
  selectedPetOption: {
    backgroundColor: '#8C52FF20',
  },
  petOptionText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#333333',
  },
  selectedPetOptionText: {
    color: '#8C52FF',
  },
  growthStageOptions: {
    padding: 20,
  },
  growthStageOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F8F8F8',
  },
  selectedGrowthStageOption: {
    backgroundColor: '#8C52FF20',
  },
  growthStageOptionText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  selectedGrowthStageOptionText: {
    color: '#8C52FF',
  },
});

export default Settings; 