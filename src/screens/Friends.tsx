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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types/navigationTypes';
import { Friend } from '../types/petTypes';
import { formatRelativeTime } from '../utils/dateUtils';
import { PET_ICONS } from '../utils/petUtils';
import Header from '../components/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../context/DataContext';

type FriendsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Friends'>;

type TimePeriod = 'weekly' | 'monthly' | 'allTime';

// Sample friend data for demonstration
const SAMPLE_FRIENDS: Friend[] = [
  {
    id: 'f1',
    username: 'walker123',
    petName: 'Blaze',
    petType: 'lunacorn',
    petLevel: 3,
    weeklySteps: 42500,
    monthlySteps: 168000,
    allTimeSteps: 1250000,
    lastActive: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    isCrowned: true
  },
  {
    id: 'f2',
    username: 'stepmaster',
    petName: 'Luna',
    petType: 'embermane',
    petLevel: 4,
    weeklySteps: 38700,
    monthlySteps: 155000,
    allTimeSteps: 980000,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    isCrowned: true
  },
  {
    id: 'f3',
    username: 'fitnessbuddy',
    petName: 'Shadow',
    petType: 'wispurr',
    petLevel: 3,
    weeklySteps: 35200,
    monthlySteps: 142000,
    allTimeSteps: 890000,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    isCrowned: true
  },
  {
    id: 'f4',
    username: 'strollerpro',
    petName: 'Sparky',
    petType: 'flareep',
    petLevel: 2,
    weeklySteps: 28100,
    monthlySteps: 112000,
    allTimeSteps: 450000,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: 'f5',
    username: 'hikerhero',
    petName: 'Aqua',
    petType: 'aquabub',
    petLevel: 2,
    weeklySteps: 24800,
    monthlySteps: 98000,
    allTimeSteps: 320000,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  }
];

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
        return friend.weeklySteps;
      case 'monthly':
        return friend.monthlySteps;
      case 'allTime':
        return friend.allTimeSteps;
    }
  };

  const getPetImage = () => {
    const petIcon = PET_ICONS[friend.petType];
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
        <Text style={styles.petName}>{friend.petName}</Text>
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
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const storedFriends = await AsyncStorage.getItem('@friends_data');
      if (storedFriends) {
        setFriends(JSON.parse(storedFriends));
      } else {
        // Use sample data for demonstration
        setFriends(SAMPLE_FRIENDS);
        
        // Save sample data to storage (only for demonstration purposes)
        await AsyncStorage.setItem('@friends_data', JSON.stringify(SAMPLE_FRIENDS));
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      // Fallback to sample data
      setFriends(SAMPLE_FRIENDS);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AddFriend');
  };

  const handleShowQRCode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('QRCode');
  };

  const handleFriendPress = (friend: Friend) => {
    const stepCount = timePeriod === 'weekly' 
      ? friend.weeklySteps 
      : timePeriod === 'monthly'
        ? friend.monthlySteps
        : friend.allTimeSteps;

    Alert.alert(
      `${friend.username}'s Profile`,
      `Pet: ${friend.petName}\nType: ${friend.petType}\nLevel: ${friend.petLevel}\n${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Steps: ${stepCount.toLocaleString()}\nLast Active: ${formatRelativeTime(friend.lastActive)}`,
      [{ text: 'OK' }]
    );
  };

  const handleTimePeriodChange = (period: TimePeriod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimePeriod(period);
  };

  // Sort friends by selected time period
  const sortedFriends = [...friends].sort((a, b) => {
    switch (timePeriod) {
      case 'weekly':
        return b.weeklySteps - a.weeklySteps;
      case 'monthly':
        return b.monthlySteps - a.monthlySteps;
      case 'allTime':
        return b.allTimeSteps - a.allTimeSteps;
      default:
        return b.weeklySteps - a.weeklySteps;
    }
  });

  const headerRightComponent = (
    <TouchableOpacity 
      onPress={() => navigation.navigate('QRCode')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="qr-code-outline" size={24} color="#8C52FF" />
    </TouchableOpacity>
  );

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <Header 
        title="Friends"
        rightComponent={headerRightComponent}
      />
      
      <View style={styles.content}>
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
        
        {loading ? (
          <View style={styles.loadingContainer}>
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
            data={sortedFriends}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  leaderboardTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
  },
  leaderboardSubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  timePeriodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
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
  },
  username: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#333333',
  },
  petName: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
  },
  stepCount: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#8C52FF',
  },
  crownContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
});

export default Friends; 