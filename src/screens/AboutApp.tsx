import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Header from '../components/Header';

const AboutApp: React.FC = () => {
  const openLink = (url: string, title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(
          'Cannot Open Link',
          `Unable to open ${title}. Please check your connection and try again.`,
          [{ text: 'OK' }]
        );
      }
    });
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header
        title="About StepPet"
        showBackButton
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>StepPet</Text>
          <Text style={styles.tagline}>Turn your steps into a pet adventure!</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About StepPet</Text>
          <Text style={styles.sectionText}>
            StepPet is a fun and motivating fitness app that turns your daily steps into a pet-nurturing adventure. 
            Walk more to hatch your pet egg, evolve your pet, and unlock exciting rewards!
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="egg-outline" size={24} color="#8C52FF" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Hatch Your Pet</Text>
              <Text style={styles.featureText}>
                Start with an egg that hatches into one of eight unique pets as you walk.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="fitness-outline" size={24} color="#8C52FF" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Daily Activities</Text>
              <Text style={styles.featureText}>
                Complete mini-games like feeding your pet and going on adventure walks.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="trophy-outline" size={24} color="#8C52FF" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Milestone Rewards</Text>
              <Text style={styles.featureText}>
                Earn special rewards as you reach step milestones.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="people-outline" size={24} color="#8C52FF" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Compete with Friends</Text>
              <Text style={styles.featureText}>
                Add friends and compete on the weekly leaderboard.
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact & Support</Text>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openLink('mailto:support@steppet.app', 'Email support')}
          >
            <Ionicons name="mail-outline" size={20} color="#8C52FF" />
            <Text style={styles.linkText}>support@steppet.app</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openLink('https://steppet.app/support', 'Support website')}
          >
            <Ionicons name="help-circle-outline" size={20} color="#8C52FF" />
            <Text style={styles.linkText}>Help & Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openLink('https://steppet.app/privacy', 'Privacy Policy')}
          >
            <Ionicons name="shield-outline" size={20} color="#8C52FF" />
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openLink('https://steppet.app/terms', 'Terms of Service')}
          >
            <Ionicons name="document-text-outline" size={20} color="#8C52FF" />
            <Text style={styles.linkText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.creditsSection}>
          <Text style={styles.creditsTitle}>Created By</Text>
          <Text style={styles.creditsText}>The StepPet Team</Text>
          <Text style={styles.copyright}>© 2025 StepPet. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  appName: {
    fontFamily: 'Caprasimo-Regular',
    fontSize: 28,
    color: '#8C52FF',
    marginBottom: 8,
  },
  tagline: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  version: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#909090',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 16,
  },
  sectionText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    color: '#666666',
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
  },
  featureText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 12,
  },
  linkText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 15,
    color: '#333333',
    marginLeft: 12,
  },
  creditsSection: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  creditsTitle: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#909090',
    marginBottom: 4,
  },
  creditsText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  copyright: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#909090',
  },
});

export default AboutApp; 