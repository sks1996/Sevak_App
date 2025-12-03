import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useMessaging } from '../../contexts/MessagingContext';
import { useFileSharing } from '../../contexts/FileSharingContext';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { FilePicker } from '../../components/common/FilePicker';
import { FileMessage } from '../../components/common/FileMessage';
import { theme } from '../../constants/theme';
import { Message, Group } from '../../types/messaging';
import { FileMessage as FileMessageType } from '../../types/fileSharing';
import { canUserSendToGroup } from '../../constants/messaging';

interface GroupChatScreenProps {
  group: Group;
  onBack: () => void;
}

export const GroupChatScreen: React.FC<GroupChatScreenProps> = ({ group, onBack }) => {
  const { authState } = useAuth();
  const { messagingState, sendMessage } = useMessaging();
  const { uploadFile } = useFileSharing();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const messages = messagingState.messages[group.id] || [];
  const canSend = authState.user ? canUserSendToGroup(authState.user.id, group.id) : false;

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !authState.user || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(group.id, messageText.trim());
      setMessageText('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelected = async (file: any) => {
    try {
      await uploadFile(file, messageText.trim() || undefined);
      setMessageText('');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    }
  };

  const formatMessageTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (timestamp: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (timestamp.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (timestamp.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === authState.user?.id;
    const showDate = index === 0 || 
      formatMessageDate(item.timestamp) !== formatMessageDate(messages[index - 1].timestamp);

    // Check if this is a file message
    const isFileMessage = (item as any).type === 'file';

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatMessageDate(item.timestamp)}</Text>
          </View>
        )}
        
        {isFileMessage ? (
          <FileMessage
            fileData={(item as FileMessageType).fileData}
            message={(item as FileMessageType).message}
            isOwnMessage={isOwnMessage}
          />
        ) : (
          <View style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessage : styles.otherMessage
          ]}>
            <View style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownBubble : styles.otherBubble
            ]}>
              {!isOwnMessage && (
                <Text style={styles.senderName}>{item.senderName}</Text>
              )}
              <Text style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText
              ]}>
                {item.content}
              </Text>
              <Text style={[
                styles.messageTime,
                isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
              ]}>
                {formatMessageTime(item.timestamp)}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textMuted} />
      <Text style={styles.emptyTitle}>No Messages Yet</Text>
      <Text style={styles.emptySubtitle}>
        {canSend 
          ? "Start the conversation by sending a message!"
          : "You can read messages when they are sent."
        }
      </Text>
    </View>
  );

  const getGroupIcon = (groupType: string) => {
    switch (groupType) {
      case 'system':
        return 'megaphone';
      case 'department':
        return 'people';
      case 'admin':
        return 'shield';
      default:
        return 'chatbubbles';
    }
  };

  const getGroupIconColor = (groupType: string) => {
    switch (groupType) {
      case 'system':
        return theme.colors.warning;
      case 'department':
        return theme.colors.info;
      case 'admin':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={group.name}
        showBackButton
        onBackPress={onBack}
        user={{
          name: authState.user?.name || '',
          role: authState.user?.role || 'sevak',
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
      >
        {/* Group Info Header */}
        <View style={styles.groupInfoHeader}>
          <View style={styles.groupIconContainer}>
            <Ionicons
              name={getGroupIcon(group.type) as any}
              size={20}
              color={getGroupIconColor(group.type)}
            />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupDescription}>{group.description}</Text>
          </View>
          {!canSend && (
            <View style={styles.readOnlyBadge}>
              <Text style={styles.readOnlyText}>Read Only</Text>
            </View>
          )}
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Message Input */}
        {canSend && (
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                style={styles.attachButton}
                onPress={() => setShowFilePicker(true)}
              >
                <Ionicons name="attach-outline" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor={theme.colors.textMuted}
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!messageText.trim() || isSending) && styles.sendButtonDisabled
                ]}
                onPress={handleSendMessage}
                disabled={!messageText.trim() || isSending}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={(!messageText.trim() || isSending) ? theme.colors.textMuted : theme.colors.textWhite}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* File Picker Modal */}
        <FilePicker
          visible={showFilePicker}
          onClose={() => setShowFilePicker(false)}
          onFileSelected={handleFileSelected}
        />

        {/* Read-only indicator */}
        {!canSend && (
          <View style={styles.readOnlyContainer}>
            <Ionicons name="eye" size={20} color={theme.colors.textMuted} />
            <Text style={styles.readOnlyMessage}>
              You can only read messages in this group
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  chatContainer: {
    flex: 1,
  },
  groupInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  groupIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  groupDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  readOnlyBadge: {
    backgroundColor: theme.colors.warning + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  readOnlyText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.warning,
    fontWeight: '600',
  },
  messagesList: {
    flexGrow: 1,
    padding: theme.spacing.md,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  dateText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  messageContainer: {
    marginBottom: theme.spacing.sm,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  ownBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: theme.borderRadius.sm,
  },
  otherBubble: {
    backgroundColor: theme.colors.background,
    borderBottomLeftRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  senderName: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  messageText: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  ownMessageText: {
    color: theme.colors.textWhite,
  },
  otherMessageText: {
    color: theme.colors.textPrimary,
  },
  messageTime: {
    fontSize: theme.typography.fontSize.xs,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: theme.colors.textWhite + '80',
  },
  otherMessageTime: {
    color: theme.colors.textMuted,
  },
  inputContainer: {
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
    maxHeight: 100,
    paddingVertical: theme.spacing.sm,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.textMuted,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.primaryLight,
  },
  readOnlyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  readOnlyMessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxxl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
});
