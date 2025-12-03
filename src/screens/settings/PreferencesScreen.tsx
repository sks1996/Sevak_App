import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useSettings } from '../../contexts/SettingsContext';

interface PreferenceItemProps {
  title: string;
  subtitle: string;
  value: string;
  onPress: () => void;
}

const PreferenceItem: React.FC<PreferenceItemProps> = ({
  title,
  subtitle,
  value,
  onPress,
}) => (
  <TouchableOpacity style={styles.preferenceItem} onPress={onPress}>
    <View style={styles.preferenceContent}>
      <Text style={styles.preferenceTitle}>{title}</Text>
      <Text style={styles.preferenceSubtitle}>{subtitle}</Text>
    </View>
    <View style={styles.preferenceRight}>
      <Text style={styles.preferenceValue}>{value}</Text>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
    </View>
  </TouchableOpacity>
);

interface ToggleItemProps {
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

const ToggleItem: React.FC<ToggleItemProps> = ({
  title,
  subtitle,
  value,
  onToggle,
}) => (
  <View style={styles.toggleItem}>
    <View style={styles.toggleContent}>
      <Text style={styles.toggleTitle}>{title}</Text>
      <Text style={styles.toggleSubtitle}>{subtitle}</Text>
    </View>
    <TouchableOpacity
      style={[
        styles.toggle,
        value ? styles.toggleOn : styles.toggleOff
      ]}
      onPress={() => onToggle(!value)}
    >
      <View style={[
        styles.toggleThumb,
        value ? styles.toggleThumbOn : styles.toggleThumbOff
      ]} />
    </TouchableOpacity>
  </View>
);

export const PreferencesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settingsState, updatePreferences, resetPreferences } = useSettings();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showFontSizeModal, setShowFontSizeModal] = useState(false);

  const handleThemeChange = async (theme: 'light' | 'dark' | 'auto') => {
    try {
      await updatePreferences({ theme });
      setShowThemeModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update theme');
    }
  };

  const handleLanguageChange = async (language: 'en' | 'hi' | 'gu') => {
    try {
      await updatePreferences({ language });
      setShowLanguageModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update language');
    }
  };

  const handleFontSizeChange = async (fontSize: 'small' | 'medium' | 'large') => {
    try {
      await updatePreferences({ fontSize });
      setShowFontSizeModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update font size');
    }
  };

  const handleDisplayToggle = async (field: string, value: boolean) => {
    try {
      await updatePreferences({
        display: {
          ...settingsState.appPreferences.display,
          [field]: value,
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update display setting');
    }
  };

  const handleResetPreferences = () => {
    Alert.alert(
      'Reset Preferences',
      'This will reset all your app preferences to default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetPreferences();
            } catch (error) {
              Alert.alert('Error', 'Failed to reset preferences');
            }
          },
        },
      ]
    );
  };

  const getThemeDisplayName = (theme: string) => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'auto': return 'Auto (System)';
      default: return 'Light';
    }
  };

  const getLanguageDisplayName = (lang: string) => {
    switch (lang) {
      case 'en': return 'English';
      case 'hi': return 'हिन्दी (Hindi)';
      case 'gu': return 'ગુજરાતી (Gujarati)';
      default: return 'English';
    }
  };

  const getFontSizeDisplayName = (size: string) => {
    switch (size) {
      case 'small': return 'Small';
      case 'medium': return 'Medium';
      case 'large': return 'Large';
      default: return 'Medium';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Preferences"
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
        {/* Appearance */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <PreferenceItem
            title="Theme"
            subtitle="Choose your preferred theme"
            value={getThemeDisplayName(settingsState.appPreferences.theme)}
            onPress={() => setShowThemeModal(true)}
          />
          
          <PreferenceItem
            title="Language"
            subtitle="Select your preferred language"
            value={getLanguageDisplayName(settingsState.appPreferences.language)}
            onPress={() => setShowLanguageModal(true)}
          />
          
          <PreferenceItem
            title="Font Size"
            subtitle="Adjust text size for better readability"
            value={getFontSizeDisplayName(settingsState.appPreferences.fontSize)}
            onPress={() => setShowFontSizeModal(true)}
          />
        </Card>

        {/* Display Options */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Display Options</Text>
          
          <ToggleItem
            title="Show Profile Pictures"
            subtitle="Display profile pictures in messages and lists"
            value={settingsState.appPreferences.display.showProfilePicture}
            onToggle={(value) => handleDisplayToggle('showProfilePicture', value)}
          />
          
          <ToggleItem
            title="Show Department"
            subtitle="Display department information in user profiles"
            value={settingsState.appPreferences.display.showDepartment}
            onToggle={(value) => handleDisplayToggle('showDepartment', value)}
          />
          
          <ToggleItem
            title="Compact Mode"
            subtitle="Use compact layout for better space utilization"
            value={settingsState.appPreferences.display.compactMode}
            onToggle={(value) => handleDisplayToggle('compactMode', value)}
          />
          
          <ToggleItem
            title="Animations"
            subtitle="Enable smooth animations and transitions"
            value={settingsState.appPreferences.display.animations}
            onToggle={(value) => handleDisplayToggle('animations', value)}
          />
        </Card>

        {/* Reset Options */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Reset Options</Text>
          <Button
            title="Reset All Preferences"
            variant="outline"
            onPress={handleResetPreferences}
            style={styles.resetButton}
            leftIcon="refresh-outline"
          />
        </Card>

        {/* Theme Selection Modal */}
        {showThemeModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Theme</Text>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleThemeChange('light')}
              >
                <Text style={styles.modalOptionText}>Light</Text>
                {settingsState.appPreferences.theme === 'light' && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleThemeChange('dark')}
              >
                <Text style={styles.modalOptionText}>Dark</Text>
                {settingsState.appPreferences.theme === 'dark' && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleThemeChange('auto')}
              >
                <Text style={styles.modalOptionText}>Auto (System)</Text>
                {settingsState.appPreferences.theme === 'auto' && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
              
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowThemeModal(false)}
                style={styles.modalCancelButton}
              />
            </View>
          </View>
        )}

        {/* Language Selection Modal */}
        {showLanguageModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Language</Text>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleLanguageChange('en')}
              >
                <Text style={styles.modalOptionText}>English</Text>
                {settingsState.appPreferences.language === 'en' && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleLanguageChange('hi')}
              >
                <Text style={styles.modalOptionText}>हिन्दी (Hindi)</Text>
                {settingsState.appPreferences.language === 'hi' && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleLanguageChange('gu')}
              >
                <Text style={styles.modalOptionText}>ગુજરાતી (Gujarati)</Text>
                {settingsState.appPreferences.language === 'gu' && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
              
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowLanguageModal(false)}
                style={styles.modalCancelButton}
              />
            </View>
          </View>
        )}

        {/* Font Size Selection Modal */}
        {showFontSizeModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Font Size</Text>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleFontSizeChange('small')}
              >
                <Text style={styles.modalOptionText}>Small</Text>
                {settingsState.appPreferences.fontSize === 'small' && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleFontSizeChange('medium')}
              >
                <Text style={styles.modalOptionText}>Medium</Text>
                {settingsState.appPreferences.fontSize === 'medium' && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleFontSizeChange('large')}
              >
                <Text style={styles.modalOptionText}>Large</Text>
                {settingsState.appPreferences.fontSize === 'large' && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
              
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowFontSizeModal(false)}
                style={styles.modalCancelButton}
              />
            </View>
          </View>
        )}
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
  sectionCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  preferenceSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  preferenceRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: theme.colors.primary,
  },
  toggleOff: {
    backgroundColor: theme.colors.border,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.textWhite,
    shadowColor: theme.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  toggleThumbOff: {
    alignSelf: 'flex-start',
  },
  resetButton: {
    marginTop: theme.spacing.sm,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: theme.colors.textWhite,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    minWidth: 280,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalOptionText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
  },
  modalCancelButton: {
    marginTop: theme.spacing.lg,
  },
});
