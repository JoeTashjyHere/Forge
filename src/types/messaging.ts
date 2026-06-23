export type ConversationType = 'direct' | 'group';

export interface Conversation {
  id: string;
  conversationType: ConversationType;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: string;
  displayName?: string | null;
  profilePhotoUrl?: string | null;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string | null;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface WorkspaceMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderPhotoUrl: string | null;
  body: string;
  createdAt: string;
}

/** Denormalized row for the conversations list UI. */
export interface ConversationSummary {
  id: string;
  otherUserId: string | null;
  otherName: string;
  otherPhotoUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}
