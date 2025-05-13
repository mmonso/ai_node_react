import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { createConversation } from '../services/api';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  
  const handleNewChat = async () => {
    try {
      setIsCreating(true);
      const newConversation = await createConversation('Nova Conversa');
      navigate(`/chat/${newConversation.id}`);
    } catch (error) {
      console.error('Erro ao criar nova conversa:', error);
      alert('Não foi possível criar uma nova conversa. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Layout>
      <HomeContainer>
        <WelcomeCard>
          <WelcomeTitle>Olá, como posso ajudar?</WelcomeTitle>
          
          <StartChatButton onClick={handleNewChat} disabled={isCreating}>
            {isCreating ? 'Criando conversa...' : 'Iniciar Nova Conversa'}
          </StartChatButton>
          
        </WelcomeCard>
      </HomeContainer>
    </Layout>
  );
};

const HomeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
`;

const WelcomeCard = styled.div`
  max-width: 600px;
  background-color: var(--secondary-bg);
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const WelcomeTitle = styled.h1`
  margin-bottom: 2.5rem;
  font-size: 2rem;
  color: var(--primary-text);
  font-weight: 600;
`;

const StartChatButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px; /* Usando raio consistente com outros botões */
  color: var(--primary-text);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: transparent;
    border-color: var(--accent-color);
    color: var(--accent-color);
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default HomePage;