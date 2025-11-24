export enum UserPlan {
  FREE = 'FREE',
  TRIAL = 'TRIAL',
  PRO = 'PRO',
  EXPIRED = 'EXPIRED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: UserPlan;
  trialStartDate?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  groundingUrls?: { title: string; uri: string }[];
  audioData?: string;
}

export interface Attachment {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  mimeType: string;
  data: string;
  name?: string;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  title: string;
  updatedAt: number;
  preview: string;
}

export interface Suggestion {
  title: string;
  subtitle: string;
  icon: string;
  prompt: string;
}
