import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ViewStyle 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface MiniGameCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  stepsRequired: number;
  stepsProgress?: number;
  isActive?: boolean;
  isComplete?: boolean;
  isLocked?: boolean;
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
}

const MiniGameCard: React.FC<MiniGameCardProps> = ({
  title,
  description,
  icon,
  stepsRequired,
  stepsProgress = 0,
  isActive = true,
  isComplete = false,
  isLocked = false,
  onPress,
  color = '#8C52FF',
  style,
}) => {
  const handlePress = () => {
    if (isLocked) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  // Calculate progress percentage
  const progress = Math.min(stepsProgress / stepsRequired, 1);
  const progressWidth = progress * 100;

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        isLocked && styles.lockedContainer,
        style
      ]} 
      onPress={handlePress}
      disabled={isLocked}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons 
            name={isComplete ? 'checkmark' : icon} 
            size={24} 
            color="#FFFFFF" 
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>{title}</Text>
          
          {isLocked && (
            <View style={styles.lockedTextContainer}>
              <Ionicons name="lock-closed" size={12} color="#909090" />
              <Text style={styles.lockedText}>
                Locked
              </Text>
            </View>
          )}
          
          {!isLocked && isComplete && (
            <Text style={[styles.statusText, { color }]}>
              Complete!
            </Text>
          )}
          
          {!isLocked && !isComplete && (
            <>
              <Text style={styles.descriptionText}>{description}</Text>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${progressWidth}%`, backgroundColor: color }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {stepsProgress.toLocaleString()} / {stepsRequired.toLocaleString()} steps
                </Text>
              </View>
            </>
          )}
        </View>
        
        <View style={styles.actionContainer}>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={isLocked ? "#C0C0C0" : "#909090"} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    marginBottom: 16,
    overflow: 'hidden',
  },
  lockedContainer: {
    backgroundColor: '#F5F5F5',
    opacity: 0.8,
  },
  contentContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 2,
  },
  descriptionText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#909090',
  },
  statusText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
  },
  lockedTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#909090',
    marginLeft: 4,
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 12,
  },
});

export default MiniGameCard; 