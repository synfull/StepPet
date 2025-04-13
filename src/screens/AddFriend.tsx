import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Header from '../components/Header';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';
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
      console.log('Searching for username:', username.trim());
      
      // First try to get all matching users to debug
      const { data: allMatches, error: matchError } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${username.trim()}%`);
        
      console.log('All potential matches:', allMatches);
      
      if (matchError) {
        console.error('Error searching for users:', matchError);
        Alert.alert('Error', 'There was a problem searching for users.');
        setIsLoading(false);
        return;
      }

      // Then get the exact match if it exists
      const foundUser = allMatches?.find(
        user => user.username.toLowerCase() === username.trim().toLowerCase()
      );

      console.log('Found exact match:', foundUser);

      if (!foundUser) {
        Alert.alert('User Not Found', 'Could not find a user with that username.');
        setIsLoading(false);
        return;
      }

      // Check if friendship already exists
      const { data: existingFriendship, error: friendshipError } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${userData?.id},friend_id.eq.${userData?.id}`)
        .or(`user_id.eq.${foundUser.id},friend_id.eq.${foundUser.id}`)
        .single();

      if (existingFriendship) {
        Alert.alert('Already Friends', 'You are already friends with this user or have a pending request.');
        setIsLoading(false);
        return;
      }

      // Create friend request
      const { error: createError } = await supabase
        .from('friendships')
        .insert({
          user_id: userData?.id,
          friend_id: foundUser.id,
          status: 'pending'
        });

      if (createError) {
        throw createError;
      }

      // Show success message
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Friend request sent!');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'There was a problem sending the friend request. Please try again.');
    } finally {
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
            title="Send Friend Request"
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