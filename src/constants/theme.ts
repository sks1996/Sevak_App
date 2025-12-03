export const theme = {
  colors: {
    // Primary Colors - Enhanced Saffron Theme
    primary: '#FF6B35', // Vibrant Saffron Orange
    primaryLight: '#FFF4E6', // Light Saffron
    primaryDark: '#E55A2B', // Darker Saffron
    secondary: '#1A365D', // Navy Blue
    secondaryLight: '#2D4A6B', // Lighter Navy
    background: '#FFFFFF', // Pure White
    surface: '#F8FAFC', // Very Light Gray
    
    // Text Colors - Better contrast
    textPrimary: '#1A202C', // Darker text for better readability
    textSecondary: '#4A5568', // Medium Gray
    textMuted: '#718096', // Light Gray
    textWhite: '#FFFFFF', // White
    textLight: '#A0AEC0', // Very Light Gray
    
    // Status Colors - More vibrant
    success: '#38A169', // Better Green
    successLight: '#C6F6D5', // Light Green
    warning: '#D69E2E', // Better Orange
    warningLight: '#FEFCBF', // Light Yellow
    error: '#E53E3E', // Better Red
    errorLight: '#FED7D7', // Light Red
    info: '#3182CE', // Better Blue
    infoLight: '#BEE3F8', // Light Blue
    
    // Neutral Colors
    white: '#FFFFFF',
    black: '#000000',
    gray50: '#F7FAFC',
    gray100: '#EDF2F7',
    gray200: '#E2E8F0',
    gray300: '#CBD5E0',
    gray400: '#A0AEC0',
    gray500: '#718096',
    gray600: '#4A5568',
    gray700: '#2D3748',
    gray800: '#1A202C',
    gray900: '#171923',
    
    // Border Colors
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    borderDark: '#CBD5E0',
    
    // Background Variations
    backgroundSecondary: '#F8FAFC',
    backgroundTertiary: '#EDF2F7',
    
    // Overlay Colors
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.1)',
  },
  
  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      semiBold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
      xxl: 36,
      xxxl: 40,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    xxxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 1,
      elevation: 1,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    inner: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: -1,
    },
  },
};

export type Theme = typeof theme;
