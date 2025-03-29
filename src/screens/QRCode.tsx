import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import Header from '../components/Header';
import Button from '../components/Button';
import { DataContext } from '../context/DataContext';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const QRCodeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { petData } = useContext(DataContext);
  const qrRef = React.useRef<View>(null);

  // Generate a unique user code
  // In a real app, this would be a user ID from the backend
  const generateUserCode = () => {
    if (!petData) return 'steppet-user-demo';
    return `steppet-user-${petData.id}`;
  };

  const userCode = generateUserCode();

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Share as text (in a real app, this might be a deep link)
      await Share.share({
        message: `Add me as a friend on StepPet! My username is: ${petData?.name || 'StepPetUser'}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'There was a problem sharing your code. Please try again.');
    }
  };

  const handleSaveQR = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!qrRef.current) return;

    try {
      // Capture the QR code as an image
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
      });

      // Share the image
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Save or share your StepPet QR code',
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on your device');
      }
    } catch (error) {
      console.error('Error saving QR code:', error);
      Alert.alert('Error', 'There was a problem saving your QR code. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header
        title="Your QR Code"
        showBackButton
      />

      <View style={styles.content}>
        <Text style={styles.title}>
          Share your QR code with friends
        </Text>
        <Text style={styles.description}>
          Friends can scan this code to add you to their friends list.
        </Text>

        <View style={styles.qrContainer} ref={qrRef}>
          <View style={styles.qrBackground}>
            <QRCode
              value={userCode}
              size={200}
              color="#333333"
              backgroundColor="#FFFFFF"
              logoBackgroundColor="#FFFFFF"
            />
          </View>
          <Text style={styles.usernameText}>
            {petData?.name || 'StepPetUser'}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <Button
            title="Share QR Code"
            onPress={handleSaveQR}
            icon={<Ionicons name="share-outline" size={20} color="#FFFFFF" />}
            style={styles.button}
          />
          
          <TouchableOpacity
            style={styles.textShareButton}
            onPress={handleShare}
          >
            <Text style={styles.textShareButtonText}>Share as Text</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#666666" />
          <Text style={styles.infoText}>
            When friends add you, you'll see them in your friends list and weekly leaderboard.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  qrBackground: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  usernameText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  button: {
    width: '100%',
    marginBottom: 16,
  },
  textShareButton: {
    padding: 10,
  },
  textShareButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#8C52FF',
    textDecorationLine: 'underline',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  infoText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
    flex: 1,
    marginLeft: 8,
  },
});

export default QRCodeScreen; 