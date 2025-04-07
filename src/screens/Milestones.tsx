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
import { DataContext } from '../context/DataContext';
import { PedometerContext } from '../context/PedometerContext';
import { RootStackParamList } from '../types/navigationTypes';
import { Milestone } from '../types/petTypes';
import { savePetData } from '../utils/petUtils';
import ProgressBar from '../components/ProgressBar';

type MilestonesNavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
  const { petData, setPetData } = useContext(DataContext);
  const { dailySteps } = useContext(PedometerContext);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#34C759');
  const [currentMilestoneId, setCurrentMilestoneId] = useState<string | null>(null);
  
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
    
    // Apply the selected background theme
    updatedPet.appearance.backgroundTheme = selectedColor;
    
    // Save updated pet data
    await savePetData(updatedPet);
    setPetData(updatedPet);
    
    // Close color picker and navigate to milestone unlocked screen
    setShowColorPicker(false);
    navigation.navigate('MilestoneUnlocked', { milestoneId: currentMilestoneId });
  };
  
  const handleClaimMilestone = async (milestoneId: string) => {
    if (!petData) return;
    
    const milestone = petData.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    
    // For background theme milestone, show color picker
    if (milestone.reward === 'background') {
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
        Alert.alert(
          'Milestone Reward',
          'Your pet has a new appearance option! Check it out in the Pet Details screen.',
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
    navigation.navigate('MilestoneUnlocked', { milestoneId });
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
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Milestones</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dailySteps.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Steps</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {sortedMilestones.filter(m => m.claimed).length}/{sortedMilestones.length}
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
              totalSteps={dailySteps}
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
            <Text style={styles.colorPickerTitle}>Choose Your Background Theme</Text>
            
            <View style={styles.colorOptions}>
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: 'rgba(52, 199, 89, 0.2)' }]}
                onPress={() => handleColorSelect('rgba(52, 199, 89, 0.2)')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: 'rgba(90, 200, 250, 0.2)' }]}
                onPress={() => handleColorSelect('rgba(90, 200, 250, 0.2)')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: 'rgba(255, 149, 0, 0.2)' }]}
                onPress={() => handleColorSelect('rgba(255, 149, 0, 0.2)')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: 'rgba(255, 45, 85, 0.2)' }]}
                onPress={() => handleColorSelect('rgba(255, 45, 85, 0.2)')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: 'rgba(255, 214, 10, 0.2)' }]}
                onPress={() => handleColorSelect('rgba(255, 214, 10, 0.2)')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: 'rgba(0, 122, 255, 0.2)' }]}
                onPress={() => handleColorSelect('rgba(0, 122, 255, 0.2)')}
              />
              <TouchableOpacity
                style={[styles.colorOption, { backgroundColor: 'rgba(255, 59, 48, 0.2)' }]}
                onPress={() => handleColorSelect('rgba(255, 59, 48, 0.2)')}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
    color: '#333333',
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