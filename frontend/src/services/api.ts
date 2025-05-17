import axios from 'axios';
import { Conversation, Message, ModelConfig, FileResponse, Folder, Model } from '../types'; // Adicionado Model aqui

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

export const createConversation = async (title: string, modelId?: number): Promise<Conversation> => {
  const response = await axios.post(`${API_URL}/conversations`, { title, modelId });
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

// API de Modelos
export const getModels = async (): Promise<Model[]> => {
  const response = await axios.get(`${API_URL}/models`);
  return response.data;
};

export const getModel = async (id: number): Promise<Model> => {
  const response = await axios.get(`${API_URL}/models/${id}`);
  return response.data;
};

export const getModelsByProvider = async (provider: string): Promise<Model[]> => {
  const response = await axios.get(`${API_URL}/models/provider/${provider}`);
  return response.data;
};

export const updateModelAvailability = async (id: number, isAvailable: boolean): Promise<Model> => {
  const response = await axios.patch(`${API_URL}/models/${id}/availability`, { isAvailable });
  return response.data;
};

export const updateConversationModel = async (
  conversationId: number, 
  modelId: number, 
  modelConfig?: ModelConfig
): Promise<Conversation> => {
  console.log(`API: Atualizando modelo da conversa ${conversationId} para modelo ${modelId}`, { modelConfig });
  
  try {
    const response = await axios.patch(`${API_URL}/conversations/${conversationId}/model`, {
      modelId,
      modelConfig
    });
    
    console.log(`API: Resposta da atualização de modelo:`, response.data);
    
    // Verificar se a resposta contém os dados esperados
    if (response.data && response.data.modelId !== modelId) {
      console.warn(`API: Modelo retornado (${response.data.modelId}) não corresponde ao solicitado (${modelId})`);
    }
    
    return response.data;
  } catch (error) {
    console.error('API: Erro ao atualizar modelo da conversa:', error);
    throw error;
  }
};

// API de Modelo Ativo Global
export const getActiveModel = async (): Promise<{ model: Model | null; config: any }> => {
  console.log('API: Obtendo modelo ativo global');
  try {
    const response = await axios.get(`${API_URL}/active-model`);
    console.log('API: Modelo ativo obtido:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Erro ao obter modelo ativo:', error);
    return { model: null, config: null };
  }
};

export const setActiveModel = async (modelId: number, modelConfig?: any): Promise<{ model: Model | null; config: any }> => {
  console.log(`API: Definindo modelo ativo global para ID=${modelId}`, { modelConfig });
  try {
    const response = await axios.post(`${API_URL}/active-model`, { 
      modelId, 
      modelConfig 
    });
    console.log('API: Modelo ativo definido:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Erro ao definir modelo ativo:', error);
    return { model: null, config: null };
  }
};

export const updateActiveModelConfig = async (modelConfig: any): Promise<boolean> => {
  console.log('API: Atualizando configuração do modelo ativo global', modelConfig);
  try {
    const response = await axios.post(`${API_URL}/active-model/config`, modelConfig);
    return response.data.success;
  } catch (error) {
    console.error('API: Erro ao atualizar configuração do modelo ativo:', error);
    return false;
  }
};

export default axios; 