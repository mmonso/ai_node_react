import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Model, ModelConfig, Folder } from '../types';
import { getActiveModel, setActiveModel as apiSetActiveModel, updateActiveModelConfig as apiUpdateActiveModelConfig, getConversations, getFolders } from '../services/api'; // Removido getMainAgent, createConversation, updateMainAgent
import { useMainAgentInitialization } from '../hooks/useMainAgentInitialization'; // Importar o novo hook

import { Conversation } from '../types';

interface AppContextType {
  reloadTrigger: number;
  triggerReload: () => void;
  activeModel: Model | null;
  activeModelConfig: ModelConfig | null;
  setActiveModelWithId: (modelId: string, config?: ModelConfig) => Promise<boolean>;
  updateActiveConfig: (config: ModelConfig) => Promise<boolean>;
  isLoadingModel: boolean;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  personas: Conversation[];
  setPersonas: React.Dispatch<React.SetStateAction<Conversation[]>>;
  mainAgentConversationId: string | null;
  mainAgentConversation: Conversation | null;
  isMainAgentInitialized: boolean; // Adicionado para refletir o estado do hook
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [activeModel, setActiveModel] = useState<Model | null>(null);
  const [activeModelConfig, setActiveModelConfig] = useState<ModelConfig | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [rawConversations, setRawConversations] = useState<Conversation[]>([]);
  const [rawFolders, setRawFolders] = useState<Folder[]>([]);
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  const [rawPersonas, setRawPersonas] = useState<Conversation[]>([]);
  
  // Estado para controlar quando as conversas foram carregadas, para passar ao hook
  const [conversationsLoaded, setConversationsLoaded] = useState(false);

  // Utilizar o novo hook para a lógica do agente principal
  const {
    mainAgentConversationId,
    mainAgentConversation,
    isMainAgentInitialized
  } = useMainAgentInitialization({
    rawConversations,
    setRawConversations,
    conversationsLoaded,
  });

