import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { DataContext } from '../context/DataContext';
import { PedometerContext } from '../context/PedometerContext';
import { formatSimpleDate } from '../utils/dateUtils';
import { savePetData } from '../utils/petUtils';
import PetDisplay from '../components/PetDisplay';
import ProgressBar from '../components/ProgressBar';
import Header from '../components/Header';

const PetDetails: React.FC = () => {
  const navigation = useNavigation();
  const { petData, setPetData } = useContext(DataContext);
  const { dailySteps, weeklySteps, totalSteps } = useContext(PedometerContext);
  const [isEditing, setIsEditing] = useState(false);
  const [petName, setPetName] = useState(petData?.name || '');
  
  if (!petData) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <Header
          title="Pet Details"
          showBackButton
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No pet data available.</Text>
        </View>
      </View>
    );
  }
  
  // Handle pet name update
  const handleUpdateName = async () => {
    if (!petName.trim()) {
      Alert.alert('Error', 'Pet name cannot be empty');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const updatedPet = { ...petData, name: petName.trim() };
      await savePetData(updatedPet);
      setPetData(updatedPet);
      setIsEditing(false);
      
      Alert.alert('Success', 'Pet name updated successfully!');
    } catch (error) {
      console.error('Error updating pet name:', error);
      Alert.alert('Error', 'There was a problem updating your pet\'s name. Please try again.');
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (isEditing) {
      setPetName(petData.name); // Reset to original name
    }
    
    setIsEditing(!isEditing);
  };
  
  // Calculate XP progress
  const xpProgress = petData.xp / petData.xpToNextLevel;
  
  // Get next evolution stage
  const getNextEvolution = () => {
    switch (petData.growthStage) {
      case 'Egg':
        return 'Baby';
      case 'Baby':
        return 'Juvenile';
      case 'Juvenile':
        return 'Adult';
      case 'Adult':
        return 'Max Level';
      default:
        return 'Unknown';
    }
  };
  
  // Determine steps to next level
  const stepsToNextLevel = petData.xpToNextLevel - petData.xp;
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header
        title="Pet Details"
        showBackButton
        rightComponent={
          <TouchableOpacity onPress={toggleEditMode} style={styles.editButton}>
            <Ionicons 
              name={isEditing ? 'close-outline' : 'pencil-outline'} 
              size={24} 
              color="#8C52FF" 
            />
          </TouchableOpacity>
        }
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.petSection}>
          <PetDisplay
            petType={petData.type}
            growthStage={petData.growthStage}
            level={petData.level}
            mainColor={petData.appearance.mainColor}
            accentColor={petData.appearance.accentColor}
            hasCustomization={petData.appearance.hasCustomization}
            size="xlarge"
          />
          
          {/* Pet Name (editable or static) */}
          {isEditing ? (
            <View style={styles.editNameContainer}>
              <TouchableOpacity 
                style={styles.nameInput}
                onPress={() => {
                  Alert.prompt(
                    'Update Pet Name',
                    'Enter a new name for your pet:',
                    [
                      {
                        text: 'Cancel',
                        onPress: () => {},
                        style: 'cancel',
                      },
                      {
                        text: 'Update',
                        onPress: (newName) => {
                          if (newName) {
                            setPetName(newName);
                            handleUpdateName();
                          }
                        },
                      },
                    ],
                    'plain-text',
                    petName,
                  );
                }}
              >
                <Text style={styles.nameInputText}>{petName}</Text>
                <Ionicons name="pencil" size={16} color="#8C52FF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleUpdateName}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.petName}>{petData.name}</Text>
          )}
          
          <Text style={styles.petInfo}>
            Level {petData.level} {petData.type} • {petData.growthStage}
          </Text>
        </View>
        
        {/* Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelContainer}>
              <Text style={styles.progressLabel}>XP Progress</Text>
              <Text style={styles.progressValue}>
                {petData.xp}/{petData.xpToNextLevel} XP
              </Text>
            </View>
            
            <ProgressBar
              progress={xpProgress}
              height={10}
              fillColor={petData.appearance.mainColor}
              backgroundColor="#E0E0E0"
              borderRadius={5}
            />
            
            <Text style={styles.progressInfo}>
              {stepsToNextLevel} steps until level {petData.level + 1}
            </Text>
          </View>
          
          <View style={styles.progressDetail}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Growth Stage</Text>
              <Text style={styles.detailValue}>{petData.growthStage}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Next Evolution</Text>
              <Text style={styles.detailValue}>{getNextEvolution()}</Text>
            </View>
          </View>
        </View>
        
        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="footsteps-outline" size={24} color="#8C52FF" />
              <Text style={styles.statValue}>{totalSteps.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Steps</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="today-outline" size={24} color="#FF9500" />
              <Text style={styles.statValue}>{dailySteps.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={24} color="#34C759" />
              <Text style={styles.statValue}>{weeklySteps.toLocaleString()}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
          </View>
        </View>
        
        {/* Pet Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pet Information</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{petData.type}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>{petData.category}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Birthday</Text>
            <Text style={styles.infoValue}>{formatSimpleDate(petData.created)}</Text>
          </View>
          
          {petData.appearance.hasCustomization && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Customization</Text>
              <Text style={styles.infoValue}>Available</Text>
              
              <TouchableOpacity 
                style={styles.customizeButton}
                onPress={() => {
                  Alert.alert(
                    'Customization',
                    'Your pet has special customization options! This feature will be available in a future update.',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Text style={styles.customizeButtonText}>Customize</Text>
              </TouchableOpacity>
            </View>
          )}
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
    paddingBottom: 40,
  },
  petSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  petName: {
    fontFamily: 'Caprasimo-Regular',
    fontSize: 28,
    color: '#333333',
    marginTop: 16,
    marginBottom: 4,
  },
  petInfo: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#666666',
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
  progressContainer: {
    marginBottom: 16,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#333333',
  },
  progressValue: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
  },
  progressInfo: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#909090',
    marginTop: 6,
    textAlign: 'right',
  },
  progressDetail: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#333333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#666666',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
    width: 100,
  },
  infoValue: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  customizeButton: {
    backgroundColor: '#8C52FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  customizeButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  editButton: {
    padding: 8,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  nameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EDFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  nameInputText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#333333',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#8C52FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default PetDetails; 