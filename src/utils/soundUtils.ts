import { Audio } from 'expo-av';

// Object to cache loaded sounds
const soundCache: { [key: string]: Audio.Sound } = {};

// Function to load sound if not already cached
const loadSound = async (soundFile: any): Promise<Audio.Sound | null> => {
  const soundKey = JSON.stringify(soundFile); // Use file path/require object as key
  if (soundCache[soundKey]) {
    // If already loaded, return cached instance
    return soundCache[soundKey];
  }
  try {
    const { sound } = await Audio.Sound.createAsync(soundFile);
    soundCache[soundKey] = sound; // Cache the loaded sound
    return sound;
  } catch (error) {
    console.error('Error loading sound:', soundKey, error);
    return null;
  }
};

// Function to play a sound effect
export const playSound = async (soundName: 'ui-tap' | 'activity-claim' | 'action-fail' | 'level-up' | 'milestone-unlocked' | 'egg-crack') => {
  let soundFile;
  try {
    switch (soundName) {
      case 'ui-tap':
        soundFile = require('../../assets/sounds/ui-tap.mp3');
        break;
      case 'activity-claim':
        soundFile = require('../../assets/sounds/activity-claim.mp3');
        break;
      case 'action-fail':
        soundFile = require('../../assets/sounds/action-fail.mp3');
        break;
      case 'level-up':
        soundFile = require('../../assets/sounds/level-up.mp3');
        break;
      case 'milestone-unlocked':
        soundFile = require('../../assets/sounds/milestone-unlocked.mp3');
        break;
      case 'egg-crack':
        // Prefer mp3 for consistency if available, otherwise wav
        try {
          soundFile = require('../../assets/sounds/egg-crack.mp3');
        } catch {
          soundFile = require('../../assets/sounds/egg-crack.wav');
        }
        break;
      default:
        console.warn('Unknown sound name:', soundName);
        return;
    }

    const soundObject = await loadSound(soundFile);
    if (soundObject) {
      await soundObject.replayAsync(); // Use replayAsync to play from start if already loaded/playing
    }
  } catch (error) {
    console.error(`Error playing sound ${soundName}:`, error);
  }
};

// Optional: Function to unload all sounds (e.g., on app close or settings change)
export const unloadAllSounds = async () => {
  console.log('Unloading all sounds...');
  for (const key in soundCache) {
    try {
      await soundCache[key].unloadAsync();
    } catch (error) {
      console.error('Error unloading sound:', key, error);
    }
    delete soundCache[key];
  }
  console.log('All sounds unloaded.');
};

// Configure audio mode for playback even in silent mode (optional but recommended for effects)
Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  playsInSilentModeIOS: true, // Allows playback in silent mode on iOS
  shouldDuckAndroid: true, // Ducks background audio on Android
  playThroughEarpieceAndroid: false,
});