import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import Button from '../components/Button';
import { Friend } from '../types/petTypes';

const AddFriend: React.FC = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddFriend = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    // In a real app, this would make an API call to find the user
    // For this demo, we'll simulate finding a user
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network request

      // For demo purposes, create a mock friend
      const newFriend: Friend = {
        id: 'friend-' + Date.now(),
        username: username,
        petName: getRandomPetName(),
        petType: getRandomPetType(),
        petLevel: Math.floor(Math.random() * 4) + 1,
        weeklySteps: Math.floor(Math.random() * 40000) + 10000,
        monthlySteps: Math.floor(Math.random() * 160000) + 40000,
        allTimeSteps: Math.floor(Math.random() * 1000000) + 100000,
        lastActive: new Date().toISOString(),
      };

      // Get existing friends
      const existingFriendsJSON = await AsyncStorage.getItem('@friends_data');
      let existingFriends: Friend[] = existingFriendsJSON ? JSON.parse(existingFriendsJSON) : [];

      // Check if friend already exists
      if (existingFriends.some(friend => friend.username === username)) {
        setIsLoading(false);
        Alert.alert('Friend Exists', 'This user is already your friend.');
        return;
      }

      // Add new friend to list
      existingFriends.push(newFriend);

      // Save updated friends list
      await AsyncStorage.setItem('@friends_data', JSON.stringify(existingFriends));

      // Show success message
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Friend Added',
        `${username} has been added to your friends list!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'There was a problem adding your friend. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanQRCode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // In a real app, this would open the device camera to scan a QR code
    Alert.alert(
      'Scan QR Code',
      'This feature would open your camera to scan a friend\'s QR code.',
      [{ text: 'OK' }]
    );
  };

  // Helper function to get random pet name for demo
  const getRandomPetName = () => {
    const names = ['Luna', 'Blaze', 'Shadow', 'Spark', 'Nova', 'Rocky', 'Misty', 'Pixel'];
    return names[Math.floor(Math.random() * names.length)];
  };

  // Helper function to get random pet type for demo
  const getRandomPetType = () => {
    const types = ['Dragon', 'Unicorn', 'Wolf', 'Eagle', 'FireLizard', 'WaterTurtle', 'RobotDog', 'ClockworkBunny'];
    return types[Math.floor(Math.random() * types.length)] as any;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <Header
        title="Add Friend"
        showBackButton
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Find Friends by Username</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Button
            title="Add Friend"
            onPress={handleAddFriend}
            loading={isLoading}
            disabled={!username.trim() || isLoading}
            style={styles.button}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scan QR Code</Text>
          <Text style={styles.description}>
            Scan your friend's QR code to add them instantly.
          </Text>
          <TouchableOpacity
            style={styles.qrButton}
            onPress={handleScanQRCode}
            activeOpacity={0.7}
          >
            <Ionicons name="qr-code-outline" size={40} color="#8C52FF" />
            <Text style={styles.qrButtonText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#666666" />
          <Text style={styles.infoText}>
            Friends can see your pet information and step count on the leaderboard.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share Your Profile</Text>
          <Text style={styles.description}>
            Share your QR code with friends so they can add you.
          </Text>
          <Button
            title="Show My QR Code"
            onPress={() => navigation.navigate('QRCode' as never)}
            type="outline"
            style={styles.qrCodeButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#333333',
    height: 50,
  },
  button: {
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 24,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EDFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  qrButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#8C52FF',
    marginLeft: 12,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  infoText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
    flex: 1,
    marginLeft: 8,
  },
  qrCodeButton: {
    width: '100%',
  },
});

export default AddFriend; 