import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { subscriptionPricing } from '../utils/subscriptionUtils';
import { RootStackParamList } from '../types/navigationTypes';
import { LinearGradient } from 'expo-linear-gradient';
import PetDisplay from '../components/PetDisplay';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const MODAL_WIDTH = width * 0.9;
const MODAL_HEIGHT = height * 0.85;

const PaywallScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { petData } = useData();
  const [selectedTier, setSelectedTier] = useState<'trial' | 'monthly' | 'annual' | 'lifetime'>('annual');
  const [isPaywallActive, setIsPaywallActive] = useState(false);

  useEffect(() => {
    const checkPaywallStatus = async () => {
      try {
        const paywallActive = await AsyncStorage.getItem('paywallActive');
        setIsPaywallActive(paywallActive === 'true');
      } catch (error) {
        console.error('Error checking paywall status:', error);
      }
    };
    
    checkPaywallStatus();
  }, []);

  const handleClose = () => {
    if (!isPaywallActive) {
      navigation.goBack();
    }
  };

  const handleContinue = async () => {
    if (selectedTier) {
      try {
        await AsyncStorage.setItem('paywallActive', 'false');
        await AsyncStorage.setItem('hasSubscribed', 'true');
        await AsyncStorage.setItem('isRegistering', 'true');
        navigation.navigate('Subscription', { tier: selectedTier });
      } catch (error) {
        console.error('Error saving subscription state:', error);
      }
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#8C52FF', '#6236B0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.header}
        >
          {!isPaywallActive && (
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          )}
          <View style={styles.petContainer}>
            <PetDisplay
              petType={petData?.type || ''}
              growthStage="Baby"
              size="small"
              showEquippedItems={false}
            />
          </View>
          <Text style={styles.title}>Your Pet Has Hatched!</Text>
          <Text style={styles.subtitle}>
            {petData?.name} is ready to grow!{'\n'}Unlock premium to begin their journey.
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Included Features:</Text>
            <View style={styles.featuresList}>
              <FeatureItem text="All Evolution Stages" />
              <FeatureItem text="Exclusive Premium Accessories" />
              <FeatureItem text="Special Mini-Games & Events" />
              <FeatureItem text="Priority Support" />
              <FeatureItem text="No Ads Ever" />
            </View>
          </View>

          <View style={styles.pricingSection}>
            <TouchableOpacity 
              style={[styles.pricingOption, selectedTier === 'monthly' && styles.selectedOption]}
              onPress={() => setSelectedTier('monthly')}
            >
              <View style={styles.radioContainer}>
                <View style={[styles.radioOuter, selectedTier === 'monthly' && styles.selectedRadioOuter]}>
                  {selectedTier === 'monthly' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.priceInfo}>
                  <Text style={styles.tierName}>Monthly</Text>
                  <Text style={styles.price}>{subscriptionPricing.monthly.displayPrice}</Text>
                  <Text style={styles.pricePerMonth}>{subscriptionPricing.monthly.displayPrice}/mo</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.pricingOption, selectedTier === 'annual' && styles.selectedOption]}
              onPress={() => setSelectedTier('annual')}
            >
              <View style={styles.radioContainer}>
                <View style={[styles.radioOuter, selectedTier === 'annual' && styles.selectedRadioOuter]}>
                  {selectedTier === 'annual' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.priceInfo}>
                  <View style={styles.tierNameContainer}>
                    <Text style={styles.tierName}>Annual</Text>
                    <View style={styles.tagsContainer}>
                      <View style={styles.popularBadge}><Text style={styles.popularText}>Popular</Text></View>
                      <View style={styles.saveBadge}><Text style={styles.saveText}>Save {subscriptionPricing.annual.savePercent}%</Text></View>
                    </View>
                  </View>
                  <Text style={styles.price}>{subscriptionPricing.annual.displayPrice}</Text>
                  <Text style={styles.pricePerMonth}>${(subscriptionPricing.annual.price / 12).toFixed(2)}/mo</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.pricingOption, selectedTier === 'lifetime' && styles.selectedOption]}
              onPress={() => setSelectedTier('lifetime')}
            >
              <View style={styles.radioContainer}>
                <View style={[styles.radioOuter, selectedTier === 'lifetime' && styles.selectedRadioOuter]}>
                  {selectedTier === 'lifetime' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.priceInfo}>
                  <Text style={styles.tierName}>Lifetime <View style={styles.saveBadge}><Text style={styles.saveText}>Save {subscriptionPricing.lifetime.savePercent}%</Text></View></Text>
                  <Text style={styles.price}>{subscriptionPricing.lifetime.displayPrice}</Text>
                  <Text style={styles.pricePerMonth}>One-time purchase</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.pricingOption, selectedTier === 'trial' && styles.selectedOption]}
              onPress={() => setSelectedTier('trial')}
            >
              <View style={styles.radioContainer}>
                <View style={[styles.radioOuter, selectedTier === 'trial' && styles.selectedRadioOuter]}>
                  {selectedTier === 'trial' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.priceInfo}>
                  <Text style={styles.tierName}>3-Day Free Trial</Text>
                  <Text style={styles.price}>Free</Text>
                  <Text style={styles.pricePerMonth}>Then ${subscriptionPricing.monthly.price}/mo</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>
              {selectedTier === 'trial' 
                ? 'Start Free Trial' 
                : `Continue with ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`}
            </Text>
          </TouchableOpacity>
          <Text style={styles.termsText}>
            Payment will be charged to your Apple ID account at the confirmation of purchase. Subscription automatically renews unless it is canceled at least 24 hours before the end of the current period.
          </Text>
        </View>
      </View>
    </View>
  );
};

const FeatureItem = ({ text }: { text: string }) => (
  <View style={styles.featureItem}>
    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: MODAL_WIDTH,
    height: MODAL_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    padding: 16,
    paddingTop: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'System',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingBottom: 8,
  },
  featuresSection: {
    padding: 16,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  featuresList: {
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
    fontFamily: 'System',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  pricingSection: {
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  pricingOption: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  selectedOption: {
    backgroundColor: '#EDE5FF',
    borderColor: '#8C52FF',
    borderWidth: 2,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8C52FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedRadioOuter: {
    borderColor: '#8C52FF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8C52FF',
  },
  priceInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tierNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  popularBadge: {
    backgroundColor: '#FF8C52',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
  },
  popularText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  saveBadge: {
    backgroundColor: '#8C52FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  saveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8C52FF',
    marginTop: -2,
  },
  pricePerMonth: {
    fontSize: 13,
    color: '#666',
    marginTop: -2,
  },
  footer: {
    padding: 12,
    paddingBottom: 12,
  },
  continueButton: {
    backgroundColor: '#8C52FF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  petContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    marginTop: 2,
    width: '100%',
    height: 50,
  },
});

export default PaywallScreen; 