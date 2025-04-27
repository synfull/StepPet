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
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigationTypes';
import { UserData, SubscriptionStatus } from '../types/userTypes';
import { createNewPet, savePetData } from '../utils/petUtils';
import { supabase } from '../lib/supabase';

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
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!validateUsername(username) || !validateEmail(email) || !validatePassword(password)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if username is already taken in Supabase
      console.log(`Checking username: ${username}`);
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('username', { count: 'exact', head: true })
        .ilike('username', username);

      console.log(`Username check result - existingProfile: ${JSON.stringify(existingProfile)}, checkError: ${JSON.stringify(checkError)}`);

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Database error checking username:', checkError);
        setError('Failed to check username availability. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsLoading(false);
        return;
      }

      if (existingProfile && existingProfile.length > 0) {
        console.log('Username already taken.');
        setError('Username is already taken');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsLoading(false);
        return;
      }

      // Sign up with Supabase using the provided email
      const { error: authError } = await signUp(email, password);
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Failed to create account. Please try again later.');
      }

      // Get the current session to get the user ID
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('Failed to get user session');
      }

      // --- Refined Error Handling ---
      // 1. Attempt Profile Insertion
      const { data: insertedProfileData, error: profileInsertError } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          username: username,
          email: email,
          pet_name: 'My Pet',
          pet_type: 'Egg',
          pet_level: 1,
          weekly_steps: 0,
          monthly_steps: 0,
          all_time_steps: 0,
          last_active: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select() // Select after insert (optional, but can confirm insert)
        .single(); // Use single if you expect one row back on success

      // 2. Check specifically for profile insertion errors
      if (profileInsertError) {
          console.error('Profile insertion failed:', JSON.stringify(profileInsertError));

          // Determine specific error message
          let specificErrorMessage: string;
          if (profileInsertError.code === '23505') {
             specificErrorMessage = 'Username is already taken. Please choose another.';
          } else {
             specificErrorMessage = 'Failed to save user profile. Please try again.';
          }

          // --- Modification Start --- 
          // Throw error instead of setting state and returning here
          throw new Error(specificErrorMessage);
          // --- Modification End ---
      }

      // 3. If no error, profile creation was successful
       console.log('Profile created successfully:', insertedProfileData);
      // --- End Refined Error Handling ---

      // Create new user data
      const newUser: UserData = {
        id: session.user.id,  // Use Supabase user ID instead of generating one
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
      
      // Create a new pet with 0 steps
      const newPet = await createNewPet(0, '', 'mythic', 'Egg');
      await savePetData(newPet);
      
      // Navigate to Main screen after registration
      navigation.navigate('Main');

    } catch (error) {
      console.error('Error during registration:', error);
      setError(error instanceof Error ? error.message : 'Failed to register. Please try again.');
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
        <Text style={styles.subtitle}>Enter your details to get started</Text>

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
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#999999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
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
    marginBottom: 15,
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