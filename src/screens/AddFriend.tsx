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
import { useUser } from '../context/UserContext';

const AddFriend: React.FC = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { userData } = useUser();

  const handleAddFriend = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    // Check if trying to add self
    if (username.trim().toLowerCase() === userData?.username?.toLowerCase()) {
      Alert.alert('Error', 'You cannot add yourself as a friend');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      // Get existing friends
      const existingFriendsJSON = await AsyncStorage.getItem('@friends_data');
      let existingFriends: Friend[] = existingFriendsJSON ? JSON.parse(existingFriendsJSON) : [];

      // Check if friend already exists
      if (existingFriends.some(friend => friend.username.toLowerCase() === username.toLowerCase())) {
        setIsLoading(false);
        Alert.alert('Friend Exists', 'This user is already your friend.');
        return;
      }

      // TODO: In a real app, we would make an API call here to verify the user exists
      // For now, we'll show a disclaimer
      Alert.alert(
        'Add Friend',
        `Note: This is a demo version. In the full app, we would verify if "${username}" exists before adding them.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsLoading(false)
          },
          {
            text: 'Continue Anyway',
            onPress: async () => {
              // Create new friend with initial data
              const newFriend: Friend = {
                id: 'friend-' + Date.now(),
                username: username,
                petName: 'Demo Pet',
                petType: 'lunacorn',
                petLevel: 1,
                weeklySteps: 0,
                monthlySteps: 0,
                allTimeSteps: 0,
                lastActive: new Date().toISOString(),
              };

              // Add new friend to list
              existingFriends.push(newFriend);

              // Save updated friends list
              await AsyncStorage.setItem('@friends_data', JSON.stringify(existingFriends));

              // Show success message
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'There was a problem adding your friend. Please try again.');
      setIsLoading(false);
    }
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

        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#666666" />
          <Text style={styles.infoText}>
            Friends can see your pet information and step count on the leaderboard.
          </Text>
        </View>

        <View style={[styles.infoContainer, styles.warningContainer]}>
          <Ionicons name="warning-outline" size={20} color="#FFB100" />
          <Text style={[styles.infoText, styles.warningText]}>
            Demo Version: Friend verification is not implemented yet. Any username can be added.
          </Text>
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
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  warningContainer: {
    backgroundColor: '#FFF8E7',
  },
  infoText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
    flex: 1,
    marginLeft: 8,
  },
  warningText: {
    color: '#B37800',
  },
});

export default AddFriend; 