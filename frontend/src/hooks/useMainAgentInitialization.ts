import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '../types';
import { getMainAgent, createConversation, updateMainAgent } from '../services/api';

interface UseMainAgentInitializationProps {
  rawConversations: Conversation[];
  setRawConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  conversationsLoaded: boolean;
}

interface UseMainAgentInitializationReturn {
  mainAgentConversationId: string | null;
  mainAgentConversation: Conversation | null;
  isMainAgentInitialized: boolean;
  // Poderíamos adicionar isLoadingMainAgent e errorMainAgent se necessário
}

export const useMainAgentInitialization = ({
  rawConversations,
  setRawConversations,
  conversationsLoaded,
}: UseMainAgentInitializationProps): UseMainAgentInitializationReturn => {
  const [mainAgentConversationId, setMainAgentConversationId] = useState<string | null>(null);
  const [mainAgentConversation, setMainAgentConversation] = useState<Conversation | null>(null);
  const [isMainAgentInitialized, setIsMainAgentInitialized] = useState(false);
  const [mainAgentInitializationAttempted, setMainAgentInitializationAttempted] = useState(false);

  const syncMainAgentConversation = useCallback(async (conversationId: string) => {
    try {
      console.log(`useMainAgentInitialization: Sincronizando conversationId ${conversationId} do agente principal com o backend...`);
      await updateMainAgent(conversationId);
      console.log(`useMainAgentInitialization: ConversationId ${conversationId} do agente principal sincronizado com sucesso.`);
    } catch (error) {
      console.error(`useMainAgentInitialization: Erro ao sincronizar conversationId ${conversationId} do agente principal:`, error);
    }
  }, []);

  const createNewMainAgentConversation = useCallback(async (): Promise<Conversation | null> => {
    try {
      console.log('useMainAgentInitialization: Criando nova conversa "Assistente IA" via API...');
      const newConversation = await createConversation(
        'Assistente IA',
        undefined, // modelId
        false, // isPersona
        'Você é um assistente AI amigável e prestativo.' // systemPrompt (DEFAULT_SYSTEM_PROMPT do backend)
      );

      if (newConversation && newConversation.id) {
        console.log(`useMainAgentInitialization: Nova conversa "Assistente IA" criada com ID: ${newConversation.id}`);
        setRawConversations(prev => [...prev, newConversation]);
        return newConversation;
      } else {
        console.error('useMainAgentInitialization: API createConversation não retornou uma conversa válida.');
        return null;
      }
    } catch (error) {
      console.error('useMainAgentInitialization: Erro ao chamar API createConversation para o agente principal:', error);
      return null;
    }
  }, [setRawConversations]);

  const initializeMainAgent = useCallback(async () => {
    console.log('======= INICIALIZAÇÃO DO AGENTE PRINCIPAL (HOOK) =======');
    console.log(`Estado atual - isMainAgentInitialized: ${isMainAgentInitialized}, mainAgentConversationId: ${mainAgentConversationId}`);
    console.log(`Conversas disponíveis: ${rawConversations.length}`);

    if (isMainAgentInitialized) {
      console.log('useMainAgentInitialization: SKIP - Agente principal já inicializado.');
      console.log('=============================================');
      return;
    }
    console.log('useMainAgentInitialization: Iniciando inicialização do agente principal...');

    try {
      console.log('useMainAgentInitialization: Verificando se já existe conversa Assistente IA nas conversas carregadas...');
      const existingIAConversation = rawConversations.find((c: Conversation) => c.title === 'Assistente IA');

      if (existingIAConversation) {
        console.log(`useMainAgentInitialization: ENCONTRADA - Conversa 'Assistente IA' local com ID ${existingIAConversation.id}`);
        console.log('useMainAgentInitialization: Verificando no backend se esta conversa já está registrada como main agent...');
        const mainAgentResponse = await getMainAgent();
        console.log('useMainAgentInitialization: Resposta do getMainAgent:', mainAgentResponse);

        if (mainAgentResponse?.conversationId === existingIAConversation.id) {
          console.log('useMainAgentInitialization: O ID da conversa local corresponde ao ID no backend');
          setMainAgentConversationId(existingIAConversation.id);
          setMainAgentConversation(existingIAConversation);
          setIsMainAgentInitialized(true);
        } else if (mainAgentResponse?.conversationId) {
          console.log(`useMainAgentInitialization: CONFLITO - Backend tem conversa diferente (${mainAgentResponse.conversationId}) da local (${existingIAConversation.id})`);
          console.log('useMainAgentInitialization: Usando o ID do backend como fonte da verdade');
          const backendConv = rawConversations.find(c => c.id === mainAgentResponse.conversationId);
          setMainAgentConversationId(mainAgentResponse.conversationId);
          setMainAgentConversation(backendConv || null);
          setIsMainAgentInitialized(true);
        } else {
          console.log('useMainAgentInitialization: Backend não tem conversationId. Sincronizando a conversa local com o backend...');
          await syncMainAgentConversation(existingIAConversation.id);
          setMainAgentConversationId(existingIAConversation.id);
          setMainAgentConversation(existingIAConversation);
          setIsMainAgentInitialized(true);
        }
      } else {
        console.log('useMainAgentInitialization: Nenhuma conversa local "Assistente IA" encontrada. Consultando o backend...');
        const mainAgentResponse = await getMainAgent();
        console.log('useMainAgentInitialization: Resposta do getMainAgent:', mainAgentResponse);

        if (mainAgentResponse?.conversationId) {
          console.log(`useMainAgentInitialization: Backend já tem conversationId: ${mainAgentResponse.conversationId}`);
          const backendConv = rawConversations.find(c => c.id === mainAgentResponse.conversationId);
          setMainAgentConversationId(mainAgentResponse.conversationId);
          setMainAgentConversation(backendConv || null);
          setIsMainAgentInitialized(true);
        } else {
          console.log('useMainAgentInitialization: Backend também não tem uma conversa definida. Criando nova conversa "Assistente IA"...');
          const newConversation = await createNewMainAgentConversation();

          if (newConversation?.id) {
            console.log(`useMainAgentInitialization: Nova conversa criada com ID ${newConversation.id}`);
            setMainAgentConversationId(newConversation.id);
            setMainAgentConversation(newConversation);
            await syncMainAgentConversation(newConversation.id);
            setIsMainAgentInitialized(true);
          } else {
            console.error('useMainAgentInitialization: Falha ao criar nova conversa para o agente principal');
            return;
          }
        }
      }
    } catch (error) {
      console.error('useMainAgentInitialization: Erro crítico ao inicializar o agente principal:', error);
      return;
    }

    console.log('useMainAgentInitialization: Inicialização do agente principal concluída com sucesso.');
    console.log('=============================================');
  }, [
    isMainAgentInitialized,
    mainAgentConversationId,
    rawConversations,
    createNewMainAgentConversation,
    syncMainAgentConversation,
    // Não precisamos de setMainAgentConversationId, setMainAgentConversation, setIsMainAgentInitialized como dependências
    // porque useCallback já captura os setters do useState.
  ]);

  useEffect(() => {
    console.log('===== EFEITO DE INICIALIZAÇÃO DO AGENTE (HOOK) =====');
    console.log(`Condições: conversationsLoaded=${conversationsLoaded}, isMainAgentInitialized=${isMainAgentInitialized}, attempted=${mainAgentInitializationAttempted}`);

    if (conversationsLoaded && !isMainAgentInitialized && !mainAgentInitializationAttempted) {
      console.log('useMainAgentInitialization: Condições atendidas! Tentando inicializar o agente principal...');
      setMainAgentInitializationAttempted(true);

      const existingAssistentIA = rawConversations.find((c: Conversation) => c.title === 'Assistente IA');
      if (existingAssistentIA) {
        console.log(`AVISO (HOOK): Já existe uma conversa 'Assistente IA' carregada (ID: ${existingAssistentIA.id})`);
      }
      
      // Usar setTimeout para garantir que o estado 'mainAgentInitializationAttempted' seja atualizado antes de chamar initializeMainAgent
      // e para desvincular a execução da renderização atual.
      const timerId = setTimeout(() => {
        initializeMainAgent();
      }, 0);
      return () => clearTimeout(timerId); // Limpar o timeout se o componente desmontar ou as dependências mudarem
    } else {
      console.log('useMainAgentInitialization: Condições NÃO atendidas para inicializar o agente principal');
    }
    console.log('=============================================');
  }, [conversationsLoaded, isMainAgentInitialized, mainAgentInitializationAttempted, initializeMainAgent, rawConversations]);

  return {
    mainAgentConversationId,
    mainAgentConversation,
    isMainAgentInitialized,
  };
};