import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  ActivityIndicator 
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  hapticFeedback?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  type = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  hapticFeedback = true,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    onPress();
  };

  const getButtonStyle = () => {
    let buttonStyle: ViewStyle = {};
    
    // Base on type
    switch (type) {
      case 'primary':
        buttonStyle = styles.primaryButton;
        break;
      case 'secondary':
        buttonStyle = styles.secondaryButton;
        break;
      case 'outline':
        buttonStyle = styles.outlineButton;
        break;
      case 'danger':
        buttonStyle = styles.dangerButton;
        break;
    }
    
    // Base on size
    switch (size) {
      case 'small':
        buttonStyle = { ...buttonStyle, ...styles.smallButton };
        break;
      case 'medium':
        buttonStyle = { ...buttonStyle, ...styles.mediumButton };
        break;
      case 'large':
        buttonStyle = { ...buttonStyle, ...styles.largeButton };
        break;
    }
    
    // Disabled state
    if (disabled) {
      buttonStyle = { ...buttonStyle, ...styles.disabledButton };
    }
    
    return buttonStyle;
  };

  const getTextStyle = () => {
    let textStyleToUse: TextStyle = {};
    
    // Base on type
    switch (type) {
      case 'primary':
        textStyleToUse = styles.primaryText;
        break;
      case 'secondary':
        textStyleToUse = styles.secondaryText;
        break;
      case 'outline':
        textStyleToUse = styles.outlineText;
        break;
      case 'danger':
        textStyleToUse = styles.dangerText;
        break;
    }
    
    // Base on size
    switch (size) {
      case 'small':
        textStyleToUse = { ...textStyleToUse, ...styles.smallText };
        break;
      case 'medium':
        textStyleToUse = { ...textStyleToUse, ...styles.mediumText };
        break;
      case 'large':
        textStyleToUse = { ...textStyleToUse, ...styles.largeText };
        break;
    }
    
    // Disabled state
    if (disabled) {
      textStyleToUse = { ...textStyleToUse, ...styles.disabledText };
    }
    
    return textStyleToUse;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={type === 'outline' ? '#8C52FF' : '#FFFFFF'} 
        />
      ) : (
        <>
          {icon && icon}
          <Text style={[getTextStyle(), textStyle, icon ? styles.textWithIcon : null]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Type styles
  primaryButton: {
    backgroundColor: '#8C52FF',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#F3EDFF',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8C52FF',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#FF5252',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Size styles
  smallButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
  },
  mediumButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 120,
  },
  largeButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minWidth: 160,
  },
  
  // Text styles by type
  primaryText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
  },
  secondaryText: {
    color: '#8C52FF',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
  },
  outlineText: {
    color: '#8C52FF',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
  },
  dangerText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
  },
  
  // Text styles by size
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  // Disabled styles
  disabledButton: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  disabledText: {
    color: '#A0A0A0',
  },
  
  // Icon spacing
  textWithIcon: {
    marginLeft: 8,
  },
});

export default Button; 