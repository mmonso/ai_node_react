import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
  addConversationToFolder, // Added
  removeConversationFromFolder // Added
} from '../services/api';
import { Conversation, Folder } from '../types';
import ReactDOM from 'react-dom';

const SidebarContainer = styled.aside`
  width: 300px;
  background-color: var(--secondary-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100%;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  overflow: visible; /* Garantir que o conteúdo possa transbordar */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  position: relative; /* Manter o contexto de posicionamento */
  z-index: 20; /* Manter acima do conteúdo principal */
`;

const SidebarHeader = styled.div`
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const NewChatButton = styled.button`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-weight: 500;
  background-color: transparent;
  border: 1px solid var(--border-color, #ccc);
  border-radius: 999px;
  color: var(--primary-text);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  opacity: 0.7;

  svg {
    width: 20px !important;
    height: 20px !important;
    min-width: 20px;
    min-height: 20px;
  }

  &:hover {
    background-color: transparent;
    border-color: var(--accent-color, #007bff);
    color: var(--accent-color, #007bff);
  }

  &:active {
    background-color: transparent;
    transform: scale(0.98);
  }
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: visible; /* Permitir que elementos filhos ultrapassem a largura */
  padding: 0 0.75rem;
  position: relative; /* Adicionado para criar contexto de posicionamento */
`;

const FoldersSection = styled.div`
  padding-top: 1rem;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
`;

const SectionHeader = styled.h3`
  margin: 0 0.25rem 0.75rem;
  font-size: 0.75rem;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FolderItemContainer = styled.div`
  margin-bottom: 0.25rem;
  position: relative; 
`;

const MoreOptionsButton = styled.button`
  background: transparent;
  color: var(--secondary-text);
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--primary-text);
  }
`;

const FolderItemHeader = styled.div<{ $active?: boolean, $isEditing?: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.6rem 0.75rem;
  font-size: 0.85rem;
  background-color: ${props => props.$active ? 'var(--hover-bg)' : 'transparent'};
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  min-height: 38px;

  &:hover {
    background-color: var(--hover-bg);
    ${MoreOptionsButton} {
      opacity: 1;
    }
  }

  ${props => props.$isEditing && `
    ${MoreOptionsButton} {
      opacity: 0 !important; 
      pointer-events: none; 
    }
  `}
`;

const FolderName = styled.span`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: 0.5rem;
`;

const FolderIcon = styled.span`
  color: var(--accent-color);
  display: flex;
  align-items: center;
  transition: transform 0.2s ease-in-out;
  opacity: 0.85;
  &.expanded {
    transform: rotate(90deg);
  }
`;

const ConversationsInFolderList = styled.div`
  padding-left: 1.5rem;
  position: relative;
  
  /* Linha vertical para indicar hierarquia */
  &::before {
    content: '';
    position: absolute;
    left: 0.5rem;
    top: 0;
    bottom: 0;
    width: 1px;
    background-color: var(--border-color);
    opacity: 0.6; /* Aumentando ligeiramente a opacidade */
  }
`;

const ConversationListStyled = styled.div`
  padding-top: 0.5rem;
`;

const EmptyState = styled.div`
  color: var(--secondary-text);
  text-align: center;
  padding: 1rem;
  font-size: 0.85rem;
  line-height: 1.4;
`;

const ConversationItem = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  background-color: ${props => props.$active ? 'var(--hover-bg)' : 'transparent'};
  transition: background-color 0.2s;
  position: relative;
  height: 42px;
  border-radius: 4px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.08);
    ${MoreOptionsButton} {
      opacity: 1;
    }
  }
`;

const FolderConversationItem = styled(ConversationItem)`
  padding-left: 1.5rem;
  margin-left: 0.25rem;
  position: relative;
`;

const ConversationLink = styled(Link)`
  color: var(--primary-text);
  text-decoration: none;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
  padding-left: 1px;
  
  &:hover {
    color: var(--primary-text);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  position: absolute;
  top: calc(100% - 5px); 
  right: 0.5rem;
  background-color: var(--secondary-bg);
  padding: 8px 4px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  z-index: 90; /* Aumentado z-index para ficar acima do resto do conteúdo */
  min-width: 170px; /* Increased min-width for better appearance */
  border: 1px solid var(--border-color);
  overflow: hidden;
  max-height: 300px; /* Altura máxima fixa */
  overflow-y: auto; /* Adiciona scroll vertical se necessário */
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: 4px;
  }
`;

const ActionButton = styled.button`
  background: transparent;
  color: var(--secondary-text);
  padding: 8px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
  gap: 0.75rem;
  width: 100%;
  font-size: 0.85rem;
  border: none;
  transition: color 0.2s ease;
  
  &:hover {
    background: transparent;
    color: var(--primary-text);
  }
  
  svg {
    color: var(--accent-color);
    opacity: 0.7;
    width: 20px;
    height: 20px;
    min-width: 20px;
    min-height: 20px;
  }
`;

const SubMenuContainer = styled.div`
  position: fixed; /* Alterado para position fixed */
  min-width: 150px;
  max-width: 200px;
  background-color: var(--secondary-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 1000; /* Valor extremamente alto */
  padding: 4px;
  max-height: 250px;
  overflow-y: auto;
  overflow-x: hidden;
`;

const SubMenuItem = styled.button`
  background: transparent;
  color: var(--secondary-text);
  padding: 8px 10px;
  border-radius: 4px;
  display: block; /* Make it block to take full width */
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-size: 0.85rem;
  border: none;
  outline: none;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--primary-text);
  }
  
  &:active {
    background: rgba(255, 255, 255, 0.15);
  }
`;


const EditForm = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  height: 100%;
  
  input {
    width: 100%;
    height: 24px;
    padding: 0 0.25rem; 
    margin: 0;
    background-color: var(--input-bg, var(--primary-bg));
    color: var(--primary-text);
    border: 1px solid var(--accent-color);
    border-radius: 3px;
    font-size: 0.85rem; 
    line-height: 1;
    outline: none;
    box-sizing: border-box;
  }
`;

const CreateFolderForm = styled.div`
  padding: 0rem 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1rem;

  input {
    width: calc(100% - 120px);
    margin-right: 0.5rem;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background: var(--input-bg);
    color: var(--primary-text);
    font-size: 0.85rem;
  }
  button {
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
  }
  button.primary {
    border: 1px solid var(--accent-color);
    background: var(--accent-color);
    color: white;
  }
  button.secondary {
    margin-left: 0.25rem;
    border: 1px solid var(--border-color);
    background: transparent;
    color: var(--secondary-text);
    &:hover {
      background: var(--hover-bg);
      color: var(--primary-text);
    }
  }
`;

// Componente de portal para o menu
interface FloatingMenuProps {
  children: React.ReactNode;
  buttonElement: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
}

// Componente para itens do menu
const EnhancedSubMenuItem = styled(SubMenuItem)`
  cursor: pointer;
  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const FloatingMenu = ({ children, buttonElement, isOpen, onClose }: FloatingMenuProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (isOpen && buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      // Calcular posição ideal com base no espaço disponível
      const viewportWidth = window.innerWidth;
      
      // Por padrão, posicionar à direita
      let left = rect.right;
      
      // Se não houver espaço suficiente à direita, posicionar à esquerda
      if (left + 150 > viewportWidth) {
        left = rect.left - 150;
      }
      
      setPosition({
        top: rect.top,
        left: left
      });
    }
  }, [isOpen, buttonElement]);

  // Função para fechar o menu quando o mouse sair dele e do botão
  const handleMouseLeave = () => {
    setIsHovering(false);
    // Não fechamos automaticamente no mouse leave para permitir que o usuário clique nos itens
  };

  // Função para lidar com cliques no overlay (fecha o menu)
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Só fecha se o clique for diretamente no overlay (não em seus filhos)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Renderizar no body do documento
  return ReactDOM.createPortal(
    <div 
      ref={menuRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        pointerEvents: 'auto', // Alterado para auto para capturar cliques
      }}
      onClick={handleOverlayClick}
    >
      <SubMenuContainer 
        style={{ 
          top: `${position.top}px`, 
          left: `${position.left}px`,
          pointerEvents: 'auto'
        }}
        onClick={e => e.stopPropagation()}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </SubMenuContainer>
    </div>,
    document.body
  );
};

// Componente para itens do menu
const MenuButton = styled.button`
  background-color: transparent;
  color: var(--primary-text);
  border: none;
  padding: 8px 10px;
  margin: 2px 0;
  width: 100%;
  text-align: left;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: transparent;
    color: var(--accent-color);
    transform: translateX(2px);
    
    svg {
      opacity: 1;
    }
  }
  
  &:active {
    background-color: transparent;
  }

  svg {
    color: var(--accent-color);
    opacity: 0.7;
    transition: opacity 0.2s ease;
    width: 20px;
    height: 20px;
    min-width: 20px;
    min-height: 20px;
  }
`;

const MenuSectionTitle = styled.div`
  font-size: 0.75rem;
  color: var(--secondary-text);
  padding: 4px 10px;
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
`;

const MenuDivider = styled.div`
  height: 1px;
  background-color: var(--border-color);
  margin: 6px 4px;
  opacity: 0.6;
`;

const FolderList = styled.div`
  max-height: 120px;
  overflow-y: auto;
  margin: 0 2px;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: 4px;
  }
`;

// Adicionando estes componentes antes do componente Sidebar
const ClockIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="12" 
    height="12" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ 
      marginRight: '6px', 
      opacity: '0.7',
      color: 'var(--accent-color)',
      flexShrink: 0
    }}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const ChatIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="12" 
    height="12" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ 
      marginRight: '6px', 
      opacity: '0.7',
      color: 'var(--accent-color)',
      flexShrink: 0
    }}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);

