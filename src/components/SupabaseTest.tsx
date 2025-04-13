import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').limit(1);
        
        if (error) {
          setConnectionStatus(`Error: ${error.message}`);
        } else {
          setConnectionStatus('Connected successfully!');
        }
      } catch (error) {
        setConnectionStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Supabase Connection Test:</Text>
      <Text style={styles.status}>{connectionStatus}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
});

export default SupabaseTest; 