import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGems } from '@context/GemContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigationTypes';

interface HeaderWithGemsProps {
  title: string;
}

type StoreNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Store'>;

const HeaderWithGems: React.FC<HeaderWithGemsProps> = ({ title }) => {
  const { gemBalance } = useGems();
  const navigation = useNavigation<StoreNavigationProp>();

  const handleGemPress = () => {
    navigation.navigate('Store', { initialTab: 'gems' });
  };

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity 
        style={styles.gemCountContainer} 
        onPress={handleGemPress} 
        activeOpacity={0.7}
      >
        <Ionicons name="diamond-outline" size={16} color="#8C52FF" />
        <Text style={styles.gemCountText}>{gemBalance.toLocaleString()}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Vertically center title and gem count
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: '#333333',
  },
  gemCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // Subtle shadow
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gemCountText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#8C52FF',
    marginLeft: 6,
  },
});

export default HeaderWithGems; 