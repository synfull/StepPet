import React, { useState, useEffect, useContext } from 'react';
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
import Header from '../components/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataContext } from '../context/DataContext';

type FriendsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type TimePeriod = 'weekly' | 'monthly' | 'allTime';

// Sample friend data for demonstration
const SAMPLE_FRIENDS: Friend[] = [
  {
    id: 'f1',
    username: 'walker123',
    petName: 'Blaze',
    petType: 'Dragon',
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
    petType: 'Unicorn',
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
    petType: 'Wolf',
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
    petType: 'FireLizard',
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
    petType: 'WaterTurtle',
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
      default:
        return friend.weeklySteps;
    }
  };

  // Pet image based on type
  const getPetImage = () => {
    switch (friend.petType) {
      case 'Dragon':
        return require('../../assets/images/pets/dragon_icon.png');
      case 'Unicorn':
        return require('../../assets/images/pets/unicorn_icon.png');
      case 'Wolf':
        return require('../../assets/images/pets/wolf_icon.png');
      // Add other pet types here
      default:
        return require('../../assets/images/pets/default_icon.png');
    }
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
      
      <View style={styles.petIconContainer}>
        <Image 
          source={getPetImage()} 
          style={styles.petIcon} 
          resizeMode="contain"
        />
        {friend.isCrowned && (
          <View style={styles.crownBadge}>
            <Ionicons name="trophy" size={12} color="#FFD700" />
          </View>
        )}
      </View>
      
      <View style={styles.friendInfo}>
        <Text style={styles.username}>{friend.username}</Text>
        <Text style={styles.petInfo}>
          {friend.petName} • Level {friend.petLevel} {friend.petType}
        </Text>
      </View>
      
      <View style={styles.stepsContainer}>
        <Text style={styles.stepsCount}>{getStepCount().toLocaleString()}</Text>
        <Text style={styles.stepsLabel}>steps</Text>
        <Text style={styles.lastActiveText}>
          {formatRelativeTime(friend.lastActive)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const Friends: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { petData } = useContext(DataContext);
  const insets = useSafeAreaInsets();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('weekly');

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
    const stepCount = selectedTimePeriod === 'weekly' 
      ? friend.weeklySteps 
      : selectedTimePeriod === 'monthly'
        ? friend.monthlySteps
        : friend.allTimeSteps;

    Alert.alert(
      `${friend.username}'s Profile`,
      `Pet: ${friend.petName}\nType: ${friend.petType}\nLevel: ${friend.petLevel}\n${selectedTimePeriod.charAt(0).toUpperCase() + selectedTimePeriod.slice(1)} Steps: ${stepCount.toLocaleString()}\nLast Active: ${formatRelativeTime(friend.lastActive)}`,
      [{ text: 'OK' }]
    );
  };

  const handleTimePeriodChange = (period: TimePeriod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTimePeriod(period);
  };

  // Sort friends by selected time period
  const sortedFriends = [...friends].sort((a, b) => {
    switch (selectedTimePeriod) {
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
          selectedTimePeriod === 'weekly' && styles.selectedTimePeriod
        ]}
        onPress={() => handleTimePeriodChange('weekly')}
      >
        <Text style={[
          styles.timePeriodText,
          selectedTimePeriod === 'weekly' && styles.selectedTimePeriodText
        ]}>Weekly</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.timePeriodButton,
          selectedTimePeriod === 'monthly' && styles.selectedTimePeriod
        ]}
        onPress={() => handleTimePeriodChange('monthly')}
      >
        <Text style={[
          styles.timePeriodText,
          selectedTimePeriod === 'monthly' && styles.selectedTimePeriodText
        ]}>Monthly</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.timePeriodButton,
          selectedTimePeriod === 'allTime' && styles.selectedTimePeriod
        ]}
        onPress={() => handleTimePeriodChange('allTime')}
      >
        <Text style={[
          styles.timePeriodText,
          selectedTimePeriod === 'allTime' && styles.selectedTimePeriodText
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
            {selectedTimePeriod === 'weekly' 
              ? 'Weekly' 
              : selectedTimePeriod === 'monthly'
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
                timePeriod={selectedTimePeriod}
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
  petIconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    marginRight: 12,
  },
  petIcon: {
    width: '100%',
    height: '100%',
  },
  crownBadge: {
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
  friendInfo: {
    flex: 1,
  },
  username: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#333333',
  },
  petInfo: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
  },
  stepsContainer: {
    alignItems: 'flex-end',
  },
  stepsCount: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#8C52FF',
  },
  stepsLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#666666',
  },
  lastActiveText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#909090',
    marginTop: 4,
  },
});

export default Friends; 