  // Estados para as versões filtradas das conversas e personas
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [filteredPersonas, setFilteredPersonas] = useState<Conversation[]>([]);

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
    // Removido initializeMainAgent() daqui para evitar duplicação
    // O agente principal será inicializado pelo outro useEffect após carregar as conversas
    console.log('Não inicializando o agente principal aqui para evitar duplicação!');
    console.log('=============================================');
  }, []);

  // A lógica de inicialização do agente principal foi movida para o hook useMainAgentInitialization.
  // Os estados mainAgentConversationId, mainAgentConversation e isMainAgentInitialized são agora obtidos do hook.

  // Efeito para carregar as conversas, pastas e personas quando o contador de reload é incrementado
  useEffect(() => {
    console.log(`====== CARREGAMENTO INICIAL DE DADOS ======`);
    console.log(`AppContext: Carregando dados (trigger=${reloadTrigger})...`);
    
    // Não resetamos mais mainAgentInitialized ou mainAgentConversation aqui,
    // pois o hook useMainAgentInitialization gerencia seu próprio ciclo de vida de inicialização.
    // Apenas garantimos que conversationsLoaded seja resetado para que o hook possa reagir.
    setConversationsLoaded(false);
    
    const fetchData = async () => {
      try {
        console.log('AppContext: Iniciando carregamento de conversas, personas e pastas...');
        
        // Resetamos as listas para evitar duplicações
        setRawConversations([]);
        setRawPersonas([]);
        setRawFolders([]);
        
        // Carrega todos os dados
        console.log('AppContext: Chamando APIs para carregar todos os dados...');
        const [conversations, personas, folders] = await Promise.all([
          getConversations(), // Função correta importada de api.ts
          getConversations().then(convs => convs.filter(c => c.isPersona === true)), // Simulando getPersonas
          getFolders(),
        ]);
        
        console.log(`AppContext: Dados carregados - ${conversations.length} conversas, ${personas.length} personas, ${folders.length} pastas`);
        console.log('Todas as conversas carregadas:', conversations.map((c: Conversation) => ({ id: c.id, title: c.title })));
        
        // Verificar se já existe uma conversa 'Assistente IA'
        const assistentIA = conversations.find((c: Conversation) => c.title === 'Assistente IA');
        if (assistentIA) {
          console.log(`AVISO: Conversa 'Assistente IA' já existe no backend com ID: ${assistentIA.id}`);
          console.log(`Detalhes da conversa 'Assistente IA':`, assistentIA);
        }
        
        // Atualizamos os dados brutos
        setRawConversations(conversations);
        setRawPersonas(personas);
        setRawFolders(folders);

        console.log('AppContext: Marcando conversas como carregadas para iniciar fluxo do agente principal');
        // Marca que as conversas foram carregadas para iniciar o fluxo de inicialização do agente
        setConversationsLoaded(true);
      } catch (error) {
        console.error('AppContext: Erro ao carregar dados:', error);
      } finally {
        console.log('=============================================');
      }
    };
    
    fetchData();
  }, [reloadTrigger]);

  // O useEffect que disparava initializeMainAgent foi removido, pois essa lógica agora está dentro do hook.

  // Efeito para filtrar conversas, personas e conversas dentro de pastas quando os dados brutos ou o mainAgentConversationId mudam
  useEffect(() => {
    console.log('==== FILTRAGEM DE CONVERSAS ====');
    console.log(`Estado atual do mainAgentConversationId:`, mainAgentConversationId);
    console.log(`Total de conversas antes da filtragem:`, rawConversations.length);
    console.log(`Todas as conversas antes da filtragem:`, rawConversations.map((c: Conversation) => ({ id: c.id, title: c.title })));
    
    // Verificar se há uma conversa 'Assistente IA' em rawConversations
    const assistentIAByTitle = rawConversations.find((c: Conversation) => c.title === 'Assistente IA');
    if (assistentIAByTitle) {
      console.log(`IMPORTANTE: Encontrada conversa 'Assistente IA' pelo título: ${assistentIAByTitle.id}`);
    }
    
    if (mainAgentConversationId) {
      console.log(`Filtrando conversas para remover o ID ${mainAgentConversationId}...`);
      
      // Encontrar a conversa do agente principal para debug
      const mainConversation = rawConversations.find((c: Conversation) => c.id === mainAgentConversationId);
      console.log('Conversa do agente principal:', mainConversation ? 
        { id: mainConversation.id, title: mainConversation.title } : 'Não encontrada');
      
      // Verificar explicitamente todas as conversas para entender por que a filtragem pode estar falhando
      rawConversations.forEach((c: Conversation) => {
        console.log(`Verificando conversa: id=${c.id}, title=${c.title}, igual a mainAgentId: ${c.id === mainAgentConversationId}`);
      });
      
      // Usando mais verificações rigorosas para garantir que a conversa correta seja removida
      const filtered = rawConversations.filter((c: Conversation) => {
        const shouldRemove = c.id === mainAgentConversationId || 
                            (c.title === 'Assistente IA' && assistentIAByTitle && c.id === assistentIAByTitle.id);
        if (shouldRemove) {
          console.log(`Removendo conversa da lista: id=${c.id}, title=${c.title}`);
        }
        return !shouldRemove;
      });
      
      console.log(`Conversas após filtragem:`, filtered.length);
      console.log(`Conversas filtradas:`, filtered.map((c: Conversation) => ({ id: c.id, title: c.title })));
      
      // Forçar a exclusão de qualquer conversa com título 'Assistente IA'
      const finalFiltered = filtered.filter((c: Conversation) => c.title !== 'Assistente IA');
      if (finalFiltered.length !== filtered.length) {
        console.log(`IMPORTANTE: Foram removidas ${filtered.length - finalFiltered.length} conversas adicionais pelo título`);  
      }
      
      setFilteredConversations(finalFiltered);
      setFilteredPersonas(rawPersonas.filter((p: Conversation) => p.id !== mainAgentConversationId && p.title !== 'Assistente IA'));
      // Simplesmente define filteredFolders com base em rawFolders.
      // A filtragem de conversas específicas de uma pasta será feita pelo componente que a renderiza.
      setFilteredFolders(rawFolders);
    } else {
      console.log('AVISO: Não há mainAgentConversationId definido!');
      
      // Mesmo sem mainAgentConversationId, tentar filtrar pelo título
      if (assistentIAByTitle) {
        console.log(`Filtrando pelo título 'Assistente IA' porque não há mainAgentConversationId`);
        const filtered = rawConversations.filter((c: Conversation) => c.title !== 'Assistente IA');
        console.log(`Removidas ${rawConversations.length - filtered.length} conversas pelo título`);
        setFilteredConversations(filtered);
        setFilteredPersonas(rawPersonas.filter((p: Conversation) => p.title !== 'Assistente IA'));
      } else {
        console.log('Nenhuma conversa encontrada para filtrar. Usando listas sem filtro.');
        setFilteredConversations(rawConversations);
        setFilteredPersonas(rawPersonas);
      }
      setFilteredFolders(rawFolders);
    }
    console.log('===========================');
  }, [rawConversations, rawPersonas, rawFolders, mainAgentConversationId]); // Adicionado rawFolders às dependências

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
      conversations: filteredConversations, // Expor a versão filtrada
      setConversations: setRawConversations, // Expor o setter para os dados brutos
      folders: filteredFolders, // Expor a versão filtrada das pastas
      setFolders: setRawFolders, // Expor o setter para os dados brutos das pastas
      personas: filteredPersonas, // Expor a versão filtrada
      setPersonas: setRawPersonas,
      mainAgentConversationId,
      mainAgentConversation,
      isMainAgentInitialized, // Expor o estado de inicialização do hook
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
