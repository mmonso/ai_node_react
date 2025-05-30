import React, { useState, useRef, FormEvent, useEffect } from 'react';
import styled, { css } from 'styled-components'; // Adicionado css aqui
import StyledButtonBase, { StyledButtonBaseProps } from './common/StyledButtonBase'; // Corrigido caminho e importado Props
import { uploadFile } from '../services/api';
import { ModelConfig } from '../types';

// --- Constantes de Dimensionamento do TextArea ---
const LINE_HEIGHT_MULTIPLIER = 1.5;
const FONT_SIZE_REM = 1; // font-size base do textarea

// Paddings do TextArea (em unidades rem para consistência no CSS)
const PADDING_TOP_REM = 1.25; // Restaurado para 1.25rem
const PADDING_RIGHT_REM = 1.25;
const PADDING_LEFT_REM = 1.7;
// const PADDING_BOTTOM_FOR_BUTTONS_REM = 2.8125; // Removido

// Altura da área dos botões (8px padding + 36px botão + 8px padding = 52px = 3.25rem)
const BUTTONS_AREA_HEIGHT_REM = 3.25;
// Padding interno na parte de baixo do TextArea, para o texto não colar na "borda" da área de scroll
const TEXTAREA_INTERNAL_PADDING_BOTTOM_REM = 0.75; // Restaurado para 0.75rem

// Número de linhas de texto visíveis
const MIN_VISIBLE_TEXT_LINES = 1;
const MAX_VISIBLE_TEXT_LINES = 15;

// Altura do conteúdo de texto (em rem)
const singleLineTextHeightRem = FONT_SIZE_REM * LINE_HEIGHT_MULTIPLIER;
const minContentTextHeightRem = MIN_VISIBLE_TEXT_LINES * singleLineTextHeightRem;
const maxContentTextHeightRem = MAX_VISIBLE_TEXT_LINES * singleLineTextHeightRem;

// Altura total do CSS para o TextArea (conteúdo + paddings verticais)
const MIN_TEXTAREA_CSS_HEIGHT_STR = `calc(${minContentTextHeightRem}rem + ${PADDING_TOP_REM}rem + ${TEXTAREA_INTERNAL_PADDING_BOTTOM_REM}rem)`;
const MAX_TEXTAREA_CSS_HEIGHT_STR = `calc(${maxContentTextHeightRem}rem + ${PADDING_TOP_REM}rem + ${TEXTAREA_INTERNAL_PADDING_BOTTOM_REM}rem)`;

// Para lógica JS, precisamos de valores em PX. Assumindo 1rem = 16px.
const PX_PER_REM = 16;
const MIN_TEXTAREA_CALCULATED_PX = (minContentTextHeightRem + PADDING_TOP_REM + TEXTAREA_INTERNAL_PADDING_BOTTOM_REM) * PX_PER_REM;
const MAX_TEXTAREA_CALCULATED_PX = (maxContentTextHeightRem + PADDING_TOP_REM + TEXTAREA_INTERNAL_PADDING_BOTTOM_REM) * PX_PER_REM;
// --- Fim das Constantes de Dimensionamento ---

const InputContainer = styled.div`
  position: relative;
  padding: 1rem; /* Restaurado para 1rem */
  background-color: var(--background);
  border-top: 1px solid var(--border-color);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  /* flex: 1; // Removido para não expandir verticalmente */
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  /* flex: 1; // Removido para não expandir verticalmente */
  background-color: var(--input-background);
  border: 1px solid var(--border-color);
  border-radius: 32px;
  overflow: hidden; /* Restaurado para clipping correto com border-radius */
  transition: border-color 0.2s;
  box-shadow: var(--input-shadow);
  /* padding-bottom foi removido, o ButtonsContainer estará no fluxo normal */
  box-sizing: border-box;
 
  &:focus-within {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 1px var(--accent-color, transparent);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${PADDING_TOP_REM}rem ${PADDING_RIGHT_REM}rem 0 ${PADDING_LEFT_REM}rem;
  background-color: transparent;
  color: var(--text-color);
  font-family: inherit;
  font-size: ${FONT_SIZE_REM}rem;
  line-height: ${LINE_HEIGHT_MULTIPLIER};
  resize: none;
  border: none;
  min-height: ${MIN_TEXTAREA_CSS_HEIGHT_STR};
  max-height: ${MAX_TEXTAREA_CSS_HEIGHT_STR};
  padding-bottom: ${TEXTAREA_INTERNAL_PADDING_BOTTOM_REM}rem; /* Padding interno do textarea */
  overflow-y: auto;
  box-sizing: border-box;
  /* flex-grow: 1; // Removido para que o TextArea não se expanda verticalmente quando vazio */

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
  /* position: absolute; bottom: 0; left: 0; // Removido */
  width: 100%;
  background-color: transparent; /* Mantido, mas pode ser var(--input-background) se o TextArea for transparente */
  border-top: 1px solid rgba(0, 0, 0, 0.05); /* Separador sutil */
  flex-shrink: 0; /* Para não ser comprimido pelo TextArea */
`;

const LeftButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BasicButton = styled(StyledButtonBase).attrs((props: StyledButtonBaseProps) => ({
  $variant: 'icon',
  $size: 'small'
}))`
  width: 36px;
  height: 36px;
  padding: 0;
  color: #6c7787;

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    color: #505a68;
    background-color: var(--icon-button-hover-bg, var(--hover-color, rgba(0, 0, 0, 0.04)));
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  svg {
    width: 15px !important;
    height: 15px !important;
    opacity: 0.8;
  }
`;

const ActionButton = styled(BasicButton)``;

const FileButton = styled(BasicButton)`
  color: var(--primary-text);
  opacity: 0.8;
  transition: opacity 0.2s ease;

  &:hover:not(:disabled) {
    color: var(--primary-text);
    background-color: transparent;
    opacity: 1;
  }

  &:active:not(:disabled) {
    background-color: transparent;
    color: var(--primary-text);
    opacity: 1;
  }
`;

const SendButton = styled(BasicButton)`
  color: var(--primary-text);
  opacity: 0.8;
  transition: opacity 0.2s ease;

  &:hover:not(:disabled) {
    color: var(--primary-text);
    background-color: transparent;
    opacity: 1;
  }

  &:active:not(:disabled) {
    background-color: transparent;
    color: var(--primary-text);
    opacity: 1;
  }
  
  &:disabled {
    color: var(--primary-text);
    opacity: 0.3;
    cursor: not-allowed;
    background-color: transparent;
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

const GroundingButton = styled(BasicButton)<{ $active: boolean }>`
  opacity: 0.8;
  transition: opacity 0.2s ease, background-color 0.2s ease, color 0.2s ease;
  color: var(--primary-text); // Cor padrão
  background-color: transparent; // Fundo padrão

  &:hover:not(:disabled) {
    opacity: 1;
    background-color: transparent; // Efeito de hover padrão
    color: var(--primary-text); // Manter cor padrão no hover
  }

  // Estilos quando o botão está ativo
  ${props => props.$active && css`
    background-color: var(--accent-color-light);
    color: var(--accent-color);
    /* A opacidade base de 0.8 é herdada. Se quiser que o ativo seja sempre 1, defina aqui. */

    &:hover:not(:disabled) {
      opacity: 1; // Opacidade total no hover do ativo
      background-color: var(--accent-color-light); // Manter fundo ativo
      color: var(--accent-color); // Manter cor ativa
    }
  `}

  svg {
    width: 15px !important;
    height: 15px !important;
    display: block;
    margin: auto;
  }
  
  // Tooltip
  &::after {
    content: ${props => props.$active ? '"Grounding ativado"' : '"Grounding desativado"'};
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--tooltip-bg, rgba(0,0,0,0.85));
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease-in-out;
    pointer-events: none;
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

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Permite encolher para recalcular scrollHeight
      let newHeight = textarea.scrollHeight;

      // Aplica os limites mínimo e máximo calculados
      newHeight = Math.max(MIN_TEXTAREA_CALCULATED_PX, Math.min(newHeight, MAX_TEXTAREA_CALCULATED_PX));
      
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    // Define a altura inicial ao montar.
    const textarea = textareaRef.current;
    if (textarea) {
        textarea.style.height = `${MIN_TEXTAREA_CALCULATED_PX}px`;
    }
  }, []); // Apenas na montagem

  useEffect(() => {
    // Ajusta a altura sempre que a mensagem mudar.
    adjustTextareaHeight();
  }, [message]);

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
            // A altura é agora totalmente controlada pelo JS e CSS min/max-height
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
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
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