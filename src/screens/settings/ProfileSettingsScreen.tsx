import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

export const ProfileSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { authState } = useAuth();
  const { settingsState, updateProfile, updateAvatar } = useSettings();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: settingsState.userProfile.name,
    email: settingsState.userProfile.email,
    phone: settingsState.userProfile.phone || '',
    department: settingsState.userProfile.department || '',
    bio: settingsState.userProfile.bio || '',
    location: settingsState.userProfile.location || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: settingsState.userProfile.name,
      email: settingsState.userProfile.email,
      phone: settingsState.userProfile.phone || '',
      department: settingsState.userProfile.department || '',
      bio: settingsState.userProfile.bio || '',
      location: settingsState.userProfile.location || '',
    });
    setIsEditing(false);
  };

  const handleAvatarPress = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => handleTakePhoto() },
        { text: 'Choose from Gallery', onPress: () => handleChoosePhoto() },
      ]
    );
  };

  const handleTakePhoto = async () => {
    try {
      // In a real app, this would open the camera
      const mockAvatarUri = 'https://via.placeholder.com/150/FF6B35/FFFFFF?text=Photo';
      await updateAvatar(mockAvatarUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleChoosePhoto = async () => {
    try {
      // In a real app, this would open the image picker
      const mockAvatarUri = 'https://via.placeholder.com/150/FF6B35/FFFFFF?text=Avatar';
      await updateAvatar(mockAvatarUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to choose photo');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Edit Profile"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightButton={isEditing ? undefined : {
          icon: 'create-outline',
          onPress: () => setIsEditing(true),
        }}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {/* Profile Picture Section */}
        <Card style={styles.avatarCard}>
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer}>
              {settingsState.userProfile.avatar ? (
                <Image
                  source={{ uri: settingsState.userProfile.avatar }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={60} color={theme.colors.textWhite} />
                </View>
              )}
              <View style={styles.avatarEditIcon}>
                <Ionicons name="camera" size={16} color={theme.colors.textWhite} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarText}>Tap to change profile picture</Text>
          </View>
        </Card>

        {/* Profile Information */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <Input
            label="Full Name"
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="Enter your full name"
            editable={isEditing}
            leftIcon="person-outline"
          />
          
          <Input
            label="Email Address"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="Enter your email"
            keyboardType="email-address"
            editable={isEditing}
            leftIcon="mail-outline"
          />
          
          <Input
            label="Phone Number"
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            editable={isEditing}
            leftIcon="call-outline"
          />
          
          <Input
            label="Department"
            value={formData.department}
            onChangeText={(value) => handleInputChange('department', value)}
            placeholder="Enter your department"
            editable={isEditing}
            leftIcon="business-outline"
          />
          
          <Input
            label="Location"
            value={formData.location}
            onChangeText={(value) => handleInputChange('location', value)}
            placeholder="Enter your location"
            editable={isEditing}
            leftIcon="location-outline"
          />
          
          <View style={styles.bioContainer}>
            <Text style={styles.bioLabel}>Bio</Text>
            <View style={styles.bioInputContainer}>
              <Text
                style={[
                  styles.bioText,
                  !isEditing && styles.bioTextReadOnly
                ]}
                onPress={() => isEditing && setIsEditing(true)}
              >
                {formData.bio || 'Tell us about yourself...'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Account Information */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue}>{settingsState.userProfile.id}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={[styles.infoValue, { color: theme.colors.primary }]}>
              {authState.user?.role.toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {formatDate(settingsState.userProfile.joinDate)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>
              {formatDate(settingsState.userProfile.lastUpdated)}
            </Text>
          </View>
        </Card>

        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={handleCancel}
              style={styles.cancelButton}
            />
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={isLoading}
              style={styles.saveButton}
            />
          </View>
        )}

        {/* Password Change */}
        <Card style={styles.passwordCard}>
          <Text style={styles.sectionTitle}>Security</Text>
          <Button
            title="Change Password"
            variant="outline"
            onPress={() => navigation.navigate('ChangePassword' as never)}
            leftIcon="lock-closed-outline"
          />
        </Card>
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
  avatarCard: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.textWhite,
  },
  avatarText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: theme.spacing.md,
  },
  infoCard: {
    marginBottom: theme.spacing.md,
  },
  passwordCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  bioContainer: {
    marginTop: theme.spacing.md,
  },
  bioLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  bioInputContainer: {
    minHeight: 80,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bioText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  bioTextReadOnly: {
    color: theme.colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
