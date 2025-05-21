import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import ReactMarkdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useTheme } from '../context/ThemeContext';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { updateMessageContent } from '../services/api';

// URL base do backend para acessar arquivos
const BASE_URL = 'http://localhost:3001';

interface GroundingMetadata {
  sources?: Array<{
    title: string;
    uri: string;
  }>;
  searchSuggestions?: string[];
  citations?: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
    sources: number[];
    confidence: number;
  }>;
  searchEntryPoint?: {
    renderedContent: string;
  };
}

interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
  onUpdateMessage?: (updatedMessage: Message) => void;
}

// Adicione este componente para exibir as sugestões de pesquisa Google
const SearchSuggestions = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: var(--input-background, #f5f5f5);
  font-size: 0.9rem;
  color: var(--secondary-text, #666);
`;

const SearchChip = styled.a`
  display: inline-block;
  margin: 4px;
  padding: 6px 12px;
  border-radius: 16px;
  background-color: var(--background);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  text-decoration: none;
  font-size: 0.85rem;
  transition: all 0.2s;
  
  &:hover {
    background-color: var(--hover-color);
    text-decoration: none;
  }
`;

const SearchIcon = styled.span`
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
`;

// Adicione os styled components antes do GroundingSources
const GroundingContainer = styled.div`
  margin-top: 10px;
  border-top: 1px solid var(--border-color);
  padding-top: 10px;
`;

const GroundingSection = styled.div`
  margin-bottom: 10px;
`;

const GroundingTitle = styled.h6`
  font-size: 0.9rem;
  margin-bottom: 5px;
  color: var(--secondary-text);
`;

const SourcesList = styled.ul`
  list-style: none;
  padding: 0;
`;

const SourceItem = styled.li`
  margin-bottom: 5px;
`;

const SourceLink = styled.a`
  color: var(--accent-color);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

// Componente para exibir os metadados de grounding com Google Search
const GroundingSources: React.FC<{ groundingMetadata: GroundingMetadata }> = ({ groundingMetadata }) => {
  if (!groundingMetadata || (!groundingMetadata.sources && !groundingMetadata.searchSuggestions)) {
    return null;
  }

  // Renderiza o HTML fornecido pelo searchEntryPoint se disponível
  const renderSearchEntryPoint = () => {
    if (groundingMetadata.searchEntryPoint?.renderedContent) {
      // É OBRIGATÓRIO usar o HTML e CSS fornecidos pelo Google sem modificações
      return (
        <div 
          dangerouslySetInnerHTML={{ 
            __html: groundingMetadata.searchEntryPoint.renderedContent 
          }} 
          style={{ 
            marginTop: '8px', 
            width: '100%',  // Garante largura total, conforme obrigatório nas diretrizes
            minWidth: '100%'
          }}
        />
      );
    }
    
    // Fallback para renderizar as sugestões manualmente se não tiver o HTML pronto
    // Isso deve seguir EXATAMENTE as diretrizes de aparência do Google
    if (groundingMetadata.searchSuggestions && groundingMetadata.searchSuggestions.length > 0) {
      return (
        <SearchSuggestions>
          <SearchIcon>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
              <circle cx="24" cy="23" fill="#FFF" r="22"/>
              <path d="M33.76 34.26c2.75-2.56 4.49-6.37 4.49-11.26 0-.89-.08-1.84-.29-3H24.01v5.99h8.03c-.4 2.02-1.5 3.56-3.07 4.56v.75l3.91 2.97h.88z" fill="#4285F4"/>
              <path d="M15.58 25.77A8.845 8.845 0 0 0 24 31.86c1.92 0 3.62-.46 4.97-1.31l4.79 3.71C31.14 36.7 27.65 38 24 38c-5.93 0-11.01-3.4-13.45-8.36l.17-1.01 4.06-2.85h.8z" fill="#34A853"/>
              <path d="M15.59 20.21a8.864 8.864 0 0 0 0 5.58l-5.03 3.86c-.98-2-1.53-4.25-1.53-6.64 0-2.39.55-4.64 1.53-6.64l1-.22 3.81 2.98.22 1.08z" fill="#FBBC05"/>
              <path d="M24 14.14c2.11 0 4.02.75 5.52 1.98l4.36-4.36C31.22 9.43 27.81 8 24 8c-5.93 0-11.01 3.4-13.45 8.36l5.03 3.85A8.86 8.86 0 0 1 24 14.14z" fill="#EA4335"/>
            </svg>
          </SearchIcon>
          {groundingMetadata.searchSuggestions.map((suggestion, index) => (
            <SearchChip 
              key={index} 
              href={`https://www.google.com/search?q=${encodeURIComponent(suggestion)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {suggestion}
            </SearchChip>
          ))}
        </SearchSuggestions>
      );
    }
    
    return null;
  };

  return (
    <GroundingContainer>
      {/* Primeiro renderize as sugestões de pesquisa (obrigatório por contrato) */}
      {renderSearchEntryPoint()}
      
      {/* Depois exibe as fontes, se houver */}
      {groundingMetadata.sources && groundingMetadata.sources.length > 0 && (
        <GroundingSection>
          <GroundingTitle>Fontes:</GroundingTitle>
          <SourcesList>
            {groundingMetadata.sources.map((source, index) => (
              <SourceItem key={index}>
                <SourceLink href={source.uri} target="_blank" rel="noopener noreferrer">
                  {source.title || source.uri}
                </SourceLink>
              </SourceItem>
            ))}
          </SourcesList>
        </GroundingSection>
      )}
    </GroundingContainer>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isTyping = false, onUpdateMessage }) => {
  const { theme } = useTheme();
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(message.imageUrl || '');
  const [groundingMetadata, setGroundingMetadata] = useState<GroundingMetadata | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const editTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const [processedContent, setProcessedContent] = useState(message.content);

  useEffect(() => {
    // Atualiza o processedContent sempre que message.content mudar
    // (a lógica de limpeza de timestamp e parsing de JSON já está aqui)
    if (message.content) {
      let content = message.content;
      
      const timestampRegexes = [
        /^\s*\[\d{1,2}:\d{2}(:\d{2})?\]\s*/,
        /^\s*\d{1,2}:\d{2}(:\d{2})?\s*/,
        /^\s*\(\d{1,2}:\d{2}(:\d{2})?\)\s*/,
        /^\s*\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2}(:\d{2})?\s*/
      ];
      
      for (const regex of timestampRegexes) {
        if (regex.test(content)) {
          content = content.replace(regex, '');
          break;
        }
      }
      
      const assistantPrefixRegex = /^\s*(Assistente(\s*\[\d{1,2}:\d{2}(:\d{2})?\])?\s*:)\s*/;
      if (assistantPrefixRegex.test(content)) {
        content = content.replace(assistantPrefixRegex, '');
      }
      
      try {
        if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
          const parsedData = JSON.parse(content);
          if (parsedData.text && parsedData.groundingMetadata) {
            setGroundingMetadata(parsedData.groundingMetadata);
            content = parsedData.text;
          }
        }
      } catch (e) {
        console.log('Não é um JSON de grounding:', e);
      }
      
      setProcessedContent(content);

      // Se não estiver editando, também atualiza o editText para refletir a nova message.content
      // Usamos message.content bruto para editText, não o processedContent.
      if (!isEditing) {
        setEditText(message.content);
      }
    }
  }, [message.content, isEditing]); // Adicionado isEditing como dependência

  // Efeito para auto-ajuste de altura do textarea
  useEffect(() => {
    if (isEditing && editTextAreaRef.current) {
      editTextAreaRef.current.style.height = 'auto'; // Reseta para calcular scrollHeight corretamente
      editTextAreaRef.current.style.height = `${editTextAreaRef.current.scrollHeight}px`;
    }
  }, [isEditing, editText]); // Re-executa quando isEditing ou editText muda para ajustar a altura

  // Format timestamp
  const formattedTimestamp = useMemo(() => {
    if (!message.timestamp) return '';
    const date = new Date(message.timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [message.timestamp]);

  // O useEffect acima (linhas 160-200 aprox.) já lida com processedContent e editText
  // com base em message.content e editText.

  // Log when image URL is present
  useEffect(() => {
    if (message.imageUrl) {
      console.log('Mensagem com imagem detectada:', message.imageUrl, 'para mensagem ID:', message.id);
      
      // Reset image error state when message.imageUrl changes
      setImageError(false);
      setImageUrl(message.imageUrl);
      
      // Tentativa de pré-carregamento da imagem
      const img = new Image();
      img.onload = () => {
        console.log('Imagem pré-carregada com sucesso:', message.imageUrl);
      };
      img.onerror = () => {
        console.error('Erro ao pré-carregar imagem:', message.imageUrl);
        // Tentar com URL absoluta caso seja um caminho relativo
        if (message.imageUrl && message.imageUrl.startsWith('/uploads/')) {
          const absoluteUrl = `${BASE_URL}${message.imageUrl}`;
          console.log('Tentando pré-carregar com URL absoluta:', absoluteUrl);
          
          const retryImg = new Image();
          retryImg.onload = () => {
            console.log('Imagem pré-carregada com sucesso com URL absoluta:', absoluteUrl);
            setImageUrl(absoluteUrl);
          };
          retryImg.onerror = () => {
            console.error('Falha definitiva ao carregar imagem, mesmo com URL absoluta');
            setImageError(true);
          };
          retryImg.src = absoluteUrl;
        } else {
          setImageError(true);
        }
      };
      img.src = message.imageUrl;
    }
  }, [message.imageUrl, message.id]);

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error('Falha ao copiar código: ', err);
    }
  };

  const handleImageError = () => {
    console.error('Erro ao carregar imagem no elemento:', message.imageUrl);
    
    // Tentar com URL absoluta
    if (message.imageUrl && message.imageUrl.startsWith('/uploads/')) {
      const absoluteUrl = `${BASE_URL}${message.imageUrl}`;
      console.log('Tentando carregar diretamente com URL absoluta:', absoluteUrl);
      setImageUrl(absoluteUrl);
      
      // Se mesmo assim não funcionar, o evento onError será disparado novamente
      return;
    }
    
    setImageError(true);
  };

  const handleEditClick = () => {
    setEditText(message.content); // Garante que o texto de edição comece com o conteúdo atual
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditText(message.content); // Reseta para o conteúdo original
  };

  const handleSaveClick = async () => {
    if (!onUpdateMessage || typeof message.id === 'undefined') {
      console.error("Save failed: onUpdateMessage callback or message.id is missing.");
      return;
    }

    const newContent = editText.trim();
    // Compara com o conteúdo original da mensagem, não com o processedContent
    if (newContent === message.content.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      const updatedMessageFromApi = await updateMessageContent(String(message.id), newContent);
      onUpdateMessage(updatedMessageFromApi);
      setIsEditing(false);
      // setProcessedContent(updatedMessageFromApi.content); // O useEffect já fará isso
      // setEditText(updatedMessageFromApi.content); // O useEffect já fará isso
    } catch (error) {
      console.error('Failed to update message:', error);
      alert('Falha ao editar mensagem.');
    }
  };

  const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(event.target.value);
    // Auto-ajuste de altura já é tratado pelo useEffect [isEditing, editText]
    // Mas podemos forçar um ajuste aqui também si quisermos resposta imediata ao digitar,
    // embora o useEffect já deva cobrir isso ao mudar editText.
    // Para garantir o ajuste imediato ao digitar:
    if (editTextAreaRef.current) {
      editTextAreaRef.current.style.height = 'auto';
      editTextAreaRef.current.style.height = `${editTextAreaRef.current.scrollHeight}px`;
    }
  };

  // Se é indicador de "digitando", mostrar apenas os três pontos
  if (isTyping) {
    return (
      <MessageContainer $isUser={false}>
        <MessageContent $isUser={false}>
          <MessageText $isUser={false}>
            <TypingIndicator>
              <Dot $delay={0} />
              <Dot $delay={0.3} />
              <Dot $delay={0.6} />
            </TypingIndicator>
          </MessageText>
        </MessageContent>
      </MessageContainer>
    );
  }

  return (
    <MessageContainer $isUser={message.isUser}>
      {isEditing ? (
        <EditViewContainer>
          <EditTextArea
            ref={editTextAreaRef}
            value={editText}
            onChange={handleTextAreaChange}
            rows={1}
          />
          <EditControls>
            <SaveButton onClick={handleSaveClick} title="Salvar">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
            </SaveButton>
            <CancelButton onClick={handleCancelClick} title="Cancelar">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </CancelButton>
          </EditControls>
        </EditViewContainer>
      ) : (
        <MessageContent $isUser={message.isUser} style={{ position: 'relative' }}>
          <MessageText $isUser={message.isUser}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: (props) => <p style={{ whiteSpace: 'pre-line' }}>{props.children}</p>,
                code(props) {
                  const { children, className, node, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  const codeContent = String(children).replace(/\n$/, '');
                  const codeBlockId = `code-${node?.position?.start.line}-${node?.position?.start.column}`;

                  return match ?
                    <CodeBlockWrapper>
                      <SyntaxHighlighterContainer>
                        <SyntaxHighlighter
                          PreTag="div"
                          language={match[1]}
                          style={theme === 'light' ? docco : atomOneDark}
                        >
                          {codeContent}
                        </SyntaxHighlighter>
                      </SyntaxHighlighterContainer>
                      <CopyButton onClick={() => handleCopy(codeContent, codeBlockId)} title="Copiar código">
                        {copiedStates[codeBlockId] ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        )}
                      </CopyButton>
                    </CodeBlockWrapper>
                  : (
                    <code className={className}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {processedContent}
            </ReactMarkdown>

            {message.imageUrl && !imageError && imageUrl && (
              <ImagePreview 
                ref={imageRef}
                src={imageUrl}
                alt="Imagem enviada" 
                onError={handleImageError}
              />
            )}

            {message.imageUrl && imageError && (
              <ImageErrorContainer>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <span>Não foi possível carregar a imagem</span>
              </ImageErrorContainer>
            )}

            {message.fileUrl && typeof message.fileUrl === 'string' && (
              <FileCard href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                <FileIcon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                </FileIcon>
                <FileInfo>
                  <FileName>{message.fileUrl.split('/').pop()}</FileName>
                  <FileType>Arquivo Anexado</FileType>
                </FileInfo>
              </FileCard>
            )}

            {groundingMetadata && !message.isUser && (
              <GroundingSources groundingMetadata={groundingMetadata} />
            )}

            {onUpdateMessage && !isEditing && (
              <EditButton className="edit-button" onClick={handleEditClick} title="Editar mensagem">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </EditButton>
            )}
          </MessageText>
        </MessageContent>
      )}
    </MessageContainer>
  );
};

const EditButton = styled.button`
  position: absolute;
  bottom: -1.8rem;
  left: 0.5rem;
  padding: 4px;
  border: none;
  background-color: transparent;
  color: var(--secondary-text);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s, color 0.3s;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  outline: none;

  &:hover {
    opacity: 1 !important;
    color: var(--primary-text);
    background-color: transparent;
  }

  &:focus {
    outline: none;
    border: none;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const EditViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0 1rem;
  box-sizing: border-box;
`;

const EditTextArea = styled.textarea`
  box-sizing: border-box;
  width: 100%;
  min-height: 80px;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  margin-bottom: 10px;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  resize: none;
  background-color: var(--input-background);
  color: var(--primary-text);
  overflow-y: hidden;

  &:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px var(--accent-color-faded);
  }
`;

const EditControls = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
`;

const EditButtonBase = styled.button`
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--secondary-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: opacity 0.3s, color 0.3s;
  opacity: 0.5;
  outline: none;

  &:hover {
    opacity: 1;
    color: var(--primary-text);
    background-color: transparent;
  }

  &:focus {
    outline: none;
    border: none;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const SaveButton = styled(EditButtonBase)``;
const CancelButton = styled(EditButtonBase)``;

const MessageContainer = styled.div<{ $isUser: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 1rem;
  padding: 0 1rem;
  width: 100%;
`;

const MessageContent = styled.div<{ $isUser: boolean }>`
  position: relative;
  background-color: ${props => props.$isUser ? 'var(--message-user-bg)' : 'transparent'};
  color: var(--primary-text);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  max-width: ${props => props.$isUser ? '80%' : '100%'};
  word-break: break-word;
  margin-bottom: 2rem;
  margin-left: ${props => props.$isUser ? '2rem' : '0'};
  transition: all 0.3s ease;

  &:hover {
    .edit-button {
      opacity: 0.5;
    }
  }
`;

const MessageText = styled.div<{ $isUser: boolean }>`
  cursor: pointer;
  white-space: pre-wrap;
`;

const MessageTimestamp = styled.span`
  font-size: 0.7rem;
  color: var(--secondary-text);
  margin-bottom: 0.25rem;
  display: block;
  text-align: right;
`;

const TypingIndicator = styled.div`
  display: flex;
`;

const Dot = styled.span<{ $delay: number }>`
  width: 6px;
  height: 6px;
  background-color: var(--secondary-text);
  border-radius: 50%;
  margin-right: 4px;
  animation: ${keyframes`
    0% { opacity: 0.2; }
    50% { opacity: 1; }
    100% { opacity: 0.2; }
  `} 1.4s infinite ease-in-out;
  animation-delay: ${props => props.$delay}s;
`;

const CodeBlockWrapper = styled.div`
  position: relative;
  margin: 0.5rem 0;
`;

const SyntaxHighlighterContainer = styled.div`
  overflow-x: auto;
  border-radius: 8px;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: var(--background);
  color: var(--secondary-text);
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }
`;

const ImagePreview = styled.img`
  max-width: 100%;
  border-radius: 8px;
  margin-top: 0.5rem;
`;

const ImageErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(244, 67, 54, 0.1);
  color: var(--error-color);
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;

  svg {
    margin-right: 0.5rem;
  }
`;

const FileCard = styled.a`
  display: flex;
  align-items: center;
  background-color: var(--input-background);
  color: var(--primary-text);
  border-radius: 8px;
  padding: 0.5rem;
  text-decoration: none;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: var(--hover-color);
  }
`;

const FileIcon = styled.div`
  margin-right: 0.5rem;
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const FileName = styled.span`
  font-weight: bold;
`;

const FileType = styled.span`
  font-size: 0.8rem;
  color: var(--secondary-text);
`;

export default ChatMessage;