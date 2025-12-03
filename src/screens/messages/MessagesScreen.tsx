import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useMessaging } from '../../contexts/MessagingContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { GroupChatScreen } from './GroupChatScreen';
import { DirectMessageScreen } from './DirectMessageScreen';
import { UserSelectionScreen } from './UserSelectionScreen';
import { theme } from '../../constants/theme';
import { Group, DirectMessage, User } from '../../types/messaging';
import { getUserDirectMessages, getDirectMessageConversation } from '../../constants/messaging';
import { MOCK_USERS } from '../../constants';

export const MessagesScreen: React.FC = () => {
  const { authState } = useAuth();
  const { messagingState, setCurrentGroup } = useMessaging();
  const { groups, isLoading } = messagingState;
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedDirectMessage, setSelectedDirectMessage] = useState<DirectMessage | null>(null);
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  // Debug MOCK_USERS
  console.log('MOCK_USERS:', MOCK_USERS);

  // Helper functions
  const getDirectMessageDisplayName = (dm: DirectMessage): string => {
    if (!authState.user || !MOCK_USERS) return '';
    const otherUserId = dm.participants.find(id => id !== authState.user?.id);
    const otherUser = MOCK_USERS.find(user => user.id === otherUserId);
    return otherUser?.name || 'Unknown User';
  };

  const getDirectMessageDescription = (dm: DirectMessage): string => {
    if (!authState.user || !MOCK_USERS) return '';
    const otherUserId = dm.participants.find(id => id !== authState.user?.id);
    const otherUser = MOCK_USERS.find(user => user.id === otherUserId);
    return `Direct message with ${otherUser?.name}`;
  };

  const getOtherParticipant = (dm: DirectMessage) => {
    if (!authState.user || !MOCK_USERS) return null;
    const otherUserId = dm.participants.find(id => id !== authState.user?.id);
    const otherUser = MOCK_USERS.find(user => user.id === otherUserId);
    return otherUser ? {
      id: otherUser.id,
      name: otherUser.name,
      role: otherUser.role,
    } : null;
  };

  // Get user's direct messages
  const directMessages = authState.user ? getUserDirectMessages(authState.user.id) : [];

  // Combine groups and direct messages for display
  const allConversations = [
    ...groups.map(group => ({ ...group, isDirect: false })),
    ...directMessages.map(dm => ({
      id: dm.id,
      name: getDirectMessageDisplayName(dm),
      type: 'direct' as const,
      description: getDirectMessageDescription(dm),
      members: dm.participants,
      createdBy: dm.participants[0],
      createdAt: dm.createdAt,
      permissions: { canSend: dm.participants, canRead: dm.participants },
      lastMessage: dm.lastMessage,
      unreadCount: dm.unreadCount,
      isDirect: true,
      otherParticipant: getOtherParticipant(dm),
    }))
  ].sort((a, b) => {
    const aTime = a.lastMessage?.timestamp || a.createdAt;
    const bTime = b.lastMessage?.timestamp || b.createdAt;
    return bTime.getTime() - aTime.getTime();
  });

  const handleGroupPress = (conversation: any) => {
    if (conversation.isDirect) {
      const dm = directMessages.find(d => d.id === conversation.id);
      if (dm) {
        setSelectedDirectMessage(dm);
      }
    } else {
      setCurrentGroup(conversation);
      setSelectedGroup(conversation);
    }
  };

  const handleUserSelect = (user: User) => {
    setShowUserSelection(false);
    // Check if direct message already exists
    const existingDM = getDirectMessageConversation(authState.user?.id || '', user.id);
    if (existingDM) {
      setSelectedDirectMessage(existingDM);
    } else {
      // Create new direct message
      const newDM: DirectMessage = {
        id: `dm_${Date.now()}`,
        participants: [authState.user?.id || '', user.id],
        createdAt: new Date(),
        unreadCount: 0,
      };
      setSelectedDirectMessage(newDM);
    }
  };

  const handleBackToMessages = () => {
    setSelectedGroup(null);
    setSelectedDirectMessage(null);
    setCurrentGroup(null);
  };

  const handleNewChat = () => {
    setShowUserSelection(true);
  };

  // If showing user selection
  if (showUserSelection) {
    return (
      <UserSelectionScreen
        onUserSelect={handleUserSelect}
        onBack={() => setShowUserSelection(false)}
      />
    );
  }

  // If a group is selected, show the group chat screen
  if (selectedGroup) {
    return (
      <GroupChatScreen 
        group={selectedGroup} 
        onBack={handleBackToMessages}
      />
    );
  }

  // If a direct message is selected, show the direct message screen
  if (selectedDirectMessage && MOCK_USERS) {
    const recipient = MOCK_USERS.find(user => 
      user.id === selectedDirectMessage.participants.find(id => id !== authState.user?.id)
    );
    if (recipient) {
      return (
        <DirectMessageScreen
          directMessage={selectedDirectMessage}
          recipient={recipient}
          onBack={handleBackToMessages}
        />
      );
    }
  }

  const getGroupIcon = (groupType: string) => {
    switch (groupType) {
      case 'system':
        return 'megaphone';
      case 'department':
        return 'people';
      case 'admin':
        return 'shield';
      case 'direct':
        return 'person';
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
      case 'direct':
        return theme.colors.success;
      default:
        return theme.colors.primary;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours < 1) {
      return minutes < 1 ? 'Just now' : `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const renderConversationItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => handleGroupPress(item)}>
      <Card style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <View style={styles.groupIconContainer}>
            <Ionicons
              name={getGroupIcon(item.type) as any}
              size={24}
              color={getGroupIconColor(item.type)}
            />
          </View>
          <View style={styles.groupInfo}>
            <View style={styles.groupTitleRow}>
              <Text style={styles.groupName}>{item.name}</Text>
              {item.unreadCount && item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.groupDescription}>{item.description}</Text>
            {item.lastMessage && (
              <View style={styles.lastMessageContainer}>
                <Text style={styles.lastMessageText} numberOfLines={1}>
                  {item.lastMessage.content}
                </Text>
                <Text style={styles.lastMessageTime}>
                  {formatTimestamp(item.lastMessage.timestamp)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textMuted} />
      <Text style={styles.emptyTitle}>No Messages Yet</Text>
      <Text style={styles.emptySubtitle}>
        You'll see your group conversations here once messages are sent.
      </Text>
    </View>
  );

  if (!authState.user) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Messages" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please log in to view messages</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Messages" />
      
      {/* New Chat Button */}
      <View style={styles.newChatContainer}>
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <Ionicons name="add" size={20} color={theme.colors.textWhite} />
          <Text style={styles.newChatText}>New Chat</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={allConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversationItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              // Refresh logic would go here
            }}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  newChatContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  newChatText: {
    color: theme.colors.textWhite,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  groupCard: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  groupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  groupInfo: {
    flex: 1,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  groupName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  unreadText: {
    color: theme.colors.textWhite,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
  },
  groupDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  lastMessageTime: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.error,
  },
});