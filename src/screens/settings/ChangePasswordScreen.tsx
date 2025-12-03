import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useSettings } from '../../contexts/SettingsContext';

export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { changePassword } = useSettings();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      Alert.alert(
        'Success',
        'Your password has been changed successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Password change error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: theme.colors.border };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = [
      theme.colors.error,
      theme.colors.warning,
      theme.colors.warning,
      theme.colors.success,
      theme.colors.success,
    ];

    return {
      strength: strength,
      label: strengthLabels[strength - 1] || 'Very Weak',
      color: strengthColors[strength - 1] || theme.colors.error,
    };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Change Password"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {/* Security Notice */}
        <Card style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>🔒 Security Notice</Text>
          <Text style={styles.noticeText}>
            For your security, please choose a strong password that you haven't used before.
            Your password should be at least 8 characters long and include uppercase letters,
            lowercase letters, and numbers.
          </Text>
        </Card>

        {/* Password Form */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          
          <Input
            label="Current Password"
            value={formData.currentPassword}
            onChangeText={(value) => handleInputChange('currentPassword', value)}
            placeholder="Enter your current password"
            secureTextEntry={!showPasswords.current}
            error={errors.currentPassword}
            leftIcon="lock-closed-outline"
            rightIcon={showPasswords.current ? "eye-off-outline" : "eye-outline"}
            onRightIconPress={() => togglePasswordVisibility('current')}
          />
          
          <Input
            label="New Password"
            value={formData.newPassword}
            onChangeText={(value) => handleInputChange('newPassword', value)}
            placeholder="Enter your new password"
            secureTextEntry={!showPasswords.new}
            error={errors.newPassword}
            leftIcon="lock-closed-outline"
            rightIcon={showPasswords.new ? "eye-off-outline" : "eye-outline"}
            onRightIconPress={() => togglePasswordVisibility('new')}
          />

          {/* Password Strength Indicator */}
          {formData.newPassword.length > 0 && (
            <View style={styles.passwordStrengthContainer}>
              <View style={styles.passwordStrengthBar}>
                <View
                  style={[
                    styles.passwordStrengthFill,
                    {
                      width: `${(passwordStrength.strength / 5) * 100}%`,
                      backgroundColor: passwordStrength.color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                {passwordStrength.label}
              </Text>
            </View>
          )}
          
          <Input
            label="Confirm New Password"
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            placeholder="Confirm your new password"
            secureTextEntry={!showPasswords.confirm}
            error={errors.confirmPassword}
            leftIcon="lock-closed-outline"
            rightIcon={showPasswords.confirm ? "eye-off-outline" : "eye-outline"}
            onRightIconPress={() => togglePasswordVisibility('confirm')}
          />
        </Card>

        {/* Password Requirements */}
        <Card style={styles.requirementsCard}>
          <Text style={styles.sectionTitle}>Password Requirements</Text>
          
          <View style={styles.requirementItem}>
            <Text style={[
              styles.requirementText,
              formData.newPassword.length >= 8 ? styles.requirementMet : styles.requirementNotMet
            ]}>
              ✓ At least 8 characters long
            </Text>
          </View>
          
          <View style={styles.requirementItem}>
            <Text style={[
              styles.requirementText,
              /[a-z]/.test(formData.newPassword) ? styles.requirementMet : styles.requirementNotMet
            ]}>
              ✓ Contains lowercase letter
            </Text>
          </View>
          
          <View style={styles.requirementItem}>
            <Text style={[
              styles.requirementText,
              /[A-Z]/.test(formData.newPassword) ? styles.requirementMet : styles.requirementNotMet
            ]}>
              ✓ Contains uppercase letter
            </Text>
          </View>
          
          <View style={styles.requirementItem}>
            <Text style={[
              styles.requirementText,
              /\d/.test(formData.newPassword) ? styles.requirementMet : styles.requirementNotMet
            ]}>
              ✓ Contains number
            </Text>
          </View>
          
          <View style={styles.requirementItem}>
            <Text style={[
              styles.requirementText,
              formData.newPassword !== formData.currentPassword && formData.currentPassword.length > 0 
                ? styles.requirementMet 
                : styles.requirementNotMet
            ]}>
              ✓ Different from current password
            </Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          />
          <Button
            title="Change Password"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={!formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  noticeCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.primaryLight,
  },
  noticeTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  noticeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  formCard: {
    marginBottom: theme.spacing.md,
  },
  requirementsCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  passwordStrengthContainer: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginBottom: theme.spacing.xs,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  requirementItem: {
    marginBottom: theme.spacing.sm,
  },
  requirementText: {
    fontSize: theme.typography.fontSize.sm,
  },
  requirementMet: {
    color: theme.colors.success,
  },
  requirementNotMet: {
    color: theme.colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});
