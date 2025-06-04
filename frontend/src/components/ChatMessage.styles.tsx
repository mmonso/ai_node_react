import styled, { keyframes } from 'styled-components';

export const SearchSuggestions = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: var(--input-background, #f5f5f5);
  font-size: 0.9rem;
  color: var(--secondary-text, #666);
`;

export const SearchChip = styled.a`
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

export const SearchIcon = styled.span`
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
`;

export const GroundingContainer = styled.div`
  margin-top: 10px;
  border-top: 1px solid var(--border-color);
  padding-top: 10px;
`;

export const GroundingSection = styled.div`
  margin-bottom: 10px;
`;

export const GroundingTitle = styled.h6`
  font-size: 0.9rem;
  margin-bottom: 5px;
  color: var(--secondary-text);
`;

export const SourcesList = styled.ul`
  list-style: none;
  padding: 0;
`;

export const SourceItem = styled.li`
  margin-bottom: 5px;
`;

export const SourceLink = styled.a`
  color: var(--accent-color);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export const ActionButton = styled.button`
  display: inline-block;
  position: relative;
  margin-top: 0.3rem;
  margin-left: 0.5rem;
  padding: 6px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  opacity: 0; /* Invisível por padrão, só visível no hover */
  transition: opacity 0.2s ease, color 0.3s;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;

  .message-actions:hover & {
    opacity: 0.5;
  }

  &:hover {
    opacity: 1 !important;
    color: var(--primary-text);
    background-color: transparent !important;
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

export const EditViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0 1rem;
  box-sizing: border-box;
`;

export const EditTextArea = styled.textarea`
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

export const EditControls = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
`;

export const EditButtonBase = styled.button`
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

export const SaveButton = styled(EditButtonBase)``;
export const DeleteButton = styled(ActionButton)`
  margin-left: 0.2rem;
  color: var(--error-color, #e53935);
`;
export const EditButton = styled(ActionButton)`
  position: relative;
  bottom: -1rem;
`;
export const CancelButton = styled(EditButtonBase)``;

export const MessageContainer = styled.div<{ $isUser: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 0.6rem;
  padding: 0 1rem;
  width: 100%;
  
  &:hover {
    .message-actions .action-button {
      opacity: 0.5;
    }
  }
`;

export const MessageContent = styled.div<{ $isUser: boolean }>`
  position: relative;
  background-color: ${props => props.$isUser ? 'var(--message-user-bg)' : 'transparent'};
  color: var(--primary-text);
  border-radius: 8px;
  padding: 0.6rem 1rem;
  max-width: ${props => props.$isUser ? '80%' : '100%'};
  word-break: break-word;
  margin-bottom: ${props => props.$isUser ? '0.3rem' : '0'};
  margin-left: ${props => props.$isUser ? '2rem' : '0'};
  transition: all 0.3s ease;
  overflow: visible;
`;

export const MessageText = styled.div<{ $isUser: boolean }>`
  cursor: pointer;
  white-space: normal;
  padding-bottom: 0; /* Removido espaço para o botão de edição */
  p:not(:last-child) {
    margin-bottom: 0.8em;
  }
`;

export const MessageTimestamp = styled.span`
  font-size: 0.7rem;
  color: var(--secondary-text);
  margin-bottom: 0.25rem;
  display: block;
  text-align: right;
`;

const typingAnimation = keyframes`
  0% { opacity: 0.2; }
  50% { opacity: 1; }
  100% { opacity: 0.2; }
`;

export const TypingIndicator = styled.div`
  display: flex;
`;

export const Dot = styled.span<{ $delay: number }>`
  width: 6px;
  height: 6px;
  background-color: var(--secondary-text);
  border-radius: 50%;
  margin-right: 4px;
  animation: ${typingAnimation} 1.4s infinite ease-in-out;
  animation-delay: ${props => props.$delay}s;
`;

export const CodeBlockWrapper = styled.div`
  position: relative;
  margin: 0.5rem 0;
`;

export const SyntaxHighlighterContainer = styled.div`
  overflow-x: auto;
  border-radius: 8px;
`;

export const CopyButton = styled.button`
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

export const ImagePreview = styled.img`
  max-width: 100%;
  border-radius: 8px;
  margin-top: 0.5rem;
`;

export const ImageErrorContainer = styled.div`
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

export const FileCard = styled.a`
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

export const FileIcon = styled.div`
  margin-right: 0.5rem;
`;

export const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const FileName = styled.span`
  font-weight: bold;
`;

export const FileType = styled.span`
  font-size: 0.8rem;
  color: var(--secondary-text);
`;