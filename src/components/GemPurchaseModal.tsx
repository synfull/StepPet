import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useGems } from '../context/GemContext';

interface GemPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
}

const GEM_PACKAGES = [
  { amount: 100, price: '$0.99' },
  { amount: 500, price: '$4.99' },
  { amount: 1000, price: '$9.99' },
  { amount: 2000, price: '$19.99' },
];

export const GemPurchaseModal: React.FC<GemPurchaseModalProps> = ({
  visible,
  onClose,
}) => {
  const { addGems } = useGems();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async (amount: number) => {
    setIsProcessing(true);
    try {
      await addGems(amount);
      // In a real app, you would integrate with a payment system here
      // For now, we'll just add the gems directly
      onClose();
    } catch (error) {
      console.error('Purchase failed:', error);
      // Handle error appropriately
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Purchase Gems</Text>
          
          {GEM_PACKAGES.map((package_) => (
            <TouchableOpacity
              key={package_.amount}
              style={styles.packageButton}
              onPress={() => handlePurchase(package_.amount)}
              disabled={isProcessing}
            >
              <Text style={styles.packageAmount}>{package_.amount} Gems</Text>
              <Text style={styles.packagePrice}>{package_.price}</Text>
            </TouchableOpacity>
          ))}

          {isProcessing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8C52FF" />
            </View>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#8C52FF',
  },
  packageButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 10,
  },
  packageAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8C52FF',
  },
  packagePrice: {
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
}); 