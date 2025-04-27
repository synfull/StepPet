import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { PedometerContext } from '../context/PedometerContext';
import { RootStackParamList } from '../types/navigationTypes';
import { Milestone, PetData } from '../types/petTypes';
import { savePetData } from '../utils/petUtils';
import ProgressBar from '../components/ProgressBar';
import { getRandomMilestoneAccessory } from '../utils/petUtils';
import { useInventory } from '../context/InventoryContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import HeaderWithGems from '../components/HeaderWithGems';

type MilestonesNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Milestones'>;

interface MilestoneItemProps {
  milestone: Milestone;
  totalSteps: number;
  onClaim: (milestoneId: string) => void;
}

const MilestoneItem: React.FC<MilestoneItemProps> = ({ 
  milestone, 
  totalSteps,
  onClaim,
}) => {
  const progress = Math.min(totalSteps / milestone.steps, 1);
  const isCompleted = totalSteps >= milestone.steps;
  const canClaim = isCompleted && !milestone.claimed;
  
  const getIcon = () => {
    switch (milestone.reward) {
      case 'xp':
        return 'flash-outline';
      case 'appearance':
        return 'color-palette-outline';
      case 'background':
        return 'image-outline';
      case 'animation':
        return 'sparkles-outline';
      case 'badge':
        return 'shield-checkmark-outline';
      default:
        return 'gift-outline';
    }
  };

  const handlePress = () => {
    if (canClaim) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onClaim(milestone.id);
    } else if (isCompleted && milestone.claimed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert(
        'Milestone Claimed',
        `You've already claimed this milestone reward: ${milestone.rewardDetails}`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.milestoneItem,
        milestone.claimed && styles.claimedMilestone,
      ]} 
      onPress={handlePress}
      disabled={!canClaim && !milestone.claimed}
      activeOpacity={canClaim ? 0.7 : 0.9}
    >
      <View style={styles.milestoneHeader}>
        <View style={styles.milestoneInfo}>
          <Text style={styles.milestoneTitle}>
            {milestone.steps.toLocaleString()} Step Milestone
          </Text>
          <Text style={styles.milestoneReward}>
            <Ionicons name={getIcon()} size={14} color="#666666" /> {milestone.rewardDetails}
          </Text>
        </View>
        <View style={styles.milestoneStatus}>
          {milestone.claimed ? (
            <View style={styles.claimedBadge}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              <Text style={styles.claimedText}>Claimed</Text>
            </View>
          ) : canClaim ? (
            <View style={styles.readyBadge}>
              <Text style={styles.readyText}>Ready to Claim</Text>
            </View>
          ) : (
            <Text style={styles.progressText}>
              {Math.round(progress * 100)}%
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={progress}
          height={8}
          backgroundColor="#E0E0E0"
          fillColor={
            milestone.claimed 
              ? '#A3A3A3' 
              : canClaim
              ? '#34C759'
              : '#8C52FF'
          }
          borderRadius={4}
          animated={false}
          showLabel={false}
        />
      </View>
      
      {canClaim && (
        <TouchableOpacity 
          style={styles.claimButton}
          onPress={handlePress}
        >
          <Text style={styles.claimButtonText}>Claim Reward</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const Milestones: React.FC = () => {
  const navigation = useNavigation<MilestonesNavigationProp>();
  const { petData, setPetData } = useData();
  const { totalSteps, setTotalSteps } = useContext(PedometerContext);
  const { purchaseItem } = useInventory();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#34C759');
  const [currentMilestoneId, setCurrentMilestoneId] = useState<string | null>(null);
  
  // // Load initial step data - COMMENTED OUT - This was incorrectly setting totalSteps in context
  // useEffect(() => {
  //   const loadInitialSteps = async () => {
  //     if (petData) {
  //       const petCreationTime = new Date(petData.created);
  //       try {
  //         const { steps: totalStepCount } = await Pedometer.getStepCountAsync(
  //           petCreationTime,
  //           new Date()
  //         );
  //         const stepsSinceCreation = Math.max(0, totalStepCount - (petData.startingStepCount || 0));
  //         setTotalSteps(stepsSinceCreation);
  //       } catch (error) {
  //         console.error('Error loading initial steps:', error);
  //       }
  //     }
  //   };

  //   loadInitialSteps();
  // }, [petData]);
  
  useEffect(() => {
    if (petData) {
      setMilestones(petData.milestones);
    }
  }, [petData]);
  
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handleColorConfirm = async () => {
    if (!currentMilestoneId || !petData) return;
    
    const updatedPet = { ...petData };
    const milestoneIndex = updatedPet.milestones.findIndex(m => m.id === currentMilestoneId);
    
    if (milestoneIndex === -1) return;
    
    // Mark as claimed
    updatedPet.milestones[milestoneIndex].claimed = true;
    
    // Apply the selected color based on reward type
    if (updatedPet.milestones[milestoneIndex].reward === 'background') {
      updatedPet.appearance.backgroundTheme = selectedColor;
    } else if (updatedPet.milestones[milestoneIndex].reward === 'nameColor') {
      updatedPet.appearance.nameColor = selectedColor;
    }
    
    // Save updated pet data
    await savePetData(updatedPet);
    setPetData(updatedPet);
    
    // Close color picker and navigate to milestone unlocked screen
    setShowColorPicker(false);
    const milestone = updatedPet.milestones[milestoneIndex];
    navigation.navigate('MilestoneUnlocked', { milestone });
  };
  
  const handleClaimMilestone = async (milestoneId: string) => {
    if (!petData) return;
    
    const milestone = petData.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    
    // For background theme or name color milestone, show color picker
    if (milestone.reward === 'background' || milestone.reward === 'nameColor') {
      setCurrentMilestoneId(milestoneId);
      setShowColorPicker(true);
      return;
    }
    
    const updatedPet = { ...petData };
    const milestoneIndex = updatedPet.milestones.findIndex(m => m.id === milestoneId);
    
    if (milestoneIndex === -1) return;
    
    // Mark as claimed
    updatedPet.milestones[milestoneIndex].claimed = true;
    
    // Apply reward
    switch (milestone.reward) {
      case 'xp':
        updatedPet.xp += 500;
        Alert.alert(
          'Milestone Reward',
          'You gained 500 XP!',
          [{ text: 'Great!' }]
        );
        break;
      case 'appearance':
        updatedPet.appearance.hasCustomization = true;
        // Get random accessory
        const { category, accessory } = getRandomMilestoneAccessory();
        // Initialize equippedItems if it doesn't exist
        if (!updatedPet.equippedItems) {
          updatedPet.equippedItems = {};
        }
        // Assign the accessory and add it to inventory
        updatedPet.equippedItems[category] = accessory;
        await purchaseItem(accessory, 0); // Add to inventory for free
        
        Alert.alert(
          'Milestone Reward',
          `Your pet received a ${accessory.replace('_', ' ')}! Check it out in the Pet Details screen.`,
          [{ text: 'Nice!' }]
        );
        break;
      case 'animation':
        Alert.alert(
          'Milestone Reward',
          'You unlocked a special animation for your pet!',
          [{ text: 'Awesome!' }]
        );
        break;
      case 'badge':
        updatedPet.appearance.hasEliteBadge = true;
        updatedPet.appearance.hasAnimatedBackground = true;
        // Set a default animated background theme if none is set
        if (!updatedPet.appearance.backgroundTheme) {
          updatedPet.appearance.backgroundTheme = 'rgba(90, 200, 250, 0.2)';
        }
        Alert.alert(
          'Milestone Reward',
          'You earned the "Elite Badge" and an animated background!',
          [{ text: 'Amazing!' }]
        );
        break;
    }
    
    // Save updated pet data
    await savePetData(updatedPet);
    setPetData(updatedPet);
    
    // Navigate to milestone unlocked screen
    navigation.navigate('MilestoneUnlocked', { milestone });
  };
  
  const handleAddMilestone = () => {
    if (!petData) return;
    
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      steps: 1000,
      reward: 'xp',
      rewardDetails: '100 XP',
      claimed: false
    };

    const updatedMilestones = [...milestones, newMilestone];
    setMilestones(updatedMilestones);
    setPetData({ ...petData, milestones: updatedMilestones });
  };

  const handleEditMilestone = (milestone: Milestone) => {
    navigation.navigate('MilestoneUnlocked', { milestone });
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    if (!petData) return;
    
    const updatedMilestones = milestones.filter((m: Milestone) => m.id !== milestoneId);
    setMilestones(updatedMilestones);
    setPetData({ ...petData, milestones: updatedMilestones });
  };

  const handleToggleComplete = (milestoneId: string) => {
    if (!petData) return;
    
    const updatedMilestones = milestones.map((m: Milestone) => {
      if (m.id === milestoneId) {
        return { ...m, claimed: !m.claimed };
      }
      return m;
    });
    setMilestones(updatedMilestones);
    setPetData({ ...petData, milestones: updatedMilestones });
  };

  // If no pet data, show empty state
  if (!petData) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Pet Yet</Text>
          <Text style={styles.emptyText}>
            You need to hatch a pet first to start earning milestones.
          </Text>
        </View>
      </View>
    );
  }
  
  // Sort milestones by steps required (ascending)
  const sortedMilestones = [...milestones].sort((a, b) => a.steps - b.steps);
  
  const completedMilestones = milestones.filter(m => m.claimed).length;
  const totalMilestones = milestones.length;

  // Use petData.totalSteps for display and progress
  const displayTotalSteps = petData?.totalSteps ?? 0;
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <HeaderWithGems title="Milestones" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{displayTotalSteps.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Steps</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {completedMilestones}/{totalMilestones}
            </Text>
            <Text style={styles.statLabel}>Milestones Completed</Text>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>Lifetime Milestones</Text>
        
        <View style={styles.milestonesContainer}>
          {sortedMilestones.map((milestone) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              totalSteps={displayTotalSteps}
              onClaim={handleClaimMilestone}
            />
          ))}
        </View>
        
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={16} color="#909090" />
          <Text style={styles.infoText}>
            Milestones are based on your total lifetime steps. Keep walking to unlock more rewards!
          </Text>
        </View>
      </ScrollView>
      
      <Modal
        visible={showColorPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.colorPickerContainer}>
            <Text style={styles.colorPickerTitle}>
              {milestones.find(m => m.id === currentMilestoneId)?.reward === 'background' 
                ? 'Choose Your Background Theme'
                : 'Choose Your Pet Name Color'}
            </Text>
            
            <View style={styles.colorOptions}>
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: '#34C759' }]}
                onPress={() => handleColorSelect('#34C759')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: '#5AC8FA' }]}
                onPress={() => handleColorSelect('#5AC8FA')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: '#FF9500' }]}
                onPress={() => handleColorSelect('#FF9500')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: '#FF2D55' }]}
                onPress={() => handleColorSelect('#FF2D55')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: '#FFD60A' }]}
                onPress={() => handleColorSelect('#FFD60A')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: '#007AFF' }]}
                onPress={() => handleColorSelect('#007AFF')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: '#FF3B30' }]}
                onPress={() => handleColorSelect('#FF3B30')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: '#8C52FF' }]}
                onPress={() => handleColorSelect('#8C52FF')}
              />
            </View>
            
            <View style={styles.selectedColorPreview}>
              <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
              <Text style={styles.selectedColorText}>Selected Color</Text>
            </View>
            
            <View style={styles.colorPickerButtons}>
              <TouchableOpacity
                style={[styles.colorPickerButton, styles.cancelButton]}
                onPress={() => setShowColorPicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.colorPickerButton, styles.confirmButton]}
                onPress={handleColorConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: '#333333',
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: '#8C52FF',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 16,
  },
  milestonesContainer: {
    marginBottom: 20,
  },
  milestoneItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  claimedMilestone: {
    borderColor: '#DADADA',
    backgroundColor: '#F9F9F9',
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
  },
  milestoneReward: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
  },
  milestoneStatus: {
    marginLeft: 10,
  },
  claimedBadge: {
    flexDirection: 'row',
    backgroundColor: '#A3A3A3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  claimedText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  readyBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readyText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  progressText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#8C52FF',
  },
  progressContainer: {
    marginBottom: 12,
  },
  claimButton: {
    backgroundColor: '#8C52FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
  },
  claimButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  colorPickerTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  colorOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  selectedColorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 12,
  },
  selectedColorText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#333333',
  },
  colorPickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  colorPickerButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  confirmButton: {
    backgroundColor: '#8C52FF',
  },
  cancelButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#666666',
  },
  confirmButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default Milestones; 