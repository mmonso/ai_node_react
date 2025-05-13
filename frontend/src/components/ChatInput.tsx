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

interface ChatInputProps {
  onSendMessage: (content: string, modelConfig: ModelConfig, file?: File) => void;
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

      onSendMessage(message, modelConfig, fileToSend || undefined);
      setMessage('');
      setSelectedFile(null);

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
              
              {/* Exemplo de outro botão que poderíamos adicionar futuramente */}
              <ActionButton
                type="button"
                title="Pensamento (+ ou Ctrl+Shift+M)"
                onClick={() => {}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              </ActionButton>
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