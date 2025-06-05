import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Layout from '../components/Layout';
import ChatMessage from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { getConversation, sendMessage } from '../services/api';
import { Conversation, Message, ModelConfig } from '../types';
import { useAppContext } from '../context/AppContext';

// URL base do backend para acessar arquivos
const BASE_URL = 'http://localhost:3001';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 1rem;
`;

const InputWrapper = styled.div`
  margin-top: auto; /* Empurra para baixo se houver espaço extra no container flex pai */
  flex-shrink: 0; /* Garante que este wrapper não encolha se o conteúdo for grande */
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--secondary-text);
`;

const ErrorMessage = styled.div`
  background-color: rgba(244, 67, 54, 0.1);
  color: var(--error-color);
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--secondary-text);
  font-size: 1.1rem;
`;

const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [error, setError] = useState('');
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Usar o modelo ativo global e sua configuração
  const { reloadTrigger, triggerReload, activeModel, activeModelConfig } = useAppContext();
  
  // Configuração do modelo local (pode ser substituída pelo activeModelConfig)
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 800,
    topK: 40,
  });
  
  // Atualizar o modelConfig local quando o activeModelConfig mudar
  useEffect(() => {
    if (activeModelConfig) {
      console.log('ChatPage: Atualizando configuração do modelo com o modelo ativo global');
      setModelConfig(activeModelConfig);
    }
  }, [activeModelConfig]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efeito para limpar o timer quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      
      // Revogar todas as URLs de objetos Blob na desmontagem
      if (conversation?.messages) {
        conversation.messages.forEach(msg => {
          if (msg.imageUrl && msg.imageUrl.startsWith('blob:')) {
            console.log('Revogando URL temporária:', msg.imageUrl);
            URL.revokeObjectURL(msg.imageUrl);
          }
          if (msg.fileUrl && msg.fileUrl.startsWith('blob:')) {
            console.log('Revogando URL temporária de arquivo:', msg.fileUrl);
            URL.revokeObjectURL(msg.fileUrl);
          }
        });
      }
    };
  }, [conversation]);

  // Efeito para mostrar o indicador de digitação com atraso
  useEffect(() => {
    if (isWaiting) {
      // Limpa qualquer timer anterior
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      
      // Configura um atraso antes de mostrar o indicador de digitação
      typingTimerRef.current = setTimeout(() => {
        setShowTyping(true);
      }, 700); // 700ms de atraso para simular o "pensamento" antes de começar a digitar
    } else {
      setShowTyping(false);
      
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    }
  }, [isWaiting]);

  // Efeito específico para recarregar a conversa quando o reloadTrigger mudar
  useEffect(() => {
    if (id && reloadTrigger > 0) {
      console.log(`ChatPage: Recarregando conversa ${id} após trigger de reload (${reloadTrigger})`);
      loadConversation();
    }
  }, [reloadTrigger, id]);

  // Efeito para carregar a conversa inicialmente
  useEffect(() => {
    if (id) {
      console.log(`ChatPage: Carregando conversa ${id} (ID mudou ou carga inicial)`);
      // Limpar o estado da conversa anterior e definir o carregamento
      // para evitar exibir brevemente dados obsoletos de outra conversa.
      setConversation(null); 
      setIsLoading(true); 
      loadConversation();
    } else {
      // Se não houver ID, talvez limpar a conversa ou tratar como erro.
      // Por enquanto, se o ID for removido (ex: navegando para fora), não faz nada aqui.
      // A lógica de desmontagem do componente já lida com a limpeza de timers/URLs.
    }
  }, [id]); // Dispara quando 'id' muda
  
  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);
  
  const loadConversation = async () => {
    if (!id) {
      setError("ID da conversa não encontrado na URL.");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      console.log(`ChatPage: Carregando conversa ${id}...`);
      
      const data = await getConversation(id);
      console.log(`ChatPage: Conversa carregada:`, {
        id: data.id,
        title: data.title,
        messageCount: data.messages?.length
      });
      
      // Verificar se há mensagens com imagens e pré-carregar
      if (data && data.messages) {
        // Verificar se existem imagens que podem não estar carregando corretamente
        data.messages.forEach(msg => {
          if (msg.imageUrl) {
            console.log('Verificando imagem ao carregar conversa:', msg.imageUrl);
            
            // A função getConversation já deve ter convertido URLs relativas para absolutas
            // Verificar se a imagem é acessível tentando pré-carregá-la
            const img = new Image();
            img.onload = () => console.log('Imagem pré-carregada com sucesso:', msg.imageUrl);
            img.onerror = (e) => {
              console.warn('Erro ao pré-carregar imagem:', msg.imageUrl, e);
              // Se ainda estiver com erro, podemos tentar novamente com a URL completa
              if (msg.imageUrl && msg.imageUrl.startsWith('/uploads/')) {
                const absoluteUrl = `${BASE_URL}${msg.imageUrl}`;
                console.log('Tentando novamente com URL absoluta:', absoluteUrl);
                const retryImg = new Image();
                retryImg.onload = () => {
                  console.log('Imagem pré-carregada com sucesso na segunda tentativa:', absoluteUrl);
                  // Atualizar a URL na mensagem se a versão absoluta funcionar
                  msg.imageUrl = absoluteUrl;
                };
                retryImg.src = absoluteUrl;
              }
            };
            img.src = msg.imageUrl;
          }
        });
      }
      
      setConversation(data);
      
      console.log(`ChatPage: Conversa ${id} carregada com sucesso`);
      setError('');
    } catch (err: any) {
      setError(`Erro ao carregar conversa: ${err.message}`);
      console.error('Erro ao carregar conversa:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendMessage = async (content: string, config: ModelConfig, file?: File, useWebSearch?: boolean) => {
    if (!id) return;
    
    // Verifica se é a primeira mensagem dessa conversa
    const isFirstMessageInNewChat = conversation?.messages?.length === 0;
    
    // Cria uma mensagem temporária do usuário para exibição imediata
    let temporaryImageUrl = '';
    let temporaryFileUrl = '';
    
    if (file) {
      if (file.type.startsWith('image/')) {
        temporaryImageUrl = URL.createObjectURL(file);
      } else {
        temporaryFileUrl = URL.createObjectURL(file);
      }
    }
    
    const userMessage: Message = {
      id: Date.now(),
      conversationId: id, // id é garantido como string pela verificação no início da função
      content,
      isUser: true,
      imageUrl: temporaryImageUrl,
      fileUrl: temporaryFileUrl,
      timestamp: new Date().toISOString(),
    };
    
    setConversation((prevConversation) => {
      if (!prevConversation) {
        // Se de alguma forma for null, criar uma nova conversa com os valores mínimos
        return {
          id: id, // Usar o id da URL que é string
          title: conversation?.title || 'Nova Conversa',
          createdAt: conversation?.createdAt || new Date().toISOString(),
          updatedAt: conversation?.updatedAt || new Date().toISOString(),
          messages: [userMessage]
          // folderId: conversation?.folderId // Removido
        };
      }
      
      return {
        ...prevConversation,
        messages: [...(prevConversation.messages || []), userMessage]
      };
    });
    
    setIsWaiting(true);
    setError('');
    
    try {
      // Envia a mensagem e recebe a resposta do bot
      const updatedMessages = await sendMessage(id, content, file, config, useWebSearch);
      
      // Log para depuração
      console.log('Mensagens recebidas do servidor:', updatedMessages);
      
      // Verificar se há mensagem do usuário com imagem
      const userMessageWithImage = updatedMessages.find(msg => msg.isUser && msg.imageUrl);
      console.log('Mensagem do usuário com imagem:', userMessageWithImage?.imageUrl);
      
      // Atualiza a conversa com as mensagens recebidas do servidor
      if (updatedMessages) { // Garante que updatedMessages não é null/undefined
        setConversation((prevConversation) => {
          if (!prevConversation) {
            // Caso de fallback, se prevConversation for null (improvável neste ponto, mas seguro)
            // Isso pode acontecer se a conversa foi deletada ou houve um erro antes.
            // Usamos o 'id' da URL, que é garantido como string.
            return {
              id: id,
              title: 'Nova Conversa', // Um título padrão se não houver um anterior
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              messages: updatedMessages, // Usa a lista completa do backend
              // folderId: undefined // Se folderId for parte do tipo Conversation
            };
          }
          // Substitui completamente as mensagens locais pelas do backend
          return {
            ...prevConversation,
            messages: updatedMessages
          };
        });
      }
      
      // Atualiza a lista de conversas se for a primeira mensagem
      if (isFirstMessageInNewChat) {
        triggerReload(); 
      }
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      setError(`Erro ao enviar mensagem: ${err.message}`);
    } finally {
      setIsWaiting(false);
      // Revoga as URLs temporárias para evitar vazamento de memória
      // Não revogamos aqui, pois precisamos manter a referência visual durante a sessão
      // Isso será limpo quando o componente for desmontado ou a página for recarregada
      // if (temporaryImageUrl) URL.revokeObjectURL(temporaryImageUrl);
      // if (temporaryFileUrl) URL.revokeObjectURL(temporaryFileUrl);
    }
  };
  
const updateMessageInConversation = useCallback((updatedMessageData: Message) => {
    // Cria uma cópia da mensagem recebida para poder modificá-la
    // O messageToUpdate já virá com a propriedade 'deleted: true' do ChatMessage.tsx
    // para casos de exclusão. Para edições, virá com o conteúdo atualizado.
    // A verificação de 'deletedAt' não é mais necessária aqui.
    const messageToUpdate = { ...updatedMessageData };

    setConversation(prevConversation => {
      if (prevConversation && prevConversation.messages) {
        return {
          ...prevConversation,
          messages: prevConversation.messages.map(msg =>
            msg.id === messageToUpdate.id ? messageToUpdate : msg
          ),
        };
      }
      return prevConversation;
    });
  }, [setConversation]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleModelConfigChange = (param: keyof ModelConfig, value: number) => {
    setModelConfig(prev => ({ ...prev, [param]: value }));
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingIndicator>
          <svg width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <circle cx="12" cy="6" r="2" fill="currentColor">
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                from="0 12 12"
                to="360 12 12"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
          <span style={{ marginLeft: '10px' }}>Carregando conversa...</span>
        </LoadingIndicator>
      </Layout>
    );
  }

  if (!conversation) {
    return (
      <Layout>
        <ErrorMessage>
          Conversa não encontrada. <button onClick={() => navigate('/')}>Voltar</button>
        </ErrorMessage>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <ChatContainer>
        <MessagesContainer>
          {(conversation?.messages?.length === 0) ? (
            <EmptyState>
              Comece uma nova conversa enviando uma mensagem abaixo.
            </EmptyState>
          ) : (
            <>
              {/* Renderiza todas as mensagens existentes, exceto as excluídas */}
              {conversation?.messages?.filter(message => !message.deleted).map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onUpdateMessage={updateMessageInConversation}
                />
              ))}
              
              {/* Mostra o indicador de digitação depois de um breve atraso */}
              {showTyping && (
                <ChatMessage isTyping={true} message={{
                  id: -1, // ID temporário
                  conversationId: id || '', // Garante que id é string ou string vazia
                  content: '',
                  isUser: false,
                  timestamp: new Date().toISOString()
                }} />
              )}
            </>
          )}
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <div ref={messagesEndRef} />
        </MessagesContainer>
        
        <InputWrapper>
          <ChatInput
            onSendMessage={handleSendMessage}
            isWaiting={isWaiting} 
            modelConfig={modelConfig}
            onModelConfigChange={handleModelConfigChange}
          />
        </InputWrapper>
      </ChatContainer>
    </Layout>
  );
};

export default ChatPage;
