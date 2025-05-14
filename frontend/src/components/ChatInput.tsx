import React, { useState, useRef, FormEvent, useEffect } from 'react';
import styled from 'styled-components';
import { uploadFile } from '../services/api';
import { ModelConfig } from '../types';

const InputContainer = styled.div`
  position: relative;
  padding: 1rem;
  background-color: var(--background);
  border-top: 1px solid var(--border-color);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  background-color: var(--input-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:focus-within {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 1px var(--accent-color, transparent);
  }
`;

const TextArea = styled.textarea<{ height: number }>`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 1rem;
  background-color: transparent;
  color: var(--text-color);
  font-family: inherit;
  font-size: 1rem;
  resize: none;
  border: none;
  height: ${props => props.height}px;
  min-height: 44px;
  max-height: 150px;
  padding-bottom: 45px; /* Mais espaço para os botões */

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: var(--secondary-text);
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 8px;
  justify-content: space-between;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: transparent;
  border-top: 1px solid rgba(0, 0, 0, 0.05); /* Separador sutil */
`;

const LeftButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BasicButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 6px;
  background-color: transparent;
  color: #6c7787; /* Cor mais neutra */
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover, &:focus {
    color: #505a68; /* Tom mais escuro */
    background-color: transparent;
    outline: none;
  }
  
  &:active {
    transform: scale(0.95);
    background-color: transparent;
  }

  svg {
    width: 18px;
    height: 18px;
    opacity: 0.8; /* Ligeiramente mais opaco para melhor visibilidade */
  }
`;

const ActionButton = styled(BasicButton)``;

const FileButton = styled(BasicButton)`
  /* Sem estilos adicionais, mantendo clean */
`;

const SendButton = styled(BasicButton)`
  color: #6c7787; /* Cor mais neutra em vez de usar a accent-color */
  opacity: 1; /* Aumentando a opacidade para melhor visibilidade */
  
  &:hover {
    opacity: 1;
    color: #505a68; /* Tom mais escuro na mesma paleta, não chama tanto a atenção */
    transform: none;
    background-color: transparent;
  }
  
  &:active {
    transform: scale(0.97);
    background-color: transparent;
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const FilePreview = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: var(--hover-color);
  border-radius: 4px;
  margin-bottom: 0.5rem;
`;

const FileName = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RemoveFileButton = styled.button`
  background: none;
  border: none;
  color: var(--error-color);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--error-color-dark);
  }
`;

// Novo componente para o toggle de pesquisa na web
const WebSearchToggle = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 6px;
  background-color: ${props => props.active ? 'var(--accent-color-light)' : 'transparent'};
  color: ${props => props.active ? 'var(--accent-color)' : '#6c7787'};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover, &:focus {
    background-color: ${props => props.active ? 'var(--accent-color-light)' : 'rgba(0, 0, 0, 0.05)'};
    color: ${props => props.active ? 'var(--accent-color)' : '#505a68'};
    outline: none;
  }
  
  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const GroundingButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${props => props.$active ? 'var(--accent-color-light)' : 'transparent'};
  border: 1px solid ${props => props.$active ? 'var(--accent-color)' : 'var(--border-color)'};
  color: ${props => props.$active ? 'var(--accent-color)' : 'var(--secondary-text)'};
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  position: relative;
  
  &:hover {
    background-color: var(--accent-color-light);
    border-color: var(--accent-color);
    color: var(--accent-color);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--accent-color-light);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
  
  &::after {
    content: ${props => props.$active ? '"Grounding ativado"' : '"Grounding desativado"'};
    position: absolute;
    bottom: 45px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--tooltip-bg, rgba(0,0,0,0.8));
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s;
  }
  
  &:hover::after {
    opacity: 1;
    visibility: visible;
  }
`;

// Adicionar um novo componente GroundingLabel
const GroundingLabel = styled.div<{ $active: boolean }>`
  position: absolute;
  top: -12px;
  right: 15px;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: ${props => props.$active ? 'var(--accent-color-light)' : 'transparent'};
  color: ${props => props.$active ? 'var(--accent-color)' : 'var(--secondary-text)'};
  opacity: ${props => props.$active ? 1 : 0};
  transition: opacity 0.2s, background-color 0.2s;
`;

