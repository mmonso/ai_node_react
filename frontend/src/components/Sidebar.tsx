import React, { useState, useEffect, useRef, useCallback, ReactElement } from 'react';
import { PlusIcon, ArrowRightIcon, MoreOptionsIcon, EditIcon, DeleteIcon, FolderIconSvg, NewFolderIcon, UserIcon } from './icons'; // GearIcon removido, ArrowRightIcon já estava importado
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
  FolderList, // Reintroduzir
  // FolderItemContainer, FolderName, FolderIcon, ConversationsInFolderList, FolderConversationItem, CreateFolderForm - Removidos
  SectionDivider, // Adicionado
} from './Sidebar.styles';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
  getConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  getFolders, // Adicionado
  createFolder, // Adicionado
  updateFolder, // Adicionado
  deleteFolder, // Adicionado
  moveConversationToFolder, // Adicionado
} from '../services/api';
import { Conversation, Folder } from '../types'; // Adicionado Folder
import SettingsModal from './SettingsModal';
import PersonaModal from './PersonaModal';
// import FloatingMenu from './common/FloatingMenu';
import PersonaSection from './PersonaSection';
import UnfiledConversationsSection from './UnfiledConversationsSection';
import useModalState from '../hooks/useModalState';
// Importar componentes que serão recriados/restaurados
import FolderModal from './FolderModal';
import FolderSection from './FolderSection';


