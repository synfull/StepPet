import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGems } from '../context/GemContext';

export const GemBalance: React.FC = () => {
  const { gemBalance } = useGems();

  return (
    <View style={styles.container}>
      <Ionicons name="diamond" size={20} color="#8C52FF" style={styles.gemIcon} />
      <Text style={styles.gemCount}>{gemBalance.toLocaleString()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gemIcon: {
    marginRight: 6,
  },
  gemCount: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#8C52FF',
  },
}); 