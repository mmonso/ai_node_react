import React from 'react';
import { UserIcon, EditIcon, EditPromptIcon, DeleteIcon, MoreOptionsIcon, PlusIcon } from './icons';
import {
  ConversationListStyled,
  EmptyState,
  ConversationItem,
  EditForm,
  ConversationLink,
  MoreOptionsButton,
  ActionButtons,
  ActionButton,
} from './Sidebar.styles'; // Assumindo que os estilos podem ser reutilizados ou ajustados
import StyledButtonBase from './common/StyledButtonBase';
import { Conversation } from '../types';

interface PersonaSectionProps {
  personas: Conversation[];
  conversationId?: string;
  editingId: number | null;
  editingTitle: string;
  openOptionsId: number | null;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  setEditingId: (id: number | null) => void;
  setEditingTitle: (title: string) => void;
  handleUpdateConversation: (id: number, isPersona: boolean, systemPrompt?: string | null) => Promise<void>;
  toggleOptionsMenu: (e: React.MouseEvent, id: number) => void;
  startEditing: (item: Conversation) => void;
  handleOpenPersonaModal: (persona?: Conversation) => void;
  handleDeleteConversation: (id: number, isPersona: boolean) => Promise<void>;
  handleMouseEnter: (e: React.MouseEvent, conversationId: number) => void;
  handleMouseLeave: () => void;
}

const PersonaSection: React.FC<PersonaSectionProps> = ({
  personas,
  conversationId,
  editingId,
  editingTitle,
  openOptionsId,
  menuButtonRef,
  menuRef,
  setEditingId,
  setEditingTitle,
  handleUpdateConversation,
  toggleOptionsMenu,
  startEditing,
  handleOpenPersonaModal,
  handleDeleteConversation,
  handleMouseEnter,
  handleMouseLeave,
}) => {
  return (
    <>
      <ConversationListStyled>
        {personas.length === 0 && (
          <EmptyState>Nenhuma persona criada ainda.</EmptyState>
        )}
        {personas.map((persona) => (
          <ConversationItem
            key={persona.id}
            $active={Number(conversationId) === persona.id}
            onMouseEnter={(e) => handleMouseEnter(e, persona.id)}
            onMouseLeave={handleMouseLeave}
          >
            {editingId === persona.id ? (
              <EditForm>
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => handleUpdateConversation(persona.id, true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateConversation(persona.id, true);
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
                <ConversationLink to={`/chat/${persona.id}`}>
                  <UserIcon />
                  {persona.title}
                </ConversationLink>
                <MoreOptionsButton
                  onClick={(e) => toggleOptionsMenu(e, persona.id)}
                  ref={openOptionsId === persona.id ? menuButtonRef : null}
                >
                  <MoreOptionsIcon />
                </MoreOptionsButton>
                {openOptionsId === persona.id && (
                  <ActionButtons ref={menuRef}>
                    <ActionButton onClick={() => startEditing(persona)} title="Renomear">
                      <EditIcon />
                      Renomear
                    </ActionButton>
                    <ActionButton onClick={() => handleOpenPersonaModal(persona)} title="Editar Prompt">
                      <EditPromptIcon />
                      Editar Prompt
                    </ActionButton>
                    <ActionButton onClick={() => handleDeleteConversation(persona.id, true)} title="Excluir">
                      <DeleteIcon />
                      Excluir
                    </ActionButton>
                  </ActionButtons>
                )}
              </>
            )}
          </ConversationItem>
        ))}
      </ConversationListStyled>
    </>
  );
};

export default PersonaSection;