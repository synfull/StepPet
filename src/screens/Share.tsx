import React, { useRef, useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { DataContext } from '../context/DataContext';
import { RootStackParamList } from '../types/navigationTypes';
import { Share as RNShare } from 'react-native';
import analytics from '@react-native-firebase/analytics';
import Header from '../components/Header';
import Button from '../components/Button';
import PetDisplay from '../components/PetDisplay';

type ShareProps = NativeStackScreenProps<RootStackParamList, 'Share'>;

const Share: React.FC<ShareProps> = ({ route }) => {
  const { type, data } = route.params;
  const navigation = useNavigation();
  const { petData } = useContext(DataContext);
  const [isLoading, setIsLoading] = useState(false);
  const shareCardRef = useRef<View>(null);

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    
    let shareMethod = 'unknown';
    let shareContentType = type;
    let shareItemId = type === 'levelUp' ? `level_${data.level}` : `milestone_${data.steps}`;
    
    try {
      // Capture the card as an image
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 1,
      });
      
      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        shareMethod = 'image';
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your achievement',
        });
        // Log share event (image)
        try {
           await analytics().logEvent('share', { 
             method: shareMethod,
             content_type: shareContentType,
             item_id: shareItemId
           });
        } catch (analyticsError) {
          console.error('[Analytics] Error logging share event (image):', analyticsError);
        }
      } else {
        // Fallback to text sharing if image sharing is not available
        await shareAsText();
      }
    } catch (error) {
      console.error('Error sharing:', error);
       // Log share failure (optional, depends on requirements)
      try {
         await analytics().logEvent('share_fail', {
           method: shareMethod,
           content_type: shareContentType,
           item_id: shareItemId,
           error_message: error instanceof Error ? error.message : String(error)
         });
      } catch (analyticsError) {
        console.error('[Analytics] Error logging share_fail event:', analyticsError);
      }
      Alert.alert(
        'Error',
        'There was a problem sharing your achievement. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const shareAsText = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    let shareMethod = 'text';
    let shareContentType = type;
    let shareItemId = type === 'levelUp' ? `level_${data.level}` : `milestone_${data.steps}`;
    
    try {
      let message = '';
      
      if (type === 'levelUp') {
        message = `My ${petData?.type} pet in StepPet just reached level ${data.level}! 🎉 Walking has never been more rewarding!`;
      } else if (type === 'milestone') {
        message = `I just reached ${data.steps?.toLocaleString()} steps in StepPet and unlocked: ${data.rewardDetails}! 🏆 Walking with my virtual pet is so much fun!`;
      }
      
      await RNShare.share({
        message,
      });
      // Log share event (text)
      try {
         await analytics().logEvent('share', { 
           method: shareMethod,
           content_type: shareContentType,
           item_id: shareItemId
         });
      } catch (analyticsError) {
        console.error('[Analytics] Error logging share event (text):', analyticsError);
      }
    } catch (error) {
      console.error('Error sharing text:', error);
       // Log share failure (text)
      try {
         await analytics().logEvent('share_fail', { 
           method: shareMethod,
           content_type: shareContentType,
           item_id: shareItemId,
           error_message: error instanceof Error ? error.message : String(error)
         });
      } catch (analyticsError) {
        console.error('[Analytics] Error logging share_fail event (text):', analyticsError);
      }
    }
  };
  
  const handleSkip = () => {
    if (type === 'levelUp' && data.level === 3) {
      navigation.navigate('Paywall');
    } else {
      navigation.navigate('Main' as never);
    }
  };
  
  // Generate appropriate content based on share type
  const renderShareCard = () => {
    if (type === 'levelUp') {
      return (
        <View style={styles.shareCard} ref={shareCardRef}>
          <View style={styles.cardHeader}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>StepPet</Text>
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.achievementTitle}>Level Up!</Text>
            <PetDisplay
              petType={petData?.type || 'Dragon'}
              growthStage={data.level <= 1 ? 'Egg' : data.level <= 5 ? 'Baby' : data.level <= 10 ? 'Juvenile' : 'Adult'}
              level={data.level}
              mainColor="#8C52FF"
              accentColor="#5EFFA9"
              size="large"
              interactive={false}
            />
            <Text style={styles.cardText}>
              My {petData?.type} just reached
            </Text>
            <Text style={styles.highlightText}>Level {data.level}!</Text>
            <Text style={styles.cardSubtext}>
              Walking has never been more rewarding!
            </Text>
          </View>
          
          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>StepPet • Turn steps into pet adventures</Text>
          </View>
        </View>
      );
    } else if (type === 'milestone') {
      return (
        <View style={styles.shareCard} ref={shareCardRef}>
          <View style={styles.cardHeader}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>StepPet</Text>
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.achievementTitle}>Milestone Achieved!</Text>
            <View style={styles.milestoneIconContainer}>
              <Ionicons
                name={
                  data.reward === 'xp' ? 'flash' :
                  data.reward === 'appearance' ? 'color-palette' :
                  data.reward === 'background' ? 'image' :
                  data.reward === 'animation' ? 'sparkles' :
                  'trophy'
                }
                size={80}
                color="#8C52FF"
              />
            </View>
            <Text style={styles.cardText}>
              I reached
            </Text>
            <Text style={styles.highlightText}>{data.steps?.toLocaleString()} Steps!</Text>
            <Text style={styles.cardSubtext}>
              Unlocked: {data.rewardDetails}
            </Text>
          </View>
          
          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>StepPet • Turn steps into pet adventures</Text>
          </View>
        </View>
      );
    }
    
    return null;
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header
        title="Share Achievement"
        showBackButton
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Share your achievement</Text>
        <Text style={styles.description}>
          Let your friends know about your progress in StepPet!
        </Text>
        
        {renderShareCard()}
        
        <View style={styles.buttonsContainer}>
          <Button
            title="Share"
            onPress={handleShare}
            loading={isLoading}
            icon={<Ionicons name="share-social-outline" size={20} color="#FFFFFF" />}
            style={styles.shareButton}
          />
          
          <TouchableOpacity
            style={styles.textShareButton}
            onPress={shareAsText}
          >
            <Text style={styles.textShareButtonText}>Share as Text</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  shareCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3EDFF',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  appName: {
    fontFamily: 'Caprasimo-Regular',
    fontSize: 18,
    color: '#8C52FF',
  },
  cardContent: {
    alignItems: 'center',
    padding: 24,
  },
  achievementTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: '#333333',
    marginBottom: 16,
  },
  cardText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  highlightText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: '#8C52FF',
    marginVertical: 8,
  },
  cardSubtext: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  milestoneIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  cardFooter: {
    padding: 12,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#909090',
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  shareButton: {
    width: '100%',
    marginBottom: 16,
  },
  textShareButton: {
    padding: 10,
    marginBottom: 8,
  },
  textShareButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#8C52FF',
    textDecorationLine: 'underline',
  },
  skipButton: {
    padding: 10,
  },
  skipButtonText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
  },
});

export default Share; 