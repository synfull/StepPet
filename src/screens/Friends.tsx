import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types/navigationTypes';
import { PET_ICONS } from '../utils/petUtils';
import { formatRelativeTime } from '../utils/dateUtils';
import HeaderWithGems from '../components/HeaderWithGems';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { PetType, GrowthStage } from '../types/petTypes';

type FriendsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Friends'>;
type TimePeriod = 'weekly' | 'monthly' | 'allTime';

interface Friend {
  id: string;
  username: string;
  pet_name: string;
  pet_type: PetType;
  pet_level: number;
  weekly_steps: number;
  monthly_steps: number;
  all_time_steps: number;
  last_active: string;
  isCrowned: boolean;
}

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  username: string;
}

interface FriendItemProps {
  friend: Friend;
  rank: number;
  onPress: (friend: Friend) => void;
  timePeriod: TimePeriod;
}

const FriendItem: React.FC<FriendItemProps> = ({ friend, rank, onPress, timePeriod }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(friend);
  };

  const getStepCount = () => {
    switch (timePeriod) {
      case 'weekly':
        return friend.weekly_steps;
      case 'monthly':
        return friend.monthly_steps;
      case 'allTime':
        return friend.all_time_steps;
    }
  };

  const getPetImage = () => {
    const petIcon = PET_ICONS[friend.pet_type];
    if (!petIcon) return require('../../assets/images/egg.png');
    return petIcon.Adult;
  };

  return (
    <TouchableOpacity 
      style={styles.friendItem}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
      
      <Image 
        source={getPetImage()}
        style={styles.petImage}
        resizeMode="contain"
      />
      
      <View style={styles.friendInfo}>
        <Text style={styles.username}>{friend.username}</Text>
        <Text style={styles.petName}>{friend.pet_name}</Text>
        <Text style={styles.stepCount}>{getStepCount().toLocaleString()} steps</Text>
      </View>
      
      {friend.isCrowned && (
        <View style={styles.crownContainer}>
          <Ionicons name="trophy" size={24} color="#FFD700" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const Friends: React.FC = () => {
  const navigation = useNavigation<FriendsNavigationProp>();
  const insets = useSafeAreaInsets();
  const { petData } = useData();
  const { userData } = useUser();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');

  useEffect(() => {
    loadFriends();
    loadFriendRequests();

    // Subscribe to friend request changes
    const friendRequestsSubscription = supabase
      .channel('friend-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships',
        filter: `friend_id=eq.${userData?.id}`,
      }, () => {
        loadFriendRequests();
      })
      .subscribe();

    return () => {
      friendRequestsSubscription.unsubscribe();
    };
  }, [userData?.id]);

  const loadFriends = async () => {
    if (!userData?.id) return;
    
    setLoading(true);
    try {
      // 1. Get accepted friendship IDs
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('user_id, friend_id') // Select only needed IDs
        .eq('status', 'accepted')
        .or(`user_id.eq.${userData.id},friend_id.eq.${userData.id}`);

      if (friendshipsError) throw friendshipsError;

      // 2. Extract unique friend IDs (excluding self)
      const friendIds = [ 
          ...new Set( // Use Set to get unique IDs
              friendships
                .map(f => (f.user_id === userData.id ? f.friend_id : f.user_id))
                .filter(id => id !== userData.id) // Ensure self is not included
          )
      ];

      if (friendIds.length === 0) {
        setFriends([]); // No friends, clear list
        setLoading(false);
        return;
      }
      
      // 3. Fetch profiles for friend IDs
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, last_active') // Select ONLY columns in profiles table
        .in('id', friendIds);

      if (profilesError) throw profilesError;

      // 4. Fetch pets for friend IDs
      const { data: pets, error: petsError } = await supabase
        .from('pets') // Use actual pets table name
        // Select necessary pet details + user_id for joining
        .select('user_id, name, type, level, total_steps, weekly_steps, monthly_steps') 
        .in('user_id', friendIds);
        
      if (petsError) throw petsError;

      // 5. Combine profile and pet data
      const friendList: Friend[] = profiles.map(profile => {
          // Find the corresponding pet for this profile
          const pet = pets.find(p => p.user_id === profile.id);
          return {
              id: profile.id,
              username: profile.username,
              last_active: profile.last_active,
              // Get pet details from the found pet object, provide defaults if no pet found
              pet_name: pet?.name || 'N/A',
              pet_type: pet?.type || '' as PetType, // Cast as PetType, default to empty string
              pet_level: pet?.level || 0,
              weekly_steps: pet?.weekly_steps || 0, // Assuming these columns exist in your pets table
              monthly_steps: pet?.monthly_steps || 0, // Assuming these columns exist
              all_time_steps: pet?.total_steps || 0, // Use total_steps for all time
              isCrowned: false, // Will be set after sorting
          };
      });

      // 6. Sort friends based on timePeriod (keep existing sort logic)
      friendList.sort((a, b) => {
        let aSteps, bSteps;
        switch (timePeriod) {
          case 'weekly':
            aSteps = a.weekly_steps;
            bSteps = b.weekly_steps;
            break;
          case 'monthly':
            aSteps = a.monthly_steps;
            bSteps = b.monthly_steps;
            break;
          case 'allTime':
            aSteps = a.all_time_steps;
            bSteps = b.all_time_steps;
            break;
          default:
            aSteps = a.weekly_steps;
            bSteps = b.weekly_steps;
        }
        return bSteps - aSteps;
      });

      // 7. Set crown for top 3 friends (keep existing crown logic)
      const crownedFriendList = friendList.map((friend, index) => ({
        ...friend,
        isCrowned: index < 3
      }));

      setFriends(crownedFriendList);
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    if (!userData?.id) return;

    try {
      // First get pending friend requests
      const { data: requests, error: requestsError } = await supabase
        .from('friendships')
        .select('id, user_id, friend_id, status')
        .eq('friend_id', userData.id)
        .eq('status', 'pending');

      if (requestsError) throw requestsError;

      // Get the usernames of the requesters
      const requesterIds = requests.map(request => request.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', requesterIds);

      if (profilesError) throw profilesError;

      // Map usernames to requests
      const requestsWithUsernames = requests.map(request => {
        const profile = profiles.find(p => p.id === request.user_id);
        return {
          id: request.id,
          user_id: request.user_id,
          friend_id: request.friend_id,
          status: request.status,
          username: profile?.username || 'Unknown User',
        };
      });

      setFriendRequests(requestsWithUsernames);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const handleFriendRequest = async (requestId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      Haptics.notificationAsync(
        accept 
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );

      loadFriendRequests();
      if (accept) loadFriends();
    } catch (error) {
      console.error('Error handling friend request:', error);
      Alert.alert('Error', 'Failed to process friend request. Please try again.');
    }
  };

  const handleAddFriend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AddFriend');
  };

  const handleFriendPress = (friend: Friend) => {
    const stepCount = timePeriod === 'weekly' 
      ? friend.weekly_steps 
      : timePeriod === 'monthly'
        ? friend.monthly_steps
        : friend.all_time_steps;

    Alert.alert(
      `${friend.username}'s Profile`,
      `Pet: ${friend.pet_name}\nType: ${friend.pet_type}\nLevel: ${friend.pet_level}\n${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Steps: ${stepCount.toLocaleString()}\nLast Active: ${formatRelativeTime(friend.last_active)}`,
      [{ text: 'OK' }]
    );
  };

  const handleTimePeriodChange = (period: TimePeriod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimePeriod(period);
  };

  const renderTimePeriodSelector = () => (
    <View style={styles.timePeriodSelector}>
      <TouchableOpacity
        style={[
          styles.timePeriodButton,
          timePeriod === 'weekly' && styles.selectedTimePeriod
        ]}
        onPress={() => handleTimePeriodChange('weekly')}
      >
        <Text style={[
          styles.timePeriodText,
          timePeriod === 'weekly' && styles.selectedTimePeriodText
        ]}>Weekly</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.timePeriodButton,
          timePeriod === 'monthly' && styles.selectedTimePeriod
        ]}
        onPress={() => handleTimePeriodChange('monthly')}
      >
        <Text style={[
          styles.timePeriodText,
          timePeriod === 'monthly' && styles.selectedTimePeriodText
        ]}>Monthly</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.timePeriodButton,
          timePeriod === 'allTime' && styles.selectedTimePeriod
        ]}
        onPress={() => handleTimePeriodChange('allTime')}
      >
        <Text style={[
          styles.timePeriodText,
          timePeriod === 'allTime' && styles.selectedTimePeriodText
        ]}>All Time</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.friendRequestItem}>
      <View style={styles.friendRequestInfo}>
        <Text style={styles.friendRequestUsername}>{item.username}</Text>
        <Text style={styles.friendRequestText}>wants to be your friend</Text>
      </View>
      <View style={styles.friendRequestActions}>
        <TouchableOpacity
          style={[styles.friendRequestButton, styles.acceptButton]}
          onPress={() => handleFriendRequest(item.id, true)}
        >
          <Ionicons name="checkmark-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.friendRequestButton, styles.rejectButton]}
          onPress={() => handleFriendRequest(item.id, false)}
        >
          <Ionicons name="close-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const headerRightComponent = (
    <TouchableOpacity 
      onPress={handleAddFriend}
      style={styles.headerButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="person-add-outline" size={24} color="#8C52FF" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <HeaderWithGems title="Friends" />
      
      <View style={styles.content}>
        <View style={styles.userInfoContainer}>
          <Text style={styles.yourUsernameLabel}>Your Username:</Text>
          <Text style={styles.yourUsername}>{userData?.username || 'Not set'}</Text>
          <Text style={styles.usernameHelpText}>Share this with friends to add you!</Text>
        </View>

        {friendRequests.length > 0 && (
          <View style={styles.friendRequestsSection}>
            <Text style={styles.sectionTitle}>Friend Requests</Text>
            <FlatList
              data={friendRequests}
              renderItem={renderFriendRequest}
              keyExtractor={item => item.id}
              horizontal={false}
              scrollEnabled={false}
            />
          </View>
        )}

        {friends.length > 0 && (
          <>
            <View style={styles.leaderboardHeader}>
              <Text style={styles.leaderboardTitle}>
                {timePeriod === 'weekly' 
                  ? 'Weekly' 
                  : timePeriod === 'monthly'
                    ? 'Monthly'
                    : 'All Time'} Leaderboard
              </Text>
              <Text style={styles.leaderboardSubtitle}>Top 3 earn a crown!</Text>
            </View>

            {renderTimePeriodSelector()}
          </>
        )}
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8C52FF" />
            <Text style={styles.loadingText}>Loading friends...</Text>
          </View>
        ) : friends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#D0D0D0" />
            <Text style={styles.emptyTitle}>No Friends Yet</Text>
            <Text style={styles.emptyText}>
              Add friends to see their pets and compare steps on the leaderboard.
            </Text>
            <TouchableOpacity 
              style={styles.addFriendButton}
              onPress={handleAddFriend}
            >
              <Text style={styles.addFriendButtonText}>Add Friends</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={friends}
            renderItem={({ item, index }) => (
              <FriendItem 
                friend={item} 
                rank={index + 1} 
                onPress={handleFriendPress}
                timePeriod={timePeriod}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    paddingHorizontal: 20,
  },
  leaderboardHeader: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  leaderboardTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 2,
  },
  leaderboardSubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
  },
  timePeriodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  timePeriodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedTimePeriod: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timePeriodText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
  },
  selectedTimePeriodText: {
    color: '#8C52FF',
    fontFamily: 'Montserrat-SemiBold',
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addFriendButton: {
    backgroundColor: '#8C52FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  addFriendButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#333333',
  },
  petImage: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
    marginRight: 8,
  },
  username: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 2,
  },
  petName: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  stepCount: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#8C52FF',
  },
  crownContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  userInfoContainer: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  yourUsernameLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  yourUsername: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#8C52FF',
    marginBottom: 8,
  },
  usernameHelpText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
  },
  headerButton: {
    padding: 8,
  },
  friendRequestsSection: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  friendRequestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendRequestInfo: {
    flex: 1,
  },
  friendRequestUsername: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#333',
  },
  friendRequestText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666',
  },
  friendRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  friendRequestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
});

export default Friends; 