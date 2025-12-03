import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

interface GradientBackgroundProps {
  children: React.ReactNode;
  colors?: string[];
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  colors,
  style,
  variant = 'primary',
}) => {
  const getGradientColors = () => {
    if (colors) return colors;
    
    switch (variant) {
      case 'primary':
        return [theme.colors.primary, theme.colors.primaryDark];
      case 'secondary':
        return [theme.colors.secondary, theme.colors.secondaryLight];
      case 'success':
        return [theme.colors.success, '#2F855A'];
      case 'warning':
        return [theme.colors.warning, '#B7791F'];
      case 'error':
        return [theme.colors.error, '#C53030'];
      case 'info':
        return [theme.colors.info, '#2B6CB0'];
      default:
        return [theme.colors.primary, theme.colors.primaryDark];
    }
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      style={[styles.container, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

