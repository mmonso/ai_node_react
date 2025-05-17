import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import ReactMarkdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useTheme } from '../context/ThemeContext';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';

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

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isTyping = false }) => {
  const { theme } = useTheme();
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(message.imageUrl || '');
  const [groundingMetadata, setGroundingMetadata] = useState<GroundingMetadata | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [processedContent, setProcessedContent] = useState(message.content);

  // Format timestamp
  const formattedTimestamp = useMemo(() => {
    if (!message.timestamp) return '';
    const date = new Date(message.timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [message.timestamp]);

  // Process message content to remove timestamps and parse grounding metadata
  useEffect(() => {
    if (message.content) {
      // Remover timestamps que possam estar no início da mensagem
      let content = message.content;
      
      // Regex para detectar vários formatos de timestamp
      const timestampRegexes = [
        /^\s*\[\d{1,2}:\d{2}(:\d{2})?\]\s*/,                      // [HH:MM] ou [HH:MM:SS]
        /^\s*\d{1,2}:\d{2}(:\d{2})?\s*/,                          // HH:MM ou HH:MM:SS
        /^\s*\(\d{1,2}:\d{2}(:\d{2})?\)\s*/,                      // (HH:MM) ou (HH:MM:SS)
        /^\s*\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2}(:\d{2})?\s*/     // DD/MM/YYYY HH:MM ou DD/MM/YYYY HH:MM:SS
      ];
      
      for (const regex of timestampRegexes) {
        if (regex.test(content)) {
          content = content.replace(regex, '');
          break; // Parar após encontrar o primeiro formato
        }
      }
      
      // Verificar se o conteúdo começa com "Assistente:" ou "Assistente [HH:MM]:"
      const assistantPrefixRegex = /^\s*(Assistente(\s*\[\d{1,2}:\d{2}(:\d{2})?\])?\s*:)\s*/;
      if (assistantPrefixRegex.test(content)) {
        content = content.replace(assistantPrefixRegex, '');
      }
      
      // Após remover timestamps, verificar se é JSON com metadados de grounding
      try {
        // Tentar fazer parse da mensagem como JSON
        // Em vez de usar regex, vamos verificar se começa e termina com chaves
        if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
          const parsedData = JSON.parse(content);
          if (parsedData.text && parsedData.groundingMetadata) {
            // Se tiver metadados de grounding, extrair o texto e os metadados
            setGroundingMetadata(parsedData.groundingMetadata);
            // Atualizar o conteúdo para mostrar apenas o texto
            content = parsedData.text;
          }
        }
      } catch (e) {
        // Não é um JSON válido, manter o conteúdo processado
        console.log('Não é um JSON de grounding:', e);
      }
      
      setProcessedContent(content);
    }
  }, [message.content]);

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

  // Se é indicador de "digitando", mostrar apenas os três pontos
  if (isTyping) {
    return (
      <MessageContainer $isUser={false}>
        <MessageContent $isUser={false}>
          <MessageText>
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
      <MessageContent $isUser={message.isUser}>
        {showTimestamp && (
          <MessageTimestamp>{formattedTimestamp}</MessageTimestamp>
        )}
        <MessageText $isUser={message.isUser} onClick={() => setShowTimestamp(!showTimestamp)}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: (props) => <p style={{ whiteSpace: 'pre-line' }}>{props.children}</p>,
              code(props) {
                const { children, className, node, ...rest } = props;
                const match = /language-(\w+)/.exec(className || '');
                const codeContent = String(children).replace(/\n$/, '');
                const codeBlockId = `code-${node?.position?.start.line}-${node?.position?.start.column}`;

                return match ? (
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
                ) : (
                  <code className={className}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {processedContent}
          </ReactMarkdown>
          
          {message.imageUrl && !imageError && (
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
          
          {message.fileUrl && (
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
          
          {/* Componente para mostrar fontes do grounding */}
          {groundingMetadata && !message.isUser && (
            <GroundingSources groundingMetadata={groundingMetadata} />
          )}
        </MessageText>
      </MessageContent>
    </MessageContainer>
  );
};

// Animação para os três pontos
const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 8px 4px;
  margin: 4px 0;
`;

const Dot = styled.span<{ $delay: number }>`
  width: 10px;
  height: 10px;
  background-color: var(--accent-color);
  border-radius: 50%;
  opacity: 0.6;
  animation: ${bounce} 1.2s ease-in-out infinite;
  animation-delay: ${props => props.$delay}s;
`;

const MessageContainer = styled.div<{ $isUser: boolean }>`
  display: flex;
  padding: 1rem 1.5rem;
  justify-content: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 1rem;
`;

const MessageContent = styled.div<{ $isUser: boolean }>`
  max-width: 90%;
  border-radius: 12px;
  background-color: ${props => props.$isUser
    ? 'var(--message-user-bg, rgba(93, 107, 133, 0.1))'
    : 'var(--tertiary-bg, var(--secondary-bg))'}; /* Usar tertiary-bg para bot */
  border: 1px solid ${props => props.$isUser ? 'rgba(93, 107, 133, 0.2)' : 'var(--border-color)'};
  padding: 0.75rem 1.5rem; /* Aumentando o padding lateral de 1.25rem para 1.5rem */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative; /* Para o botão de cópia */
`;

const MessageText = styled.div<{ $isUser?: boolean }>`
  white-space: normal;
  line-height: 1.6;
  color: ${props => props.$isUser ? 'var(--message-user-text)' : 'var(--primary-text)'};
  font-size: 17px;
  
  p {
    margin-bottom: 0.75rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  ul, ol {
    margin-bottom: 0.75rem;
    padding-left: 1.5rem;
  }
  
  blockquote {
    border-left: 3px solid var(--accent-color);
    padding-left: 1rem;
    color: var(--secondary-text);
    margin: 1rem 0;
    background-color: rgba(93, 107, 133, 0.05);
    padding: 0.5rem 1rem;
    border-radius: 0 4px 4px 0;
  }

  h1, h2, h3, h4, h5, h6 {
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
  }

  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.3rem; }
  h3 { font-size: 1.2rem; }
  h4 { font-size: 1.1rem; }
  h5, h6 { font-size: 1rem; }

  code { /* Estilo para código inline */
    font-family: monospace;
    background-color: var(--code-bg);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.85em;
    color: var(--primary-text);
  }

  pre { /* Estilo para o wrapper <pre> do react-markdown */
    background-color: transparent !important; /* Sobrescreve o fundo do pre do react-markdown */
    padding: 0 !important; /* Sobrescreve o padding do pre do react-markdown */
    margin: 0.75rem 0;
    border-radius: 0; /* O SyntaxHighlighterContainer cuidará do radius */
    border: none; /* O SyntaxHighlighterContainer cuidará da borda */
    overflow-x: visible; /* Para não cortar o botão de cópia */
  }
  
  /* Ajuste para o SyntaxHighlighter não ter fundo extra se o pre já tiver */
  pre > div[style*="background"] {
    /* Removendo o !important para permitir que o tema original seja aplicado */
    background-color: transparent;
  }


  a {
    color: var(--accent-color);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ImagePreview = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin: 0.5rem 0;
  border: 1px solid var(--border-color);
  cursor: pointer;
`;

const ImageCard = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  margin: 0.75rem 0;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.2);
    border-color: var(--accent-color);
  }
`;

const ImageIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(93, 107, 133, 0.1);
  border-radius: 6px;
  width: 40px;
  height: 40px;
  color: var(--accent-color);
`;

const ImageInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

const ImageName = styled.div`
  font-weight: 500;
  color: var(--primary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ImageAction = styled.div`
  font-size: 0.8rem;
  color: var(--secondary-text);
`;

const FileCard = styled.a`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  margin: 0.75rem 0;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
  text-decoration: none;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.3);
    border-color: var(--accent-color);
  }
`;

const FileIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(93, 107, 133, 0.1);
  border-radius: 6px;
  width: 40px;
  height: 40px;
  color: var(--accent-color);
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-weight: 500;
  color: var(--primary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileType = styled.div`
  font-size: 0.8rem;
  color: var(--secondary-text);
`;

const SyntaxHighlighterContainer = styled.div`
  border-radius: 6px; /* Mantém o radius aqui */
  overflow: hidden; /* Para o conteúdo do highlighter */
  border: 1px solid var(--border-color);
`;

const CodeBlockWrapper = styled.div`
  position: relative;
  margin: 0.75rem 0; /* Reduzindo de 1rem para 0.75rem para consistência */
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: var(--secondary-text);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease, background-color 0.2s ease;
  font-size: 0.8rem;

  &:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.2);
    color: var(--primary-text);
  }

  svg {
    width: 1em;
    height: 1em;
  }
`;

const ImageErrorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: rgba(244, 67, 54, 0.1);
  border-radius: 6px;
  margin: 0.75rem 0;
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: var(--error-color);
  
  svg {
    flex-shrink: 0;
  }
  
  span {
    font-size: 0.9rem;
  }
`;

// Estilos para o grounding
const GroundingContainer = styled.div`
  margin-top: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
`;

const GroundingSection = styled.div`
  margin-bottom: 0.75rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const GroundingTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-text);
`;

const SourcesList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const SourceItem = styled.li`
  margin-bottom: 0.3rem;
  font-size: 0.85rem;
`;

const SourceLink = styled.a`
  color: var(--accent-color);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const MessageTimestamp = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.75rem;
  color: var(--secondary-text);
  opacity: 0.7;
`;

export default ChatMessage;