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

// Sample friend data for demonstration
const SAMPLE_FRIENDS: Friend[] = [
  {
    id: 'f1',
    username: 'walker123',
    petName: 'Blaze',
    petType: 'Dragon',
    petLevel: 3,
    weeklySteps: 42500,
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
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: 'f5',
    username: 'hikerhero',
    petName: 'Aqua',
    petType: 'WaterTurtle',
    petLevel: 2,
    weeklySteps: 24800,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  }
];

interface FriendItemProps {
  friend: Friend;
  rank: number;
  onPress: (friend: Friend) => void;
}

const FriendItem: React.FC<FriendItemProps> = ({ friend, rank, onPress }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(friend);
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
        <Text style={styles.stepsCount}>{friend.weeklySteps.toLocaleString()}</Text>
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
    Alert.alert(
      `${friend.username}'s Profile`,
      `Pet: ${friend.petName}\nType: ${friend.petType}\nLevel: ${friend.petLevel}\nWeekly Steps: ${friend.weeklySteps.toLocaleString()}\nLast Active: ${formatRelativeTime(friend.lastActive)}`,
      [{ text: 'OK' }]
    );
  };

  // Sort friends by weekly steps
  const sortedFriends = [...friends].sort((a, b) => b.weeklySteps - a.weeklySteps);

  const headerRightComponent = (
    <TouchableOpacity 
      onPress={() => navigation.navigate('QRCode')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="qr-code-outline" size={24} color="#8C52FF" />
    </TouchableOpacity>
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
          <Text style={styles.leaderboardTitle}>Weekly Leaderboard</Text>
          <Text style={styles.leaderboardSubtitle}>Top 3 earn a crown!</Text>
        </View>
        
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