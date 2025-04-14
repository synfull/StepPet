import { Image as ExpoImage } from 'expo-image';
import { Image as RNImage } from 'react-native';

// Preload onboarding images
export const preloadOnboardingImages = () => {
  const onboardingImages = [
    require('../../assets/images/onboarding1.png'),
    require('../../assets/images/onboarding2.png'),
    require('../../assets/images/onboarding3.png'),
    require('../../assets/images/onboarding4.png'),
    require('../../assets/images/onboarding5.png'),
  ];

  onboardingImages.forEach((image) => {
    const uri = RNImage.resolveAssetSource(image).uri;
    ExpoImage.prefetch(uri);
  });
};

// Preload logo
export const preloadLogo = () => {
  const logo = require('../../assets/images/logo.png');
  const uri = RNImage.resolveAssetSource(logo).uri;
  ExpoImage.prefetch(uri);
}; 