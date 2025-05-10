import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { RootStackParamList } from '../types/navigationTypes';
import { LinearGradient } from 'expo-linear-gradient';
import PetDisplay from '../components/PetDisplay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { PurchasesPackage, PurchasesStoreProduct } from 'react-native-purchases';

const { width, height } = Dimensions.get('window');
const MODAL_WIDTH = width * 0.9;
const MODAL_HEIGHT = height * 0.85;

const PaywallScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { petData } = useData();
  const [selectedTier, setSelectedTier] = useState<'trial' | 'monthly' | 'annual' | 'lifetime'>('annual');
  const [rcSubPackages, setRcSubPackages] = useState<Record<string, PurchasesPackage>>({});
  const [isFetchingPackages, setIsFetchingPackages] = useState<boolean>(true);
  const [purchaseState, setPurchaseState] = useState<'idle' | 'processing' | 'failed'>('idle');

  const subscriptionPackageIdentifiers: string[] = [
    '$rc_annual',
    '$rc_monthly',
    '$rc_lifetime'
  ];

  useEffect(() => {
    const fetchOfferings = async () => {
      setIsFetchingPackages(true);
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.availablePackages.length > 0) {
          const subsPackages: Record<string, PurchasesPackage> = {};
          offerings.current.availablePackages.forEach(pkg => {
            if (subscriptionPackageIdentifiers.includes(pkg.identifier)) {
              subsPackages[pkg.identifier] = pkg;
            }
          });
          setRcSubPackages(subsPackages);
          console.log('[PaywallScreen] Fetched Subscription/Lifetime Packages:', subsPackages);

          // More detailed debugging for the problematic condition
          const monthlyProduct = subsPackages['$rc_monthly']?.product;
          console.log('[PaywallScreen] DEBUG: monthlyProduct:', monthlyProduct);
          if (monthlyProduct) {
            const introPriceObj = (monthlyProduct as any)['introPrice'];
            console.log('[PaywallScreen] DEBUG: introPriceObj:', introPriceObj);
            if (introPriceObj) {
              console.log('[PaywallScreen] DEBUG: introPriceObj.price:', introPriceObj.price);
              console.log('[PaywallScreen] DEBUG: typeof introPriceObj.price:', typeof introPriceObj.price);
            }
          }

          // Actual logic for setting the tier:
          if (monthlyProduct && (monthlyProduct as any)['introPrice']?.price === 0) {
            console.log('[PaywallScreen] DETECTED Trial: Setting selectedTier to trial');
            setSelectedTier('trial');
          } else {
            console.log('[PaywallScreen] NO Trial detected or intro price not 0, setting selectedTier to annual'); // DEBUG
            setSelectedTier('annual'); // Default to annual if no free trial
          }
        } else {
          console.log('[PaywallScreen] No current offerings or packages found.');
          setRcSubPackages({});
          setSelectedTier('annual'); // Fallback if no packages
        }
      } catch (e) {
        console.error('[PaywallScreen] Error fetching offerings:', e);
        Alert.alert('Error', 'Could not load subscription options. Please try again later.');
        setRcSubPackages({});
      }
      setIsFetchingPackages(false);
    };

    fetchOfferings();
  }, []);

  const handleClose = () => {
    navigation.goBack();
  };

  const handleContinue = async () => {
    let selectedPackageIdentifier: string | null = null;
    let isTrialAttempt = false;

    switch(selectedTier) {
      case 'annual': 
        selectedPackageIdentifier = '$rc_annual';
        break;
      case 'monthly':
        selectedPackageIdentifier = '$rc_monthly';
        break;
      case 'lifetime':
        selectedPackageIdentifier = '$rc_lifetime';
        break;
      case 'trial':
        selectedPackageIdentifier = '$rc_monthly'; 
        isTrialAttempt = true;
        console.warn('[PaywallScreen] Trial selected, will attempt purchase of $rc_monthly (expecting intro offer).');
        break;
    }

    if (!selectedPackageIdentifier || !rcSubPackages[selectedPackageIdentifier]) {
       console.error('[PaywallScreen] Selected package not found in fetched packages:', selectedPackageIdentifier);
       Alert.alert('Error', 'Selected option is currently unavailable. Please try another.');
       return;
    }

    const packageToPurchase = rcSubPackages[selectedPackageIdentifier];
    const premiumEntitlementId = 'StepPet Premium'; // ** MATCHES ENTITLEMENT ID FROM LOGS **
    
    setPurchaseState('processing');
    console.log(`[PaywallScreen] Attempting purchase for package: ${packageToPurchase.identifier}`);

    try {
      // Log purchase_start analytics (adapt your analytics call as needed)
      // await analytics().logEvent(...) 

      const { customerInfo, productIdentifier: purchasedProductId } = await Purchases.purchasePackage(packageToPurchase);
      console.log('[PaywallScreen] Purchase successful! CustomerInfo:', customerInfo, 'Purchased Product ID:', purchasedProductId);

      if (customerInfo.entitlements.active[premiumEntitlementId]) {
        console.log(`[PaywallScreen] Entitlement '${premiumEntitlementId}' is active.`);
        await AsyncStorage.setItem('paywallActive', 'false'); // Or remove it
        await AsyncStorage.setItem('hasSubscribed', 'true'); // Consider relying more on RC entitlements via CustomerInfo listener

        // Log purchase_complete analytics
        // await analytics().logEvent(...) 

        Alert.alert(
          'Subscription Activated!',
          `${isTrialAttempt ? 'Your trial is active.' : 'Your subscription is active.'} Enjoy premium features!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        setPurchaseState('idle'); // Reset after alert is dismissed
      } else {
        console.error(`[PaywallScreen] Entitlement '${premiumEntitlementId}' is NOT active after purchase. CustomerInfo:`, customerInfo);
        Alert.alert('Activation Issue', 'Your purchase was successful, but there was an issue activating premium features. Please contact support.');
        setPurchaseState('idle');
      }

    } catch (e: any) {
      console.warn("[PaywallScreen] Purchase error:", e);
      let errorMessage = 'There was an error completing your purchase.';
      if (e.userCancelled) {
        console.log("[PaywallScreen] User cancelled the purchase.");
        errorMessage = 'Purchase cancelled.';
        setPurchaseState('idle'); 
      } else {
        setPurchaseState('failed'); // Keep as failed to potentially show a different UI or retry
      }
      
      // Log purchase_fail analytics
      // await analytics().logEvent(...)

      if (!e.userCancelled) { 
        Alert.alert(
          'Purchase Failed',
          errorMessage,
          [{ text: 'OK', onPress: () => setPurchaseState('idle') }]
        );
      }
    } 
    // No finally block needed here for setPurchaseState if all paths handle it.
    // If purchaseState remains 'processing' due to an unhandled path, that's a bug.
  };

  const getPackage = (identifier: string): PurchasesPackage | null => {
    return rcSubPackages[identifier] || null;
  };

  if (isFetchingPackages) {
    return (
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator style={styles.loadingIndicator} size="large" color="#8C52FF" />
        </View>
      </View>
    );
  }

  const monthlyPkg = getPackage('$rc_monthly');
  const annualPkg = getPackage('$rc_annual');
  const lifetimePkg = getPackage('$rc_lifetime');

  // Accessing directly from subsPackages for rendering logic
  const introPrice = rcSubPackages['$rc_monthly']?.product ? (rcSubPackages['$rc_monthly'].product as any)['introPrice'] : null;
  let trialTitle = '';
  if (introPrice && introPrice.price === 0) {
    console.log('[PaywallScreen] Rendering: introPrice object is:', introPrice); // DEBUG
    const unitSingular = introPrice.periodUnit.toLowerCase();
    const unitDisplay = unitSingular.charAt(0).toUpperCase() + unitSingular.slice(1);
    trialTitle = `${introPrice.periodNumberOfUnits}-${unitDisplay}${introPrice.periodNumberOfUnits > 1 ? 's' : ''} Free Trial`;
    console.log('[PaywallScreen] Rendering: trialTitle created:', trialTitle); // DEBUG
  } else {
    console.log('[PaywallScreen] Rendering: introPrice condition for trial title FAILED. introPrice:', introPrice); // DEBUG
  }

  // Prepare annual title parts safely
  let mainAnnualTitle = '';
  let savingsText = null;
  if (annualPkg && annualPkg.product && annualPkg.product.title) {
    const parts = annualPkg.product.title.split(' - ');
    mainAnnualTitle = parts[0];
    if (parts.length > 1) {
      savingsText = parts[1];
    }
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#8C52FF', '#6236B0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.petContainer}>
            <PetDisplay
              petType={petData?.type || ''}
              growthStage="Baby"
              size="small"
              showEquippedItems={false}
            />
          </View>
          <Text style={styles.title}>{petData?.name || 'Your Pet'} Has Arrived!</Text>
          <Text style={styles.subtitle}>
            They need your steps to grow.{'\n'}
            Unlock Premium to begin your journey!
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>{petData?.name || 'Your Pet'} Needs You — Don't Keep Them Waiting</Text>
            <View style={styles.featuresList}>
              <FeatureItem text="Full Pet Evolution (Baby → Adult)" />
              <FeatureItem text="Daily Step Goals & Tracking" />
              <FeatureItem text="Exclusive Premium Accessories" />
              <FeatureItem text="Special Mini-Games & Events" />
              <FeatureItem text="Priority Support" />
              <FeatureItem text="No Ads Ever" />
            </View>
          </View>

          <View style={styles.pricingSection}>
            {monthlyPkg && introPrice && introPrice.price === 0 && (
              <TouchableOpacity
                style={[styles.pricingOption, selectedTier === 'trial' && styles.selectedOption]}
                onPress={() => setSelectedTier('trial')}
              >
                <View style={styles.radioContainer}>
                  <View style={[styles.radioOuter, selectedTier === 'trial' && styles.selectedRadioOuter]}>
                    {selectedTier === 'trial' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.priceInfo}>
                    <Text style={styles.tierName}>{trialTitle}</Text>
                    <Text style={styles.pricePerMonth}>Then {monthlyPkg.product.priceString}/mo</Text>
                    {/* You could add a badge here e.g., <View style={styles.trialBadge}><Text>Starts Free</Text></View> */}
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {monthlyPkg && (
              <TouchableOpacity 
                style={[styles.pricingOption, selectedTier === 'monthly' && styles.selectedOption]}
                onPress={() => setSelectedTier('monthly')}
              >
                <View style={styles.radioContainer}>
                  <View style={[styles.radioOuter, selectedTier === 'monthly' && styles.selectedRadioOuter]}>
                    {selectedTier === 'monthly' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.priceInfo}>
                    <Text style={styles.tierName}>{monthlyPkg.product.title}</Text>
                    <Text style={styles.price}>{monthlyPkg.product.priceString}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {annualPkg && (
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
                      <Text style={styles.tierName}>{mainAnnualTitle}</Text>
                      <View style={styles.tagsContainer}>
                         <View style={styles.popularBadge}><Text style={styles.popularText}>Popular</Text></View>
                         {savingsText && (
                           <View style={styles.saveBadge}><Text style={styles.saveText}>{savingsText}</Text></View>
                         )}
                      </View>
                    </View>
                    <Text style={styles.price}>{annualPkg.product.priceString}</Text>
                    <Text style={styles.pricePerMonth}>
                      {annualPkg.product.pricePerMonthString 
                        ? `${annualPkg.product.pricePerMonthString}/mo` 
                        : `(${annualPkg.product.priceString} / year)`}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {lifetimePkg && (
              <TouchableOpacity 
                style={[styles.pricingOption, selectedTier === 'lifetime' && styles.selectedOption]}
                onPress={() => setSelectedTier('lifetime')}
              >
                <View style={styles.radioContainer}>
                  <View style={[styles.radioOuter, selectedTier === 'lifetime' && styles.selectedRadioOuter]}>
                    {selectedTier === 'lifetime' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.priceInfo}>
                    <Text style={styles.tierName}>{lifetimePkg.product.title}</Text>
                    <Text style={styles.price}>{lifetimePkg.product.priceString}</Text>
                    <Text style={styles.pricePerMonth}>One-time purchase</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
             style={[styles.continueButton, purchaseState === 'processing' && styles.disabledButton ]}
             onPress={handleContinue}
             disabled={purchaseState === 'processing'}
          >
            {purchaseState === 'processing' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
            <Text style={styles.continueButtonText}>
              {selectedTier === 'trial' 
                ? 'Start Free Trial'
                : `Continue with ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`}
            </Text>
            )}
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
    fontSize: 17,
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
    backgroundColor: '#8C52FF',
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
    backgroundColor: '#4CAF50', // Green color for savings
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4, // Add some space if it's next to another badge
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
  loadingIndicator: {
    marginTop: 50,
  },
  disabledButton: {
    backgroundColor: '#B8B8B8',
  },
});

export default PaywallScreen; 