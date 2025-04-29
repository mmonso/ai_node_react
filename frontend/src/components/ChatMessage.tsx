import React from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <MessageContainer $isUser={message.isUser}>
      <MessageContent $isUser={message.isUser}>
        <MessageHeader>
          <Avatar $isUser={message.isUser}>
            {message.isUser ? 'U' : 'G'}
          </Avatar>
          <Timestamp>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Timestamp>
        </MessageHeader>
        
        <MessageText>
          <ReactMarkdown>
            {message.content}
          </ReactMarkdown>
          
          {message.imageUrl && (
            <ImagePreview src={message.imageUrl} alt="Imagem enviada" />
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
        </MessageText>
      </MessageContent>
    </MessageContainer>
  );
};

const MessageContainer = styled.div<{ $isUser: boolean }>`
  display: flex;
  padding: 1rem;
  justify-content: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 1rem;
`;

const MessageContent = styled.div<{ $isUser: boolean }>`
  max-width: 80%;
  border-radius: 12px;
  overflow: hidden;
  background-color: ${props => props.$isUser ? 'rgba(138, 133, 255, 0.1)' : 'var(--secondary-bg)'};
  border: 1px solid ${props => props.$isUser ? 'rgba(138, 133, 255, 0.2)' : 'var(--border-color)'};
  padding: 0.75rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const Avatar = styled.div<{ $isUser: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: ${props => props.$isUser ? 'var(--accent-color)' : '#555'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
`;

const MessageText = styled.div`
  white-space: pre-wrap;
  line-height: 1.6;
  color: var(--primary-text);
  
  p {
    margin-bottom: 1rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  ul, ol {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }
  
  blockquote {
    border-left: 3px solid var(--accent-color);
    padding-left: 1rem;
    color: var(--secondary-text);
    margin: 1rem 0;
    background-color: rgba(138, 133, 255, 0.05);
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

  code {
    font-family: monospace;
    background-color: #1a1a1a;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.85em;
  }

  pre {
    background-color: #1a1a1a;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1rem 0;
    border: 1px solid var(--border-color);
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
  background-color: rgba(138, 133, 255, 0.1);
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

const Timestamp = styled.div`
  font-size: 0.75rem;
  color: var(--secondary-text);
`;

export default ChatMessage; 