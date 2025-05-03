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

const gemPackages: GemPackage[] = [
  {
    id: 'starter',
    price: 1.99,
    gems: 100,
    bonus: 0,
    image: require('../../assets/images/store/gems/gems_100.png'),
  },
  {
    id: 'basic',
    price: 4.99,
    gems: 300,
    bonus: 50,
    image: require('../../assets/images/store/gems/gems_350.png'),
  },
  {
    id: 'popular',
    price: 9.99,
    gems: 650,
    bonus: 150,
    image: require('../../assets/images/store/gems/gems_800.png'),
  },
  {
    id: 'value',
    price: 19.99,
    gems: 1300,
    bonus: 400,
    image: require('../../assets/images/store/gems/gems_1700.png'),
  },
  {
    id: 'premium',
    price: 49.99,
    gems: 3300,
    bonus: 1200,
    image: require('../../assets/images/store/gems/gems_4500.png'),
  },
];

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
  const [selectedPackage, setSelectedPackage] = useState<GemPackage | null>(null);

  const handlePurchaseAttempt = (pack: GemPackage) => {
    setSelectedPackage(pack);
    Alert.alert(
      'Confirm Purchase',
      `Would you like to purchase ${pack.gems + pack.bonus} gems for $${pack.price.toFixed(2)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setSelectedPackage(null);
            setPurchaseState('idle');
          },
        },
        {
          text: 'Purchase',
          onPress: () => processPurchase(pack),
        },
      ]
    );
  };

  const processPurchase = async (pack: GemPackage) => {
    // Log purchase_gems_start event
    try {
      await analytics().logEvent('purchase_gems_start', { 
        package_id: pack.id, 
        package_gems: pack.gems,
        package_bonus: pack.bonus,
        package_price: pack.price
      });
      console.log(`[Analytics] Logged purchase_gems_start event: ${pack.id}`);
    } catch (analyticsError) {
      console.error('[Analytics] Error logging purchase_gems_start event:', analyticsError);
    }
    
    setPurchaseState('processing');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock purchase success (this will be replaced with real StoreKit logic)
      await addGems(pack.gems + pack.bonus);
      playSound('activity-claim');
      setPurchaseState('success');
      
      // Log purchase_gems_complete event
      try {
        await analytics().logEvent('purchase_gems_complete', { 
          package_id: pack.id, 
          package_gems: pack.gems,
          package_bonus: pack.bonus,
          package_price: pack.price
        });
        console.log(`[Analytics] Logged purchase_gems_complete event: ${pack.id}`);
      } catch (analyticsError) {
        console.error('[Analytics] Error logging purchase_gems_complete event:', analyticsError);
      }
      
      Alert.alert(
        'Purchase Successful!',
        `${pack.gems + pack.bonus} gems have been added to your account.`,
        [{ text: 'OK', onPress: () => setPurchaseState('idle') }]
      );
    } catch (error) {
      console.error('Purchase failed:', error);
      setPurchaseState('failed');
      
      // Log purchase_gems_fail event
      try {
        // Use selectedPackage if pack is not available in catch scope (though it should be)
        const failedPack = pack || selectedPackage;
        if (failedPack) {
          await analytics().logEvent('purchase_gems_fail', { 
            package_id: failedPack.id, 
            package_gems: failedPack.gems,
            package_bonus: failedPack.bonus,
            package_price: failedPack.price,
            error_message: error instanceof Error ? error.message : String(error) // Capture error message
          });
          console.log(`[Analytics] Logged purchase_gems_fail event: ${failedPack.id}`);
        } else {
          console.log(`[Analytics] Logged purchase_gems_fail event (unknown package)`);
          await analytics().logEvent('purchase_gems_fail', { 
             error_message: error instanceof Error ? error.message : String(error)
          });
        }
      } catch (analyticsError) {
        console.error('[Analytics] Error logging purchase_gems_fail event:', analyticsError);
      }
      
      Alert.alert(
        'Purchase Failed',
        'There was an error processing your purchase. Please try again.',
        [{ text: 'OK', onPress: () => setPurchaseState('idle') }]
      );
    } finally {
      setSelectedPackage(null);
    }
  };

  const renderPurchaseButton = (pack: GemPackage) => {
    const isProcessing = purchaseState === 'processing' && selectedPackage?.id === pack.id;
    
    return (
      <TouchableOpacity 
        style={[
          styles.purchaseButton,
          isProcessing && styles.purchaseButtonDisabled
        ]}
        onPress={() => handlePurchaseAttempt(pack)}
        disabled={purchaseState !== 'idle'}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.purchaseButtonText}>
            Purchase
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView 
      style={styles.scrollView} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* <View style={styles.devWarning}>
        <Text style={styles.devWarningText}>
          Development Mode: Purchases are simulated and gems are added instantly.
        </Text>
      </View> */}
      
      <Text style={styles.sectionTitle}>Select Gem Package</Text>
      {gemPackages.map((pack) => (
        <View key={pack.id} style={styles.gemPackage}>
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
          {renderPurchaseButton(pack)}
        </View>
      ))}
    </ScrollView>
  );
};

const Store = () => {
  const route = useRoute<StoreRouteProp>();
  const [activeTab, setActiveTab] = useState<'Gems' | 'Items' | 'All'>('Gems');

  useEffect(() => {
    const initialTab = route.params?.initialTab || (activeTab.toLowerCase() as 'gems' | 'items');
    // Log view_store event on mount or when tab changes
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

    // Set active tab based on route params (runs only once on mount)
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
  }, [route.params?.initialTab]); // Depend only on route params for initial setting

  // Log event when tab is manually changed by user
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
    // Avoid logging on initial mount if route.params existed
    if (!route.params?.initialTab) {
       logTabChange(); 
    }
  }, [activeTab]); // Log when activeTab changes

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

    // Log purchase_item_fail event (insufficient funds)
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
            // Log purchase_item_fail event (user cancelled)
            try {
              analytics().logEvent('purchase_item_fail', { 
                item_id: item.id,
                item_name: item.name,
                item_category: item.category,
                item_price: item.price,
                reason: 'user_cancelled'
              }); // No await needed for cancel
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
              // Log purchase_item_complete event
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
              // Log purchase_item_fail event (general failure)
              try {
                await analytics().logEvent('purchase_item_fail', { 
                  item_id: item.id,
                  item_name: item.name,
                  item_category: item.category,
                  item_price: item.price,
                  reason: 'purchase_error' // General error during purchase logic
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
});

export default Store; 