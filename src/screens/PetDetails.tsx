import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { RootStackParamList } from '../types/navigationTypes';
import { DataContext } from '../context/DataContext';
import { PedometerContext } from '../context/PedometerContext';
import { formatSimpleDate } from '../utils/dateUtils';
import { savePetData } from '../utils/petUtils';
import PetDisplay from '../components/PetDisplay';
import ProgressBar from '../components/ProgressBar';
import Header from '../components/Header';
import { PET_TYPES } from '../utils/petUtils';

type PetDetailsProps = NativeStackScreenProps<RootStackParamList, 'PetDetails'>;
type PetDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PetDetails'>;
type PetDetailsRouteProp = RouteProp<RootStackParamList, 'PetDetails'>;

interface PetDetailsRouteParams {
  petId: string;
  showSpecialAnimation?: boolean;
}

const PetDetails: React.FC<PetDetailsProps> = ({ route }) => {
  const navigation = useNavigation<PetDetailsNavigationProp>();
  const { petData, setPetData } = useContext(DataContext);
  const { dailySteps, weeklySteps, totalSteps } = useContext(PedometerContext);
  const [isEditing, setIsEditing] = useState(false);
  const [petName, setPetName] = useState(petData?.name || '');
  const [showSpecialAnim, setShowSpecialAnim] = useState(route.params?.showSpecialAnimation || false);
  const [editedName, setEditedName] = useState(petData?.name || '');
  
  // Reset special animation after it plays
  useEffect(() => {
    if (showSpecialAnim) {
      const timer = setTimeout(() => {
        setShowSpecialAnim(false);
      }, 2000); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [showSpecialAnim]);
  
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
    if (!editedName.trim()) {
      Alert.alert('Error', 'Pet name cannot be empty');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const updatedPet = { ...petData, name: editedName.trim() };
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
      setEditedName(petData.name); // Reset to original name
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
      
      {petData.appearance.hasAnimatedBackground && (
        <View style={styles.sparklesContainer}>
          <LottieView
            source={require('../../assets/animations/stars.json')}
            autoPlay
            loop
            style={styles.sparkles}
            speed={0.5}
          />
        </View>
      )}
      
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Pet Details</Text>
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={toggleEditMode}
          >
            <Ionicons 
              name={isEditing ? "close" : "create-outline"} 
              size={24} 
              color="#000000" 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.petContainer}>
          <PetDisplay
            petType={petData.type}
            growthStage={petData.growthStage}
            level={petData.level}
            mainColor={petData.appearance.mainColor}
            accentColor={petData.appearance.accentColor}
            hasCustomization={petData.appearance.hasCustomization}
            size="xlarge"
            specialAnimation={showSpecialAnim}
          />
        </View>
        
        <View style={styles.petInfoContainer}>
          <Text style={styles.petName}>
            {isEditing ? (
              <TextInput
                style={styles.petNameInput}
                value={editedName}
                onChangeText={setEditedName}
                maxLength={20}
                autoCapitalize="words"
                autoCorrect={false}
              />
            ) : (
              petData.name
            )}
          </Text>
          <Text style={styles.petType}>
            Level {petData.level} {PET_TYPES[petData.type].name}
          </Text>
        </View>
        
        <Text style={styles.petInfo}>
          {petData.growthStage}
        </Text>
        
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
            <Text style={styles.infoValue}>{PET_TYPES[petData.type].name}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>{PET_TYPES[petData.type].category.charAt(0).toUpperCase() + PET_TYPES[petData.type].category.slice(1)}</Text>
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
          
          {petData.appearance.hasEliteBadge && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Elite Badge</Text>
              <Text style={styles.infoValue}>Unlocked</Text>
              <View style={styles.badgeContainer}>
                <Ionicons name="shield-checkmark" size={24} color="#8C52FF" />
              </View>
            </View>
          )}
          
          {petData.appearance.hasAnimatedBackground && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Animated Background</Text>
              <Text style={styles.infoValue}>Enabled</Text>
              <View style={styles.backgroundContainer}>
                <Ionicons name="sparkles" size={24} color="#8C52FF" />
              </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginLeft: 16,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  petContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  petInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  petName: {
    fontFamily: 'Caprasimo-Regular',
    fontSize: 28,
    color: '#333333',
    marginTop: 16,
    marginBottom: 4,
  },
  petType: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#666666',
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
  petNameInput: {
    flex: 1,
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#333333',
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
  badgeContainer: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 4,
  },
  backgroundContainer: {
    backgroundColor: '#8C52FF',
    borderRadius: 12,
    padding: 4,
  },
  sparklesContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    opacity: 0.3,
  },
  sparkles: {
    width: '100%',
    height: '100%',
  },
});

export default PetDetails; 