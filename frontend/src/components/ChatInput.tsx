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
  gap: 0.5rem;
`;

const TextArea = styled.textarea<{ height: number }>`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-background);
  color: var(--text-color);
  font-family: inherit;
  font-size: 1rem;
  resize: none;
  height: ${props => props.height}px;
  min-height: 44px;
  max-height: 200px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  &::placeholder {
    color: var(--secondary-text);
  }
`;

const SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--primary-color-dark);
  }

  &:disabled {
    background-color: var(--disabled-color);
    cursor: not-allowed;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const FileButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background-color: var(--background);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: var(--hover-color);
  }
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
  const [showConfig, setShowConfig] = useState(false);
  
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
      handleSubmit(e);
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
          <RemoveFileButton onClick={handleRemoveFile} title="Remover arquivo">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </RemoveFileButton>
        </FilePreview>
      )}
      
      <Form onSubmit={handleSubmit}>
        <FileButton as="label" title="Anexar arquivo">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
          <FileInput
            type="file"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt,audio/wav,audio/mp3,audio/aac,audio/ogg,audio/flac"
          />
        </FileButton>

        <ConfigButton 
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          title="Configurações do modelo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </ConfigButton>
        
        <TextArea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          disabled={isWaiting || isUploading}
          ref={textareaRef}
          height={Math.min(textareaRef.current?.scrollHeight || 44, 200)}
        />
        
        <SendButton 
          type="submit" 
          disabled={!message.trim() && !selectedFile || isWaiting || isUploading}
          title="Enviar mensagem"
        >
          {isUploading ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
              <line x1="12" y1="2" x2="12" y2="6"></line>
              <line x1="12" y1="18" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
              <line x1="2" y1="12" x2="6" y2="12"></line>
              <line x1="18" y1="12" x2="22" y2="12"></line>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </SendButton>
      </Form>

      {showConfig && (
        <ConfigPanel>
          <h3>Configurações do Modelo</h3>
          <div>
            <label>
              Temperatura:
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={modelConfig.temperature}
                onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
              />
              <span>{modelConfig.temperature}</span>
            </label>
          </div>
          <div>
            <label>
              Top P:
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={modelConfig.topP}
                onChange={(e) => handleConfigChange('topP', parseFloat(e.target.value))}
              />
              <span>{modelConfig.topP}</span>
            </label>
          </div>
        </ConfigPanel>
      )}
    </InputContainer>
  );
};

const ConfigPanel = styled.div`
  background-color: var(--primary-bg);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
`;

const ConfigGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ConfigLabel = styled.label`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--primary-text);
`;

const ConfigValue = styled.span`
  font-size: 0.85rem;
  color: var(--accent-color);
  font-weight: 500;
`;

const ConfigSlider = styled.input`
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: var(--secondary-bg);
  border-radius: 3px;
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent-color);
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--accent-hover);
      transform: scale(1.2);
    }
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent-color);
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    
    &:hover {
      background: var(--accent-hover);
      transform: scale(1.2);
    }
  }
`;

const SliderLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--secondary-text);
`;

const LoadingSpinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(138, 133, 255, 0.2);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ConfigButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 0.5rem;
  background: transparent;
  color: var(--secondary-text);
  transition: color 0.2s ease;
  
  &:hover {
    background: transparent;
    color: var(--accent-color);
  }
`;

export default ChatInput; 