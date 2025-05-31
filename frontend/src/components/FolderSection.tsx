import React from 'react';
import { Folder, Conversation } from '../types';
import {
  FolderItemContainer,
  FolderItemHeader,
  // FolderIcon, // Removido pois não é mais exportado/usado
  FolderName,
  ConversationsInFolderList,
  ConversationItem, // Usaremos ConversationItem para consistência, ajustando se necessário
  ConversationLink,
  MoreOptionsButton,
  ActionButtons,
  ActionButton,
} from './Sidebar.styles';
import { ArrowRightIcon, EditIcon, DeleteIcon, FolderIconSvg, MoreOptionsIcon, ChatIcon } from './icons'; // Corrigido: FolderIconSvg importado diretamente, ChatIcon adicionado
import { useParams, useNavigate } from 'react-router-dom';

interface FolderSectionProps {
  folder: Folder;
  conversations: Conversation[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
  openFolderOptionsId: number | null;
  folderMenuButtonRef: React.RefObject<HTMLButtonElement | null>; // Aceitar null
  folderMenuRef: React.RefObject<HTMLDivElement | null>; // Aceitar null
  toggleFolderOptionsMenu: (e: React.MouseEvent, folderId: number) => void;
  onEditFolder: () => void;
  onDeleteFolder: (folderId: number) => void;
  handleDragStart: (e: React.DragEvent, conversationId: number) => void;
  draggingConversationId: number | null;
  conversationIdParams: string | undefined; // Para destacar a conversa ativa
  // Adicionar handlers para mouse enter/leave para mostrar o botão de opções da conversa
  handleConversationMouseEnter: (e: React.MouseEvent, conversationId: number) => void;
  handleConversationMouseLeave: () => void;
  openConversationOptionsId: number | null;
  conversationMenuButtonRef: React.RefObject<HTMLButtonElement | null>;
  conversationMenuRef: React.RefObject<HTMLDivElement | null>;
  toggleConversationOptionsMenu: (e: React.MouseEvent, conversationId: number) => void;
  startEditingConversation: (conversation: Conversation) => void;
  handleDeleteConversation: (conversationId: number, isPersona?: boolean) => void;
}

const FolderSection: React.FC<FolderSectionProps> = ({
  folder,
  conversations,
  isExpanded,
  onToggleExpand,
  onDragOver,
  onDrop,
  isDragOver,
  openFolderOptionsId,
  folderMenuButtonRef,
  folderMenuRef,
  toggleFolderOptionsMenu,
  onEditFolder,
  onDeleteFolder,
  handleDragStart,
  draggingConversationId,
  conversationIdParams,
  handleConversationMouseEnter,
  handleConversationMouseLeave,
  openConversationOptionsId,
  conversationMenuButtonRef,
  conversationMenuRef,
  toggleConversationOptionsMenu,
  startEditingConversation,
  handleDeleteConversation,
}) => {
  const navigate = useNavigate();
  const { conversationId: activeConversationIdFromParams } = useParams<{ conversationId?: string }>();

  return (
    <FolderItemContainer
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{ background: isDragOver ? 'var(--drop-target-bg)' : 'transparent' }}
    >
      <FolderItemHeader onClick={onToggleExpand} $active={false}>
        {/* FolderIcon removido para teste de alinhamento
        <FolderIcon className={isExpanded ? 'expanded' : ''}>
          <ArrowRightIcon />
        </FolderIcon>
        */}
        {/* <span style={{ marginRight: '8px', opacity: 0.7, display: 'flex', alignItems: 'center' }}><FolderIconSvg /></span> */} {/* Ícone da pasta SVG removido */}
        <FolderIconSvg size={16} className="folder-item-icon-svg" />
        <FolderName>{folder.name}</FolderName>
        <MoreOptionsButton
          ref={folderMenuButtonRef}
          onClick={(e) => toggleFolderOptionsMenu(e, folder.id)}
          style={{ opacity: openFolderOptionsId === folder.id ? 1 : undefined }}
          aria-label={`Opções para pasta ${folder.name}`}
        >
          <MoreOptionsIcon />
        </MoreOptionsButton>
        {openFolderOptionsId === folder.id && (
          <ActionButtons ref={folderMenuRef} style={{ top: 'calc(100% + 2px)', right: '5px' }}>
            <ActionButton onClick={(e) => { e.stopPropagation(); onEditFolder(); }}>
              <EditIcon /> Editar Pasta
            </ActionButton>
            <ActionButton onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}>
              <DeleteIcon /> Deletar Pasta
            </ActionButton>
          </ActionButtons>
        )}
      </FolderItemHeader>
      {isExpanded && (
        <ConversationsInFolderList>
          {conversations.length === 0 && <div style={{padding: '10px 15px', fontSize: '0.8rem', color: 'var(--secondary-text)', textAlign: 'center', opacity: 0.3}}>—</div>}
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              $active={Number(activeConversationIdFromParams) === conv.id}
              draggable
              onDragStart={(e) => handleDragStart(e, conv.id)}
              onMouseEnter={(e) => handleConversationMouseEnter(e, conv.id)}
              onMouseLeave={handleConversationMouseLeave}
              style={{ opacity: draggingConversationId === conv.id ? 0.5 : 1 }}
            >
              <ConversationLink to={`/chat/${conv.id}`}>
                {conv.title || 'Nova Conversa'}
              </ConversationLink>
              <MoreOptionsButton
                ref={openConversationOptionsId === conv.id ? conversationMenuButtonRef : null}
                onClick={(e) => toggleConversationOptionsMenu(e, conv.id)}
                style={{ opacity: openConversationOptionsId === conv.id ? 1 : undefined }}
                aria-label={`Opções para conversa ${conv.title}`}
              >
                <MoreOptionsIcon />
              </MoreOptionsButton>
              {openConversationOptionsId === conv.id && (
                <ActionButtons ref={conversationMenuRef} style={{ top: 'calc(100% + 2px)', right: '5px' }}>
                  <ActionButton onClick={(e) => { e.stopPropagation(); startEditingConversation(conv); }}>
                    <EditIcon /> Renomear
                  </ActionButton>
                  <ActionButton onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id, false); }}>
                    <DeleteIcon /> Deletar
                  </ActionButton>
                  {/* Adicionar opção para mover para "Não Arquivadas" ou outra pasta no futuro */}
                </ActionButtons>
              )}
            </ConversationItem>
          ))}
        </ConversationsInFolderList>
      )}
    </FolderItemContainer>
  );
};

export default FolderSection;