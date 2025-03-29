import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, ViewStyle } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  borderRadius?: number;
  animated?: boolean;
  duration?: number;
  showLabel?: boolean;
  labelFormat?: 'percent' | 'fraction' | 'custom';
  customLabel?: string;
  labelStyle?: 'inside' | 'outside' | 'none';
  style?: ViewStyle;
  currentValue?: number;
  maxValue?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 15,
  backgroundColor = '#E0E0E0',
  fillColor = '#8C52FF',
  borderRadius = 4,
  animated = true,
  duration = 500,
  showLabel = false,
  labelFormat = 'percent',
  customLabel,
  labelStyle = 'outside',
  style,
  currentValue,
  maxValue,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: clampedProgress,
        duration: duration,
        useNativeDriver: false, // We're animating width which isn't supported by the native driver
      }).start();
    } else {
      progressAnim.setValue(clampedProgress);
    }
  }, [clampedProgress, animated, duration, progressAnim]);

  const getLabel = () => {
    if (customLabel) return customLabel;
    
    switch (labelFormat) {
      case 'percent':
        return `${Math.round(clampedProgress * 100)}%`;
      case 'fraction':
        if (currentValue !== undefined && maxValue !== undefined) {
          return `${currentValue}/${maxValue}`;
        }
        return `${Math.round(clampedProgress * 100)}%`;
      default:
        return `${Math.round(clampedProgress * 100)}%`;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {showLabel && labelStyle === 'outside' && (
        <Text style={styles.labelOutside}>{getLabel()}</Text>
      )}
      
      <View 
        style={[
          styles.progressContainer, 
          { 
            height: height, 
            backgroundColor: backgroundColor,
            borderRadius: borderRadius,
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              height: height,
              backgroundColor: fillColor,
              borderRadius: borderRadius,
            },
          ]}
        >
          {showLabel && labelStyle === 'inside' && (
            <Text style={styles.labelInside}>{getLabel()}</Text>
          )}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  progressContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelOutside: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    textAlign: 'right',
  },
  labelInside: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default ProgressBar; 