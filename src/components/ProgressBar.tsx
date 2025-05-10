import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Animated, Text, ViewStyle } from 'react-native';
import { debounce } from 'lodash';

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

const MIN_PROGRESS_CHANGE = 0.01; // Only animate if progress changes by more than 1%

const ProgressBar: React.FC<ProgressBarProps> = React.memo(({
  progress,
  height = 15,
  backgroundColor = '#E0E0E0',
  fillColor = '#8C52FF',
  borderRadius = 4,
  animated = true,
  duration = 300, // Reduced from 500ms to 300ms
  showLabel = false,
  labelFormat = 'percent',
  customLabel,
  labelStyle = 'outside',
  style,
  currentValue,
  maxValue,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const prevProgress = useRef(0);
  const isInitialRender = useRef(true);
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  const startAnimation = useCallback(
    debounce((toValue: number) => {
      if (animated) {
        Animated.timing(progressAnim, {
          toValue,
          duration,
          useNativeDriver: false,
        }).start();
      } else {
        progressAnim.setValue(toValue);
      }
    }, 16),
    [animated, duration]
  );

  useEffect(() => {
    if (isInitialRender.current && clampedProgress > 0) {
      progressAnim.setValue(clampedProgress);
      prevProgress.current = clampedProgress;
      isInitialRender.current = false;
    } else if (!isInitialRender.current) {
      if (Math.abs(clampedProgress - prevProgress.current) >= MIN_PROGRESS_CHANGE) {
        startAnimation(clampedProgress);
        prevProgress.current = clampedProgress;
      }
    }

    return () => {
      startAnimation.cancel();
    };
  }, [clampedProgress, startAnimation]);

  const label = useMemo(() => {
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
  }, [clampedProgress, customLabel, labelFormat, currentValue, maxValue]);

  const containerStyle = useMemo(() => [styles.container, style], [style]);
  const progressContainerStyle = useMemo(() => [
    styles.progressContainer,
    {
      height,
      backgroundColor,
      borderRadius,
    }
  ], [height, backgroundColor, borderRadius]);

  const progressFillStyle = useMemo(() => [
    styles.progressFill,
    {
      width: progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
      }),
      height,
      backgroundColor: fillColor,
      borderRadius,
    },
  ], [height, fillColor, borderRadius, progressAnim]);

  return (
    <View style={containerStyle}>
      {showLabel && labelStyle === 'outside' && (
        <Text style={styles.labelOutside}>{label}</Text>
      )}
      
      <View style={progressContainerStyle}>
        <Animated.View style={progressFillStyle}>
          {showLabel && labelStyle === 'inside' && (
            <Text style={styles.labelInside}>{label}</Text>
          )}
        </Animated.View>
      </View>
    </View>
  );
});

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