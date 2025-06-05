import axios from 'axios';
import { Conversation, Message, ModelConfig, FileResponse, Model, Folder, MainAgentData } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:3001'; // Base URL para arquivos estáticos

// API de Conversas
export const getConversations = async (): Promise<Conversation[]> => {
  try {
    const response = await axios.get(`${API_URL}/conversations`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    throw error;
  }
};

export const getConversation = async (id: string): Promise<Conversation> => {
  try {
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
  } catch (error) {
    console.error(`Erro ao buscar conversa ${id}:`, error);
    throw error;
  }
};

export const createConversation = async (
  title: string,
  modelId?: string,
  isPersona?: boolean,
  systemPrompt?: string | null
): Promise<Conversation> => {
  try {
    const response = await axios.post(`${API_URL}/conversations`, { title, modelId, isPersona, systemPrompt });
    return response.data;
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    throw error;
  }
};

export const updateConversation = async (
  id: string,
  title: string,
  isPersona?: boolean,
  systemPrompt?: string | null
): Promise<Conversation> => {
  try {
    const response = await axios.put(`${API_URL}/conversations/${id}`, { title, isPersona, systemPrompt });
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar conversa ${id}:`, error);
    throw error;
  }
};

export const deleteConversation = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/conversations/${id}`);
  } catch (error) {
    console.error(`Erro ao deletar conversa ${id}:`, error);
    throw error;
  }
};

// API de Mensagens
export const getMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const response = await axios.get(`${API_URL}/conversations/${conversationId}/messages`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar mensagens para conversa ${conversationId}:`, error);
    throw error;
  }
};

export const sendMessage = async (
  conversationId: string,
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
  
  try {
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
  } catch (error) {
    console.error(`Erro ao enviar mensagem para conversa ${conversationId}:`, error);
    throw error;
  }
};

export const updateMessageContent = async (
  messageId: string, // ou number, dependendo do tipo do ID da sua entidade Message
  newContent: string
): Promise<Message> => { // Certifique-se que o tipo Message aqui corresponde ao que a API retorna
  try {
    const response = await axios.patch<Message>( // Use o seu cliente axios configurado
      `${API_URL}/conversations/messages/${messageId}`, // Confirme este caminho do endpoint
      { content: newContent }
    );
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar mensagem ${messageId}:`, error);
    throw error;
  }
};
export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    // O endpoint agora é DELETE e não retorna corpo em caso de sucesso (204 No Content)
    await axios.delete(
      `${API_URL}/conversations/messages/${messageId}`
    );
    // Não há dados para retornar em uma exclusão física bem-sucedida (204)
  } catch (error) {
    console.error(`Erro ao deletar mensagem ${messageId} permanentemente:`, error);
    throw error;
  }
};
// API de Arquivos 
export const uploadFile = async (file: File): Promise<FileResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await axios.post(`${API_URL}/files/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    throw error;
  }
};

// API de System Prompt
export const getSystemPrompt = async (): Promise<string> => {
  try {
    const response = await axios.get(`${API_URL}/config/system-prompt`);
    return response.data.systemPrompt;
  } catch (error) {
    console.error('Erro ao buscar system prompt:', error);
    throw error;
  }
};

export const updateSystemPrompt = async (prompt: string): Promise<void> => {
  try {
    await axios.put(`${API_URL}/config/system-prompt`, { systemPrompt: prompt });
  } catch (error) {
    console.error('Erro ao atualizar system prompt:', error);
    throw error;
  }
};

// API de Pastas
export const getFolders = async (): Promise<Folder[]> => {
  try {
    const response = await axios.get(`${API_URL}/folders`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar pastas:', error);
    throw error;
  }
};

export const createFolder = async (data: { name: string; systemPrompt?: string }): Promise<Folder> => {
  try {
    const response = await axios.post(`${API_URL}/folders`, data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar pasta:', error);
    throw error;
  }
};

export const updateFolder = async (id: string, data: Partial<{ name?: string; systemPrompt?: string }>): Promise<Folder> => {
  try {
    const response = await axios.patch(`${API_URL}/folders/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar pasta ${id}:`, error);
    throw error;
  }
};

export const deleteFolder = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/folders/${id}`);
  } catch (error) {
    console.error(`Erro ao deletar pasta ${id}:`, error);
    throw error;
  }
};

