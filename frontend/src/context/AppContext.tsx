import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Model, ModelConfig, Folder } from '../types'; // Agent removido
import { getActiveModel, setActiveModel as apiSetActiveModel, updateActiveModelConfig as apiUpdateActiveModelConfig, getMainAgent, createConversation, updateMainAgent, getConversations, getFolders } from '../services/api';

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
  mainAgentConversationId: string | null; // Adicionado
  mainAgentConversation: Conversation | null; // NOVA PROP
  // agents: Agent[]; // Removido
  // setAgents: React.Dispatch<React.SetStateAction<Agent[]>>; // Removido
  // TODO: Adicionar funções para CRUD de Folders
  // fetchFolders: () => Promise<void>;
  // createFolder: (folderData: Omit<Folder, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Folder | null>;
  // updateFolder: (folderId: number, folderData: Partial<Omit<Folder, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<Folder | null>;
  // deleteFolder: (folderId: number) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [activeModel, setActiveModel] = useState<Model | null>(null);
  const [activeModelConfig, setActiveModelConfig] = useState<ModelConfig | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [rawConversations, setRawConversations] = useState<Conversation[]>([]);
  const [rawFolders, setRawFolders] = useState<Folder[]>([]); // Renomeado de folders para rawFolders e setFolders para setRawFolders
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]); // Novo estado para pastas filtradas
  const [rawPersonas, setRawPersonas] = useState<Conversation[]>([]);
  const [mainAgentConversationId, setMainAgentConversationId] = useState<string | null>(null); // Adicionado
  const [mainAgentConversation, setMainAgentConversation] = useState<Conversation | null>(null); // NOVO ESTADO
  const [mainAgentInitialized, setMainAgentInitialized] = useState(false); // Flag para controle de inicialização do agente
  // const [agents, setAgents] = useState<Agent[]>([]); // Removido

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

  // Função para carregar dados do agente principal
  // Com uma flag para evitar chamadas repetidas em um curto período de tempo

  // Função para sincronizar o ID da conversa do agente principal com o backend
  const syncMainAgentConversation = async (conversationId: string) => {
    try {
      console.log(`AppContext: Sincronizando conversationId ${conversationId} do agente principal com o backend...`);
      await updateMainAgent(conversationId); // API call: frontend/src/services/api.ts -> updateMainAgent
      console.log(`AppContext: ConversationId ${conversationId} do agente principal sincronizado com sucesso.`);
    } catch (error) {
      console.error(`AppContext: Erro ao sincronizar conversationId ${conversationId} do agente principal:`, error);
    }
  };

  // Função simplificada para criar a conversa do agente principal
  const createNewMainAgentConversation = async (): Promise<Conversation | null> => {
    try {
      console.log('AppContext: Criando nova conversa "Assistente IA" via API...');
      const newConversation = await createConversation( // API call: frontend/src/services/api.ts -> createConversation
        'Assistente IA',
        undefined, // modelId
        false, // isPersona
        'Você é um assistente AI amigável e prestativo.' // systemPrompt (DEFAULT_SYSTEM_PROMPT do backend)
      );

      if (newConversation && newConversation.id) {
        console.log(`AppContext: Nova conversa "Assistente IA" criada com ID: ${newConversation.id}`);
        // Adicionar à lista local de conversas
        setRawConversations(prev => [...prev, newConversation]);
        return newConversation;
      } else {
        console.error('AppContext: API createConversation não retornou uma conversa válida.');
        return null;
      }
    } catch (error) {
      console.error('AppContext: Erro ao chamar API createConversation para o agente principal:', error);
      return null;
    }
  };

  const initializeMainAgent = async () => {
    console.log('======= INICIALIZAÇÃO DO AGENTE PRINCIPAL =======');
    console.log(`Estado atual - mainAgentInitialized: ${mainAgentInitialized}, mainAgentConversationId: ${mainAgentConversationId}`);
    console.log(`Conversas disponíveis: ${rawConversations.length}`);
    
    if (mainAgentInitialized) {
      console.log('AppContext: SKIP - Agente principal já inicializado.');
      console.log('=============================================');
      return;
    }
    console.log('AppContext: Iniciando inicialização do agente principal...');
    
    try {
      // Verificar primeiro se já existe uma conversa chamada 'Assistente IA'
      console.log('AppContext: Verificando se já existe conversa Assistente IA nas conversas carregadas...');
      const existingIAConversation = rawConversations.find((c: Conversation) => c.title === 'Assistente IA');
      
      if (existingIAConversation) {
        console.log(`AppContext: ENCONTRADA - Conversa 'Assistente IA' local com ID ${existingIAConversation.id}`);
        
        // Antes de usar a conversa local, verificar se o backend confirma essa informação
        console.log('AppContext: Verificando no backend se esta conversa já está registrada como main agent...');
        const mainAgentResponse = await getMainAgent();
        console.log('AppContext: Resposta do getMainAgent:', mainAgentResponse);
        
        if (mainAgentResponse?.conversationId === existingIAConversation.id) {
          console.log('AppContext: O ID da conversa local corresponde ao ID no backend');
          setMainAgentConversationId(existingIAConversation.id);
          setMainAgentConversation(existingIAConversation);
          setMainAgentInitialized(true);
        } else if (mainAgentResponse?.conversationId) {
          console.log(`AppContext: CONFLITO - Backend tem conversa diferente (${mainAgentResponse.conversationId}) da local (${existingIAConversation.id})`);
          console.log('AppContext: Usando o ID do backend como fonte da verdade');
          const backendConv = rawConversations.find(c => c.id === mainAgentResponse.conversationId);
          setMainAgentConversationId(mainAgentResponse.conversationId);
          setMainAgentConversation(backendConv || null);
          setMainAgentInitialized(true);
        } else {
          console.log('AppContext: Backend não tem conversationId. Sincronizando a conversa local com o backend...');
          await syncMainAgentConversation(existingIAConversation.id);
          setMainAgentConversationId(existingIAConversation.id);
          setMainAgentConversation(existingIAConversation);
          setMainAgentInitialized(true);
        }
      } else {
        // Nenhuma conversa local encontrada com o título "Assistente IA". Verificar no backend.
        console.log('AppContext: Nenhuma conversa local "Assistente IA" encontrada. Consultando o backend...');
        const mainAgentResponse = await getMainAgent();
        console.log('AppContext: Resposta do getMainAgent:', mainAgentResponse);
        
        if (mainAgentResponse?.conversationId) {
          console.log(`AppContext: Backend já tem conversationId: ${mainAgentResponse.conversationId}`);
          const backendConv = rawConversations.find(c => c.id === mainAgentResponse.conversationId);
          setMainAgentConversationId(mainAgentResponse.conversationId);
          setMainAgentConversation(backendConv || null);
          setMainAgentInitialized(true);
        } else {
          console.log('AppContext: Backend também não tem uma conversa definida. Criando nova conversa "Assistente IA"...');
          const newConversation = await createNewMainAgentConversation();
          
          if (newConversation?.id) {
            console.log(`AppContext: Nova conversa criada com ID ${newConversation.id}`);
            setMainAgentConversationId(newConversation.id);
            setMainAgentConversation(newConversation);
            await syncMainAgentConversation(newConversation.id);
            setMainAgentInitialized(true);
          } else {
            console.error('AppContext: Falha ao criar nova conversa para o agente principal');
            // Não marcar como inicializado em caso de falha
            return;
          }
        }
      }
    } catch (error) {
      console.error('AppContext: Erro crítico ao inicializar o agente principal:', error);
      // Não marcar como inicializado em caso de erro
      return;
    }
    
    console.log('AppContext: Inicialização do agente principal concluída com sucesso.');
    console.log('=============================================');
  };

  
  

  
  // Estados para controlar o fluxo de inicialização do agente principal
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  // Flag para rastrear se já tentamos inicializar o agente neste ciclo de vida
  const [mainAgentInitializationAttempted, setMainAgentInitializationAttempted] = useState(false);

  // Efeito para carregar as conversas, pastas e personas quando o contador de reload é incrementado
  useEffect(() => {
    console.log(`====== CARREGAMENTO INICIAL DE DADOS ======`);
    console.log(`AppContext: Carregando dados (trigger=${reloadTrigger})...`);
    
    // Resetar flags de inicialização para garantir recarregamento correto
    console.log('Resetando estados de inicialização do agente principal');
    console.log(`Estados antes do reset - mainAgentInitialized: ${mainAgentInitialized}, conversationsLoaded: ${conversationsLoaded}`);
    setMainAgentConversation(null);
    setConversationsLoaded(false);
    setMainAgentInitialized(false);
    setMainAgentInitializationAttempted(false); 
    
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

  // Efeito para tentar inicializar o agente principal após o carregamento de conversas
  useEffect(() => {
    console.log('===== EFEITO DE INICIALIZAÇÃO DO AGENTE =====');
    console.log(`Condições: conversationsLoaded=${conversationsLoaded}, mainAgentInitialized=${mainAgentInitialized}, attempted=${mainAgentInitializationAttempted}`);
    
    if (conversationsLoaded && !mainAgentInitialized && !mainAgentInitializationAttempted) {
      console.log('AppContext: Condições atendidas! Tentando inicializar o agente principal...');
      setMainAgentInitializationAttempted(true); // Marcar que tentamos inicializar
      
      // Verificar se já existe uma conversa 'Assistente IA' nas conversas carregadas
      const existingAssistentIA = rawConversations.find((c: Conversation) => c.title === 'Assistente IA');
      if (existingAssistentIA) {
        console.log(`AVISO: Já existe uma conversa 'Assistente IA' carregada (ID: ${existingAssistentIA.id})`);
        console.log(`Detalhes da conversa existente:`, existingAssistentIA);
      }
      
      // Chamar de forma assíncrona para evitar race conditions
      setTimeout(() => {
        initializeMainAgent();
      }, 0);
    } else {
      console.log('AppContext: Condições NÃO atendidas para inicializar o agente principal');
    }
    console.log('=============================================');
  }, [conversationsLoaded, mainAgentInitialized, mainAgentInitializationAttempted, mainAgentConversationId, rawConversations]);

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
      setPersonas: setRawPersonas, // Expor o setter para os dados brutos
      mainAgentConversationId, // Adicionado
      mainAgentConversation, // NOVA PROP
      // agents, // Removido
      // setAgents // Removido
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
