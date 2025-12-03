import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../constants/theme';
import { FileData, getFileIcon, formatFileSize, getFileTypeCategory } from '../../types/fileSharing';
import { useFileSharing } from '../../contexts/FileSharingContext';

interface FileMessageProps {
  fileData: FileData;
  message?: string;
  isOwnMessage?: boolean;
  onPress?: () => void;
}

export const FileMessage: React.FC<FileMessageProps> = ({
  fileData,
  message,
  isOwnMessage = false,
  onPress,
}) => {
  const { downloadFile, deleteFile } = useFileSharing();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadFile(fileData.id);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete File',
      'Are you sure you want to delete this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFile(fileData.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete file');
            }
          },
        },
      ]
    );
  };

  const fileCategory = getFileTypeCategory(fileData.mimeType);
  const fileIcon = getFileIcon(fileData.mimeType);

  const renderFilePreview = () => {
    if (fileCategory === 'image' && fileData.thumbnail) {
      return (
        <Image
          source={{ uri: fileData.thumbnail }}
          style={styles.fileImage}
          resizeMode="cover"
        />
      );
    }

    return (
      <View style={styles.fileIconContainer}>
        <Ionicons name={fileIcon as any} size={32} color={theme.colors.primary} />
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {renderFilePreview()}
      
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={2}>
          {fileData.name}
        </Text>
        
        <View style={styles.fileDetails}>
          <Text style={styles.fileSize}>
            {formatFileSize(fileData.size)}
          </Text>
          <Text style={styles.fileType}>
            {fileCategory.toUpperCase()}
          </Text>
        </View>

        {message && (
          <Text style={styles.message} numberOfLines={3}>
            {message}
          </Text>
        )}

        <View style={styles.fileActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            <Ionicons
              name={isDownloading ? "hourglass-outline" : "download-outline"}
              size={16}
              color={theme.colors.primary}
            />
            <Text style={styles.actionText}>
              {isDownloading ? 'Downloading...' : 'Download'}
            </Text>
          </TouchableOpacity>

          {isOwnMessage && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={theme.colors.error}
              />
              <Text style={[styles.actionText, { color: theme.colors.error }]}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.xs,
    maxWidth: '80%',
    shadowColor: theme.colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessage: {
    backgroundColor: theme.colors.primaryLight,
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: theme.colors.textWhite,
    alignSelf: 'flex-start',
  },
  fileImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
  },
  fileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  fileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  fileSize: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  fileType: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  message: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 18,
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  actionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
});
