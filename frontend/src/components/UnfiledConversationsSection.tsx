import React from 'react';
import {
  ConversationListStyled,
  SectionHeader,
  EmptyState,
  ConversationItem,
  EditForm,
  ConversationLink,
  MoreOptionsButton,
  ActionButtons,
  ActionButton,
  SubMenuContainer,
  SubMenuItem,
  MenuButton,
  // FolderList, // Não é mais necessário aqui
} from './Sidebar.styles';
import { ChatIcon, MoreOptionsIcon, EditIcon, DeleteIcon } from './icons'; // Removido FolderIconSvg
// import FloatingMenu from './common/FloatingMenu'; // Não é mais necessário aqui
import { Conversation } from '../types'; // Removido Folder

interface UnfiledConversationsSectionProps {
  conversations: Conversation[]; // Renomeado de unfiledConversations
  conversationId?: string;
  editingId: number | null;
  editingTitle: string;
  openOptionsId: number | null;
  // activeMoveToFolderMenu removido
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  // folders: Folder[]; // Removido

  handleMouseEnter: (e: React.MouseEvent, conversationId: number) => void;
  handleMouseLeave: () => void;
  startEditing: (item: Conversation) => void;
  handleUpdateConversation: (id: number, isPersona?: boolean, systemPrompt?: string | null) => Promise<void>;
  handleDeleteConversation: (id: number, isPersona?: boolean) => Promise<void>;
  toggleOptionsMenu: (e: React.MouseEvent, id: number) => void;
  // handleToggleMoveToFolderMenu removido
  // handleMoveConversationToFolder removido
  setEditingId: (id: number | null) => void;
  setEditingTitle: (title: string) => void;
  handleDragStart: (e: React.DragEvent, conversationId: number) => void;
  draggingConversationId: number | null; // Adicionada a prop
  // setActiveMoveToFolderMenu removido
  // setOpenOptionsId: (id: number | null) => void; // Definitivamente removido
}

const UnfiledConversationsSection: React.FC<UnfiledConversationsSectionProps> = ({
  conversations, // Renomeado de unfiledConversations
  conversationId,
  editingId,
  editingTitle,
  openOptionsId,
  // activeMoveToFolderMenu removido
  menuButtonRef,
  menuRef,
  handleMouseEnter,
  handleMouseLeave,
  startEditing,
  handleUpdateConversation,
  handleDeleteConversation,
  toggleOptionsMenu,
  // handleToggleMoveToFolderMenu removido
  // handleMoveConversationToFolder removido
  setEditingId,
  setEditingTitle,
  handleDragStart,
  draggingConversationId, // Adicionada a prop
  // setActiveMoveToFolderMenu removido
  // setOpenOptionsId, // Prop removida da chamada também
}) => {
  return (
    <ConversationListStyled>
      {/* SectionHeader foi movido para Sidebar.tsx para padronização */}
      {conversations.length === 0 && (
        <EmptyState style={{ opacity: 0.3 }}>Nenhuma conversa ainda.</EmptyState>
      )}
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          $active={Number(conversationId) === conversation.id}
          onMouseEnter={(e) => handleMouseEnter(e, conversation.id)}
          onMouseLeave={handleMouseLeave}
          draggable="true"
          onDragStart={(e) => handleDragStart(e, conversation.id)}
        >
          {editingId === conversation.id ? (
            <EditForm onSubmit={(e) => { e.preventDefault(); handleUpdateConversation(conversation.id); }}>
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => handleUpdateConversation(conversation.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateConversation(conversation.id);
                  } else if (e.key === 'Escape') {
                    setEditingId(null);
                    setEditingTitle('');
                  }
                }}
                autoFocus
              />
            </EditForm>
          ) : (
            <>
              <ConversationLink to={`/chat/${conversation.id}`}>
                {conversation.title}
              </ConversationLink>
              <MoreOptionsButton
                onClick={(e) => toggleOptionsMenu(e, conversation.id)}
                ref={openOptionsId === conversation.id ? menuButtonRef : null}
              >
                <MoreOptionsIcon />
              </MoreOptionsButton>
              {openOptionsId === conversation.id && (
                <ActionButtons ref={menuRef}>
                  <ActionButton onClick={() => startEditing(conversation)} title="Renomear">
                    <EditIcon />
                    Renomear
                  </ActionButton>
                  <ActionButton onClick={() => handleDeleteConversation(conversation.id)} title="Excluir">
                    <DeleteIcon />
                    Excluir
                  </ActionButton>
                  {/* Botão Mover para pasta removido */}
                </ActionButtons>
              )}
            </>
          )}
        </ConversationItem>
      ))}
    </ConversationListStyled>
  );
};

export default UnfiledConversationsSection;