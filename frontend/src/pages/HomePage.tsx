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
          <WelcomeTitle>Bem-vindo ao Gemini Chatbot</WelcomeTitle>
          <WelcomeText>
            Um assistente de chat poderoso usando a API Gemini
          </WelcomeText>
          
          <StartChatButton onClick={handleNewChat} disabled={isCreating}>
            {isCreating ? 'Criando conversa...' : 'Iniciar Nova Conversa'}
          </StartChatButton>
          
          <FeaturesList>
            <FeatureItem>
              <FeatureIcon>🔍</FeatureIcon>
              <FeatureText>Respostas inteligentes e contextuais</FeatureText>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>📝</FeatureIcon>
              <FeatureText>Suporte para formatação em Markdown</FeatureText>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>📤</FeatureIcon>
              <FeatureText>Envio de imagens e arquivos</FeatureText>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>⚙️</FeatureIcon>
              <FeatureText>Configuração personalizada do sistema</FeatureText>
            </FeatureItem>
          </FeaturesList>
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
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
`;

const WelcomeTitle = styled.h1`
  margin-bottom: 1rem;
  font-size: 2rem;
  background: linear-gradient(to right, var(--accent-color), var(--accent-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const WelcomeText = styled.p`
  color: var(--secondary-text);
  margin-bottom: 2rem;
  font-size: 1.1rem;
`;

const StartChatButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
  margin-bottom: 3rem;
`;

const FeaturesList = styled.ul`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  text-align: left;
  list-style: none;
  padding: 0;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
`;

const FeatureIcon = styled.span`
  font-size: 1.5rem;
  margin-right: 0.75rem;
`;

const FeatureText = styled.span`
  color: var(--primary-text);
`;

export default HomePage; 