// Função para mover conversa para uma pasta (ou remover de uma pasta)
export const moveConversationToFolder = async (conversationId: string, folderId: string | null): Promise<Conversation> => {
  try {
    if (folderId === null) {
      // Usa o endpoint DELETE para desassociar a conversa da pasta
      const response = await axios.delete(`${API_URL}/conversations/${conversationId}/folder`);
      return response.data;
    } else {
      // Usa o endpoint POST para associar a conversa a uma pasta
      const response = await axios.post(`${API_URL}/conversations/${conversationId}/folder/${folderId}`);
      return response.data;
    }
  } catch (error) {
    console.error(`Erro ao mover conversa ${conversationId} para pasta ${folderId}:`, error);
    throw error;
  }
};


export const resetSystemPrompt = async (): Promise<void> => {
  try {
    await axios.put(`${API_URL}/config/system-prompt/reset`);
  } catch (error) {
    console.error('Erro ao resetar system prompt:', error);
    throw error;
  }
};

// API de Modelos
export const getModels = async (): Promise<Model[]> => {
  console.log('API: Chamando getModels');
  try {
    const response = await axios.get(`${API_URL}/models`);
    console.log('API: Resposta de getModels:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar modelos:', error);
    throw error;
  }
};

export const getModel = async (id: string): Promise<Model> => {
  try {
    const response = await axios.get(`${API_URL}/models/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar modelo ${id}:`, error);
    throw error;
  }
};

export const getModelsByProvider = async (provider: string): Promise<Model[]> => {
  try {
    const response = await axios.get(`${API_URL}/models/provider/${provider}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar modelos do provedor ${provider}:`, error);
    throw error;
  }
};

export const updateModelAvailability = async (id: string, isAvailable: boolean): Promise<Model> => {
  try {
    const response = await axios.patch(`${API_URL}/models/${id}/availability`, { isAvailable });
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar disponibilidade do modelo ${id}:`, error);
    throw error;
  }
};

export const updateConversationModel = async (
  conversationId: string,
  modelId: string,
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
  console.log('API: Chamando getActiveModel');
  try {
    const response = await axios.get(`${API_URL}/active-model`);
    console.log('API: Resposta de getActiveModel:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Erro ao obter modelo ativo global:', error);
    // return { model: null, config: null }; // Alterado para relançar o erro
    throw error;
  }
};

export const setActiveModel = async (modelId: string, modelConfig?: any): Promise<{ model: Model | null; config: any }> => {
  console.log(`API: Chamando setActiveModel com ID=${modelId}, Config:`, modelConfig);
  try {
    const response = await axios.post(`${API_URL}/active-model`, {
      modelId,
      modelConfig
    });
    console.log('API: Resposta de setActiveModel:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Erro ao definir modelo ativo global:', error);
    // return { model: null, config: null }; // Alterado para relançar o erro
    throw error;
  }
};

export const updateActiveModelConfig = async (modelConfig: any): Promise<boolean> => {
  console.log('API: Atualizando configuração do modelo ativo global', modelConfig);
  try {
    const response = await axios.post(`${API_URL}/active-model/config`, modelConfig);
    return response.data.success;
  } catch (error) {
    console.error('API: Erro ao atualizar configuração do modelo ativo:', error);
    // return false; // Alterado para relançar o erro
    throw error;
  }
};

// API de Agentes Removida
// export const getAgents = async (): Promise<Agent[]> => { ... };
// export const createAgent = async (name: string, systemPrompt?: string | null): Promise<Agent> => { ... };
// export const updateAgent = async (id: string, name?: string, systemPrompt?: string | null): Promise<Agent> => { ... };
// export const deleteAgent = async (id: string): Promise<void> => { ... };

// API para o Main Agent
export const getMainAgent = async (): Promise<MainAgentData | null> => {
  try {
    const response = await axios.get(`${API_URL}/agents/main`);
    return response.data;
  } catch (error) {
    console.error('API: Erro ao buscar o Main Agent:', error);
    // return null; // Alterado para relançar o erro
    throw error;
  }
};

export const updateMainAgent = async (conversationId: string): Promise<MainAgentData | null> => {
  try {
    console.log('API: Atualizando conversationId do Main Agent para:', conversationId);
    const response = await axios.put(`${API_URL}/agents/main/conversation`, { conversationId });
    console.log('API: Resposta da atualização do Main Agent:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Erro ao atualizar o conversationId do Main Agent:', error);
    // return null; // Alterado para relançar o erro
    throw error;
  }
};

export default axios;