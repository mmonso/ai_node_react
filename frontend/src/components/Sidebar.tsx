import React, { useState, useEffect, useRef, useCallback, ReactElement } from 'react';
import { PlusIcon, ArrowRightIcon, MoreOptionsIcon, EditIcon, DeleteIcon, FolderIconSvg, NewFolderIcon, UserIcon, BotIcon } from './icons';
import {
  SidebarContainer,
  SidebarHeader,
  LeftActions,
  RightActions,
  MoreOptionsButton,
  NewChatButton,
  ScrollableContent,
  SectionHeader,
  ConversationListStyled,
  EmptyState,
  ConversationItem,
  ConversationLink,
  ActionButtons,
  ActionButton,
  SubMenuContainer,
  SubMenuItem,
  EditForm,
  MenuButton,
  FolderList,
  SectionDivider,
  AgentItem,
} from './Sidebar.styles';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
  getConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  moveConversationToFolder,
} from '../services/api';
import { Conversation, Folder } from '../types';
import SettingsModal from './SettingsModal';
import PersonaModal from './PersonaModal';
import PersonaSection from './PersonaSection';
import UnfiledConversationsSection from './UnfiledConversationsSection';
import MainAgentSection from './MainAgentSection';
import useModalState from '../hooks/useModalState';
import FolderModal from './FolderModal';
import FolderSection from './FolderSection';

