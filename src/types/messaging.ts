import { User } from './index';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: 'sevak' | 'hod' | 'admin';
  groupId?: string; // Optional for group messages
  recipientId?: string; // Optional for direct messages
  timestamp: Date;
  type: 'text' | 'announcement' | 'direct';
  isRead?: boolean;
}

export interface Group {
  id: string;
  name: string;
  type: 'department' | 'system' | 'admin' | 'direct';
  description?: string;
  members: string[];
  createdBy: string;
  createdAt: Date;
  permissions: {
    canSend: string[]; // User IDs who can send
    canRead: string[];  // User IDs who can read
  };
  lastMessage?: {
    content: string;
    senderName: string;
    timestamp: Date;
  };
  unreadCount?: number;
  // For direct messages
  otherParticipant?: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
}

export interface DirectMessage {
  id: string;
  participants: [string, string]; // Two user IDs
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: Date;
}

export interface MessagingState {
  groups: Group[];
  directMessages: DirectMessage[];
  messages: Record<string, Message[]>; // groupId or directMessageId -> messages
  currentGroup: Group | null;
  currentDirectMessage: DirectMessage | null;
  isLoading: boolean;
  error: string | null;
}

export interface MessagingContextType {
  messagingState: MessagingState;
  sendMessage: (groupId: string, content: string) => Promise<void>;
  sendDirectMessage: (recipientId: string, content: string) => Promise<void>;
  createGroup: (groupData: Omit<Group, 'id' | 'createdAt'>) => Promise<void>;
  joinGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  markAsRead: (groupId: string) => Promise<void>;
  setCurrentGroup: (group: Group | null) => void;
  setCurrentDirectMessage: (directMessage: DirectMessage | null) => void;
  getAvailableUsers: () => Promise<User[]>;
}
