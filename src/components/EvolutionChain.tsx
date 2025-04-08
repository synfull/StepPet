import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { PetType, GrowthStage } from '../types/petTypes';
import { PET_ICONS } from '../utils/petUtils';

interface EvolutionChainProps {
  petType: PetType;
  currentStage: GrowthStage;
}

interface StageDisplayProps {
  petType: PetType;
  stage: GrowthStage;
  currentStage: GrowthStage;
  isCurrentStage: boolean;
  label: string;
}

const StageDisplay: React.FC<StageDisplayProps> = ({
  petType,
  stage,
  currentStage,
  isCurrentStage,
  label,
}) => {
  const petImages = PET_ICONS[petType];
  const imageSource = petImages[stage];

  // Determine if this stage should be blurred based on evolution order
  const shouldBlur = () => {
    const evolutionOrder: Record<Exclude<GrowthStage, 'Egg'>, number> = {
      'Baby': 1,
      'Juvenile': 2,
      'Adult': 3
    };
    
    // Only blur if this is a future stage
    if (stage === 'Egg' || !evolutionOrder[stage]) return false;
    
    // Get the order of the current stage from props
    const currentStageOrder = evolutionOrder[currentStage as Exclude<GrowthStage, 'Egg'>];
    const thisStageOrder = evolutionOrder[stage];
    
    // Blur if this stage comes after the current stage
    return thisStageOrder > currentStageOrder;
  };

  return (
    <View style={styles.stageContainer}>
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={styles.petImage}
          contentFit="contain"
        />
        {shouldBlur() && (
          <BlurView 
            intensity={8}
            style={StyleSheet.absoluteFill}
            tint="light"
          />
        )}
      </View>
      <Text style={[
        styles.stageLabel,
        isCurrentStage && styles.currentStageLabel
      ]}>
        {label}
      </Text>
    </View>
  );
};

const EvolutionChain: React.FC<EvolutionChainProps> = ({
  petType,
  currentStage,
}) => {
  const renderArrow = () => (
    <View style={styles.arrowContainer}>
      <Ionicons name="arrow-forward" size={24} color="#8C52FF" />
    </View>
  );

  const renderStages = () => {
    switch (currentStage) {
      case 'Baby':
        return (
          <>
            <StageDisplay
              petType={petType}
              stage="Baby"
              currentStage={currentStage}
              isCurrentStage={true}
              label="Baby"
            />
            {renderArrow()}
            <StageDisplay
              petType={petType}
              stage="Juvenile"
              currentStage={currentStage}
              isCurrentStage={false}
              label="Juvenile"
            />
            {renderArrow()}
            <StageDisplay
              petType={petType}
              stage="Adult"
              currentStage={currentStage}
              isCurrentStage={false}
              label="Adult"
            />
          </>
        );
      case 'Juvenile':
        return (
          <>
            <StageDisplay
              petType={petType}
              stage="Baby"
              currentStage={currentStage}
              isCurrentStage={false}
              label="Baby"
            />
            {renderArrow()}
            <StageDisplay
              petType={petType}
              stage="Juvenile"
              currentStage={currentStage}
              isCurrentStage={true}
              label="Juvenile"
            />
            {renderArrow()}
            <StageDisplay
              petType={petType}
              stage="Adult"
              currentStage={currentStage}
              isCurrentStage={false}
              label="Adult"
            />
          </>
        );
      case 'Adult':
        return (
          <>
            <StageDisplay
              petType={petType}
              stage="Baby"
              currentStage={currentStage}
              isCurrentStage={false}
              label="Baby"
            />
            {renderArrow()}
            <StageDisplay
              petType={petType}
              stage="Juvenile"
              currentStage={currentStage}
              isCurrentStage={false}
              label="Juvenile"
            />
            {renderArrow()}
            <StageDisplay
              petType={petType}
              stage="Adult"
              currentStage={currentStage}
              isCurrentStage={true}
              label="Adult"
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderStages()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginVertical: 8,
  },
  stageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  blurredImage: {
    opacity: 0.5,
  },
  stageLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  currentStageLabel: {
    fontFamily: 'Montserrat-Bold',
    color: '#8C52FF',
  },
  arrowContainer: {
    marginHorizontal: 12,
  },
});

export default EvolutionChain; 