interface ChatInputProps {
  onSendMessage: (content: string, modelConfig: ModelConfig, file?: File, useWebSearch?: boolean) => void;
  isWaiting: boolean;
  modelConfig: ModelConfig;
  onModelConfigChange: (param: keyof ModelConfig, value: number) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isWaiting,
  modelConfig,
  onModelConfigChange,
}) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight();
    }
  }, [message]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (message.trim() || selectedFile) {
      // Verificar se o conteúdo da mensagem contém palavras-chave relacionadas a 
      // informações temporais ou atuais para ativar automaticamente o grounding
      const messageLower = message.toLowerCase();
      const timeKeywords = ['hoje', 'ontem', 'agora', 'atual', 'recente', 'última', 'último'];
      const topicKeywords = ['loteria', 'resultado', 'números', 'jogo', 'mega', 'quina', 'notícia', 'clima', 'previsão'];
      const queryKeywords = ['qual', 'quem', 'quando', 'onde', 'quanto', 'como está'];
      
      const hasTimeKeyword = timeKeywords.some(keyword => messageLower.includes(keyword));
      const hasTopicKeyword = topicKeywords.some(keyword => messageLower.includes(keyword));
      const hasQueryKeyword = queryKeywords.some(keyword => messageLower.includes(keyword));
      
      // Se a mensagem contiver ao menos uma palavra de tempo/atualidade E uma palavra de tópico
      // OU se contiver uma palavra de consulta e uma palavra de tópico
      // ativar automaticamente a busca na web
      const shouldActivateWebSearch = (hasTimeKeyword && hasTopicKeyword) || 
                                     (hasQueryKeyword && hasTopicKeyword);
      
      // Ativar automaticamente a busca na web se detectar que a pergunta precisa disso
      if (shouldActivateWebSearch && !useWebSearch) {
        console.log('Ativando busca na web automaticamente para consulta de informação atual');
        setUseWebSearch(true);
      }

      // Se o arquivo for maior que 20MB, use a API de arquivos
      let fileToSend = selectedFile;

      if (selectedFile && selectedFile.size > 20 * 1024 * 1024) {
        try {
          setIsUploading(true);
          // Aqui apenas configuramos a lógica, backend implementará o upload via API File
          await uploadFile(selectedFile);
          // Não enviamos o arquivo diretamente, apenas a referência
          fileToSend = null;
        } catch (error) {
          console.error('Erro ao fazer upload do arquivo:', error);
          alert('Erro ao fazer upload do arquivo. Tente novamente.');
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      onSendMessage(message, modelConfig, fileToSend || undefined, useWebSearch);
      setMessage('');
      setSelectedFile(null);
      // Não reseta o useWebSearch para manter a preferência do usuário

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      // Verificar tamanho do arquivo
      if (file.size > 100 * 1024 * 1024) { // Limite máximo (exemplo: 100MB)
        alert('Arquivo muito grande. O tamanho máximo permitido é 100MB.');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() || selectedFile) {
        handleSubmit(e);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfigChange = (param: keyof ModelConfig, value: number) => {
    onModelConfigChange(param, value);
  };

  const toggleWebSearch = () => {
    setUseWebSearch(!useWebSearch);
  };

  return (
    <InputContainer>
      {selectedFile && (
        <FilePreview>
          <FileName>{selectedFile.name}</FileName>
          <RemoveFileButton onClick={handleRemoveFile}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </RemoveFileButton>
        </FilePreview>
      )}

      <Form onSubmit={handleSubmit}>
        <GroundingLabel $active={useWebSearch}>
          Pesquisa Web ativa
        </GroundingLabel>
        
        <InputWrapper>
          <TextArea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Como posso ajudá-lo hoje?"
            disabled={isWaiting || isUploading}
            ref={textareaRef}
            height={Math.min(textareaRef.current?.scrollHeight || 44, 150)}
          />
          
          <ButtonsContainer>
            <LeftButtons>
              <FileButton
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Anexar arquivo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
                <FileInput
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.txt,audio/wav,audio/mp3,audio/aac,audio/ogg,audio/flac"
                  ref={fileInputRef}
                />
              </FileButton>
              
              {/* Botão de pesquisa web */}
              <GroundingButton 
                type="button" 
                onClick={toggleWebSearch}
                $active={useWebSearch}
                title={useWebSearch ? "Desativar busca na web" : "Ativar busca na web"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                  <circle cx="24" cy="23" fill="#FFF" r="22"/>
                  <path d="M33.76 34.26c2.75-2.56 4.49-6.37 4.49-11.26 0-.89-.08-1.84-.29-3H24.01v5.99h8.03c-.4 2.02-1.5 3.56-3.07 4.56v.75l3.91 2.97h.88z" fill="#4285F4"/>
                  <path d="M15.58 25.77A8.845 8.845 0 0 0 24 31.86c1.92 0 3.62-.46 4.97-1.31l4.79 3.71C31.14 36.7 27.65 38 24 38c-5.93 0-11.01-3.4-13.45-8.36l.17-1.01 4.06-2.85h.8z" fill="#34A853"/>
                  <path d="M15.59 20.21a8.864 8.864 0 0 0 0 5.58l-5.03 3.86c-.98-2-1.53-4.25-1.53-6.64 0-2.39.55-4.64 1.53-6.64l1-.22 3.81 2.98.22 1.08z" fill="#FBBC05"/>
                  <path d="M24 14.14c2.11 0 4.02.75 5.52 1.98l4.36-4.36C31.22 9.43 27.81 8 24 8c-5.93 0-11.01 3.4-13.45 8.36l5.03 3.85A8.86 8.86 0 0 1 24 14.14z" fill="#EA4335"/>
                </svg>
              </GroundingButton>
            </LeftButtons>
            
            <SendButton
              type="submit"
              title="Enviar mensagem"
              disabled={isWaiting || isUploading || (!message.trim() && !selectedFile)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </SendButton>
          </ButtonsContainer>
        </InputWrapper>
      </Form>
    </InputContainer>
  );
};

export default ChatInput;