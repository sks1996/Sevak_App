import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { MessagingState, MessagingContextType, Group, Message, DirectMessage } from '../types/messaging';
import { User } from '../types';
import { useAuth } from './AuthContext';
import { 
  MOCK_GROUPS, 
  MOCK_MESSAGES, 
  MOCK_DIRECT_MESSAGES,
  getUserAccessibleGroups,
  canUserSendToGroup,
  getGroupMessages,
  getUserDirectMessages,
  canUserSendDirectMessage,
  getDirectMessageConversation,
  MOCK_USERS
} from '../constants/messaging';

const initialState: MessagingState = {
  groups: [],
  directMessages: [],
  messages: {},
  currentGroup: null,
  currentDirectMessage: null,
  isLoading: true,
  error: null,
};

type MessagingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_GROUPS'; payload: Group[] }
  | { type: 'SET_DIRECT_MESSAGES'; payload: DirectMessage[] }
  | { type: 'SET_MESSAGES'; payload: Record<string, Message[]> }
  | { type: 'SET_CURRENT_GROUP'; payload: Group | null }
  | { type: 'SET_CURRENT_DIRECT_MESSAGE'; payload: DirectMessage | null }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'ADD_DIRECT_MESSAGE'; payload: DirectMessage }
  | { type: 'UPDATE_GROUP'; payload: Group }
  | { type: 'UPDATE_DIRECT_MESSAGE'; payload: DirectMessage }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const messagingReducer = (state: MessagingState, action: MessagingAction): MessagingState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_GROUPS':
      return { ...state, groups: action.payload };
    case 'SET_DIRECT_MESSAGES':
      return { ...state, directMessages: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'SET_CURRENT_GROUP':
      return { ...state, currentGroup: action.payload };
    case 'SET_CURRENT_DIRECT_MESSAGE':
      return { ...state, currentDirectMessage: action.payload };
    case 'ADD_MESSAGE':
      const newMessages = { ...state.messages };
      const groupMessages = newMessages[action.payload.groupId || ''] || [];
      newMessages[action.payload.groupId || ''] = [...groupMessages, action.payload];
      return { ...state, messages: newMessages };
    case 'ADD_DIRECT_MESSAGE':
      return { ...state, directMessages: [...state.directMessages, action.payload] };
    case 'UPDATE_GROUP':
      const updatedGroups = state.groups.map(group =>
        group.id === action.payload.id ? action.payload : group
      );
      return { ...state, groups: updatedGroups };
    case 'UPDATE_DIRECT_MESSAGE':
      const updatedDirectMessages = state.directMessages.map(dm =>
        dm.id === action.payload.id ? action.payload : dm
      );
      return { ...state, directMessages: updatedDirectMessages };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messagingState, dispatch] = useReducer(messagingReducer, initialState);
  const { authState } = useAuth();

  useEffect(() => {
    loadMessagingData();
  }, [authState.user]);

  const loadMessagingData = async () => {
    if (!authState.user) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get user's accessible groups
      const userGroups = getUserAccessibleGroups(authState.user.id, authState.user.role);
      
      // Get user's direct messages
      const userDirectMessages = getUserDirectMessages(authState.user.id);
      
      // Load messages for all groups and direct messages
      const allMessages: Record<string, Message[]> = {};
      userGroups.forEach(group => {
        allMessages[group.id] = getGroupMessages(group.id);
      });
      
      // Load direct message conversations
      userDirectMessages.forEach(dm => {
        allMessages[dm.id] = MOCK_MESSAGES[dm.id] || [];
      });

      dispatch({ type: 'SET_GROUPS', payload: userGroups });
      dispatch({ type: 'SET_DIRECT_MESSAGES', payload: userDirectMessages });
      dispatch({ type: 'SET_MESSAGES', payload: allMessages });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load messaging data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const sendMessage = async (groupId: string, content: string): Promise<void> => {
    if (!authState.user) throw new Error('User not authenticated');

    // Check permissions
    if (!canUserSendToGroup(authState.user.id, groupId)) {
      throw new Error('You do not have permission to send messages to this group');
    }

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      content,
      senderId: authState.user.id,
      senderName: authState.user.name,
      senderRole: authState.user.role,
      groupId,
      timestamp: new Date(),
      type: 'text',
      isRead: true, // Sender has read their own message
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    dispatch({ type: 'ADD_MESSAGE', payload: newMessage });

    // Update group's last message
    const group = messagingState.groups.find(g => g.id === groupId);
    if (group) {
      const updatedGroup = {
        ...group,
        lastMessage: {
          content,
          senderName: authState.user.name,
          timestamp: new Date(),
        },
      };
      dispatch({ type: 'UPDATE_GROUP', payload: updatedGroup });
    }
  };

  const sendDirectMessage = async (recipientId: string, content: string): Promise<void> => {
    if (!authState.user) throw new Error('User not authenticated');

    // Check permissions
    if (!canUserSendDirectMessage(authState.user.id, recipientId)) {
      throw new Error('You do not have permission to send messages to this user');
    }

    // Find or create direct message conversation
    let directMessage = getDirectMessageConversation(authState.user.id, recipientId);
    
    if (!directMessage) {
      // Create new direct message conversation
      directMessage = {
        id: `dm_${Date.now()}`,
        participants: [authState.user.id, recipientId],
        createdAt: new Date(),
        unreadCount: 0,
      };
      dispatch({ type: 'ADD_DIRECT_MESSAGE', payload: directMessage });
    }

    const newMessage: Message = {
      id: `dm_msg_${Date.now()}`,
      content,
      senderId: authState.user.id,
      senderName: authState.user.name,
      senderRole: authState.user.role,
      recipientId,
      timestamp: new Date(),
      type: 'direct',
      isRead: true, // Sender has read their own message
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    dispatch({ type: 'ADD_MESSAGE', payload: newMessage });

    // Update direct message's last message
    const updatedDirectMessage = {
      ...directMessage,
      lastMessage: {
        id: newMessage.id,
        content,
        senderId: authState.user.id,
        senderName: authState.user.name,
        senderRole: authState.user.role,
        recipientId,
        timestamp: new Date(),
        type: 'direct' as const,
        isRead: true,
      },
    };
    dispatch({ type: 'UPDATE_DIRECT_MESSAGE', payload: updatedDirectMessage });
  };

  const createGroup = async (groupData: Omit<Group, 'id' | 'createdAt'>): Promise<void> => {
    if (!authState.user) throw new Error('User not authenticated');
    if (authState.user.role !== 'admin') throw new Error('Only admins can create groups');

    const newGroup: Group = {
      ...groupData,
      id: `group_${Date.now()}`,
      createdAt: new Date(),
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    dispatch({ type: 'SET_GROUPS', payload: [...messagingState.groups, newGroup] });
  };

  const joinGroup = async (groupId: string): Promise<void> => {
    if (!authState.user) throw new Error('User not authenticated');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    // Update group membership
    const group = messagingState.groups.find(g => g.id === groupId);
    if (group && !group.members.includes(authState.user.id)) {
      const updatedGroup = {
        ...group,
        members: [...group.members, authState.user.id],
        permissions: {
          ...group.permissions,
          canRead: [...group.permissions.canRead, authState.user.id],
        },
      };
      dispatch({ type: 'UPDATE_GROUP', payload: updatedGroup });
    }
  };

  const leaveGroup = async (groupId: string): Promise<void> => {
    if (!authState.user) throw new Error('User not authenticated');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    // Update group membership
    const group = messagingState.groups.find(g => g.id === groupId);
    if (group && group.members.includes(authState.user.id)) {
      const updatedGroup = {
        ...group,
        members: group.members.filter(id => id !== authState.user.id),
        permissions: {
          ...group.permissions,
          canRead: group.permissions.canRead.filter(id => id !== authState.user.id),
          canSend: group.permissions.canSend.filter(id => id !== authState.user.id),
        },
      };
      dispatch({ type: 'UPDATE_GROUP', payload: updatedGroup });
    }
  };

  const markAsRead = async (groupId: string): Promise<void> => {
    if (!authState.user) return;

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));

    // Mark messages as read
    const groupMessages = messagingState.messages[groupId] || [];
    const updatedMessages = groupMessages.map(msg => ({
      ...msg,
      isRead: true,
    }));

    dispatch({ 
      type: 'SET_MESSAGES', 
      payload: { 
        ...messagingState.messages, 
        [groupId]: updatedMessages 
      } 
    });

    // Update group unread count
    const group = messagingState.groups.find(g => g.id === groupId);
    if (group) {
      const updatedGroup = { ...group, unreadCount: 0 };
      dispatch({ type: 'UPDATE_GROUP', payload: updatedGroup });
    }
  };

  const setCurrentGroup = (group: Group | null) => {
    dispatch({ type: 'SET_CURRENT_GROUP', payload: group });
    if (group) {
      markAsRead(group.id);
    }
  };

  const setCurrentDirectMessage = (directMessage: DirectMessage | null) => {
    dispatch({ type: 'SET_CURRENT_DIRECT_MESSAGE', payload: directMessage });
  };

  const getAvailableUsers = async (): Promise<User[]> => {
    // Return all users except the current user
    return MOCK_USERS.filter(user => user.id !== authState.user?.id);
  };

  const value: MessagingContextType = {
    messagingState,
    sendMessage,
    sendDirectMessage,
    createGroup,
    joinGroup,
    leaveGroup,
    markAsRead,
    setCurrentGroup,
    setCurrentDirectMessage,
    getAvailableUsers,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = (): MessagingContextType => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};
