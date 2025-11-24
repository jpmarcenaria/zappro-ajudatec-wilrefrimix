export enum UserPlan {
  FREE = 'FREE', // Pre-login
  TRIAL = 'TRIAL', // 1 Day Free
  PRO = 'PRO', // Paid
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
  content: string; // Text content
  timestamp: number;
  attachments?: Attachment[];
  groundingUrls?: { title: string; uri: string }[];
  audioData?: string; // Raw Base64 PCM for AudioContext
}

export interface Attachment {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string; // Preview URL (blob or base64)
  mimeType: string;
  data: string; // Base64 data for API
  name?: string; // Filename for documents
}

export interface ChatSession {
  id: string;
  messages: Message[];
  title: string;
}