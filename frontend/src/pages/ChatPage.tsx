import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Layout from '../components/Layout';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import { getConversation, sendMessage, streamMessage, uploadFile } from '../services/api';
import { Conversation, Message, ModelConfig } from '../types';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 750px;
  margin: 0 auto;
  width: 100%;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 1rem;
`;

const InputWrapper = styled.div`
  margin-top: auto;
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
  const [error, setError] = useState('');
  const [streamingMessage, setStreamingMessage] = useState('');
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 800,
    topK: 40,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFinalizedRef = useRef(false); // Ref para controlar a finalização
  
  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }
    
    loadConversation();
  }, [id]);
  
  useEffect(() => {
    scrollToBottom();
  }, [conversation, streamingMessage]);
  
  const loadConversation = async () => {
    try {
      setIsLoading(true);
      const data = await getConversation(Number(id));
      setConversation(data);
      setError('');
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
      setError('Não foi possível carregar esta conversa.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendMessage = async (content: string, modelConfig: ModelConfig, file?: File) => {
    if (!id || (!content.trim() && !file)) return;
    
    // Adicionar informações de arquivo para exibição local temporária
    let temporaryImageUrl, temporaryFileUrl;
    
    if (file) {
      const isImage = file.type.startsWith('image/');
      const objectUrl = URL.createObjectURL(file);
      
      if (isImage) {
        temporaryImageUrl = objectUrl;
      } else {
        temporaryFileUrl = objectUrl;
      }
    }
    
    // Adiciona a mensagem do usuário localmente
    const userMessage: Message = {
      id: Date.now(),
      conversationId: Number(id),
      content,
      isUser: true,
      imageUrl: temporaryImageUrl,
      fileUrl: temporaryFileUrl,
      timestamp: new Date().toISOString(),
    };
    
    setConversation(prevConversation => {
      if (!prevConversation) return null;
      
      return {
        ...prevConversation,
        messages: [...prevConversation.messages, userMessage]
      };
    });
    
    setIsWaiting(true);
    setError(''); // Limpa erros anteriores
    
    try {
      // 1. Salvar a mensagem do usuário
      await sendMessage(Number(id), content, file, modelConfig);

      // 2. Iniciar o stream para obter a resposta do bot
      let retryCount = 0;
      const MAX_RETRIES = 3;
      
      const startStream = () => {
        // Limpar qualquer stream anterior em caso de retry
        setStreamingMessage('');
        
        // Iniciar nova conexão
        console.log(`Iniciando stream (tentativa ${retryCount + 1}/${MAX_RETRIES})`);
        const eventSource = streamMessage(Number(id));
        
        // Variáveis para controle
        let messageAccumulator = '';
        let lastActivity = Date.now();
        let isEventSourceActive = true;
        const TIMEOUT_MS = 30000; // 30 segundos
        const MAX_STREAM_DURATION = 60000; // 60 segundos máximo
        
        // Timeout para encerrar o stream se demorar demais
        const maxDurationTimeout = setTimeout(() => {
          console.warn(`Stream ultrapassou o tempo máximo de ${MAX_STREAM_DURATION/1000} segundos`);
          cleanupResources('Tempo máximo excedido');
          
          // Se temos mensagem, finalizamos com ela
          if (messageAccumulator.trim().length > 0) {
            finalizeWithMessage(messageAccumulator);
          } else {
            setIsWaiting(false);
            setError('Conexão encerrada por tempo limite.');
          }
        }, MAX_STREAM_DURATION);
        
        // Função para limpar recursos
        const cleanupResources = (message?: string) => {
          if (!isEventSourceActive) return;
          
          // Registrar ação
          if (message) {
            console.log(`Limpando recursos: ${message}`);
          }
          
          // Limpar timers
          clearInterval(timeoutId);
          clearTimeout(maxDurationTimeout);
          
          // Fechar conexão
          try {
            eventSource.close();
          } catch (e) {
            console.error('Erro ao fechar EventSource:', e);
          }
          
          isEventSourceActive = false;
        };
        
        // Finalizar com mensagem
        const finalizeWithMessage = (message: string) => {
          cleanupResources('Finalizando com mensagem');
          
          const finalBotMessage: Message = {
            id: Date.now(),
            conversationId: Number(id),
            content: message,
            isUser: false,
            timestamp: new Date().toISOString(),
          };
          
          setConversation(prevConversation => {
            if (!prevConversation) return null;
            return {
              ...prevConversation,
              messages: [...prevConversation.messages, finalBotMessage]
            };
          });
          
          setStreamingMessage('');
          setIsWaiting(false);
        };
        
        // Monitorar timeout
        const timeoutId = setInterval(() => {
          if (!isEventSourceActive) {
            clearInterval(timeoutId);
            return;
          }
          
          const inactiveTime = Date.now() - lastActivity;
          
          // Log para debug
          if (inactiveTime > 10000) { // A cada 10 segundos
            console.log(`Stream inativo por ${Math.round(inactiveTime/1000)} segundos`);
          }
          
          // Verificar se já recebemos alguma resposta antes de aplicar timeout
          if (inactiveTime > TIMEOUT_MS && messageAccumulator.trim().length === 0) {
            console.warn(`Stream timeout - Sem atividade por ${TIMEOUT_MS/1000} segundos`);
            
            cleanupResources('Timeout');
            
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              console.log(`Tentativa ${retryCount} de ${MAX_RETRIES}`);
              setTimeout(startStream, 1000);
            } else {
              console.error('Máximo de tentativas atingido após timeout');
              setError('Tempo limite excedido. Por favor, tente novamente.');
              setIsWaiting(false);
            }
          }
        }, 5000);
        
        // Handler para mensagens recebidas
        eventSource.onmessage = (event) => {
          lastActivity = Date.now(); // Atualiza timestamp de atividade
          
          try {
            const chunk = event.data;
            
            // Verifica se é o marcador de fim
            if (chunk === '[STREAM_ENCERRADO]') {
              console.log('Marcador de encerramento recebido');
              
              // Verificar se temos uma mensagem para finalizar
              if (messageAccumulator.trim().length > 0) {
                console.log(`Finalizando com mensagem acumulada de ${messageAccumulator.length} caracteres`);
                finalizeWithMessage(messageAccumulator);
              } else {
                console.warn('Stream finalizado sem mensagem');
                cleanupResources('Fim sem mensagem');
                setIsWaiting(false);
              }
              return;
            }
            
            if (chunk && chunk.trim().length > 0) {
              messageAccumulator += chunk;
              setStreamingMessage(messageAccumulator);
            }
          } catch (err) {
            console.error('Erro ao processar chunk:', err);
          }
        };
        
        // Evento fim enviado explicitamente pelo servidor
        eventSource.addEventListener('end', (event: any) => {
          console.log('Evento end recebido do servidor', event);
          
          // Se o evento tiver dados específicos, processá-los
          // senão, o onmessage já deve ter tratado as marcações [FIM_*]
          if (isEventSourceActive && event.data && typeof event.data === 'string' && 
              !event.data.includes('[FIM_COM_RESPOSTA]') && 
              !event.data.includes('[FIM_SEM_RESPOSTA]')) {
            
            // Verificar se temos uma mensagem para finalizar
            if (messageAccumulator.trim().length > 0) {
              console.log(`Finalizando com mensagem acumulada de ${messageAccumulator.length} caracteres via evento end`);
              finalizeWithMessage(messageAccumulator);
            } else {
              console.warn('Stream finalizado sem mensagem via evento end');
              cleanupResources('Evento end sem mensagem');
              setIsWaiting(false);
            }
          }
        });

        // Evento error enviado explicitamente pelo servidor
        eventSource.addEventListener('error', (event: any) => {
          console.warn('Evento error recebido do servidor:', event);
          
          try {
            // Verificar se temos dados no evento
            if (event.data) {
              const mensagemErro = typeof event.data === 'string' 
                ? event.data 
                : 'Erro no servidor';
              
              setError(`Erro: ${mensagemErro}`);
            }
          } catch (err) {
            console.error('Erro ao processar evento de erro:', err);
          }
          
          // Verificamos se já não foi tratado
          if (isEventSourceActive) {
            // Verificar se temos alguma mensagem parcial
            if (messageAccumulator.trim().length > 0) {
              console.log(`Temos uma mensagem parcial de ${messageAccumulator.length} caracteres após evento de erro, vamos usá-la`);
              finalizeWithMessage(messageAccumulator);
            } else if (retryCount < MAX_RETRIES) {
              // Tentar novamente se possível
              cleanupResources('Erro - com retry');
              retryCount++;
              console.log(`Tentativa ${retryCount} de ${MAX_RETRIES} após evento de erro`);
              setError(`Erro de comunicação. Tentativa ${retryCount} de ${MAX_RETRIES}...`);
              setTimeout(startStream, 1000);
            } else {
              cleanupResources('Erro - sem retry');
              setIsWaiting(false);
            }
          }
        });

        // Handler para erros de conexão
        eventSource.onerror = (error) => {
          console.error('Erro no EventSource:', error);
          
          // Verificar se temos alguma mensagem parcial
          if (messageAccumulator.trim().length > 0) {
            console.log(`Temos uma mensagem parcial de ${messageAccumulator.length} caracteres, vamos usar mesmo com erro`);
            finalizeWithMessage(messageAccumulator);
            return;
          }
          
          // Tentar novamente se ainda não atingimos o limite
          if (retryCount < MAX_RETRIES) {
            cleanupResources('Erro no EventSource - com retry');
            retryCount++;
            console.log(`Tentativa ${retryCount} de ${MAX_RETRIES}`);
            setError(`Problema de conexão. Tentativa ${retryCount} de ${MAX_RETRIES}...`);
            
            // Adicionar um atraso entre tentativas, que aumenta em cada tentativa
            const delayMs = 1000 * retryCount; // 1s, 2s, 3s
            setTimeout(startStream, delayMs);
          } else {
            cleanupResources('Erro no EventSource - sem retry');
            console.error('Máximo de tentativas atingido após erros');
            setError('Erro de conexão. Verifique sua internet e tente novamente.');
            setIsWaiting(false);
          }
        };
      };
      
      // Iniciar o stream
      startStream();
      
    } catch (error) {
      console.error('Erro ao enviar mensagem ou iniciar stream:', error);
      setError('Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.');
      setIsWaiting(false);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleModelConfigChange = (param: keyof ModelConfig, value: number) => {
    setModelConfig(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  return (
    <Layout>
      <ChatContainer>
        {isLoading ? (
          <LoadingIndicator>Carregando conversa...</LoadingIndicator>
        ) : error ? (
          <ErrorMessage>
            <div>{error}</div>
            {isWaiting && <div>Tentando novamente...</div>}
          </ErrorMessage>
        ) : conversation ? (
          <>
            <MessagesContainer>
              {conversation.messages?.map(message => (
                <ChatMessage key={message.id} message={message} />
              ))}
              
              {/* Exibe a mensagem temporária APENAS se estiver esperando E houver conteúdo */}
              {isWaiting && streamingMessage && (
                <ChatMessage 
                  message={{
                    id: -1,
                    conversationId: Number(id),
                    content: streamingMessage,
                    isUser: false,
                    timestamp: new Date().toISOString(),
                  }} 
                />
              )}
              
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
          </>
        ) : (
          <EmptyState>
            Conversa não encontrada
          </EmptyState>
        )}
      </ChatContainer>
    </Layout>
  );
};

export default ChatPage; 