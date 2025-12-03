import { Group, Message, DirectMessage } from '../types/messaging';

// Mock Groups Data
export const MOCK_GROUPS: Group[] = [
  {
    id: '1',
    name: 'System Announcements',
    type: 'system',
    description: 'Important announcements from administration',
    members: ['1', '2', '3'], // All users
    createdBy: '3', // Admin
    createdAt: new Date('2024-01-01'),
    permissions: {
      canSend: ['3'], // Only Admin can send
      canRead: ['1', '2', '3'], // All can read
    },
    lastMessage: {
      content: 'Weekly Satsang Schedule - Please note the updated timings for this week',
      senderName: 'Admin User',
      timestamp: new Date('2024-01-15T10:30:00'),
    },
    unreadCount: 0,
  },
  {
    id: '2',
    name: 'Education Department',
    type: 'department',
    description: 'Education department group for HOD and Sevaks',
    members: ['1', '2'], // Sevak and HOD
    createdBy: '3', // Admin
    createdAt: new Date('2024-01-01'),
    permissions: {
      canSend: ['2'], // Only HOD can send
      canRead: ['1', '2'], // Both can read
    },
    lastMessage: {
      content: 'Meeting tomorrow at 6 PM in the main hall',
      senderName: 'Jane Smith',
      timestamp: new Date('2024-01-15T14:20:00'),
    },
    unreadCount: 3,
  },
  {
    id: '3',
    name: 'Administration Group',
    type: 'admin',
    description: 'Internal administration communications',
    members: ['3'], // Only Admin
    createdBy: '3',
    createdAt: new Date('2024-01-01'),
    permissions: {
      canSend: ['3'], // Only Admin can send
      canRead: ['3'], // Only Admin can read
    },
    lastMessage: {
      content: 'New policies update - Please review the attached document',
      senderName: 'Admin User',
      timestamp: new Date('2024-01-15T09:15:00'),
    },
    unreadCount: 0,
  },
];

// Mock Direct Messages Data
export const MOCK_DIRECT_MESSAGES: DirectMessage[] = [
  {
    id: 'dm1',
    participants: ['1', '2'], // John (Sevak) and Jane (HOD)
    lastMessage: {
      id: 'dm_msg1',
      content: 'Hi Jane, I have a question about the upcoming event',
      senderId: '1',
      senderName: 'John Doe',
      senderRole: 'sevak',
      recipientId: '2',
      timestamp: new Date('2024-01-15T16:30:00'),
      type: 'direct',
      isRead: false,
    },
    unreadCount: 1,
    createdAt: new Date('2024-01-15T16:30:00'),
  },
  {
    id: 'dm2',
    participants: ['2', '3'], // Jane (HOD) and Admin
    lastMessage: {
      id: 'dm_msg2',
      content: 'Please review the department report when you get a chance',
      senderId: '3',
      senderName: 'Admin User',
      senderRole: 'admin',
      recipientId: '2',
      timestamp: new Date('2024-01-15T15:45:00'),
      type: 'direct',
      isRead: true,
    },
    unreadCount: 0,
    createdAt: new Date('2024-01-15T15:45:00'),
  },
];

