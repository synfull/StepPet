import React, { useState, useEffect, useRef, useContext } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
// import { Pedometer } from 'expo-sensors';
import LottieView from 'lottie-react-native';
import { RootStackParamList } from '../types/navigationTypes';
import { useData } from '../context/DataContext';
import { PedometerContext } from '../context/PedometerContext';
import { formatSimpleDate } from '../utils/dateUtils';
import { savePetData, LEVEL_REQUIREMENTS } from '../utils/petUtils';
import PetDisplay from '../components/PetDisplay';
import ProgressBar from '../components/ProgressBar';
import Header from '../components/Header';
import EvolutionChain from '../components/EvolutionChain';
import { PET_TYPES, PET_CATEGORIES } from '../utils/petUtils';
import { PetType, GrowthStage } from '../types/petTypes';
// import { Pedometer } from 'expo-sensors'; // Removed incorrect import

type PetDetailsRouteProp = RouteProp<RootStackParamList, 'PetDetails'>;
type PetDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PetDetails'>;

interface PetDetailsProps {
  route: PetDetailsRouteProp;
}

const PetDetails: React.FC<PetDetailsProps> = ({ route }) => {
  const navigation = useNavigation<PetDetailsNavigationProp>();
  const { petData, setPetData } = useData();
  const { dailySteps, weeklySteps, totalSteps, setTotalSteps } = useContext(PedometerContext);
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
  
  // Get next evolution stage and required steps
  const getEvolutionInfo = () => {
    switch (petData.growthStage) {
      case 'Baby':
        // Need to reach level 6 for Juvenile
        if (petData.level < 6) {
          // Calculate total steps needed to reach level 6
          let totalStepsNeeded = petData.xpToNextLevel - petData.xp; // Remaining steps for current level
          
          // Add steps needed for each level up to level 6
          for (let level = petData.level; level < 5; level++) {
            totalStepsNeeded += LEVEL_REQUIREMENTS[level];
          }
          
          return {
            nextStage: 'Juvenile',
            stepsNeeded: totalStepsNeeded
          };
        }
        return {
          nextStage: 'Juvenile',
          stepsNeeded: 0 // Already at level 6, should be evolving
        };
      case 'Juvenile':
        // Need to reach level 11 for Adult
        if (petData.level < 11) {
          // Calculate total steps needed to reach level 11
          let totalStepsNeeded = petData.xpToNextLevel - petData.xp; // Remaining steps for current level
          
          // Add steps needed for each level up to level 11
          for (let level = petData.level; level < 10; level++) {
            totalStepsNeeded += LEVEL_REQUIREMENTS[level];
          }
          
          return {
            nextStage: 'Adult',
            stepsNeeded: totalStepsNeeded
          };
        }
        return {
          nextStage: 'Adult',
          stepsNeeded: 0 // Already at level 11, should be evolving
        };
      case 'Adult':
        return {
          nextStage: 'Max Level',
          stepsNeeded: petData.xpToNextLevel - petData.xp // Remaining steps for current level
        };
      default:
        return {
          nextStage: 'Unknown',
          stepsNeeded: 0
        };
    }
  };
  
  const evolutionInfo = getEvolutionInfo();
  
  // Determine which step values to display based on pet state
  const displayDailySteps = dailySteps; // Daily steps from context are correct
  // For Egg weekly display, use the cumulative petData.totalSteps
  const displayWeeklySteps = petData.growthStage === 'Egg' ? petData.totalSteps : weeklySteps; 
  // Total steps always come from petData
  const displayTotalSteps = petData.totalSteps;
  
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
            size="xlarge"
            showEquippedItems={true}
          />
        </View>
        
        <View style={styles.petInfoContainer}>
          {isEditing ? (
            <TextInput
              style={styles.petNameInput}
              value={editedName}
              onChangeText={setEditedName}
              maxLength={20}
              autoCapitalize="words"
              autoCorrect={false}
              placeholder="Enter pet name"
            />
          ) : (
            <View style={styles.nameContainer}>
              <Text style={styles.petName}>{petData.name}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>
                  Lv. {petData.growthStage === 'Egg' ? '0' : petData.level}
                </Text>
              </View>
            </View>
          )}
          <Text style={styles.petType}>
            {petData.growthStage === 'Egg' ? 'Mysterious Egg' : PET_TYPES[petData.type].name}
          </Text>
          {/* Only show category if not an Egg */}
          {petData.growthStage !== 'Egg' && (
            <View style={styles.categoryContainer}>
              <Ionicons 
                name={
                  petData.category === 'forest' ? 'leaf' :
                  petData.category === 'mythic' ? 'star' :
                  petData.category === 'elemental' ? 'flame' :
                  'moon'  // for shadow category
                } 
                size={16} 
                color="#8C52FF" 
              />
              <Text style={styles.categoryText}>
                {PET_CATEGORIES[petData.category].name}
              </Text>
            </View>
          )}
        </View>
        
        {/* Evolution Chain */}
        {petData.growthStage !== 'Egg' && (
          <EvolutionChain
            petType={petData.type}
            currentStage={petData.growthStage}
          />
        )}
        
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <ProgressBar 
            progress={petData.growthStage === 'Egg' 
              ? (petData.totalSteps / petData.stepsToHatch) 
              : (evolutionInfo.stepsNeeded === 0 ? 1 : Math.max(0, 1 - (evolutionInfo.stepsNeeded / (evolutionInfo.stepsNeeded + petData.totalSteps))))}
            height={12}
            backgroundColor="#F0F0F0"
            fillColor="#8C52FF"
            currentValue={petData.growthStage === 'Egg' ? petData.totalSteps : (petData.xp || 0)}
            maxValue={petData.growthStage === 'Egg' ? petData.stepsToHatch : petData.xpToNextLevel}
          />
          <Text style={styles.progressText}>
            {petData.growthStage === 'Egg'
              ? `${Math.max(0, petData.stepsToHatch - petData.totalSteps).toLocaleString()} steps to hatch`
              : `${evolutionInfo.stepsNeeded.toLocaleString()} steps to ${evolutionInfo.nextStage.toLowerCase()}`}
          </Text>
        </View>
        
        {/* Pet Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{displayDailySteps.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Today's Steps</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{displayWeeklySteps.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Weekly Steps</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{displayTotalSteps.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Steps</Text>
            </View>
          </View>
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
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  petName: {
    fontFamily: 'Caprasimo-Regular',
    fontSize: 28,
    color: '#333333',
    marginRight: 8,
  },
  levelBadge: {
    backgroundColor: '#8C52FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  petType: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 18,
    color: '#666666',
    marginBottom: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EDFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  categoryText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#8C52FF',
    marginLeft: 6,
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
  progressSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  progressText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  statsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  statValue: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
  },
  statLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  editButton: {
    padding: 8,
  },
  petNameInput: {
    fontFamily: 'Caprasimo-Regular',
    fontSize: 28,
    color: '#333333',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#8C52FF',
    paddingBottom: 4,
    marginBottom: 8,
    minWidth: 200,
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