const Sidebar = (): ReactElement => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const {
    conversations, setConversations,
    personas, setPersonas,
    folders, setFolders,
    reloadTrigger,
    mainAgentConversationId,
    mainAgentConversation // OBTER DO CONTEXTO
  } = useAppContext();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  const [openOptionsId, setOpenOptionsId] = useState<string | null>(null);
  const [openFolderOptionsId, setOpenFolderOptionsId] = useState<string | null>(null);

  const [draggingConversationId, setDraggingConversationId] = useState<string | null>(null);
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const folderMenuRef = useRef<HTMLDivElement>(null);
  const folderMenuButtonRef = useRef<HTMLButtonElement>(null);

  const settingsModal = useModalState();
  const personaModal = useModalState<Conversation>();
  const folderModal = useModalState<Folder | undefined>();
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const fetchedConversations = await getConversations();
      const fetchedFolders = await getFolders();
      
      setConversations(fetchedConversations.filter(c => !c.isPersona));
      setPersonas(fetchedConversations.filter(c => c.isPersona));
      setFolders(fetchedFolders);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }, [setConversations, setPersonas, setFolders]);

  useEffect(() => {
    loadData();
  }, [reloadTrigger, loadData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Fechar menu de opções de conversa/persona se clicar fora dele
      if (
        openOptionsId &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setOpenOptionsId(null);
      }

      // Fechar menu de opções de pasta se clicar fora dele
      if (
        openFolderOptionsId &&
        folderMenuRef.current &&
        !folderMenuRef.current.contains(event.target as Node) &&
        folderMenuButtonRef.current &&
        !folderMenuButtonRef.current.contains(event.target as Node)
      ) {
        setOpenFolderOptionsId(null);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openOptionsId, openFolderOptionsId]);

  const handleNewConversationClick = async () => {
    try {
      const newConversation = await createConversation('Nova conversa');
      setConversations(prev => [newConversation, ...prev]);
      navigate(`/chat/${newConversation.id}`);
    } catch (error) {
      console.error('Erro ao criar nova conversa:', error);
    }
  };

  const handleUpdateConversation = async (id: string, isPersona: boolean = false) => {
    if (!editingTitle.trim()) return;
    
    try {
      const updated = await updateConversation(id, editingTitle);
      
      if (isPersona) {
        setPersonas(prev => prev.map(p => p.id === id ? { ...p, title: editingTitle } : p));
      } else {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, title: editingTitle } : c));
      }
      
      setEditingId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Erro ao atualizar conversa:', error);
    }
  };

  const handleDeleteConversation = async (id: string, isPersona: boolean = false) => {
    try {
      await deleteConversation(id);
      
      if (isPersona) {
        setPersonas(prev => prev.filter(p => p.id !== id));
      } else {
        setConversations(prev => prev.filter(c => c.id !== id));
      }
      
      // Se a conversa atual for excluída, redirecionar para a página inicial
      if (conversationId === id) {
        navigate('/');
      }
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
    }
  };

  const startEditing = (item: Conversation) => {
    setEditingId(item.id);
    setEditingTitle(item.title || '');
  };

  const toggleOptionsMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    menuButtonRef.current = e.currentTarget as HTMLButtonElement;
    setOpenOptionsId(openOptionsId === id ? null : id);
  };

  // Funções para drag and drop
  const handleDragStart = (e: React.DragEvent, conversationId: string) => {
    e.dataTransfer.setData('conversationId', conversationId);
    setDraggingConversationId(conversationId);
  };

  const handleDragOver = (e: React.DragEvent, folderId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDropOnFolder = async (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    const conversationId = e.dataTransfer.getData('conversationId');
    if (!conversationId || conversationId === '') return;

    try {
      await moveConversationToFolder(conversationId, folderId);
      
      // Atualizar estado local
      setConversations(prev => 
        prev.map(c => c.id === conversationId 
          ? { ...c, folderId, folder: folders.find(f => f.id === folderId) } 
          : c
        )
      );
    } catch (error) {
      console.error('Erro ao mover conversa para pasta:', error);
    } finally {
      setDraggingConversationId(null);
      setDragOverFolderId(null);
    }
  };

  const handleDropOnUnfiled = async (e: React.DragEvent) => {
    e.preventDefault();
    const conversationId = e.dataTransfer.getData('conversationId');
    if (!conversationId || conversationId === '') return;

    try {
      // Mover para "sem pasta" significa passar null como folderId
      await moveConversationToFolder(conversationId, null);
      
      // Atualizar estado local
      setConversations(prev => 
        prev.map(c => c.id === conversationId 
          ? { ...c, folderId: null, folder: null } 
          : c
        )
      );
    } catch (error) {
      console.error('Erro ao remover conversa da pasta:', error);
    } finally {
      setDraggingConversationId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggingConversationId(null);
    setDragOverFolderId(null);
  };

  const handleOpenPersonaModal = (persona?: Conversation) => {
    personaModal.openModal(persona);
  };

  const handleSavePersona = async (name: string, systemPrompt: string | null) => {
    try {
      if (personaModal.data) {
        // Editando persona existente
        const updatedPersona = await updateConversation(
          personaModal.data.id,
          name,
          true,
          systemPrompt || undefined
        );
        
        setPersonas(prev => 
          prev.map(p => p.id === updatedPersona.id ? updatedPersona : p)
        );
      } else {
        // Criando nova persona
        const newPersona = await createConversation(
          name,
          undefined,
          true,
          systemPrompt || undefined
        );
        
        setPersonas(prev => [newPersona, ...prev]);
      }
      
      personaModal.closeModal();
    } catch (error) {
      console.error('Erro ao salvar persona:', error);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, conversationId: string) => {
    setHoveredConversationId(conversationId);
  };

  const handleMouseLeave = () => {
    setHoveredConversationId(null);
  };

  return (
    <SidebarContainer>
      <SidebarHeader>
        <LeftActions>
          <NewChatButton
            onClick={(_event) => settingsModal.openModal()}
            title="Configurações"
          >
            <ArrowRightIcon />
          </NewChatButton>
        </LeftActions>
        <RightActions>
          <NewChatButton
            onClick={handleNewConversationClick}
            title="Nova conversa"
          >
            <PlusIcon />
          </NewChatButton>
          <NewChatButton
            onClick={() => folderModal.openModal()}
            title="Nova pasta"
          >
            <NewFolderIcon />
          </NewChatButton>
          <NewChatButton
            onClick={() => handleOpenPersonaModal()}
            title="Nova persona"
          >
            <UserIcon />
          </NewChatButton>
        </RightActions>
      </SidebarHeader>

      <SectionDivider />

      {/* Seção do agente principal no topo (fora da área de rolagem) */}
      {mainAgentConversationId && mainAgentConversation && ( // Verificar ambos
        <>
          <SectionHeader>Assistente IA</SectionHeader>
          <MainAgentSection
            // conversations={conversations} // NÃO MAIS NECESSÁRIO AQUI
            mainAgentConversationId={mainAgentConversationId}
            agentConversationDetails={mainAgentConversation} // PASSAR O OBJETO
            conversationId={conversationId} // ID da conversa ativa na URL
          />
          <SectionDivider />
        </>
      )}

      <ScrollableContent
        onDragOver={(e) => handleDragOver(e)}
        onDrop={handleDropOnUnfiled}
      >
        <SectionHeader>Personas</SectionHeader>
        <PersonaSection
          personas={personas}
          conversationId={conversationId}
          editingId={editingId}
          editingTitle={editingTitle}
          openOptionsId={openOptionsId}
          menuButtonRef={menuButtonRef}
          menuRef={menuRef}
          setEditingId={setEditingId}
          setEditingTitle={setEditingTitle}
          handleUpdateConversation={handleUpdateConversation}
          toggleOptionsMenu={toggleOptionsMenu}
          startEditing={startEditing}
          handleOpenPersonaModal={handleOpenPersonaModal}
          handleDeleteConversation={handleDeleteConversation}
          handleMouseEnter={handleMouseEnter}
          handleMouseLeave={handleMouseLeave}
        />

        <SectionDivider />

        <SectionHeader>Pastas</SectionHeader>
        <FolderList>
          {folders.map((folder) => (
            <FolderSection
              key={folder.id}
              folder={folder}
              conversations={conversations.filter(c => c.folderId === folder.id)}
              isExpanded={expandedFolders.has(folder.id)}
              onToggleExpand={() => {
                const newExpanded = new Set(expandedFolders);
                if (newExpanded.has(folder.id)) {
                  newExpanded.delete(folder.id);
                } else {
                  newExpanded.add(folder.id);
                }
                setExpandedFolders(newExpanded);
              }}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDrop={(e) => handleDropOnFolder(e, folder.id)}
              isDragOver={dragOverFolderId === folder.id}
              openFolderOptionsId={openFolderOptionsId}
              folderMenuButtonRef={folderMenuButtonRef}
              folderMenuRef={folderMenuRef}
              toggleFolderOptionsMenu={(e, id: string) => {
                e.stopPropagation();
                folderMenuButtonRef.current = e.currentTarget as HTMLButtonElement;
                setOpenFolderOptionsId(openFolderOptionsId === id ? null : id);
              }}
              onEditFolder={() => folderModal.openModal(folder)}
              onDeleteFolder={async (id: string) => {
                try {
                  await deleteFolder(id);
                  setFolders(prev => prev.filter(f => f.id !== id));
                  setConversations(prev => prev.map(c => c.folderId === id ? {...c, folderId: null, folder: null} : c));
                } catch (error) {
                  console.error("Erro ao deletar pasta:", error);
                }
              }}
              handleDragStart={handleDragStart}
              draggingConversationId={draggingConversationId}
              conversationIdParams={conversationId}
              handleConversationMouseEnter={handleMouseEnter}
              handleConversationMouseLeave={handleMouseLeave}
              openConversationOptionsId={openOptionsId}
              conversationMenuButtonRef={menuButtonRef}
              conversationMenuRef={menuRef}
              toggleConversationOptionsMenu={toggleOptionsMenu}
              startEditingConversation={startEditing}
              handleDeleteConversation={handleDeleteConversation}
            />
          ))}
        </FolderList>

        <SectionDivider />

        <SectionHeader>Conversas</SectionHeader>
        <UnfiledConversationsSection
          conversations={conversations.filter(c => !c.folderId && c.id !== mainAgentConversationId)}
          conversationId={conversationId}
          editingId={editingId}
          editingTitle={editingTitle}
          openOptionsId={openOptionsId}
          menuButtonRef={menuButtonRef}
          menuRef={menuRef}
          setEditingId={setEditingId}
          setEditingTitle={setEditingTitle}
          handleUpdateConversation={handleUpdateConversation}
          toggleOptionsMenu={toggleOptionsMenu}
          startEditing={startEditing}
          handleDeleteConversation={handleDeleteConversation}
          handleDragStart={handleDragStart}
          draggingConversationId={draggingConversationId}
          handleMouseEnter={handleMouseEnter}
          handleMouseLeave={handleMouseLeave}
        />
      </ScrollableContent>

      <SettingsModal
        isOpen={settingsModal.isOpen}
        onClose={settingsModal.closeModal}
      />
      <FolderModal
        isOpen={folderModal.isOpen}
        onClose={folderModal.closeModal}
        onSave={async (name, systemPrompt) => {
          try {
            const folderData = { name, systemPrompt: systemPrompt || undefined };
            if (folderModal.data) {
              const updatedFolder = await updateFolder(folderModal.data.id, folderData);
              setFolders(prev => prev.map(f => f.id === updatedFolder.id ? updatedFolder : f));
            } else {
              const newFolder = await createFolder(folderData);
              setFolders(prev => [...prev, newFolder]);
            }
            folderModal.closeModal();
          } catch (error) {
            console.error("Erro ao salvar pasta:", error);
          }
        }}
        folderToEdit={folderModal.data}
      />
      <PersonaModal
        isOpen={personaModal.isOpen}
        onClose={personaModal.closeModal}
        onSave={handleSavePersona}
        personaToEdit={personaModal.data}
      />
    </SidebarContainer>
  );
};

export default Sidebar;
