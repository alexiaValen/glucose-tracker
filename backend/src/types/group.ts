// backend/src/types/group.ts

export interface CoachingGroup {
  id: string;
  name: string;
  description: string;
  coachId: string;
  startDate: Date;
  endDate: Date;
  durationWeeks: number;
  accessCode: string;
  maxMembers: number;
  currentMembers: number;
  status: 'active' | 'full' | 'completed' | 'archived';
  pricing: {
    founding: number;
    paymentPlan: number;
    fullPrice: number;
  };
  meetingSchedule: {
    day: string;
    time: string;
    timezone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMembership {
  id: string;
  groupId: string;
  userId: string;
  joinedAt: Date;
  status: 'active' | 'paused' | 'completed' | 'removed';
  paymentStatus: 'pending' | 'paid' | 'payment_plan';
  membershipType: 'founding' | 'regular';
  paymentAmount: number;
  completedWeeks: number;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupSession {
  id: string;
  groupId: string;
  weekNumber: number;
  title: string;
  description: string;
  sessionDate: Date;
  zoomLink?: string;
  recordingUrl?: string;
  materials: SessionMaterial[];
  homework?: string;
  status: 'upcoming' | 'live' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionMaterial {
  id: string;
  type: 'pdf' | 'video' | 'image' | 'link';
  title: string;
  url: string;
  size?: number;
  uploadedAt: Date;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  message: string;
  messageType: 'text' | 'announcement' | 'question';
  replyTo?: string;
  attachments: any[];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  groupId?: string;
  message: string;
  readAt?: Date;
  createdAt: Date;
}

export interface UserProgress {
  id: string;
  userId: string;
  groupId: string;
  sessionId: string;
  completed: boolean;
  homeworkSubmitted: boolean;
  notes?: string;
  completedAt?: Date;
  createdAt: Date;
}

export interface AccessCode {
  id: string;
  code: string;
  groupId: string;
  usedBy?: string;
  usedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

// Request/Response types
export interface CreateGroupRequest {
  name: string;
  description: string;
  startDate: string;
  durationWeeks: number;
  maxMembers: number;
  pricing: {
    founding: number;
    paymentPlan: number;
    fullPrice: number;
  };
  meetingSchedule: {
    day: string;
    time: string;
    timezone: string;
  };
}

export interface JoinGroupRequest {
  accessCode: string;
  paymentType: 'founding' | 'payment_plan';
}

export interface CreateSessionRequest {
  weekNumber: number;
  title: string;
  description: string;
  sessionDate: string;
  zoomLink?: string;
  homework?: string;
}

export interface SendMessageRequest {
  message: string;
  messageType?: 'text' | 'announcement' | 'question';
  replyTo?: string;
}

export interface SendDirectMessageRequest {
  recipientId: string;
  groupId?: string;
  message: string;
}

export interface CompleteSessionRequest {
  notes?: string;
  homeworkSubmitted: boolean;
}