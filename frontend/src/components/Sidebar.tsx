import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getConversations, createConversation, updateConversation, deleteConversation } from '../services/api';
import { Conversation } from '../types';

const SidebarContainer = styled.aside`
  width: 250px;
  background-color: var(--secondary-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100%;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
`;

const SidebarHeader = styled.div`
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AppTitle = styled.h1`
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary-text);
  text-align: center;
  margin-bottom: 0;
`;

const NewChatButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: 500;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const PlusIcon = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
`;

const ConversationList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0.75rem;
`;

const EmptyState = styled.div`
  color: var(--secondary-text);
  text-align: center;
  padding: 1rem;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const ConversationItem = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  background-color: ${props => props.$active ? 'var(--hover-bg)' : 'transparent'};
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--hover-bg);
  }
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
  
  &:hover {
    color: var(--primary-text);
  }
`;

const ChatIcon = styled.div`
  color: var(--accent-color);
  display: flex;
  align-items: center;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  ${ConversationItem}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled.button`
  background: transparent;
  color: var(--secondary-text);
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--primary-text);
  }
`;

const CreateForm = styled.div`
  padding: 1rem 0.75rem;
  border-bottom: 1px solid var(--border-color);
  
  input {
    width: 100%;
    margin-bottom: 0.75rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const CreateButton = styled.button`
  flex: 1;
`;

const CancelButton = styled.button`
  flex: 1;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--secondary-text);
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--primary-text);
    border-color: var(--accent-color);
  }
`;

const EditForm = styled.div`
  width: 100%;
  
  input {
    width: 100%;
    padding: 0.5rem;
    background-color: var(--primary-bg);
    border: 1px solid var(--accent-color);
  }
`;

const Sidebar: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  useEffect(() => {
    loadConversations();
  }, []);
  
  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };
  
  const handleCreateConversation = async () => {
    try {
      const title = newTitle.trim() || 'Nova Conversa';
      const newConversation = await createConversation(title);
      setConversations([newConversation, ...conversations]);
      setIsCreating(false);
      setNewTitle('');
      navigate(`/chat/${newConversation.id}`);
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
    }
  };
  
  const handleUpdateConversation = async (id: number) => {
    try {
      if (editingTitle.trim()) {
        await updateConversation(id, editingTitle);
        setConversations(
          conversations.map(conv => 
            conv.id === id ? { ...conv, title: editingTitle } : conv
          )
        );
        setEditingId(null);
      }
    } catch (error) {
      console.error('Erro ao atualizar conversa:', error);
    }
  };
  
  const handleDeleteConversation = async (id: number) => {
    try {
      await deleteConversation(id);
      setConversations(conversations.filter(conv => conv.id !== id));
      
      // Se a conversa atual foi excluída, redirecione para a página inicial
      if (Number(id) === Number(id)) {
        navigate('/');
      }
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
    }
  };
  
  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  return (
    <SidebarContainer>
      <SidebarHeader>
        <AppTitle>Gemini Chatbot</AppTitle>
        <NewChatButton onClick={() => setIsCreating(true)}>
          <PlusIcon>+</PlusIcon>
          Nova Conversa
        </NewChatButton>
      </SidebarHeader>
      
      {isCreating && (
        <CreateForm>
          <input
            type="text"
            placeholder="Título da conversa"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <ButtonGroup>
            <CreateButton onClick={handleCreateConversation}>Criar</CreateButton>
            <CancelButton onClick={() => setIsCreating(false)}>Cancelar</CancelButton>
          </ButtonGroup>
        </CreateForm>
      )}
      
      <ConversationList>
        {conversations.length === 0 ? (
          <EmptyState>
            Nenhuma conversa encontrada. Crie uma nova para começar.
          </EmptyState>
        ) : (
          conversations.map(conversation => (
            <ConversationItem 
              key={conversation.id} 
              $active={Number(id) === conversation.id}
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
                      if (e.key === 'Enter') {
                        handleUpdateConversation(conversation.id);
                      } else if (e.key === 'Escape') {
                        setEditingId(null);
                      }
                    }}
                  />
                </EditForm>
              ) : (
                <>
                  <ConversationLink to={`/chat/${conversation.id}`}>
                    <ChatIcon>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </ChatIcon>
                    <span>{conversation.title}</span>
                  </ConversationLink>
                  <ActionButtons>
                    <ActionButton onClick={() => startEditing(conversation)} title="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </ActionButton>
                    <ActionButton onClick={() => handleDeleteConversation(conversation.id)} title="Excluir">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </ActionButton>
                  </ActionButtons>
                </>
              )}
            </ConversationItem>
          ))
        )}
      </ConversationList>
    </SidebarContainer>
  );
};

export default Sidebar;