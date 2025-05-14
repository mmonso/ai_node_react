import axios from 'axios';
import { Conversation, Message, ModelConfig, FileResponse, Folder } from '../types'; // Adicionado Folder aqui

const API_URL = 'http://localhost:3001/api';
const BASE_URL = 'http://localhost:3001'; // Base URL para arquivos estáticos

// API de Conversas
export const getConversations = async (): Promise<Conversation[]> => {
  const response = await axios.get(`${API_URL}/conversations`);
  return response.data;
};

export const getConversation = async (id: number): Promise<Conversation> => {
  const response = await axios.get(`${API_URL}/conversations/${id}`);
  
  // Processar URLs de imagens para garantir que elas sejam absolutas
  if (response.data && response.data.messages) {
    response.data.messages = response.data.messages.map((message: Message) => {
      if (message.imageUrl && message.imageUrl.startsWith('/uploads/')) {
        // Converter URLs relativas para absolutas usando o domínio do backend
        console.log('Processando URL de imagem relativa:', message.imageUrl);
        message.imageUrl = `${BASE_URL}${message.imageUrl}`;
        console.log('URL convertida para absoluta:', message.imageUrl);
      }
      
      // Fazer o mesmo para arquivos
      if (message.fileUrl && message.fileUrl.startsWith('/uploads/')) {
        console.log('Processando URL de arquivo relativa:', message.fileUrl);
        message.fileUrl = `${BASE_URL}${message.fileUrl}`;
        console.log('URL convertida para absoluta:', message.fileUrl);
      }
      
      return message;
    });
  }
  
  return response.data;
};

export const createConversation = async (title: string): Promise<Conversation> => {
  const response = await axios.post(`${API_URL}/conversations`, { title });
  return response.data;
};

export const updateConversation = async (id: number, title: string): Promise<Conversation> => {
  const response = await axios.put(`${API_URL}/conversations/${id}`, { title });
  return response.data;
};

export const deleteConversation = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/conversations/${id}`);
};

// API de Mensagens
export const getMessages = async (conversationId: number): Promise<Message[]> => {
  const response = await axios.get(`${API_URL}/conversations/${conversationId}/messages`);
  return response.data;
};

export const sendMessage = async (
  conversationId: number, 
  content: string, 
  file?: File,
  modelConfig?: ModelConfig,
  useWebSearch: boolean = false
): Promise<Message[]> => {
  const formData = new FormData();
  formData.append('content', content);
  
  if (file) {
    console.log('Enviando arquivo:', file.name, file.type, file.size);
    formData.append('file', file);
  }
  
  if (modelConfig) {
    formData.append('modelConfig', JSON.stringify(modelConfig));
  }
  
  const response = await axios.post(
    `${API_URL}/conversations/${conversationId}/messages?web_search=${useWebSearch}`, 
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  
  console.log('Resposta do servidor (sendMessage):', response.data);
  return response.data;
};

// API de Arquivos 
export const uploadFile = async (file: File): Promise<FileResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(`${API_URL}/files/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

// API de System Prompt
export const getSystemPrompt = async (): Promise<string> => {
  const response = await axios.get(`${API_URL}/config/system-prompt`);
  return response.data.systemPrompt;
};

export const updateSystemPrompt = async (prompt: string): Promise<void> => {
  await axios.put(`${API_URL}/config/system-prompt`, { systemPrompt: prompt });
};

// API de Pastas
export const getFolders = async (): Promise<Folder[]> => {
  const response = await axios.get(`${API_URL}/folders`);
  return response.data;
};

export const createFolder = async (name: string): Promise<Folder> => {
  const response = await axios.post(`${API_URL}/folders`, { name });
  return response.data;
};

export const updateFolder = async (id: number, name: string): Promise<Folder> => {
  const response = await axios.put(`${API_URL}/folders/${id}`, { name });
  return response.data;
};

export const deleteFolder = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/folders/${id}`);
};

export const addConversationToFolder = async (conversationId: number, folderId: number): Promise<Conversation> => {
  try {
    console.log(`API: Adicionando conversa ${conversationId} à pasta ${folderId}`);
    const response = await axios.post(`${API_URL}/conversations/${conversationId}/folder/${folderId}`);
    return response.data;
  } catch (error) {
    console.error('Erro na API addConversationToFolder:', error);
    throw error;
  }
};

export const removeConversationFromFolder = async (conversationId: number): Promise<Conversation> => {
  try {
    console.log(`API: Removendo conversa ${conversationId} da pasta`);
    const response = await axios.delete(`${API_URL}/conversations/${conversationId}/folder`);
    return response.data;
  } catch (error) {
    console.error('Erro na API removeConversationFromFolder:', error);
    throw error;
  }
};

export const resetSystemPrompt = async (): Promise<void> => {
  await axios.put(`${API_URL}/config/system-prompt/reset`);
};

export default axios; 