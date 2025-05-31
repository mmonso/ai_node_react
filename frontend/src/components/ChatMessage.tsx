import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  EditButton,
  EditViewContainer,
  EditTextArea,
  EditControls,
  SaveButton,
  CancelButton,
  MessageContainer,
  MessageContent,
  MessageText,
  TypingIndicator,
  Dot,
  DeleteButton,
} from './ChatMessage.styles';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { updateMessageContent } from '../services/api';
import { SaveMessageIcon, CancelEditIcon } from './icons';
import GroundingSources, { GroundingMetadata } from './GroundingSources';
import CodeBlock from './CodeBlock';
import MessageImage from './MessageImage'; // Importa MessageImage
import MessageFile from './MessageFile';   // Importa MessageFile

interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
  onUpdateMessage?: (updatedMessage: Message) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isTyping = false, onUpdateMessage }) => {
  // const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({}); // Removido: gerenciado por CodeBlock
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  // const [imageError, setImageError] = useState(false); // Movido para MessageImage.tsx
  // const [imageUrl, setImageUrl] = useState(message.imageUrl || ''); // Movido para MessageImage.tsx
  const [groundingMetadata, setGroundingMetadata] = useState<GroundingMetadata | null>(null);
  // const imageRef = useRef<HTMLImageElement>(null); // Movido para MessageImage.tsx
  const editTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const [processedContent, setProcessedContent] = useState(message.content);
  const [showButtons, setShowButtons] = useState(false);

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
  // const formattedTimestamp = useMemo(() => { // Removido pois não está sendo usado para renderizar
  //   if (!message.timestamp) return '';
  //   const date = new Date(message.timestamp);
  //   return date.toLocaleTimeString('pt-BR', {
  //     hour: '2-digit',
  //     minute: '2-digit'
  //   });
  // }, [message.timestamp]);

  // O useEffect acima (linhas 160-200 aprox.) já lida com processedContent e editText
  // com base em message.content e editText.

  // useEffect para imagem movido para MessageImage.tsx
  // const handleCopy movido para CodeBlock.tsx
  // handleImageError movido para MessageImage.tsx

  const handleEditClick = () => {
    setEditText(message.content); // Garante que o texto de edição comece com o conteúdo atual
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditText(processedContent);
  };

  const handleDeleteClick = () => {
    if (onUpdateMessage && window.confirm('Tem certeza que deseja excluir esta mensagem?')) {
      // Criando uma cópia da mensagem e marcando-a para exclusão
      const messageToDelete = { ...message, deleted: true };
      onUpdateMessage(messageToDelete);
    }
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
    <MessageContainer 
      $isUser={message.isUser}
      onMouseEnter={() => setShowButtons(true)}
      onMouseLeave={() => setShowButtons(false)}
    >
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
              <SaveMessageIcon />
            </SaveButton>
            <CancelButton onClick={handleCancelClick} title="Cancelar">
              <CancelEditIcon />
            </CancelButton>
          </EditControls>
        </EditViewContainer>
      ) : (
        <>
          <MessageContent $isUser={message.isUser}>
            <MessageText $isUser={message.isUser}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  
                  code: ({ node, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeContent = String(children).replace(/\n$/, '');
                    if (match) {
                      return (
                        <CodeBlock
                          language={match[1]}
                          codeContent={codeContent}
                          node={node}
                        />
                      );
                    }
                    // Para código inline ou não especificado, usa a tag code padrão
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {processedContent}
              </ReactMarkdown>

              <MessageImage imageUrl={message.imageUrl} messageId={message.id} />

              <MessageFile fileUrl={message.fileUrl} />

              {groundingMetadata && !message.isUser && (
                <GroundingSources groundingMetadata={groundingMetadata} />
              )}
            </MessageText>
          </MessageContent>
          
          {onUpdateMessage && !isEditing && (
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                position: 'relative',
                marginTop: '4px' 
              }} 
              className="message-actions"
            >
              <EditButton 
                className="edit-button" 
                onClick={handleEditClick} 
                title="Editar mensagem"
                style={{ opacity: showButtons ? 0.7 : 0, transition: 'opacity 0.2s ease' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </EditButton>
              <DeleteButton 
                className="delete-button" 
                onClick={handleDeleteClick} 
                title="Excluir mensagem"
                style={{ opacity: showButtons ? 0.7 : 0, transition: 'opacity 0.2s ease' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </DeleteButton>
            </div>
          )}
        </>
      )}
    </MessageContainer>
  );
};

export default ChatMessage;