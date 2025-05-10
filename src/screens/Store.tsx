import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigationTypes';
import { hatItems } from './StoreHats';
import { neckItems } from './StoreNeck';
import { eyewearItems } from './StoreEyewear';
import { useGems } from '../context/GemContext';
import { useInventory } from '../context/InventoryContext';
import { playSound } from '../utils/soundUtils';
import HeaderWithGems from '../components/HeaderWithGems';
import analytics from '@react-native-firebase/analytics';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

type StoreNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Store'>;
type StoreRouteProp = RouteProp<RootStackParamList, 'Store'>;

type GemPackage = {
  id: string;
  price: number;
  gems: number;
  bonus: number;
  image: any;
};

type StoreItem = {
  id: string;
  name: string;
  price: number;
  image: any;
  description?: string;
};

type CategorizedItem = StoreItem & {
  category: string;
};

// Mock purchase states
type PurchaseState = 'idle' | 'confirming' | 'processing' | 'success' | 'failed';

const GemPackageCard: React.FC<{ pack: GemPackage }> = ({ pack }) => (
  <TouchableOpacity style={styles.gemPackage}>
    <View style={styles.gemInfo}>
      <View style={styles.leftContent}>
        <Image 
          source={pack.image} 
          style={styles.gemImage}
          contentFit="contain"
          transition={200}
        />
      </View>
      <View style={styles.rightContent}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${pack.price.toFixed(2)}</Text>
          <Text style={styles.priceLabel}>USD</Text>
        </View>
        <View style={styles.gemsContainer}>
          <Text style={styles.gemsAmount}>{pack.gems}</Text>
          {pack.bonus > 0 && (
            <Text style={styles.gemsBonus}>+{pack.bonus} Bonus</Text>
          )}
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const StoreItemCard: React.FC<{ item: StoreItem }> = ({ item }) => (
  <TouchableOpacity style={styles.itemCard}>
    <View style={styles.itemImageContainer}>
      {item.image && (
        <Image 
          source={item.image} 
          style={styles.itemImage}
          contentFit="cover"
          transition={200}
        />
      )}
    </View>
    <View style={styles.itemInfo}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemPrice}>{item.price} Gems</Text>
    </View>
  </TouchableOpacity>
);

const HatsScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hats</Text>
      </View>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        {hatItems.map((item) => (
          <StoreItemCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
};

const ItemCategory: React.FC<{ title: string; onPress: () => void }> = ({ title, onPress }) => {
  const getItemCount = () => {
    switch (title) {
      case 'Hats':
        return hatItems.length;
      case 'Neck':
        return neckItems.length;
      case 'Eyewear':
        return eyewearItems.length;
      default:
        return 0;
    }
  };

  const getIconSource = () => {
    switch (title) {
      case 'Hats':
        return require('../../assets/images/store/items/hats/top_hat.png');
      case 'Neck':
        return require('../../assets/images/store/items/neck/bow_tie.png');
      case 'Eyewear':
        return require('../../assets/images/store/items/eyewear/sunglasses.png');
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity style={styles.itemCategory} onPress={onPress}>
      <View style={styles.categoryContent}>
        <View style={styles.categoryIcon}>
          <Image 
            source={getIconSource()} 
            style={styles.categoryImage}
            contentFit="contain"
            transition={200}
          />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryTitle}>{title}</Text>
          <Text style={styles.itemCount}>{getItemCount()} items</Text>
        </View>
        <View style={styles.categoryArrow}>
          <Text style={styles.arrowIcon}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ItemsTab = () => {
  const navigation = useNavigation<StoreNavigationProp>();

  const handleCategoryPress = (category: string) => {
    if (category === 'Hats') {
      navigation.navigate('StoreHats');
    } else if (category === 'Neck') {
      navigation.navigate('StoreNeck');
    } else if (category === 'Eyewear') {
      navigation.navigate('StoreEyewear');
    }
  };

  return (
    <ScrollView 
      style={styles.scrollView} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <Text style={styles.sectionSubtitle}>Customize your pet with unique accessories</Text>
      </View>
      <ItemCategory title="Eyewear" onPress={() => handleCategoryPress('Eyewear')} />
      <ItemCategory title="Hats" onPress={() => handleCategoryPress('Hats')} />
      <ItemCategory title="Neck" onPress={() => handleCategoryPress('Neck')} />
    </ScrollView>
  );
};

const GemsTab = () => {
  const { addGems } = useGems();
  const [purchaseState, setPurchaseState] = useState<PurchaseState>('idle');
  const [selectedRcPackage, setSelectedRcPackage] = useState<PurchasesPackage | null>(null);

  const [rcGemPackages, setRcGemPackages] = useState<PurchasesPackage[]>([]);
  const [isFetchingPackages, setIsFetchingPackages] = useState<boolean>(false);

  const expectedGemPackageIdentifiers: string[] = [
    'custom', 
    'custom_app.steppet.gems.350', 
    'custom_app.steppet.gems.800',
    'custom_app.steppet.gems.1700',
    'custom_app.steppet.gems.4500'
  ];

  // Gem product details mapping
  interface GemProductDetails {
    gems: number;
    bonus: number;
    // image?: any; // Optional: if you want to centralize image mapping too
  }

  const GEM_PRODUCT_MAP: Record<string, GemProductDetails> = {
    'app.steppet.gems.100': { gems: 100, bonus: 0 },
    'app.steppet.gems.350': { gems: 300, bonus: 50 }, 
    'app.steppet.gems.800': { gems: 650, bonus: 150 },
    'app.steppet.gems.1700': { gems: 1300, bonus: 400 },
    'app.steppet.gems.4500': { gems: 3300, bonus: 1200 },
  };

  useEffect(() => {
    const fetchOfferings = async () => {
      setIsFetchingPackages(true);
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.availablePackages.length > 0) {
          console.log('[Store.tsx] RevenueCat Offerings.current:', JSON.stringify(offerings.current, null, 2));
          const filteredGemPackages = offerings.current.availablePackages.filter(pkg => 
            expectedGemPackageIdentifiers.includes(pkg.identifier)
          );
          
          // Sort the filtered packages by price in ascending order
          filteredGemPackages.sort((a, b) => a.product.price - b.product.price);

          setRcGemPackages(filteredGemPackages);
          console.log('[Store.tsx] Filtered AND SORTED RC Gem Packages:', JSON.stringify(filteredGemPackages, null, 2));
        } else {
          console.log('[Store.tsx] No current offerings or packages found from RevenueCat.');
          setRcGemPackages([]);
        }
      } catch (e) {
        console.error('[Store.tsx] Error fetching RevenueCat offerings:', e);
        Alert.alert('Error', 'Could not load purchase options. Please try again later.');
        setRcGemPackages([]);
      }
      setIsFetchingPackages(false);
    };

    fetchOfferings();
  }, []);

  const handleRcPurchasAttempt = (rcPack: PurchasesPackage) => {
    setSelectedRcPackage(rcPack);
    Alert.alert(
      'Confirm Purchase',
      `Purchase ${rcPack.product.title} for ${rcPack.product.priceString}?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setSelectedRcPackage(null) },
        { text: 'Purchase', onPress: () => processRcPurchase(rcPack) },
      ]
    );
  };

  const processRcPurchase = async (rcPack: PurchasesPackage) => {
    console.log("[Store.tsx] Initiating purchase for RC Package:", rcPack.identifier, "Product ID:", rcPack.product.identifier);
    setPurchaseState('processing');
    setSelectedRcPackage(rcPack); // Keep selected while processing

    try {
      await analytics().logEvent('purchase_gems_start', { 
        package_id: rcPack.identifier, 
        product_id: rcPack.product.identifier,
        product_title: rcPack.product.title,
        package_price: rcPack.product.price
      });
      console.log(`[Analytics] Logged purchase_gems_start event: ${rcPack.identifier}`);

      const { customerInfo, productIdentifier: purchasedProductId } = await Purchases.purchasePackage(rcPack);
      console.log("[Store.tsx] Purchase successful! CustomerInfo:", customerInfo, "Purchased Product ID:", purchasedProductId);

      const productDetails = GEM_PRODUCT_MAP[purchasedProductId];
      let gemsToAward = 0;

      if (productDetails) {
        gemsToAward = productDetails.gems + productDetails.bonus;
        await addGems(gemsToAward);
        playSound('activity-claim');
        setPurchaseState('success');

        try {
          await analytics().logEvent('purchase_gems_complete', { 
            package_id: rcPack.identifier,
            product_id: purchasedProductId,
            product_title: rcPack.product.title,
            package_price: rcPack.product.price,
            gems_awarded: gemsToAward
          });
          console.log(`[Analytics] Logged purchase_gems_complete event: ${rcPack.identifier}`);
        } catch (analyticsError) {
          console.error('[Analytics] Error logging purchase_gems_complete event:', analyticsError);
        }

        Alert.alert(
          'Purchase Successful!',
          `${gemsToAward} gems have been added to your account.`,
          [{ text: 'OK', onPress: () => setPurchaseState('idle') }]
        );
      } else {
        console.error("[Store.tsx] Gem product details not found in GEM_PRODUCT_MAP for ID:", purchasedProductId);
        // This case should ideally not happen if GEM_PRODUCT_MAP is comprehensive
        setPurchaseState('failed');
        Alert.alert('Purchase Error', 'There was an issue processing your gem award. Please contact support.');
      }

    } catch (e: any) {
      console.warn("[Store.tsx] Purchase error:", e);
      playSound('action-fail');
      let errorMessage = 'There was an error completing your purchase.';
      if (e.userCancelled) {
        console.log("[Store.tsx] User cancelled the purchase.");
        errorMessage = 'Purchase cancelled.';
        setPurchaseState('idle'); // User cancelled, so back to idle
      } else {
        setPurchaseState('failed');
      }
      
      try {
        await analytics().logEvent('purchase_gems_fail', { 
          package_id: rcPack.identifier,
          product_id: rcPack.product.identifier,
          product_title: rcPack.product.title,
          error_code: e.code, 
          error_message: e.message,
          user_cancelled: e.userCancelled
        });
        console.log(`[Analytics] Logged purchase_gems_fail event: ${rcPack.identifier}`);
      } catch (analyticsError) {
        console.error('[Analytics] Error logging purchase_gems_fail event:', analyticsError);
      }

      if (!e.userCancelled) { // Only show error alert if not a user cancellation
        Alert.alert(
          'Purchase Failed',
          errorMessage,
          [{ text: 'OK', onPress: () => setPurchaseState('idle') }]
        );
      }
    } finally {
      setSelectedRcPackage(null); // Clear selected package in all cases (success, fail, cancel)
      // Only reset to idle if not already set by userCancelled or successful completion alert
      if (purchaseState !== 'idle' && purchaseState !== 'success') {
           // If it was 'processing' or 'failed' and not handled above, set to idle
           // Success already has its own OK button to reset to idle.
           // User cancel directly sets to idle.
           if(purchaseState === 'failed') setPurchaseState('idle'); 
      }
    }
  };

  const renderRcGemPackageCard = (rcPack: PurchasesPackage) => {
    let imageSource = require('../../assets/images/store/gems/gems_100.png');
    if (rcPack.product.identifier.includes('350')) imageSource = require('../../assets/images/store/gems/gems_350.png');
    if (rcPack.product.identifier.includes('800')) imageSource = require('../../assets/images/store/gems/gems_800.png');
    if (rcPack.product.identifier.includes('1700')) imageSource = require('../../assets/images/store/gems/gems_1700.png');
    if (rcPack.product.identifier.includes('4500')) imageSource = require('../../assets/images/store/gems/gems_4500.png');

    const isProcessingThis = purchaseState === 'processing' && selectedRcPackage?.identifier === rcPack.identifier;

    // Construct custom title and description
    let displayTitle = rcPack.product.title;
    let displayDescription = rcPack.product.description;
    const productDetails = GEM_PRODUCT_MAP[rcPack.product.identifier];

    if (productDetails) {
      const baseGems = productDetails.gems;
      const bonusGems = productDetails.bonus;
      if (bonusGems > 0) {
        displayTitle = `${baseGems} Gems + ${bonusGems} Bonus Gems`;
        displayDescription = `Get ${baseGems} gems plus ${bonusGems} bonus gems!`;
      } else {
        displayTitle = `${baseGems} Gems`;
        displayDescription = `Get ${baseGems} gems!`;
      }
    }

    return (
      <View key={rcPack.identifier} style={styles.rcGemPackageCard}>
        <Image source={imageSource} style={styles.rcGemImage} contentFit="contain" />
        <View style={styles.rcGemInfo}>
          <Text style={styles.rcGemTitle}>{displayTitle}</Text>
          <Text style={styles.rcGemDescription}>{displayDescription}</Text>
          <Text style={styles.rcGemPrice}>{rcPack.product.priceString}</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.purchaseButton,
            (isProcessingThis || purchaseState === 'processing' && selectedRcPackage?.identifier !== rcPack.identifier) && styles.purchaseButtonDisabled
          ]}
          onPress={() => handleRcPurchasAttempt(rcPack)}
          disabled={isProcessingThis || (purchaseState === 'processing' && selectedRcPackage?.identifier !== rcPack.identifier) }
        >
          {isProcessingThis ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.purchaseButtonText}>Purchase</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (isFetchingPackages) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8C52FF" />
        <Text>Loading gem packages...</Text>
      </View>
    );
  }

  if (rcGemPackages.length === 0) {
    return (
      <View style={styles.loadingContainer}> 
        <Text>No gem packages available at the moment. Please check back later.</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.scrollView} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>Select Gem Package</Text>
      {rcGemPackages.map(renderRcGemPackageCard)}
    </ScrollView>
  );
};

const Store = () => {
  const route = useRoute<StoreRouteProp>();
  const [activeTab, setActiveTab] = useState<'Gems' | 'Items' | 'All'>('Gems');

  useEffect(() => {
    const initialTab = route.params?.initialTab || (activeTab.toLowerCase() as 'gems' | 'items');
    const logViewStore = async () => {
      try {
        await analytics().logEvent('view_store', { 
          initial_tab: initialTab
        });
        console.log(`[Analytics] Logged view_store event (tab: ${initialTab})`);
      } catch (analyticsError) {
        console.error('[Analytics] Error logging view_store event:', analyticsError);
      }
    };
    logViewStore();

    if (route.params?.initialTab) {
      switch (route.params.initialTab) {
        case 'gems':
          setActiveTab('Gems');
          break;
        case 'hats':
        case 'neck':
        case 'eyewear':
          setActiveTab('Items');
          break;
      }
    }
  }, [route.params?.initialTab]);

  useEffect(() => {
    const logTabChange = async () => {
      try {
        await analytics().logEvent('view_store', { 
          initial_tab: activeTab.toLowerCase() as 'gems' | 'items' | 'all'
        });
        console.log(`[Analytics] Logged view_store event (tab changed to: ${activeTab})`);
      } catch (analyticsError) {
        console.error('[Analytics] Error logging view_store tab change event:', analyticsError);
      }
    };
    if (!route.params?.initialTab) {
       logTabChange(); 
    }
  }, [activeTab]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <HeaderWithGems title="Store" />

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'Gems' && styles.activeTab
          ]} 
          onPress={() => setActiveTab('Gems')}
        >
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'Gems' ? '#8C52FF' : '#909090' }
          ]}>
            Gems
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'Items' && styles.activeTab
          ]} 
          onPress={() => setActiveTab('Items')}
        >
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'Items' ? '#8C52FF' : '#909090' }
          ]}>
            Items
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'All' && styles.activeTab
          ]} 
          onPress={() => setActiveTab('All')}
        >
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'All' ? '#8C52FF' : '#909090' }
          ]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'Gems' ? <GemsTab /> : activeTab === 'Items' ? <ItemsTab /> : <AllItemsTab />}
      </View>
    </View>
  );
};

const AllItemsTab = () => {
  const navigation = useNavigation<StoreNavigationProp>();
  const { gemBalance, deductGems } = useGems();
  const { purchaseItem, isItemOwned } = useInventory();

  const allItems: CategorizedItem[] = [
    ...hatItems.map((item: StoreItem) => ({ ...item, category: 'Hats' })),
    ...neckItems.map((item: StoreItem) => ({ ...item, category: 'Neck' })),
    ...eyewearItems.map((item: StoreItem) => ({ ...item, category: 'Eyewear' })),
  ];

  const handleItemPurchase = async (item: CategorizedItem) => {
    if (isItemOwned(item.id)) {
       playSound('action-fail');
       Alert.alert("Already Owned", "You already own this item.");
       return;
    }

    if (gemBalance < item.price) {
      playSound('action-fail');
      try {
        await analytics().logEvent('purchase_item_fail', { 
          item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          item_price: item.price,
          reason: 'insufficient_gems'
        });
        console.log(`[Analytics] Logged purchase_item_fail (insufficient_gems) event: ${item.id}`);
      } catch (analyticsError) {
        console.error('[Analytics] Error logging purchase_item_fail (insufficient_gems) event:', analyticsError);
      }
      Alert.alert("Not Enough Gems", `You need ${item.price} gems to purchase the ${item.name}, but you only have ${gemBalance}.`);
      return;
    }

    Alert.alert(
      "Confirm Purchase",
      `Purchase ${item.name} for ${item.price} gems?`,
      [
        { text: "Cancel", style: "cancel", onPress: () => {
            playSound('action-fail');
            try {
              analytics().logEvent('purchase_item_fail', { 
                item_id: item.id,
                item_name: item.name,
                item_category: item.category,
                item_price: item.price,
                reason: 'user_cancelled'
              });
              console.log(`[Analytics] Logged purchase_item_fail (user_cancelled) event: ${item.id}`);
            } catch (analyticsError) {
              console.error('[Analytics] Error logging purchase_item_fail (user_cancelled) event:', analyticsError);
            }
          } 
        },
        {
          text: "Confirm",
          onPress: async () => {
            const success = await purchaseItem(item.id, item.price);
            
            if (success) {
              try {
                await analytics().logEvent('purchase_item_complete', { 
                  item_id: item.id,
                  item_name: item.name,
                  item_category: item.category,
                  item_price: item.price
                });
                console.log(`[Analytics] Logged purchase_item_complete event: ${item.id}`);
              } catch (analyticsError) {
                console.error('[Analytics] Error logging purchase_item_complete event:', analyticsError);
              }
              
              playSound('activity-claim');
              Alert.alert("Purchase Successful", `${item.name} added to your inventory!`);
            } else {
              try {
                await analytics().logEvent('purchase_item_fail', { 
                  item_id: item.id,
                  item_name: item.name,
                  item_category: item.category,
                  item_price: item.price,
                  reason: 'purchase_error'
                });
                console.log(`[Analytics] Logged purchase_item_fail (purchase_error) event: ${item.id}`);
              } catch (analyticsError) {
                console.error('[Analytics] Error logging purchase_item_fail (purchase_error) event:', analyticsError);
              }
              
              console.error("Error purchasing item (likely failed gem deduction or storage error).");
              playSound('action-fail');
              Alert.alert("Purchase Failed", "There was an error completing your purchase.");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.scrollView} 
      contentContainerStyle={styles.gridContent}
      showsVerticalScrollIndicator={false}
    >
      {allItems.map((item) => {
        const owned = isItemOwned(item.id);

        return (
          <TouchableOpacity 
            key={`${item.category}-${item.id}`} 
            style={[
              styles.itemCard,
              owned && styles.ownedItemCard
            ]}
            onPress={() => handleItemPurchase(item)}
            disabled={owned}
            activeOpacity={owned ? 1 : 0.7}
          >
            <View style={styles.itemImageContainer}>
              {item.image && (
                <Image 
                  source={item.image} 
                  style={styles.itemImage}
                  contentFit="cover"
                  transition={200}
                />
              )}
              {owned && (
                <View style={styles.ownedBadge}>
                  <Text style={styles.ownedBadgeText}>Owned</Text>
                </View>
              )}
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              <Text style={styles.itemPrice}>{item.price} Gems</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    zIndex: 0,
  },
  headerTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: '#333333',
  },
  gemCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#8C52FF',
  },
  tabLabel: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 28,
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  gemPackage: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftContent: {
    marginRight: 16,
  },
  rightContent: {
    flex: 1,
  },
  gemImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: '#333333',
  },
  priceLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  gemsContainer: {
    alignItems: 'flex-start',
  },
  gemsAmount: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: '#8C52FF',
  },
  gemsBonus: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#4CAF50',
  },
  comingSoonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: '#333333',
    marginBottom: 12,
  },
  subText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  itemCategory: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F8F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryImage: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 4,
  },
  itemCount: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#8C52FF',
  },
  categoryArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 20,
    color: '#8C52FF',
  },
  gridContent: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  itemImageContainer: {
    aspectRatio: 1,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  itemPrice: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#8C52FF',
    marginTop: 4,
  },
  categoryBadge: {
    backgroundColor: '#F0E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#8C52FF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#8C52FF',
    fontWeight: 'bold',
  },
  purchaseButton: {
    backgroundColor: '#8C52FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonDisabled: {
    backgroundColor: '#B8B8B8',
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
  },
  devWarning: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  devWarningText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  headerContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  ownedItemCard: {
    opacity: 0.6,
  },
  ownedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#8C52FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ownedBadgeText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  rcGemPackageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  rcGemImage: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  rcGemInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  rcGemTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 4,
  },
  rcGemDescription: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  rcGemPrice: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#8C52FF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});

export default Store; 