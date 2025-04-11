import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { RootStackParamList } from '../types/navigationTypes';
import { UserData, SubscriptionStatus } from '../types/userTypes';

// Custom ID generator for React Native
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

type RegistrationNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Registration'>;

const Registration: React.FC = () => {
  const navigation = useNavigation<RegistrationNavigationProp>();
  const insets = useSafeAreaInsets();
  const { setUserData, setRegistrationStatus } = useUser();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateUsername = (username: string): boolean => {
    // Username must be between 3 and 20 characters
    if (username.length < 3 || username.length > 20) {
      setError('Username must be between 3 and 20 characters');
      return false;
    }

    // Username can only contain letters, numbers, and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    // Username must start with a letter
    if (!/^[a-zA-Z]/.test(username)) {
      setError('Username must start with a letter');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateUsername(username)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if username is already taken
      const existingUsers = await AsyncStorage.getItem('@user_data');
      if (existingUsers) {
        const users = JSON.parse(existingUsers);
        if (users.some((user: UserData) => user.username.toLowerCase() === username.toLowerCase())) {
          setError('Username is already taken');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setIsLoading(false);
          return;
        }
      }

      // Create new user data
      const newUser: UserData = {
        id: generateId(),
        username,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        subscription: {
          tier: 'free',
          startDate: new Date().toISOString(),
          endDate: null,
          isActive: true,
          autoRenew: false
        },
        isRegistered: true
      };

      // Save user data
      await AsyncStorage.setItem('@user_data', JSON.stringify(newUser));
      setUserData(newUser);
      setRegistrationStatus({ isRegistered: true, lastCheck: new Date().toISOString() });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('Main');
    } catch (error) {
      console.error('Error during registration:', error);
      setError('Failed to register. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subtitle}>Choose a username to get started</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#999999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Caprasimo-Regular',
    color: '#8C52FF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#333333',
    backgroundColor: '#F8F8F8',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    height: 50,
    backgroundColor: '#8C52FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
});

export default Registration; 