const Sidebar: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null); 
  const [editingTitle, setEditingTitle] = useState('');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [openOptionsId, setOpenOptionsId] = useState<number | null>(null); 
  const [openFolderOptionsId, setOpenFolderOptionsId] = useState<number | null>(null); 
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [moveToFolderMenuOpenForConvId, setMoveToFolderMenuOpenForConvId] = useState<number | null>(null);
  const [lastButtonRef, setLastButtonRef] = useState<HTMLElement | null>(null);


  const navigate = useNavigate();
  const { id: currentChatId } = useParams<{ id: string }>();
  const { reloadTrigger } = useAppContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const folderMenuRef = useRef<HTMLDivElement>(null); 


  const loadData = async () => {
    try {
      console.log("Sidebar: Carregando dados...");
      const [convData, folderData] = await Promise.all([
        getConversations(),
        getFolders()
      ]);
      setConversations(convData);
      setFolders(folderData.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Erro ao carregar dados da sidebar:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentChatId, reloadTrigger]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target) && openOptionsId !== null) {
        setOpenOptionsId(null);
      }
      if (folderMenuRef.current && !folderMenuRef.current.contains(target) && openFolderOptionsId !== null) {
        setOpenFolderOptionsId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openOptionsId, openFolderOptionsId]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert("O nome da pasta não pode estar vazio.");
      return;
    }
    try {
      const newFolder = await createFolder(newFolderName.trim());
      setFolders(prevFolders => [...prevFolders, newFolder].sort((a, b) => a.name.localeCompare(b.name)));
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      alert('Não foi possível criar a pasta. Tente novamente.');
    }
  };

  const toggleFolderExpansion = (folderId: number) => {
    setExpandedFolders(prevExpanded => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId);
      } else {
        newExpanded.add(folderId);
      }
      return newExpanded;
    });
  };
  
  const handleNewConversationClick = async () => {
    if (isCreatingConversation) return;
    setIsCreatingConversation(true);
    try {
      const newConversation = await createConversation('Nova Conversa');
      setConversations(prev => [newConversation, ...prev]);
      navigate(`/chat/${newConversation.id}`);
      setActiveFolderId(null); 
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      alert('Não foi possível criar a conversa.');
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleUpdateConversation = async (id: number) => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await updateConversation(id, editingTitle);
      setConversations(convs => convs.map(conv => conv.id === id ? { ...conv, title: editingTitle } : conv));
      setEditingId(null);
    } catch (error) {
      console.error('Erro ao atualizar conversa:', error);
    }
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await deleteConversation(id);
      setConversations(convs => convs.filter(conv => conv.id !== id));
      if (Number(currentChatId) === id) {
        navigate('/');
        setActiveFolderId(null);
      }
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
    }
  };

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
    setOpenOptionsId(null);
  };

  const toggleOptionsMenu = (e: React.MouseEvent, conversationId: number) => {
    e.stopPropagation();
    e.preventDefault();
    setOpenOptionsId(prev => prev === conversationId ? null : conversationId);
    setOpenFolderOptionsId(null); 
  };

  const toggleFolderOptionsMenu = (e: React.MouseEvent, folderId: number) => {
    e.stopPropagation();
    e.preventDefault();
    setOpenFolderOptionsId(prev => prev === folderId ? null : folderId);
    setOpenOptionsId(null); 
  };

  const startEditingFolder = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
    setOpenFolderOptionsId(null);
  };

  const handleUpdateFolder = async (folderId: number) => {
    if (!editingFolderName.trim()) {
      setEditingFolderId(null); 
      setEditingFolderName('');
      return;
    }
    try {
      const updated = await updateFolder(folderId, editingFolderName.trim());
      setFolders(prevs => prevs.map(f => f.id === folderId ? updated : f).sort((a,b) => a.name.localeCompare(b.name)));
      setEditingFolderId(null);
      setEditingFolderName('');
    } catch (error) {
      console.error('Erro ao renomear pasta:', error);
      alert('Não foi possível renomear a pasta.');
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta pasta? As conversas dentro dela não serão excluídas, mas movidas para 'Conversas Soltas'.")) {
      try {
        await deleteFolder(folderId);
        setFolders(prevs => prevs.filter(f => f.id !== folderId));
        setConversations(prevConvs =>
          prevConvs.map(conv => {
            if (conv.folderId === folderId) {
              const updatedConv = { 
                ...conv, 
                folderId: null as number | null,
                folder: undefined 
              };
              return updatedConv;
            }
            return conv;
          })
        );
        setOpenFolderOptionsId(null);
        if(activeFolderId === folderId) {
          setActiveFolderId(null);
        }
        const currentChat = conversations.find(c => c.id === Number(currentChatId));
        if (currentChat?.folderId === folderId) {
            navigate('/'); 
        }
      } catch (error) {
        console.error('Erro ao excluir pasta:', error);
        alert('Não foi possível excluir a pasta.');
        loadData(); 
      }
    }
  };

  const handleMoveConversationToFolder = async (conversationId: number, targetFolderId: number | null) => {
    try {
      console.log(`Movendo conversa ${conversationId} para a pasta ${targetFolderId === null ? 'Conversas Soltas' : targetFolderId}`);
      
      // Primeiro, atualize a UI para uma experiência mais responsiva
      setConversations(prevConvs =>
        prevConvs.map(c => {
          if (c.id === conversationId) {
            const updatedConv = { 
              ...c, 
              folderId: targetFolderId as number | null 
            };
            return updatedConv;
          }
          return c;
        })
      );
      
      // Feche os menus
      setOpenOptionsId(null);
      setMoveToFolderMenuOpenForConvId(null);
      
      // Depois, realize a chamada à API
      let updatedConv;
      if (targetFolderId === null) {
        updatedConv = await removeConversationFromFolder(conversationId);
      } else {
        updatedConv = await addConversationToFolder(conversationId, targetFolderId);
      }
      
      console.log('Resposta do servidor:', updatedConv);
      
      // Recarregue os dados após um curto intervalo
      setTimeout(() => {
        loadData();
      }, 300);
      
    } catch (error) {
      console.error('Erro ao mover conversa:', error);
      alert('Não foi possível mover a conversa. Tente novamente.');
      // Em caso de erro, recarregue para restaurar o estado correto
      loadData();
    }
  };

  const toggleMoveToFolderMenu = (e: React.MouseEvent, conversationId: number) => {
    e.stopPropagation();
    // Armazenar o elemento que foi clicado
    setLastButtonRef(e.currentTarget as HTMLElement);
    setMoveToFolderMenuOpenForConvId(prev => prev === conversationId ? null : conversationId);
  };

  // Handlers para hover
  const handleMouseEnter = (e: React.MouseEvent, conversationId: number) => {
    setLastButtonRef(e.currentTarget as HTMLElement);
    setMoveToFolderMenuOpenForConvId(conversationId);
  };

  const handleMouseLeave = () => {
    // Pequeno atraso para permitir que o usuário mova o mouse para o menu
    setTimeout(() => {
      // Se o menu não estiver em hover, fecha
      setMoveToFolderMenuOpenForConvId(null);
    }, 300);
  };

  const unfiledConversations = conversations.filter(c => !c.folderId);

  return (
    <SidebarContainer>
      <SidebarHeader>
        <div></div>
        <HeaderActions>
          <NewChatButton
            onClick={() => { setIsCreatingFolder(true); setActiveFolderId(null); setNewFolderName(''); }}
            title="Nova Pasta"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <line x1="12" y1="11" x2="12" y2="17"></line>
              <line x1="9" y1="14" x2="15" y2="14"></line>
            </svg>
          </NewChatButton>
          <NewChatButton
            onClick={handleNewConversationClick}
            disabled={isCreatingConversation}
            title="Nova Conversa"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </NewChatButton>
        </HeaderActions>
      </SidebarHeader>

      <ScrollableContent>
        {isCreatingFolder && (
          <CreateFolderForm>
            <input
              type="text"
              placeholder="Nome da nova pasta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }
              }}
            />
            <button className="primary" onClick={handleCreateFolder}>Criar</button>
            <button className="secondary" onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }}>X</button>
          </CreateFolderForm>
        )}

        <FoldersSection>
          <SectionHeader>Pastas</SectionHeader>
          {folders.length === 0 && !isCreatingFolder && (
            <EmptyState style={{ fontSize: '0.8rem', padding: '0.5rem 0', textAlign: 'left' }}>
              Nenhuma pasta.
            </EmptyState>
          )}
          {folders.map(folder => {
            const isExpanded = expandedFolders.has(folder.id);
            const conversationsInThisFolder = conversations.filter(c => c.folderId === folder.id);
            return (
              <FolderItemContainer key={folder.id}>
                <FolderItemHeader
                  onClick={() => {
                    if (editingFolderId !== folder.id) { 
                      toggleFolderExpansion(folder.id);
                      setActiveFolderId(folder.id); 
                    }
                  }}
                  $active={activeFolderId === folder.id && !currentChatId}
                  $isEditing={editingFolderId === folder.id}
                >
                  {editingFolderId === folder.id ? (
                    <EditForm> 
                      <input
                        type="text"
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        autoFocus
                        onBlur={() => handleUpdateFolder(folder.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateFolder(folder.id);
                          else if (e.key === 'Escape') {
                            setEditingFolderId(null);
                            setEditingFolderName('');
                          }
                        }}
                      />
                    </EditForm>
                  ) : (
                    <>
                      <FolderIcon className={isExpanded ? 'expanded' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </FolderIcon>
                      <FolderName>{folder.name}</FolderName>
                      <MoreOptionsButton
                        onClick={(e) => toggleFolderOptionsMenu(e, folder.id)}
                        aria-label="Opções da pasta"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle>
                        </svg>
                      </MoreOptionsButton>
                    </>
                  )}
                </FolderItemHeader>
                {openFolderOptionsId === folder.id && editingFolderId !== folder.id && (
                  <ActionButtons ref={folderMenuRef} >
                    <ActionButton onClick={() => startEditingFolder(folder)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      <span>Renomear</span>
                    </ActionButton>
                    <ActionButton onClick={() => handleDeleteFolder(folder.id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      <span>Excluir</span>
                    </ActionButton>
                  </ActionButtons>
                )}
                {isExpanded && (
                  <ConversationsInFolderList>
                    {conversationsInThisFolder.length === 0 && (
                      <EmptyState style={{ fontSize: '0.8rem', padding: '0.5rem 0', textAlign: 'left' }}>
                        Nenhuma conversa nesta pasta.
                      </EmptyState>
                    )}
                    {conversationsInThisFolder.map(conversation => (
                      <FolderConversationItem
                        key={conversation.id}
                        $active={Number(currentChatId) === conversation.id}
                        style={{ paddingLeft: '1.5rem', marginLeft: '0.25rem', position: 'relative' }}
                        onClick={() => setActiveFolderId(folder.id)}
                      >
                        {/* Marcador de item filho */}
                        <div style={{
                          position: 'absolute',
                          left: '0.75rem',
                          top: '50%',
                          width: '8px',
                          height: '1px',
                          backgroundColor: 'var(--border-color)',
                          opacity: 0.7
                        }} />
                        
                        {editingId === conversation.id ? (
                          <EditForm>
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              autoFocus
                              onBlur={() => handleUpdateConversation(conversation.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateConversation(conversation.id);
                                else if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                          </EditForm>
                        ) : (
                          <>
                            <ConversationLink to={`/chat/${conversation.id}`}>
                              <ChatIcon />
                              <span>{conversation.title}</span>
                            </ConversationLink>
                            <MoreOptionsButton
                              onClick={(e) => toggleOptionsMenu(e, conversation.id)}
                              aria-label="Opções da conversa"
                            >
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="19" cy="12" r="1"></circle>
                                <circle cx="5" cy="12" r="1"></circle>
                              </svg>
                            </MoreOptionsButton>
                            {openOptionsId === conversation.id && (
                              <ActionButtons ref={menuRef}>
                                <ActionButton onClick={() => startEditing(conversation)} title="Renomear">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                  <span>Renomear</span>
                                </ActionButton>
                                <ActionButton onClick={() => handleDeleteConversation(conversation.id)} title="Excluir">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                  <span>Excluir</span>
                                </ActionButton>
                                
                                {/* Lista de Pastas Disponíveis */}
                                <div>
                                  <MenuDivider />
                                  <MenuSectionTitle>Mover para</MenuSectionTitle>
                                  
                                  <FolderList>
                                    {folders.filter(f => f.id !== conversation.folderId).map(folder => (
                                      <MenuButton
                                        key={folder.id}
                                        onClick={() => handleMoveConversationToFolder(conversation.id, folder.id)}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                        {folder.name}
                                      </MenuButton>
                                    ))}
                                    
                                    {conversation.folderId && (
                                      <MenuButton
                                        onClick={() => handleMoveConversationToFolder(conversation.id, null)}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                          <line x1="8" y1="12" x2="16" y2="12"></line>
                                        </svg>
                                        Remover da Pasta
                                      </MenuButton>
                                    )}
                                    
                                    {folders.length === 0 && !conversation.folderId && (
                                      <div style={{padding: '4px 10px', color: 'var(--secondary-text)', fontSize: '0.8rem', fontStyle: 'italic'}}>
                                        Nenhuma pasta disponível
                                      </div>
                                    )}
                                  </FolderList>
                                </div>
                              </ActionButtons>
                            )}
                          </>
                        )}
                      </FolderConversationItem>
                    ))}
                  </ConversationsInFolderList>
                )}
              </FolderItemContainer>
            );
          })}
        </FoldersSection>

        <ConversationListStyled>
          <SectionHeader>Conversas Soltas</SectionHeader>
          {unfiledConversations.length === 0 && (
             <EmptyState style={{ fontSize: '0.8rem', padding: '0.5rem 0', textAlign: 'left' }}>
              Nenhuma conversa solta.
            </EmptyState>
          )}
          {unfiledConversations.map(conversation => (
            <ConversationItem
              key={conversation.id}
              $active={Number(currentChatId) === conversation.id && activeFolderId === null}
              onClick={() => setActiveFolderId(null)}
            >
              {editingId === conversation.id ? (
                <EditForm>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    autoFocus
                    onBlur={() => handleUpdateConversation(conversation.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateConversation(conversation.id);
                      else if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                </EditForm>
              ) : (
                <>
                  <ConversationLink to={`/chat/${conversation.id}`}>
                    <ClockIcon />
                    <span>{conversation.title}</span>
                  </ConversationLink>
                  <MoreOptionsButton
                    onClick={(e) => toggleOptionsMenu(e, conversation.id)}
                    aria-label="Opções da conversa"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="19" cy="12" r="1"></circle>
                      <circle cx="5" cy="12" r="1"></circle>
                    </svg>
                  </MoreOptionsButton>
                  {openOptionsId === conversation.id && (
                    <ActionButtons ref={menuRef}>
                       <ActionButton onClick={() => startEditing(conversation)} title="Renomear">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <span>Renomear</span>
                      </ActionButton>
                      <ActionButton onClick={() => handleDeleteConversation(conversation.id)} title="Excluir">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        <span>Excluir</span>
                      </ActionButton>
                      
                      {/* Lista de Pastas Disponíveis */}
                      <div>
                        <MenuDivider />
                        <MenuSectionTitle>Mover para</MenuSectionTitle>
                        
                        <FolderList>
                          {folders.filter(f => f.id !== conversation.folderId).map(folder => (
                            <MenuButton
                              key={folder.id}
                              onClick={() => handleMoveConversationToFolder(conversation.id, folder.id)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                              </svg>
                              {folder.name}
                            </MenuButton>
                          ))}
                          
                          {conversation.folderId && (
                            <MenuButton
                              onClick={() => handleMoveConversationToFolder(conversation.id, null)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                              </svg>
                              Remover da Pasta
                            </MenuButton>
                          )}
                          
                          {folders.length === 0 && !conversation.folderId && (
                            <div style={{padding: '4px 10px', color: 'var(--secondary-text)', fontSize: '0.8rem', fontStyle: 'italic'}}>
                              Nenhuma pasta disponível
                            </div>
                          )}
                        </FolderList>
                      </div>
                    </ActionButtons>
                  )}
                </>
              )}
            </ConversationItem>
          ))}
        </ConversationListStyled>
      </ScrollableContent>
    </SidebarContainer>
  );
};

export default Sidebar;