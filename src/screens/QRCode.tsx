import React from 'react';
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
import { useData } from '../context/DataContext';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';

const QRCodeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { petData } = useData();
  const qrViewRef = React.useRef<View>(null);

  // Generate a unique user code
  // In a real app, this would be a user ID from the backend
  const generateUserCode = () => {
    if (!petData) return 'steppet-user-demo';
    return `steppet-user-${petData.id}`;
  };

  const userCode = generateUserCode();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

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

    try {
      if (!qrViewRef.current) {
        Alert.alert('Error', 'QR code is not ready. Please try again.');
        return;
      }

      // Create a temporary file
      const fileUri = `${FileSystem.cacheDirectory}qrcode.png`;
      
      // Capture the QR code view
      const uri = await captureRef(qrViewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (!uri) {
        throw new Error('Failed to capture QR code image');
      }

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
      Alert.alert(
        'Error',
        'There was a problem saving your QR code. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header
        title="Your QR Code"
        showBackButton
        onBackPress={handleBack}
      />

      <View style={styles.content}>
        <Text style={styles.title}>
          Share your QR code with friends
        </Text>
        <Text style={styles.description}>
          Friends can scan this code to add you to their friends list.
        </Text>

        <View style={styles.qrContainer}>
          <View style={styles.qrBackground} ref={qrViewRef}>
            <QRCode
              value={userCode}
              size={200}
              color="#333333"
              backgroundColor="#FFFFFF"
              logoBackgroundColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Share QR Code"
            onPress={handleSaveQR}
            type="primary"
            size="large"
            style={styles.button}
          />
          <Button
            title="Share Username"
            onPress={handleShare}
            type="secondary"
            size="large"
            style={styles.button}
          />
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
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  button: {
    width: '100%',
    marginBottom: 16,
  },
});

export default QRCodeScreen; 