const Sidebar = (): ReactElement => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const {
    conversations, setConversations,
    personas, setPersonas,
    folders, setFolders, // Reintroduzido
    reloadTrigger
  } = useAppContext();

  const [editingId, setEditingId] = useState<number | null>(null); // Para conversas e personas
  const [editingTitle, setEditingTitle] = useState(''); // Para conversas e personas
  
  const [openOptionsId, setOpenOptionsId] = useState<number | null>(null); // Para conversas e personas
  const [openFolderOptionsId, setOpenFolderOptionsId] = useState<number | null>(null); // Para pastas

  const [draggingConversationId, setDraggingConversationId] = useState<number | null>(null);
  const [hoveredConversationId, setHoveredConversationId] = useState<number | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null); // Reintroduzido

  const menuRef = useRef<HTMLDivElement>(null); // Menu de opções de conversa/persona
  const menuButtonRef = useRef<HTMLButtonElement>(null); // Botão que abriu o menu de conversa/persona
  const folderMenuRef = useRef<HTMLDivElement>(null); // Menu de opções de pasta
  const folderMenuButtonRef = useRef<HTMLButtonElement>(null); // Botão que abriu o menu de pasta


  const settingsModal = useModalState();
  const personaModal = useModalState<Conversation>();
  const folderModal = useModalState<Folder | undefined>(); // Para criar ou editar pasta

  // Estados para criação/edição de pastas (serão gerenciados pelo FolderModal, mas podem ser iniciados aqui)
  // const [isCreatingFolder, setIsCreatingFolder] = useState(false); // Gerenciado pelo folderModal.isOpen
  // const [newFolderName, setNewFolderName] = useState('');
  // const [newFolderSystemPrompt, setNewFolderSystemPrompt] = useState('');
  // const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  // const [editingFolderName, setEditingFolderName] = useState('');
  // const [editingFolderSystemPrompt, setEditingFolderSystemPrompt] = useState('');
  
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());



  const loadData = useCallback(async () => {
    try {
      const fetchedConversations = await getConversations();
      const fetchedFolders = await getFolders(); // Carregar pastas
      
      const normalConversations = fetchedConversations.filter((conv: Conversation) => !conv.isPersona);
      const fetchedPersonas = fetchedConversations.filter((conv: Conversation) => conv.isPersona);
      
      setConversations(normalConversations);
      setPersonas(fetchedPersonas);
      setFolders(fetchedFolders); // Definir pastas
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }, [setConversations, setPersonas, setFolders]);

  useEffect(() => {
    loadData();
  }, [reloadTrigger, loadData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
  
      // Verifica clique no botão do menu de opções de conversa/persona
      if (menuButtonRef.current && menuButtonRef.current.contains(target)) {
        return;
      }
      // Verifica clique dentro do menu de opções de conversa/persona
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
  
      // Verifica clique no botão do menu de opções de pasta
      if (folderMenuButtonRef.current && folderMenuButtonRef.current.contains(target)) {
        return;
      }
      // Verifica clique dentro do menu de opções de pasta
      if (folderMenuRef.current && folderMenuRef.current.contains(target)) {
        return;
      }
      
      // Se o clique foi fora de todos os menus e botões relevantes, feche os menus.
      setOpenOptionsId(null);
      setOpenFolderOptionsId(null);
    }
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // Nenhuma dependência específica, pois os refs são estáveis.


  const handleNewConversationClick = async () => {
    try {
      const newConversation = await createConversation('Nova Conversa');
      setConversations((prev: Conversation[]) => [newConversation, ...prev]);
      navigate(`/chat/${newConversation.id}`);
    } catch (error) {
      console.error('Erro ao criar nova conversa:', error);
    }
  };

  const handleUpdateConversation = async (id: number, isPersona: boolean = false) => {
    if (editingId === id && editingTitle.trim() !== '') {
      try {
        const updated = await updateConversation(id, editingTitle, isPersona);
        if (isPersona) {
          setPersonas((prev: Conversation[]) => prev.map(p => (p.id === id ? updated : p)));
        } else {
          setConversations((prev: Conversation[]) => prev.map(conv => (conv.id === id ? updated : conv)));
        }
        setEditingId(null);
        setEditingTitle('');
      } catch (error) {
        console.error('Erro ao atualizar conversa:', error);
      }
    }
  };

  const handleDeleteConversation = async (id: number, isPersona: boolean = false) => {
    try {
      await deleteConversation(id);
      if (isPersona) {
        setPersonas((prev: Conversation[]) => prev.filter(p => p.id !== id));
      } else {
        setConversations((prev: Conversation[]) => prev.filter(conv => conv.id !== id));
      }
      if (Number(conversationId) === id) {
        navigate('/');
      }
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
    } finally {
      setOpenOptionsId(null);
    }
  };

  const startEditing = (item: Conversation) => {
    setEditingId(item.id);
    setEditingTitle(item.title);
    setOpenOptionsId(null);
  };

  const toggleOptionsMenu = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    menuButtonRef.current = e.currentTarget as HTMLButtonElement;
    setOpenOptionsId(openOptionsId === id ? null : id);
  };


  const handleDragStart = (e: React.DragEvent, conversationId: number) => {
    setDraggingConversationId(conversationId);
    e.dataTransfer.effectAllowed = 'move';
    // Opcional: definir uma imagem de arrastar personalizada
    // e.dataTransfer.setData('text/plain', conversationId.toString());
  };

  const handleDragOver = (e: React.DragEvent, folderId?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (folderId) {
      setDragOverFolderId(folderId);
    } else {
      setDragOverFolderId(null); // Limpa se estiver sobre a área não arquivada
    }
  };

  const handleDropOnFolder = async (e: React.DragEvent, folderId: number) => {
    e.preventDefault();
    e.stopPropagation(); // Impede que o evento de drop se propague para o container pai
    if (draggingConversationId) {
      try {
        const updatedConv = await moveConversationToFolder(draggingConversationId, folderId);
        // Atualizar o estado local das conversas
        setConversations(prevConvs =>
          prevConvs.map(c => c.id === updatedConv.id ? updatedConv : c)
        );
        // Opcional: atualizar a pasta para refletir a nova conversa (se a API retornar a pasta atualizada)
      } catch (error) {
        console.error('Erro ao mover conversa para pasta:', error);
      }
    }
    setDraggingConversationId(null);
    setDragOverFolderId(null);
  };
  
  const handleDropOnUnfiled = async (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingConversationId) {
      try {
        // Mover para "sem pasta" significa folderId = null
        const updatedConv = await moveConversationToFolder(draggingConversationId, null);
         setConversations(prevConvs =>
          prevConvs.map(c => c.id === updatedConv.id ? updatedConv : c)
        );
      } catch (error) {
        console.error('Erro ao mover conversa para não arquivadas:', error);
      }
    }
    setDraggingConversationId(null);
    setDragOverFolderId(null);
  };

  const handleDragEnd = () => {
    setDraggingConversationId(null);
    setDragOverFolderId(null);
  };

  const handleOpenPersonaModal = (persona?: Conversation) => {
    personaModal.openModal(persona);
  };

  // handleClosePersonaModal não é mais necessário, personaModal.closeModal() será usado diretamente

  const handleSavePersona = async (name: string, systemPrompt: string | null) => {
    try {
      if (personaModal.data) {
        const updatedPersona = await updateConversation(personaModal.data.id, name, true, systemPrompt);
        setPersonas((prev: Conversation[]) => prev.map(p => (p.id === updatedPersona.id ? updatedPersona : p)));
      } else {
        const newPersona = await createConversation(name, undefined, true, systemPrompt);
        setPersonas((prev: Conversation[]) => [...prev, newPersona]);
      }
    } catch (error) {
      console.error('Erro ao salvar persona:', error);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, conversationId: number) => {
    setHoveredConversationId(conversationId);
  };

  const handleMouseLeave = () => {
    setTimeout(() => {
      if (!menuRef.current?.contains(document.activeElement) && !menuButtonRef.current?.contains(document.activeElement)) {
        setOpenOptionsId(null);
      }
    }, 100);
    setHoveredConversationId(null);
  };

  // Não precisamos mais filtrar conversas não arquivadas, pois todas estarão "não arquivadas"
  // const unfiledConversations = conversations; // Ou simplesmente usar 'conversations' diretamente

  // Estados de edição de pasta removidos

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
            onClick={() => handleOpenPersonaModal()}
            title="Nova Persona"
          >
            <UserIcon />
          </NewChatButton>
          <NewChatButton
            onClick={() => folderModal.openModal(undefined) } // Abre para criar nova pasta
            title="Nova Pasta"
          >
            <NewFolderIcon />
          </NewChatButton>
          <NewChatButton
            onClick={handleNewConversationClick}
            title="Nova Conversa"
          >
            <PlusIcon />
          </NewChatButton>
        </RightActions>
      </SidebarHeader>
 
      <SectionDivider />
 
      <ScrollableContent
        onDragOver={(e) => handleDragOver(e)} // Ajustado para não passar folderId aqui
        onDrop={handleDropOnUnfiled} // Área geral para soltar conversas não arquivadas
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
          startEditing={startEditing as (item: Conversation) => void}
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
              // Props para menu de opções da pasta
              openFolderOptionsId={openFolderOptionsId}
              folderMenuButtonRef={folderMenuButtonRef}
              folderMenuRef={folderMenuRef}
              toggleFolderOptionsMenu={(e, id) => { // Implementar toggleFolderOptionsMenu
                 e.stopPropagation();
                 folderMenuButtonRef.current = e.currentTarget as HTMLButtonElement;
                 setOpenFolderOptionsId(openFolderOptionsId === id ? null : id);
              }}
              // Props para editar/deletar pasta
              onEditFolder={() => folderModal.openModal(folder)}
              onDeleteFolder={async (id) => { // Implementar handleDeleteFolder
                try {
                  await deleteFolder(id);
                  setFolders(prev => prev.filter(f => f.id !== id));
                  // Também desassociar conversas no estado local se necessário, ou recarregar
                  setConversations(prev => prev.map(c => c.folderId === id ? {...c, folderId: null, folder: null} : c));
                } catch (error) {
                  console.error("Erro ao deletar pasta:", error);
                }
              }}
              // Props para arrastar conversas
              handleDragStart={handleDragStart}
              draggingConversationId={draggingConversationId}
              conversationIdParams={conversationId}
              // Props para menu de opções de conversa dentro da pasta
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
          conversations={conversations.filter(c => !c.folderId)} // Apenas conversas sem pasta
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

      {/* FloatingMenu para mover para pastas removido, a lógica de D&D é direta */}

      <SettingsModal
        isOpen={settingsModal.isOpen}
        onClose={settingsModal.closeModal}
      />
      <FolderModal
        isOpen={folderModal.isOpen}
        onClose={folderModal.closeModal}
        onSave={async (name, systemPrompt) => { // Implementar handleSaveFolder
          const folderData = folderModal.data;
          try {
            if (folderData && folderData.id) { // Editando
              const updated = await updateFolder(folderData.id, { name, systemPrompt });
              setFolders(prev => prev.map(f => f.id === updated.id ? updated : f));
            } else { // Criando
              const newFolder = await createFolder({ name, systemPrompt });
              setFolders(prev => [newFolder, ...prev]);
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