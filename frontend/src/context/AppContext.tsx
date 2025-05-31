import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Model, ModelConfig, Folder } from '../types'; // Adicionar Folder
import { getActiveModel, setActiveModel as apiSetActiveModel, updateActiveModelConfig as apiUpdateActiveModelConfig } from '../services/api';

import { Conversation } from '../types'; // Importar Conversation

interface AppContextType {
  reloadTrigger: number; // Um contador para disparar reloads
  triggerReload: () => void; // Função para incrementar o contador
  activeModel: Model | null;
  activeModelConfig: ModelConfig | null;
  setActiveModelWithId: (modelId: string, config?: ModelConfig) => Promise<boolean>;
  updateActiveConfig: (config: ModelConfig) => Promise<boolean>;
  isLoadingModel: boolean;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  folders: Folder[]; // Adicionado
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>; // Adicionado
  personas: Conversation[];
  setPersonas: React.Dispatch<React.SetStateAction<Conversation[]>>;
  // TODO: Adicionar funções para CRUD de Folders
  // fetchFolders: () => Promise<void>;
  // createFolder: (folderData: Omit<Folder, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Folder | null>;
  // updateFolder: (folderId: number, folderData: Partial<Omit<Folder, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<Folder | null>;
  // deleteFolder: (folderId: number) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [activeModel, setActiveModel] = useState<Model | null>(null);
  const [activeModelConfig, setActiveModelConfig] = useState<ModelConfig | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]); // Adicionado
  const [personas, setPersonas] = useState<Conversation[]>([]);

  // Função estável para disparar o reload incrementando o contador
  const triggerReload = useCallback(() => {
    console.log("AppContext: Disparando reload (incrementando trigger)...");
    setReloadTrigger(prev => prev + 1);
  }, []);

  // Carregar o modelo ativo ao iniciar
  useEffect(() => {
    const loadActiveModel = async () => {
      setIsLoadingModel(true);
      console.log('AppContext: Iniciando carregamento do modelo ativo global...');
      try {
        const { model, config } = await getActiveModel();
        console.log('AppContext: Modelo ativo global carregado da API:', { modelName: model?.name, modelId: model?.id, config });
        setActiveModel(model);
        setActiveModelConfig(config);
      } catch (error) {
        console.error('AppContext: Erro ao carregar modelo ativo global da API:', error);
      } finally {
        setIsLoadingModel(false);
      }
    };

    loadActiveModel();
  }, []);

  // Função para definir o modelo ativo
  const setActiveModelWithId = useCallback(async (modelId: string, config?: ModelConfig): Promise<boolean> => {
    console.log(`AppContext: Tentando definir modelo ativo global com ID: ${modelId}, Config:`, config);
    setIsLoadingModel(true);
    try {
      const result = await apiSetActiveModel(modelId, config);
      console.log('AppContext: Resposta da API setActiveModel:', result);
      
      if (result && result.model) {
        if (result.model.id !== modelId) {
          console.warn(`AppContext: ID do modelo retornado (${result.model.id}) não corresponde ao solicitado (${modelId})`);
          return false;
        }
        
        console.log(`AppContext: Modelo ativo global definido com sucesso para ${result.model.name} (ID: ${result.model.id}), Config:`, result.config);
        setActiveModel(result.model);
        setActiveModelConfig(result.config);
        triggerReload();
        return true;
      }
      
      console.warn('AppContext: Falha ao definir modelo ativo global, API não retornou modelo válido.');
      return false;
    } catch (error) {
      console.error('AppContext: Erro na API ao definir modelo ativo global:', error);
      return false;
    } finally {
      setIsLoadingModel(false);
    }
  }, [triggerReload]);

  // Função para atualizar apenas a configuração do modelo ativo
  const updateActiveConfig = useCallback(async (config: ModelConfig): Promise<boolean> => {
    try {
      const success = await apiUpdateActiveModelConfig(config);
      if (success) {
        console.log('AppContext: Configuração do modelo ativo atualizada');
        setActiveModelConfig(config);
        return true;
      }
      return false;
    } catch (error) {
      console.error('AppContext: Erro ao atualizar configuração do modelo ativo:', error);
      return false;
    }
  }, []);

  return (
    // Fornece o contador e a função para dispará-lo
    <AppContext.Provider value={{
      reloadTrigger,
      triggerReload,
      activeModel,
      activeModelConfig,
      setActiveModelWithId,
      updateActiveConfig,
      isLoadingModel,
      conversations,
      setConversations,
      folders, // Adicionado
      setFolders, // Adicionado
      personas,
      setPersonas
      // TODO: Adicionar funções CRUD de Folders ao valor do contexto
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext deve ser usado dentro de um AppProvider');
  }
  return context;
};