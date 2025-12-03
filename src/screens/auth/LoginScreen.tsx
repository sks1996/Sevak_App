import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { GradientBackground } from '../../components/common/GradientBackground';
import { theme } from '../../constants/theme';

export const LoginScreen: React.FC = () => {
  const { login, authState } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
    };

    if (!credentials.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!credentials.password) {
      newErrors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login(credentials);
    } catch (error) {
      Alert.alert('Login Failed', 'Please check your credentials and try again.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
          alwaysBounceVertical={true}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🏛️</Text>
            <Text style={styles.appName}>Sevak App</Text>
            <Text style={styles.tagline}>Secure Communication Platform</Text>
          </View>

          <Card style={styles.loginCard}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtitleText}>
              Sign in to continue to your account
            </Text>

            <View style={styles.formContainer}>
              <Input
                label="Email Address"
                placeholder="Enter your email"
                value={credentials.email}
                onChangeText={(value) => handleInputChange('email', value)}
                error={errors.email}
                leftIcon="mail"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={credentials.password}
                onChangeText={(value) => handleInputChange('password', value)}
                error={errors.password}
                leftIcon="lock-closed"
                secureTextEntry
              />

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={authState.isLoading}
                style={styles.loginButton}
                size="large"
              />

              {authState.error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{authState.error}</Text>
                </View>
              )}
            </View>
          </Card>

          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>Demo Credentials</Text>
            <View style={styles.demoCredentials}>
              <View style={styles.demoItem}>
                <Text style={styles.demoRole}>Sevak:</Text>
                <Text style={styles.demoText}>john@example.com / password123</Text>
              </View>
              <View style={styles.demoItem}>
                <Text style={styles.demoRole}>HOD:</Text>
                <Text style={styles.demoText}>jane@example.com / password123</Text>
              </View>
              <View style={styles.demoItem}>
                <Text style={styles.demoRole}>Admin:</Text>
                <Text style={styles.demoText}>admin@example.com / password123</Text>
              </View>
            </View>
          </View>

          {/* Extra content to ensure scrolling */}
          <View style={styles.extraContent}>
            <Text style={styles.extraText}>
              🎉 Sevak App - Complete Communication Platform
            </Text>
            <View style={styles.spacer} />
            <Text style={styles.extraText}>
              Ready for production deployment!
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    minHeight: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
    marginTop: theme.spacing.xl,
  },
  logo: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  appName: {
    fontSize: theme.typography.fontSize.xxxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  tagline: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.white,
    textAlign: 'center',
    opacity: 0.9,
    fontFamily: theme.typography.fontFamily.medium,
  },
  loginCard: {
    marginBottom: theme.spacing.xl,
  },
  welcomeText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitleText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  formContainer: {
    marginTop: theme.spacing.md,
  },
  loginButton: {
    marginTop: theme.spacing.lg,
  },
  errorContainer: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.error + '10',
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
  },
  demoContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  demoTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  demoCredentials: {
    gap: theme.spacing.sm,
  },
  demoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  demoRole: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.primary,
    width: 60,
  },
  demoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  extraContent: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  extraText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  spacer: {
    height: theme.spacing.xl,
  },
});
