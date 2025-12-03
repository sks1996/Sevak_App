import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { theme } from '../../constants/theme';
import { Card } from './Card';
import { Button } from './Button';
import { FileData, getFileIcon, formatFileSize, getFileTypeCategory } from '../../types/fileSharing';
import { useFileSharing } from '../../contexts/FileSharingContext';
import { useAuth } from '../../contexts/AuthContext';

interface FilePickerProps {
  onFileSelected?: (file: FileData) => void;
  onClose?: () => void;
  visible: boolean;
}

export const FilePicker: React.FC<FilePickerProps> = ({
  onFileSelected,
  onClose,
  visible,
}) => {
  const { uploadFile } = useFileSharing();
  const { authState } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access your media library');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file: FileData = {
          id: Date.now().toString(),
          name: asset.fileName || `image_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
          type: asset.type || 'image',
          mimeType: asset.type === 'image' ? 'image/jpeg' : 'video/mp4',
          uri: asset.uri,
          thumbnail: asset.uri,
          uploadedAt: new Date(),
          uploadedBy: authState.user?.id || '',
          uploadedByName: authState.user?.name || '',
        };

        await handleFileUpload(file);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access your camera');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file: FileData = {
          id: Date.now().toString(),
          name: `photo_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
          type: 'image',
          mimeType: 'image/jpeg',
          uri: asset.uri,
          thumbnail: asset.uri,
          uploadedAt: new Date(),
          uploadedBy: authState.user?.id || '',
          uploadedByName: authState.user?.name || '',
        };

        await handleFileUpload(file);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file: FileData = {
          id: Date.now().toString(),
          name: asset.name,
          size: asset.size || 0,
          type: getFileTypeCategory(asset.mimeType || ''),
          mimeType: asset.mimeType || 'application/octet-stream',
          uri: asset.uri,
          uploadedAt: new Date(),
          uploadedBy: authState.user?.id || '',
          uploadedByName: authState.user?.name || '',
        };

        await handleFileUpload(file);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleFileUpload = async (file: FileData) => {
    setIsUploading(true);
    try {
      await uploadFile(file);
      onFileSelected?.(file);
      onClose?.();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const fileOptions = [
    {
      id: 'camera',
      title: 'Take Photo',
      subtitle: 'Capture a new photo',
      icon: 'camera-outline',
      onPress: takePhoto,
    },
    {
      id: 'gallery',
      title: 'Choose from Gallery',
      subtitle: 'Select from your photos',
      icon: 'images-outline',
      onPress: pickImage,
    },
    {
      id: 'document',
      title: 'Upload Document',
      subtitle: 'Select a file to upload',
      icon: 'document-outline',
      onPress: pickDocument,
    },
  ];

  const renderFileOption = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.optionItem}
      onPress={item.onPress}
      disabled={isUploading}
    >
      <View style={styles.optionIcon}>
        <Ionicons name={item.icon as any} size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{item.title}</Text>
        <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Share File</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>Choose how you'd like to share a file</Text>
          
          <FlatList
            data={fileOptions}
            renderItem={renderFileOption}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {isUploading && (
          <View style={styles.uploadingOverlay}>
            <View style={styles.uploadingContent}>
              <Ionicons name="cloud-upload-outline" size={32} color={theme.colors.primary} />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.textWhite,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingContent: {
    alignItems: 'center',
    backgroundColor: theme.colors.textWhite,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
  },
  uploadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
  },
});
