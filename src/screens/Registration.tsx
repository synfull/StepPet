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
import { createNewPet } from '../utils/petUtils';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';
import { PetData, MiniGames } from '../types/petTypes';

// Custom ID generator for React Native
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

type RegistrationNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Registration'>;

// Helper function to convert object keys from camelCase to snake_case (can be moved to a utils file)
const keysToSnakeCase = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(keysToSnakeCase);
    }
    return Object.keys(obj).reduce((acc, key) => {
        // Basic conversion, might need refinement for nested objects if not already handled
        const snakeCaseKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        acc[snakeCaseKey] = keysToSnakeCase(obj[key]);
        return acc;
    }, {} as any);
};

const Registration: React.FC = () => {
  const navigation = useNavigation<RegistrationNavigationProp>();
  const insets = useSafeAreaInsets();
  const { setUserData, setRegistrationStatus } = useUser();
  const { signUp } = useAuth();
  const { setPetData } = useData();
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
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('username', { count: 'exact', head: true })
        .ilike('username', username);

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Database error checking username:', checkError);
        setError('Failed to check username availability. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsLoading(false);
        return;
      }

      if (existingProfile && existingProfile.length > 0) {
        setError('Username is already taken');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsLoading(false);
        return;
      }

      // Sign up with Supabase
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
      const userId = session.user.id; // Store user ID

      // Insert Profile (as before)
      const { data: insertedProfileData, error: profileInsertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: username,
          email: email,
          last_active: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileInsertError) {
        console.error('Profile insertion failed:', JSON.stringify(profileInsertError));

        // Determine specific error message
        let specificErrorMessage: string;
        if (profileInsertError.code === '23505') {
          specificErrorMessage = 'Username is already taken. Please choose another.';
        } else {
          specificErrorMessage = 'Failed to save user profile. Please try again.';
        }

        throw new Error(specificErrorMessage);
      }

      // --- New Pet Creation ---
      // 1. Create the initial pet object in memory
      const newPetObject: PetData = await createNewPet(0, '', 'mythic', 'Egg');
      const petId = newPetObject.id; // Get the generated pet ID

      // 2. Prepare Pet Data for Supabase Insert (snake_case, add user_id)
      const { miniGames: initialMiniGames, milestones: initialMilestones, ...petFieldsRaw } = newPetObject;
      const petFieldsForInsert = keysToSnakeCase(petFieldsRaw);
      petFieldsForInsert.user_id = userId; // Add user_id
      // Ensure ID is included
      petFieldsForInsert.id = petId;

      // 3. Direct INSERT into 'pets' table
      const { error: petInsertError } = await supabase
        .from('pets')
        .insert(petFieldsForInsert);

      if (petInsertError) {
        console.error('[Registration] Direct Pet INSERT failed:', petInsertError);
        // Handle potential errors, maybe try to clean up profile?
        throw new Error('Failed to create initial pet record.');
      }

      // 4. Prepare and Insert Initial MiniGames Data
      if (initialMiniGames) {
        const gameTypes = Object.keys(initialMiniGames) as Array<keyof MiniGames>;
        const insertPromises = [];

        for (const gameType of gameTypes) {
          const gameData = initialMiniGames[gameType];
          let rowToInsert: any = {
            pet_id: petId, // Use the pet's ID
            game_type: gameType,
          };

          // Add fields specific to game type (similar to DataContext logic)
          if (gameType === 'feed') {
            if ('lastClaimed' in gameData) rowToInsert.last_claimed = gameData.lastClaimed || null;
            if ('claimedToday' in gameData) rowToInsert.claimed_today = gameData.claimedToday;
          } else if (gameType === 'fetch') {
            if ('lastClaimed' in gameData) rowToInsert.last_claimed = gameData.lastClaimed || null;
            if ('claimsToday' in gameData) rowToInsert.claims_today = gameData.claimsToday;
          } else if (gameType === 'adventure') {
            if ('lastStarted' in gameData) rowToInsert.last_started = gameData.lastStarted || null;
            if ('lastCompleted' in gameData) rowToInsert.last_completed = gameData.lastCompleted || null;
            if ('currentProgress' in gameData) rowToInsert.current_progress = gameData.currentProgress;
            if ('isActive' in gameData) rowToInsert.is_active = gameData.isActive;
          }

          // Clean up undefined values
          Object.keys(rowToInsert).forEach(key => {
            if (rowToInsert[key] === undefined) {
              rowToInsert[key] = null;
            }
          });

          insertPromises.push(
            supabase.from('mini_games').insert(rowToInsert)
          );
        }

        // Execute all inserts
        const results = await Promise.allSettled(insertPromises);
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
          } else {
            console.error(`[Registration] Error inserting MiniGame (${gameTypes[index]}):`, result.reason);
          }
        });
      }

      // 5. Prepare and Insert Initial Milestones Data
      if (initialMilestones && initialMilestones.length > 0) {
        const insertMilestonePromises = [];
        for (const milestone of initialMilestones) {
          const { id: milestoneIdentifier, ...milestoneData } = milestone; // Extract identifier
          const milestoneToInsert = {
            ...keysToSnakeCase(milestoneData),
            pet_id: petId,
            milestone_id: milestoneIdentifier, // Ensure this is the string ID
          };
          insertMilestonePromises.push(
            supabase.from('milestones').insert(milestoneToInsert)
          );
        }
        const milestoneResults = await Promise.allSettled(insertMilestonePromises);
        milestoneResults.forEach((result, index) => {
          const milestoneIdentifier = initialMilestones[index].id;
          if (result.status === 'fulfilled') {
          } else {
            console.error(`[Registration] Error inserting Milestone ID (${milestoneIdentifier}):`, result.reason);
          }
        });
      }

      // --- End New Pet Creation ---

      const fullPetData: PetData = { ...newPetObject, miniGames: initialMiniGames, milestones: initialMilestones };

      setUserData({
        id: userId,
        username: username,
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
      });
      setRegistrationStatus({ isRegistered: true, lastCheck: new Date().toISOString() }, 'handleRegister');

      setPetData(fullPetData);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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