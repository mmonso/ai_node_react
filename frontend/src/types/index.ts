export interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  folderId?: number | null; // Adicionado para referência à pasta
  folder?: Folder | null;    // Adicionado para dados da pasta, se carregados
}

export interface Folder { // Nova interface Folder
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  conversations?: Conversation[]; // Opcional, dependendo se você carrega isso
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