// Mock Messages Data (including direct messages)
export const MOCK_MESSAGES: Record<string, Message[]> = {
  '1': [ // System Announcements
    {
      id: 'm1',
      content: 'Welcome to Sevak App! This is your secure communication platform.',
      senderId: '3',
      senderName: 'Admin User',
      senderRole: 'admin',
      groupId: '1',
      timestamp: new Date('2024-01-01T10:00:00'),
      type: 'announcement',
      isRead: true,
    },
    {
      id: 'm2',
      content: 'Weekly Satsang Schedule - Please note the updated timings for this week',
      senderId: '3',
      senderName: 'Admin User',
      senderRole: 'admin',
      groupId: '1',
      timestamp: new Date('2024-01-15T10:30:00'),
      type: 'announcement',
      isRead: true,
    },
  ],
  '2': [ // Education Department
    {
      id: 'm3',
      content: 'Good morning everyone! Hope you all are doing well.',
      senderId: '2',
      senderName: 'Jane Smith',
      senderRole: 'hod',
      groupId: '2',
      timestamp: new Date('2024-01-15T08:00:00'),
      type: 'text',
      isRead: true,
    },
    {
      id: 'm4',
      content: 'Meeting tomorrow at 6 PM in the main hall',
      senderId: '2',
      senderName: 'Jane Smith',
      senderRole: 'hod',
      groupId: '2',
      timestamp: new Date('2024-01-15T14:20:00'),
      type: 'text',
      isRead: false,
    },
  ],
  '3': [ // Administration Group
    {
      id: 'm5',
      content: 'New policies update - Please review the attached document',
      senderId: '3',
      senderName: 'Admin User',
      senderRole: 'admin',
      groupId: '3',
      timestamp: new Date('2024-01-15T09:15:00'),
      type: 'text',
      isRead: true,
    },
  ],
  // Direct Messages
  'dm1': [ // John <-> Jane
    {
      id: 'dm_msg1',
      content: 'Hi Jane, I have a question about the upcoming event',
      senderId: '1',
      senderName: 'John Doe',
      senderRole: 'sevak',
      recipientId: '2',
      timestamp: new Date('2024-01-15T16:30:00'),
      type: 'direct',
      isRead: false,
    },
  ],
  'dm2': [ // Jane <-> Admin
    {
      id: 'dm_msg2',
      content: 'Please review the department report when you get a chance',
      senderId: '3',
      senderName: 'Admin User',
      senderRole: 'admin',
      recipientId: '2',
      timestamp: new Date('2024-01-15T15:45:00'),
      type: 'direct',
      isRead: true,
    },
  ],
};

// Helper function to get user's accessible groups
export const getUserAccessibleGroups = (userId: string, userRole: string): Group[] => {
  return MOCK_GROUPS.filter(group => {
    // Admin can see all groups
    if (userRole === 'admin') return true;
    
    // HOD can see system groups and their department groups
    if (userRole === 'hod') {
      return group.type === 'system' || group.members.includes(userId);
    }
    
    // Sevak can only see groups they're members of
    return group.members.includes(userId);
  });
};

// Helper function to check if user can send messages to group
export const canUserSendToGroup = (userId: string, groupId: string): boolean => {
  const group = MOCK_GROUPS.find(g => g.id === groupId);
  if (!group) return false;
  
  return group.permissions.canSend.includes(userId);
};

// Helper function to get group messages
export const getGroupMessages = (groupId: string): Message[] => {
  return MOCK_MESSAGES[groupId] || [];
};

// Helper function to get user's direct messages
export const getUserDirectMessages = (userId: string): DirectMessage[] => {
  return MOCK_DIRECT_MESSAGES.filter(dm => 
    dm.participants.includes(userId)
  );
};

// Helper function to check if user can send direct messages
export const canUserSendDirectMessage = (senderId: string, recipientId: string): boolean => {
  // Basic permission rules:
  // - Admins can message anyone
  // - HODs can message their department members and admins
  // - Sevaks can message their HOD and admins
  
  // For now, allow all users to message each other
  // In a real app, you'd implement specific business rules
  return senderId !== recipientId;
};

// Helper function to get or create direct message conversation
export const getDirectMessageConversation = (userId1: string, userId2: string): DirectMessage | null => {
  return MOCK_DIRECT_MESSAGES.find(dm => 
    dm.participants.includes(userId1) && dm.participants.includes(userId2)
  ) || null;
};

// Helper function to get available users for messaging
export const getAvailableUsersForMessaging = (currentUserId: string) => {
  // Return all users except the current user
  return MOCK_USERS.filter(user => user.id !== currentUserId);
};
