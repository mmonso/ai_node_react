import axios from 'axios';
import { Conversation, Message, ModelConfig, FileResponse } from '../types';

const API_URL = 'http://localhost:3001/api';

// API de Conversas
export const getConversations = async (): Promise<Conversation[]> => {
  const response = await axios.get(`${API_URL}/conversations`);
  return response.data;
};

export const getConversation = async (id: number): Promise<Conversation> => {
  const response = await axios.get(`${API_URL}/conversations/${id}`);
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
  modelConfig?: ModelConfig
): Promise<Message> => {
  const formData = new FormData();
  formData.append('content', content);
  
  if (file) {
    formData.append('file', file);
  }
  
  if (modelConfig) {
    formData.append('modelConfig', JSON.stringify(modelConfig));
  }
  
  const response = await axios.post(
    `${API_URL}/conversations/${conversationId}/messages`, 
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  
  return response.data;
};

export const streamMessage = (conversationId: number): EventSource => {
  // Usar diretamente o EventSource sem tentar fazer reconexão aqui
  // A lógica de reconexão será gerenciada pelo componente que usa este serviço
  const url = `${API_URL}/conversations/${conversationId}/stream`;
  console.log(`Conectando ao stream: ${url}`);
  
  try {
    // Criamos um EventSource sem withCredentials para melhor compatibilidade
    const source = new EventSource(url);
    
    // Adicionar log para debug
    source.onopen = () => {
      console.log(`EventSource conectado: ${url}`);
    };
    
    return source;
  } catch (e) {
    console.error('Erro ao criar EventSource:', e);
    // Retornamos um EventSource vazio que será tratado pelo onerror no componente
    return new EventSource('data:,');
  }
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
  return response.data.prompt;
};

export const updateSystemPrompt = async (prompt: string): Promise<void> => {
  await axios.put(`${API_URL}/config/system-prompt`, { prompt });
};

export const resetSystemPrompt = async (): Promise<void> => {
  await axios.post(`${API_URL}/config/system-prompt/reset`);
};

export default axios; 