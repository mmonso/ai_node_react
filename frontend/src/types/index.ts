export interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  modelId?: string | null;
  model?: Model | null;
  modelConfig?: ModelConfig | null;
  isPersona?: boolean;
  systemPrompt?: string | null;
  folderId?: number | null;
  folder?: Folder | null;
}

export interface Folder {
  id: number;
  name: string;
  systemPrompt?: string | null;
  userId: string; // Ou o tipo correspondente do seu backend
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id?: number;
  conversationId: number;
  content: string;
  isUser: boolean;
  timestamp: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  groundingMetadata?: GroundingMetadata;
}

export interface GroundingMetadata {
  sources?: Array<{
    title: string;
    uri: string;
  }>;
  searchSuggestions?: string[];
  citations?: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
    sources: number[];
    confidence: number;
  }>;
}

export interface Config {
  systemPrompt: string;
}

export interface Model {
  id: string;
  provider: string;
  name: string;
  label: string;
  isAvailable: boolean;
  capabilities: {
    textInput: boolean;
    imageInput: boolean;
    fileInput: boolean;
    webSearch: boolean;
    tool_use?: boolean;
  };
  defaultConfig: ModelConfig;
  createdAt: string;
  updatedAt: string;
}

export interface ModelConfig {
  temperature: number;
  topP?: number;
  topK?: number;
  maxOutputTokens: number;
}

export interface ProgressMessage {
  type: 'start' | 'progress' | 'complete' | 'error';
  message?: string;
  progress?: number;
}

export interface FileResponse {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
} 