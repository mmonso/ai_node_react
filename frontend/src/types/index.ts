export interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Message {
  id: number;
  conversationId: number;
  content: string;
  isUser: boolean;
  timestamp: string;
  imageUrl?: string;
  fileUrl?: string;
}

export interface Config {
  systemPrompt: string;
}

export interface ModelConfig {
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK: number;
}

export interface FileResponse {
  uri: string;
  mimeType: string;
} 