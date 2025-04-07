import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGems } from '../context/GemContext';
import { Ionicons } from '@expo/vector-icons';

export const GemBalance: React.FC = () => {
  const { gemBalance, isLoading } = useGems();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="diamond" size={24} color="#8C52FF" />
      <Text style={styles.balance}>{gemBalance}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    marginHorizontal: 16,
  },
  balance: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8C52FF',
  },
}); 